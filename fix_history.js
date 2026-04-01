const fs = require('fs');
const path = require('path');

const historyPath = path.join(__dirname, 'history.json');

if (fs.existsSync(historyPath)) {
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    let fixedCount = 0;

    history.forEach(entry => {
        if (entry.user && !entry.user.includes('@')) {
            // If ID length > 15, it's likely a group (WhatsApp group IDs are long)
            if (entry.user.length > 15) {
                entry.user = `${entry.user}@g.us`;
            } else {
                entry.user = `${entry.user}@s.whatsapp.net`;
            }
            fixedCount++;
        }
    });

    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    console.log(`✅ Fixed ${fixedCount} entries in history.json`);
} else {
    console.log('❌ history.json not found');
}
