const fs = require('fs');
const path = require('path');
const { generateHealthResponse } = require('./ai');

async function testImageAnalysis() {
    console.log("--- Starting AI Vision Test (Gemini) ---");
    
    const imagePath = path.join(__dirname, 'one.jpg');
    if (!fs.existsSync(imagePath)) {
        console.error("Error: one.jpg not found in current directory!");
        return;
    }

    // Load image and convert to base64
    const buffer = fs.readFileSync(imagePath);
    const base64Image = buffer.toString('base64');
    const mimeType = "image/jpeg";

    console.log("Sending image to AI for analysis...");
    
    try {
        const response = await generateHealthResponse(
            "Analyze this medical report/image and tell me what you see.",
            base64Image,
            mimeType,
            [] // No history for this test
        );

        console.log("\n--- AI Response ---");
        console.log(response);
        console.log("-------------------\n");
        console.log("Test Complete! If you see a medical analysis above, Gemini is working correctly.");
    } catch (err) {
        console.error("Test Failed:", err.message);
    }
}

testImageAnalysis();
