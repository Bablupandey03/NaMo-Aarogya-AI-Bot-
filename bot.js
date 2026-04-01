require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const qrcode = require('qrcode');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');
const P = require('pino');

// Internal Modules
const { generateHealthResponse } = require('./ai');
const { logInteraction, getHistory, getUserHistory } = require('./historyManager');

const app = express();
const PORT = process.env.PORT || 3001;

// Prepare uploads directory
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

let currentQR = "";
let isConnected = false;

// --- Express Server (QR + Admin Dashboard) ---
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/', (req, res) => {
    if (isConnected) {
        res.send(`
            <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                <h1 style="color: green;">✅ NaMo Aarogya is LIVE & Connected!</h1>
                <p>Chat via WhatsApp. <a href="/admin">Go to Admin Dashboard</a></p>
            </div>
        `);
    } else if (currentQR) {
        res.send(`
            <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                <h2>Scan this QR Code using WhatsApp "Linked Devices"</h2>
                <img src="${currentQR}" alt="QR Code" style="border: 2px solid #333; padding: 10px; border-radius: 10px; width: 300px; height: 300px;" />
                <p>Status: Waiting for scan...</p>
                <script>setInterval(() => location.reload(), 3000);</script>
            </div>
        `);
    } else {
        res.send(`
            <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                <h1>⏳ Generating QR Code...</h1>
                <p>Please wait or refresh in a few seconds.</p>
                <script>setInterval(() => location.reload(), 2000);</script>
            </div>
        `);
    }
});

// Admin Routes
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/api/history', (req, res) => {
    const history = getHistory();
    res.json(history);
});

app.listen(PORT, () => {
    console.log(`\n============== SERVER START =============`);
    console.log(`🔗 Scanner: http://localhost:${PORT}`);
    console.log(`🔗 Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`===========================================\n`);
});

// --- WhatsApp Bot Core ---
const AUTH_DIR = path.join(__dirname, 'wa_bot_auth');

async function initWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false,
        logger: P({ level: "silent" }),
        browser: ["NaMo Aarogya", "Desktop", "1.0.0"]
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            currentQR = await qrcode.toDataURL(qr);
            console.log(`[Status] New QR. Open http://localhost:${PORT} to scan.`);
        }

        if (connection === "close") {
            isConnected = false;
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`Connection closed. Reconnecting: ${shouldReconnect}`);
            if (shouldReconnect) {
                setTimeout(initWhatsApp, 5000);
            } else {
                console.log("Logged out from WhatsApp. Please delete wa_bot_auth folder and restart script.");
                currentQR = "";
            }
        } else if (connection === "open") {
            isConnected = true;
            currentQR = "";
            console.log("✅ WhatsApp AI Listener Connected & Ready!");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    const activeTasks = new Set();

    sock.ev.on("messages.upsert", async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const remoteJid = msg.key.remoteJid;
            
            // Extract textual content
            let userText = msg.message.conversation || 
                           msg.message.extendedTextMessage?.text || 
                           msg.message.imageMessage?.caption || 
                           msg.message.documentMessage?.caption || "";
            
            // Extract media if present (Image or Document)
            let base64Image = null;
            let mimeType = null;
            let mediaUrl = null;
            
            const imageMsg = msg.message.imageMessage;
            const docMsg = msg.message.documentMessage;
            
            const attachedMedia = imageMsg || docMsg;

            if (attachedMedia) {
                mimeType = attachedMedia.mimetype || "";
                
                // Allow only Images or PDF
                if (mimeType.includes('image/') || mimeType.includes('application/pdf')) {
                    const msgType = imageMsg ? 'image' : 'document';
                    const stream = await downloadContentFromMessage(attachedMedia, msgType);
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                    
                    // We need base64 for Gemini directly
                    base64Image = buffer.toString('base64');
                    
                    // Save to local disk for Admin panel to view
                    const ext = mimeType.includes('pdf') ? 'pdf' : (mimeType.split('/')[1] || 'jpg');
                    const fileName = `media_${Date.now()}.${ext}`;
                    fs.writeFileSync(path.join(UPLOADS_DIR, fileName), buffer);
                    mediaUrl = `/uploads/${fileName}`;
                }
            }

            // Must have text or supported media
            if (!userText && !base64Image) return;

            if (activeTasks.has(remoteJid)) {
                await sock.sendMessage(remoteJid, { text: "⏳ I am already analyzing your previous query. Please wait." });
                return;
            }

            activeTasks.add(remoteJid);
            await sock.sendPresenceUpdate('composing', remoteJid);

            console.log(`[User Request] from ${remoteJid}: Text: ${userText.substring(0,30)} | Media: ${!!base64Image}`);
            
            const userHistory = getUserHistory(remoteJid, 5);
            let aiResponseText = await generateHealthResponse(userText, base64Image, mimeType, userHistory);

            // Add clear Bot prefix so people know it's not a human
            aiResponseText = "🤖 *NaMo Aarogya (AI Bot)*\n──────────────\n" + aiResponseText;

            // Save to DB
            logInteraction(remoteJid, userText, aiResponseText, !!base64Image, mediaUrl);

            await sock.sendMessage(remoteJid, { text: aiResponseText }, { quoted: msg });
            
            await sock.sendPresenceUpdate('available', remoteJid);
            activeTasks.delete(remoteJid);

        } catch (err) {
            console.error("Message processing error:", err);
            const msg = m.messages[0];
            if (msg && msg.key.remoteJid) {
                activeTasks.delete(msg.key.remoteJid);
                // Try sending fallback error
                try {
                    await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Expected text/image format, but an internal processing error occurred." });
                } catch(e) {}
            }
        }
    });
}

initWhatsApp().catch(err => {
    console.error("Failed to start WhatsApp Bot:", err);
});
