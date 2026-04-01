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
const { addReminder, startReminderService } = require('./reminderManager');

const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());

// Prepare uploads directory
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

let currentQR = "";
let isConnected = false;
let globalSock = null;

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

// Broadcast API
app.post('/api/broadcast', async (req, res) => {
    const { message } = req.body;
    if (!message || !globalSock) return res.status(400).json({ error: "No message or bot not connected" });

    const history = getHistory();
    const uniqueUsers = [...new Set(history.map(h => h.user))]; // This matches historyManager format

    res.json({ success: true, message: `Starting broadcast to ${uniqueUsers.length} users...` });

    for (const userId of uniqueUsers) {
        try {
            // userId will be full JID (e.g. ...@s.whatsapp.net or ...@g.us)
            let jid = userId;
            if (!jid.includes('@')) {
                // If it's a legacy entry without @, assume it's a person/group based on length
                jid = userId.length > 15 ? `${userId}@g.us` : `${userId}@s.whatsapp.net`;
            }
            await globalSock.sendMessage(jid, { text: `📢 *UPDATE* 📢\n──────────────\n${message}` });
            // Random delay 3-8 seconds
            const delay = Math.floor(Math.random() * 5000) + 3000;
            await new Promise(r => setTimeout(r, delay));
        } catch (e) {
            console.error(`Broadcast failed for ${userId}:`, e.message);
        }
    }
});

app.listen(PORT, () => {
    console.log(`\n============== SERVER START =============`);
    console.log(`🔗 Scanner: http://localhost:${PORT}`);
    console.log(`🔗 Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`===========================================\n`);
});

// --- WhatsApp Bot Core ---
const AUTH_DIR = path.join(__dirname, 'wa_bot_auth');
const userState = {}; // Simple state machine { jid: { type: 'awaiting_address' } }

async function initWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false,
        logger: P({ level: "silent" }),
        generateHighQualityLinkPreview: true,
        browser: ["NaMo Aarogya", "Desktop", "1.0.0"]
    });

    globalSock = sock;

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
            
            // Start the background reminder service
            startReminderService(sock);
        }
    });

    sock.ev.on("creds.update", saveCreds);

    // --- Global Queue System ---
    const taskQueue = [];
    let isProcessing = false;

    async function processQueue() {
        if (isProcessing || taskQueue.length === 0) return;
        isProcessing = true;
        while (taskQueue.length > 0) {
            const task = taskQueue.shift();
            try { await handleTask(task); } catch (err) { console.error("[Queue] Task failed:", err); }
        }
        isProcessing = false;
    }

    async function handleTask({ msg, remoteJid, userText, base64Data, mimeType, mediaUrl }) {
        try {
            await sock.sendPresenceUpdate('composing', remoteJid);
            const userHistory = getUserHistory(remoteJid, 5);
            let aiResponseText = await generateHealthResponse(userText, base64Data, mimeType, userHistory);
            
            aiResponseText = "🤖 *NaMo Aarogya (AI Bot)*\n──────────────\n" + aiResponseText;
            logInteraction(remoteJid, userText, aiResponseText, !!base64Data, mediaUrl);
            await sock.sendMessage(remoteJid, { text: aiResponseText }, { quoted: msg });
            await sock.sendPresenceUpdate('available', remoteJid);
            await new Promise(resolve => setTimeout(resolve, 2000)); 
        } catch (err) {
            console.error("[Queue] handleTask Error:", err);
            try { await sock.sendMessage(remoteJid, { text: "⚠️ An internal error occurred." }); } catch(e) {}
        }
    }

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        try {
            if (type !== 'notify') return;
            const msg = messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const remoteJid = msg.key.remoteJid;
            if (remoteJid === 'status@broadcast') return;
            if (msg.message.protocolMessage) return;
            
            // 1. Extract textual content
            let userText = msg.message.conversation || msg.message.extendedTextMessage?.text || 
                           msg.message.imageMessage?.caption || msg.message.documentMessage?.caption || 
                           msg.message.audioMessage?.caption || "";
            
            // 2. Handle State Machine (Reminders / Location)
            if (userState[remoteJid]) {
                const state = userState[remoteJid];
                if (state.type === 'awaiting_address') {
                    delete userState[remoteJid];
                    userText = `Find nearby hospitals or medical stores for this address: ${userText}`;
                    // Proceed to AI processing
                } else if (state.type === 'awaiting_reminder') {
                    // Smart parsing: find time like "18:30" or "3:00 pm" or "3am"
                    const timeMatch = userText.match(/(\d{1,2}:\d{2})\s*(am|pm)?/i) || userText.match(/(\d{1,2})\s*(am|pm)/i);
                    
                    if (timeMatch) {
                        delete userState[remoteJid];
                        let time = timeMatch[1];
                        const ampm = timeMatch[2]?.toLowerCase();
                        
                        // Convert to 24h for cron (HH:mm)
                        let [hours, minutes] = time.includes(':') ? time.split(':') : [time, '00'];
                        hours = parseInt(hours);
                        if (ampm === 'pm' && hours < 12) hours += 12;
                        if (ampm === 'am' && hours === 12) hours = 0;
                        const finalTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                        
                        const medicine = userText.replace(timeMatch[0], '').replace(/[,]/g, '').trim() || "Medicine";
                        
                        addReminder(remoteJid, finalTime, medicine);
                        await sock.sendMessage(remoteJid, { text: `✅ *Reminder Set!*\n\nBhai, main aapko rozana *${finalTime}* (Standard Time) baje *${medicine}* ki dawai yaad dilaunga. Swasth rahein! ❤️` });
                        return;
                    } else {
                        await sock.sendMessage(remoteJid, { text: "⚠️ Format samajh nahi aaya! Please sahi se likhein.\n\n*Example:* Calpol 18:30\n*Ya phir:* Paracetamol 3:00 pm" });
                        // Don't delete state, let them try again
                        return;
                    }
                }
            }

            // Trigger State Activation (if not already in a state)
            const lowerText = userText.toLowerCase();
            if (lowerText.includes("hospital") || lowerText.includes("nearby") || lowerText.includes("aas paas") || lowerText.includes("address")) {
                userState[remoteJid] = { type: 'awaiting_address' };
                await sock.sendMessage(remoteJid, { text: "🏥 *Nearby Hospital Finder*\n\nBhai, aap kahan se ho? Apna poora *address* ya *area ka naam* batao taaki main aas-paas ke hospitals dhoondh sakun." });
                return;
            }
            if (lowerText.includes("remind") || lowerText.includes("remain") || lowerText.includes("yad dila") || lowerText.includes("yaad dila")) {
                userState[remoteJid] = { type: 'awaiting_reminder' };
                await sock.sendMessage(remoteJid, { text: "🔔 *Medicine Reminder*\n\nTheek hai bhai, kaunsi dawai (medicine name) aur kitne baje (format: HH:mm) yaad dilana hai?\n\n*Format:* [Medicine] [Time]\n*Example:* Calpol 18:30" });
                return;
            }

            // 3. Handle Multimodal (Image, PDF, Audio)
            let base64Data = null;
            let mimeType = null;
            let mediaUrl = null;
            
            const imageMsg = msg.message.imageMessage;
            const docMsg = msg.message.documentMessage;
            const audioMsg = msg.message.audioMessage;
            const attachedMedia = imageMsg || (docMsg && docMsg.mimetype.includes('pdf')) || audioMsg;

            if (attachedMedia) {
                mimeType = attachedMedia.mimetype || "";
                const msgType = imageMsg ? 'image' : (audioMsg ? 'audio' : 'document');
                const stream = await downloadContentFromMessage(attachedMedia, msgType);
                let buffer = Buffer.from([]);
                for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }
                base64Data = buffer.toString('base64');
                
                const ext = mimeType.includes('pdf') ? 'pdf' : (mimeType.includes('image') ? 'jpg' : 'ogg');
                const fileName = `media_${Date.now()}.${ext}`;
                fs.writeFileSync(path.join(UPLOADS_DIR, fileName), buffer);
                mediaUrl = `/uploads/${fileName}`;
            }

            if (!userText && !base64Data) return;
            if (taskQueue.some(t => t.remoteJid === remoteJid)) {
                await sock.sendMessage(remoteJid, { text: "⏳ I have received your message. You are in the queue. Please wait." });
                return;
            }

            console.log(`[Queue] Added request from ${remoteJid}`);
            taskQueue.push({ msg, remoteJid, userText, base64Data, mimeType, mediaUrl });
            processQueue();

        } catch (err) { console.error("Upsert handler error:", err); }
    });
}

initWhatsApp().catch(err => { console.error("Failed to start WhatsApp Bot:", err); });
