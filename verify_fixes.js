const { generateHealthResponse } = require('./ai');
const fs = require('fs');

async function verify() {
    console.log("--- 🧪 Verifying Stability & Safety Fixes ---");
    
    // 1. Test with a medicine image (Checking Safety Filters)
    console.log("\n[1] Testing with medicine image (1.webp)...");
    let base64Image = null;
    if (fs.existsSync('1.webp')) {
        base64Image = fs.readFileSync('1.webp', { encoding: 'base64' });
    }
    
    const response = await generateHealthResponse("What are the uses of this medicine?", base64Image, "image/webp");
    console.log("\n--- AI Response ---\n");
    console.log(response);
    console.log("\n-------------------\n");

    if (response.includes("❌ Model Error")) {
        console.error("❌ Safety Filter test FAILED or Quota hit.");
    } else {
        console.log("✅ Safety Filter test PASSED (AI analyzed the image).");
    }

    // 2. Test Fallback (Manual step: You can temporarily change GEMINI_API_KEY to 'invalid' in .env)
    console.log("\n[2] Note: To verify Backup Fallback, change your primary key in .env to 'invalid' and run this again.");
}

verify();
