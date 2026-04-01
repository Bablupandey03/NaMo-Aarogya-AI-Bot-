require('dotenv').config();
const healthPrompt = require('./healthPrompt');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Sends a request to Google's Gemini Vision/Text model (`gemini-flash-latest`)
 * @param {string} userText 
 * @param {string|null} base64Image 
 * @param {string|null} mimeType 
 * @returns {Promise<string>}
 */
async function generateHealthResponse(userText, base64Image = null, mimeType = null, userHistory = []) {
    if (!GEMINI_API_KEY) {
        throw new Error("Missing GEMINI_API_KEY in .env");
    }

    // Use the model that worked for you in test_gemini.js mappings.
    // 'gemini-flash-latest' maps to the functional 'gemini-3-flash-preview' where you have quota
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    try {
        let historyContext = "";
        if (userHistory && userHistory.length > 0) {
            historyContext = "--- RECENT CHAT HISTORY WITH THIS USER ---\n";
            userHistory.forEach(h => {
                // Stripping the disclaimer from the injected history to save tokens 
                // and keep context clean.
                let cleanResponse = h.response.replace(/⚠️ \*Disclaimer:\*.*$/, '').trim();
                historyContext += `User: ${h.query}\nYou (AI): ${cleanResponse}\n\n`;
            });
            historyContext += "------------------------------------------\n";
        }

        let parts = [
            { text: healthPrompt }, // Give system prompt first
            { text: `\n\n${historyContext}Current User Query: ${userText || "Check this medical image"}` }
        ];

        // Attach image inlineData if it exists
        if (base64Image && mimeType) {
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Image
                }
            });
        }

        const payload = {
            contents: [{
                parts: parts
            }]
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Gemini API Error:", data.error.message);
            return "❌ Model Error: Unable to process the request due to server restrictions or quota.";
        }

        if (data.candidates && data.candidates.length > 0) {
            let text = data.candidates[0].content.parts[0].text;
            
            // Clean up to strictly match WhatsApp Markdown parsing rules
            // 1. Remove Markdown headers logic
            text = text.replace(/^(#+)\s+(.*?)$/gm, '*$2*'); 
            // 2. Clear any lingering double asterisks
            text = text.replace(/\*\*(.*?)\*\*/g, '*$1*');
            // 3. Clear space inside asterisks e.g. * text * to prevent WhatsApp failing
            text = text.replace(/\*\s+(.*?)\s+\*/g, '*$1*');
            // 4. Force markdown list hyphens/stars to unicode bullets so they don't break WA parser
            text = text.replace(/^[\-\*]\s/gm, '• ');

            return text;
        }

        return "❌ Unexpected response from AI. Please try again.";

    } catch (e) {
        console.error("Health Generation Error:", e);
        return "⚠️ Network or Timeout Error while connecting to Health AI.";
    }
}

module.exports = {
    generateHealthResponse
};
