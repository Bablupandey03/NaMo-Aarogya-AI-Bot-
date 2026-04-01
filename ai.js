require('dotenv').config();
const healthPrompt = require('./healthPrompt');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_KEY_BACKUP = process.env.GEMINI_API_KEY_BACKUP;

/**
 * Sends a request to Google's Gemini Vision/Text model (`gemini-flash-latest`)
 * Includes logic for fallback API key if primary fails.
 */
async function generateHealthResponse(userText, base64Image = null, mimeType = null, userHistory = []) {
    // Try primary key first, then fallback
    const keys = [GEMINI_API_KEY, GEMINI_API_KEY_BACKUP].filter(key => !!key);

    if (keys.length === 0) {
        throw new Error("Missing GEMINI_API_KEY in .env");
    }

    let lastError = null;

    for (let i = 0; i < keys.length; i++) {
        const currentKey = keys[i];
        const isBackup = i > 0;

        try {
            const result = await callGeminiAPI(currentKey, userText, base64Image, mimeType, userHistory);
            return result;
        } catch (err) {
            lastError = err;
            console.error(`[AI] ${isBackup ? 'Backup' : 'Primary'} API Key Failed:`, err.message);
            // If it's a critical error (like quota or server restricted), we try the next key
            if (i < keys.length - 1) {
                console.log(`[AI] Retrying with Backup Key...`);
                continue; 
            }
        }
    }

    // If all keys fail
    return `⚕️ Maaf kijiye, is samay response generate karne me thodi der ho rahi hai.

Kripya kuch seconds baad apna message dobara bhejein.
🏥 Main aapki health query me madad ke liye yahin hoon.`;
}

/**
 * Core API caller with safety settings
 */
async function callGeminiAPI(apiKey, userText, base64Image, mimeType, userHistory) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    let historyContext = "";
    if (userHistory && userHistory.length > 0) {
        historyContext = "--- RECENT CHAT HISTORY WITH THIS USER ---\n";
        userHistory.forEach(h => {
            let cleanResponse = h.response.replace(/⚠️ \*Disclaimer:\*.*$/, '').trim();
            historyContext += `User: ${h.query}\nYou (AI): ${cleanResponse}\n\n`;
        });
        historyContext += "------------------------------------------\n";
    }

    let parts = [
        { text: healthPrompt },
        { text: `\n\n${historyContext}Current User Query: ${userText || "Check this medical image"}` }
    ];

    if (base64Image && mimeType) {
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: base64Image
            }
        });
    }

    const payload = {
        contents: [{ parts: parts }],
        // RELAXED SAFETY SETTINGS: Essential for medical/report analysis
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error.message);
    }

    if (data.candidates && data.candidates.length > 0) {
        let text = data.candidates[0].content.parts[0].text;
        
        // Clean up formatting
        text = text.replace(/^(#+)\s+(.*?)$/gm, '*$2*'); 
        text = text.replace(/\*\*(.*?)\*\*/g, '*$1*');
        text = text.replace(/\*\s+(.*?)\s+\*/g, '*$1*');
        text = text.replace(/^[\-\*]\s/gm, '• ');

        return text;
    }

    throw new Error("Unexpected response structure from AI.");
}

module.exports = {
    generateHealthResponse
};
