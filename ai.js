require('dotenv').config();
const healthPrompt = require('./healthPrompt');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_KEY_BACKUP = process.env.GEMINI_API_KEY_BACKUP;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

/**
 * Sends a request to AI models (DeepSeek for text, Gemini for Multi-modal / Backup)
 */
async function generateHealthResponse(userText, base64Data = null, mimeType = null, userHistory = []) {
    // 1. If it's Multi-modal (Image, Audio, PDF), use Gemini (DeepSeek-V3 is text only)
    if (base64Data && mimeType) {
        let mediaType = "unknown";
        if (mimeType.includes('image')) mediaType = "Image";
        else if (mimeType.includes('pdf')) mediaType = "PDF Report";
        else if (mimeType.includes('audio')) mediaType = "Voice Message";

        console.log(`[AI] Using Gemini for ${mediaType} analysis...`);
        return await handleGeminiWithFallback(userText, base64Data, mimeType, userHistory);
    }

    // 2. If it's pure text, try DeepSeek first (OpenAI-compatible)
    if (DEEPSEEK_API_KEY) {
        try {
            console.log("[AI] Using DeepSeek for text query...");
            return await callDeepSeekAPI(DEEPSEEK_API_KEY, userText, userHistory);
        } catch (err) {
            console.error("[AI] DeepSeek Failed, falling back to Gemini:", err.message);
        }
    }

    // 3. Fallback to Gemini if DeepSeek fails or isn't configured
    return await handleGeminiWithFallback(userText, base64Data, mimeType, userHistory);
}

/**
 * Handles Gemini calls with primary and backup keys
 */
async function handleGeminiWithFallback(userText, base64Data, mimeType, userHistory) {
    const keys = [GEMINI_API_KEY, GEMINI_API_KEY_BACKUP].filter(key => !!key);
    
    if (keys.length === 0) {
        throw new Error("Missing GEMINI_API_KEY in .env");
    }

    for (let i = 0; i < keys.length; i++) {
        const currentKey = keys[i];
        try {
            return await callGeminiAPI(currentKey, userText, base64Data, mimeType, userHistory);
        } catch (err) {
            console.error(`[AI] Gemini ${i === 0 ? 'Primary' : 'Backup'} Failed:`, err.message);
            if (i < keys.length - 1) continue;
        }
    }

    return `⚕️ Maaf kijiye, is samay response generate karne me thodi der ho rahi hai. Kripya kuch seconds baad apna message dobara bhejein.`;
}

/**
 * DeepSeek API (OpenAI Compatible)
 */
async function callDeepSeekAPI(apiKey, userText, userHistory) {
    const endpoint = "https://api.deepseek.com/chat/completions";

    const messages = [
        { role: "system", content: healthPrompt }
    ];

    if (userHistory && userHistory.length > 0) {
        userHistory.forEach(h => {
            let cleanResponse = h.response.replace(/🤖 \*NaMo Aarogya \(AI Bot\)\*\n──────────────\n/g, '');
            cleanResponse = cleanResponse.replace(/⚠️ \*Disclaimer:\*.*$/, '').trim();
            
            messages.push({ role: "user", content: h.query });
            messages.push({ role: "assistant", content: cleanResponse });
        });
    }

    messages.push({ role: "user", content: userText || "Hi" });

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: messages,
            temperature: 0.7,
            max_tokens: 1500
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    let text = data.choices[0].message.content;
    return cleanResponseFormatting(text);
}

/**
 * Core Gemini API caller
 */
async function callGeminiAPI(apiKey, userText, base64Data, mimeType, userHistory) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`;

    let historyContext = "";
    if (userHistory && userHistory.length > 0) {
        historyContext = "--- RECENT CHAT HISTORY WITH THIS USER ---\n";
        userHistory.forEach(h => {
            let cleanResponse = h.response.replace(/🤖 \*NaMo Aarogya \(AI Bot\)\*\n──────────────\n/g, '');
            cleanResponse = cleanResponse.replace(/⚠️ \*Disclaimer:\*.*$/, '').trim();
            historyContext += `User: ${h.query}\nYou (AI): ${cleanResponse}\n\n`;
        });
        historyContext += "------------------------------------------\n";
    }

    let parts = [
        { text: healthPrompt },
        { text: `\n\n${historyContext}Current User Query: ${userText || "Analyze the attached medical data (Audio/PDF/Image)"}` }
    ];

    if (base64Data && mimeType) {
        // Handle PDF/Audio/Image natively
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: base64Data
            }
        });
    }

    const payload = {
        contents: [{ parts: parts }],
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    if (data.candidates && data.candidates.length > 0) {
        let text = data.candidates[0].content.parts[0].text;
        return cleanResponseFormatting(text);
    }

    throw new Error("Unexpected response structure from AI.");
}

/**
 * Shared formatting cleanup
 */
function cleanResponseFormatting(text) {
    // Formatting logic as implemented before
    text = text.replace(/^(#+)\s+(.*?)$/gm, '*$2*'); 
    text = text.replace(/\*\*(.*?)\*\*/g, '*$1*');
    text = text.replace(/([a-zA-Z0-9])(\*)([a-zA-Z0-9])/g, '$1 $2$3');
    text = text.replace(/([a-zA-Z0-9]\*)([a-zA-Z0-9])/g, '$1 $2');
    text = text.replace(/^[\-\*]\s/gm, '• ');
    text = text.replace(/🤖 \*NaMo Aarogya \(AI Bot\)\*\n──────────────\n/g, '').trim();
    return text;
}

module.exports = {
    generateHealthResponse
};
