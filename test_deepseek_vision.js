const fs = require('fs');
const path = require('path');

const DEEPSEEK_API_KEY = "sk-a4480cca8a61447da46f790b6e91b93e";

async function testDeepSeekVision() {
    console.log("--- Testing DeepSeek Vision (Experimental) ---");
    
    const imagePath = path.join(__dirname, 'one.jpg');
    if (!fs.existsSync(imagePath)) {
        console.error("Error: one.jpg not found!");
        return;
    }

    const buffer = fs.readFileSync(imagePath);
    const base64Image = buffer.toString('base64');

    const endpoint = "https://api.deepseek.com/chat/completions";

    const payload = {
        model: "deepseek-chat",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: "Analyze this image and describe the health symptoms shown." },
                    { 
                        type: "image_url", 
                        image_url: { 
                            url: `data:image/jpeg;base64,${base64Image}`
                        } 
                    }
                ]
            }
        ]
    };

    console.log("Sending vision request to DeepSeek...");
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        console.log("\n--- API Response Status ---");
        console.log(response.status);
        console.log("\n--- API Response Body ---");
        console.log(JSON.stringify(data, null, 2));
        
        if (response.status === 200) {
            console.log("\n✅ SURPRISE: DeepSeek supported the vision format!");
        } else {
            console.log("\n❌ FAILED: As expected, current DeepSeek endpoint does not support images.");
        }
    } catch (err) {
        console.error("Error during test:", err.message);
    }
}

testDeepSeekVision();
