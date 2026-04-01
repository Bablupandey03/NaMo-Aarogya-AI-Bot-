const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const REMINDERS_FILE = path.join(__dirname, 'data', 'reminders.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

/**
 * Loads all reminders
 */
function loadReminders() {
    if (!fs.existsSync(REMINDERS_FILE)) {
        fs.writeFileSync(REMINDERS_FILE, JSON.stringify([]));
    }
    const data = fs.readFileSync(REMINDERS_FILE, 'utf8');
    return JSON.parse(data);
}

/**
 * Saves all reminders
 */
function saveReminders(reminders) {
    fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2));
}

/**
 * Adds a new reminder
 * @param {string} jid 
 * @param {string} time HH:mm format
 * @param {string} medicine 
 */
function addReminder(jid, time, medicine) {
    const reminders = loadReminders();
    reminders.push({ jid, time, medicine, active: true });
    saveReminders(reminders);
}

/**
 * Sets up the cron job to check reminders every minute
 * @param {object} sock Baileys socket to send messages
 */
function startReminderService(sock) {
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        const reminders = loadReminders();
        const dueReminders = reminders.filter(r => r.active && r.time === currentTime);
        
        for (const r of dueReminders) {
            try {
                const message = `🔔 *ROZANA REMINDER* 💊\n──────────────\nBhai, aapki dawai ka waqt ho gaya hai!\n\n💊 *Medicine:* ${r.medicine}\n⏰ *Time:* ${r.time}\n\nKripya ise samay par lein. Swasth rahein! ❤️`;
                await sock.sendMessage(r.jid, { text: message });
                console.log(`[Reminders] Sent to ${r.jid} for ${r.medicine}`);
            } catch (err) {
                console.error(`[Reminders] Failed to send to ${r.jid}:`, err.message);
            }
        }
    });
}

module.exports = {
    addReminder,
    startReminderService
};
