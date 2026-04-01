const fs = require('fs');

const apiKey = 'AIzaSyCDm6jBpWc7GVM-EMl_0ezuJAp5H1KvdOQ';
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

async function testApi() {
  try {
    // Check if images exist before reading
    let parts = [
       { text: "Please recognize these images and tell me what they are, what is their purpose or use case? I've attached 2 images." }
    ];

    if (fs.existsSync('1.webp')) {
      const img1 = fs.readFileSync('1.webp', { encoding: 'base64' });
      parts.push({
        inlineData: {
          mimeType: "image/webp",
          data: img1
        }
      });
      console.log('Loaded 1.webp');
    }

    if (fs.existsSync('2.jpg')) {
      const img2 = fs.readFileSync('2.jpg', { encoding: 'base64' });
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: img2
        }
      });
      console.log('Loaded 2.jpg');
    }

    const payload = {
      contents: [{
        parts: parts
      }]
    };

    console.log("Sending request to Gemini API...");
    // Using fetch which is available in Node.js 18+
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("Response Status:", response.status);
    
    // Save response to a file
    fs.writeFileSync('api_response.json', JSON.stringify(data, null, 2));
    console.log("Full response saved to api_response.json");
    
    if (data.error) {
       console.error("API Error:", data.error.message);
    } else if (data.candidates && data.candidates.length > 0) {
        console.log("\n================ MODEL RESPONSE ================\n");
        console.log(data.candidates[0].content.parts[0].text);
        console.log("\n================================================\n");
    } else {
        console.log("Unexpected response structure. Check api_response.json");
    }

  } catch (error) {
    console.error("Execution Error:", error);
  }
}

testApi();
