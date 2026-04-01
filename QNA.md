# 🩺 NaMo Aarogya AI Bot - Exhibition Q&A (100 Questions)

This document is designed to help students and presenters explain the **NaMo Aarogya AI Bot** to teachers, judges, and the public. It covers everything from basic mission to advanced technical architecture.

---

## 📜 Category 1: Project Overview & Mission (1-15)

**1. What is NaMo Aarogya AI Bot?**
It is a professional WhatsApp-based health assistant powered by Google's Gemini AI, designed to provide preliminary health guidance and medical report analysis.

**2. Why was this project built?**
To make healthcare guidance more accessible and immediate, helping people understand their symptoms or lab reports before they can reach a doctor.

**3. Is this a replacement for a doctor?**
Absolutely not. It is a "preliminary guide." Every response includes a strict medical disclaimer advising users to consult a qualified professional.

**4. What does the name "NaMo Aarogya" mean?**
"NaMo" is an respectful greeting, and "Aarogya" means "disease-free/health." Together, it represents a respectful service for a healthy India.

**5. Who is the target audience for this bot?**
General public, rural users with limited access to immediate medical info, and anyone who needs a simplified explanation of a medical report.

**6. What are the core pillars of this project?**
Accuracy (Medical domain), Accessibility (WhatsApp), and Simplicity (Plain language).

**7. How do users start using the bot?**
By simply sending a "Hi" or "Namaste" to the bot's WhatsApp number.

**8. Does the bot support multiple languages?**
Yes, it intelligently understands and responds in English, Hindi, and Hinglish based on the user's input.

**9. Can the bot prescribe medicines?**
No. It can suggest basic home care or indicate what type of doctor to consult, but it never gives official prescriptions for scheduled drugs.

**10. What makes this different from a Google Search?**
A search gives links; this bot gives a structured, conversational, and context-aware answer tailored specifically to the user's query or image.

**11. Is it a live service or a prototype?**
It is a fully functional, production-ready prototype that can be deployed on servers like Railway or Heroku.

**12. Can it handle emergency situations?**
It is not designed for emergencies. In such cases, it advises the user to contact emergency services immediately.

**13. What is the mission statement?**
"To empower every citizen with instant, reliable, and simplified health guidance at their fingertips."

**14. Does the bot have a personality?**
Yes, it is programmed to be empathetic, professional, and clear.

**15. How does it help in "Digital India"?**
It utilizes AI and mobile technology to bridge the gap in healthcare information delivery.

---

## 🛠️ Category 2: Functional Features (16-30)

**16. What happens when a user sends a medical report image?**
The bot uses Multimodal AI (OCR) to read the text, extract key values, and explain them in simple terms.

**17. Can it analyze a handwritten prescription?**
Yes, depending on clarity, the Gemini model is excellent at interpreting handwritten medical text.

**18. What if someone asks a non-health question like "Who is the Prime Minister?"**
The bot will strictly refuse and reply: "🏥 This assistant is only for health-related guidance and medical report analysis."

**19. How does it format its answers for WhatsApp?**
It uses single asterisks for *bolding*, custom bullet points (•), and emojis to make the text readable on small screens.

**20. Does it remember previous messages?**
Yes, it maintains a "Chat History" so if you ask "What about my fever?", it knows you were talking about a fever earlier.

**21. What is the "Symptom Checker" feature?**
Users describe symptoms (e.g., "I have a headache and stomach pain"), and the bot suggests possible causes and home care tips.

**22. Can it analyze scans like X-rays or MRIs?**
It can attempt to read the textual findings written on the scan report, which is safer than diagnosing the image alone.

**23. Does it provide a summary of the medical report?**
Yes, it highlights "out of range" or abnormal values from lab reports for quick attention.

**24. How do I know the AI is not hallucinating?**
The system prompt is strictly constrained by "Health Domain Rules" to minimize errors and keep recommendations conservative.

**25. Is there an Admin Panel?**
Yes, a web-based dashboard allows the owner to see all interactions and monitor the bot's performance.

**26. How do users authenticate to start the bot?**
A QR code is generated; the owner scans it using "Linked Devices" on WhatsApp.

**27. What happens if the internet goes down?**
The bot will pause and automatically try to reconnect once the connection is restored.

**28. Can the bot handle PDF files?**
Currently, it focuses on Images and Text, as lab reports are most commonly shared as photos.

**29. Does it show a "Typing..." status?**
Yes, it sends a `composing` pulse to WhatsApp so the user knows the AI is thinking.

**30. Is there a limit to how many users can message at once?**
It uses an asynchronous task set to handle multiple users, though it processes them sequentially to avoid rate limits.

---

## 🏗️ Category 3: Technical Architecture (31-50)

**31. Which programming language is used?**
Node.js (JavaScript).

**32. What is Baileys?**
It is a high-performance, lightweight library used to connect with WhatsApp's Web API without a paid official business API.

**33. Which AI model is powering this?**
Google's **Gemini 1.5 Flash** (latest).

**34. Why use Gemini Flash instead of Gemini Pro?**
Flash is faster, cheaper, and more than capable for conversational health guidance and OCR tasks.

**35. How is the AI connected to the code?**
Via a REST API request to Google Generative Language endpoints using the user's API Key.

**36. What is the role of Express.js in this project?**
It serves the Admin Dashboard and hosts the QR code for authentication.

**37. Where is the chat history stored?**
In a local `history.json` file. This can be scaled to a database like MongoDB in the future.

**38. How are images processed technically?**
The image is converted to a `base64` string and sent as `inlineData` to the Gemini Multimodal model.

**39. What is the purpose of `healthPrompt.js`?**
It contains the "System Instruction" that defines the AI's identity, rules, and domain boundaries.

**40. How secure is the WhatsApp connection?**
It uses "Multi-File Auth State," which saves session tokens locally in `wa_bot_auth/`, ensuring you don't have to scan the QR code every time.

**41. What is the role of `dotenv`?**
To securely handle sensitive information like the `GEMINI_API_KEY` without hardcoding it.

**42. Why is there a `Dockerfile`?**
To "containerize" the app, ensuring it runs exactly the same on any server, whether it's Windows, Linux, or Cloud.

**43. What does `railway.json` do?**
It provides configuration for the Railway.app cloud platform for one-click deployment.

**44. How does the bot handle high traffic?**
It uses a `Set` of active tasks to prevent a single user from spamming and crashing the AI processor.

**45. How do you extract text from reports?**
Gemini Flash has "Native Multimodality," meaning it doesn't need external OCR; it "sees" and "understands" the text directly.

**46. Can we use multiple API keys for load balancing?**
Yes, the `ai.js` module could be easily modified to rotate between multiple keys.

**47. What happens if the WhatsApp session expires?**
The server generates a new QR code which is displayed on the local dashboard for the admin to re-scan.

**48. Why Node.js for this instead of Python?**
Node.js is superior for handling many concurrent asynchronous connections (like multiple WhatsApp chats) with its event-driven architecture.

**49. How is the history injected into the AI?**
The last 5-10 messages are summarized and added to the prompt context so the AI "remembers" the conversation flow.

**50. What is `pino` used for?**
It is a very fast logger for Node.js, used to track errors and connection events in the terminal.

---

## 🧠 Category 4: AI & Prompt Engineering (51-65)

**51. What is Prompt Engineering?**
The art of crafting the instructions (prompts) given to the AI to control its behavior, tone, and accuracy.

**52. How do you prevent the AI from giving non-health advice?**
By using **Strict Negative Constraints** in the system prompt (e.g., "STRICTLY refuse and reply verbatim with...").

**53. How do you ensure the bot doesn't use "## Heading" tags?**
The `ai.js` file has a cleaning function that converts Markdown headers into bold text (`*text*`) compatible with WhatsApp.

**54. Why are bullet points converted to (•)?**
WhatsApp's parser often breaks with standard Markdown stars (*); (•) is a universal Unicode character that always looks good.

**55. How do you prevent "Assistant hallucinations"?**
By instructing the AI to only stick to "preliminary observations" and "known medical guidelines" instead of making up diagnosis.

**56. How does the bot handle Hinglish?**
The Gemini model is trained on massive multilingual datasets, allowing it to naturally switch between languages based on the user's intent.

**57. What is "few-shot" prompting?**
Providing examples in the prompt to show the AI how to respond (e.g., showing a sample Greeting vs. a sample Symptom check).

**58. How do you keep the AI concise?**
The prompt contains a "FORMATTING RULE" saying: "Be concise. This is WhatsApp, nobody wants to read an essay."

**59. How does the bot detect a "Greeting"?**
The prompt lists specific keywords (hi, namaste, hlw) and tells the AI to reply with a hardcoded welcome message if they are detected.

**60. Can the AI recognize different doctor specialties?**
Yes, it is instructed to suggest a specific *type* of doctor (e.g., Cardiologist for heart issues, Dermatologist for skin).

**61. Does the prompt include emergency advice?**
Yes, it's inherent in the instruction to prioritize safety and professional consultation.

**62. How does the model interpret "Out of Range" values?**
It looks for markers like `(H)`, `(L)`, `*`, or numerical comparisons against the "Reference Interval" column in a report.

**63. What is the "Multimodal" capability?**
The ability of one single AI model to process different types of data (Text + Image) simultaneously.

**64. Can we change the bot's "Identity"?**
Yes, by simply editing the `healthPrompt.js` file, we can change it to a "Yoga Assistant" or a "Fitness Coach."

**65. How does it handle ambiguous queries?**
It is instructed to ask clarifying questions empathetically if it cannot understand the user's symptoms.

---

## 🔒 Category 5: Data Security & Privacy (66-80)

**66. Is user data sold to third parties?**
No. All data is stored locally on the server owned by the bot admin.

**67. Is the medical report saved?**
Yes, it's saved in a private `uploads/` folder on the server for the admin's reference.

**68. How do we ensure privacy for the medical images?**
The `uploads/` folder is typically not public on the web and can only be accessed by the admin.

**69. What if a user wants to delete their data?**
Currently, an admin would have to delete it from the `history.json` and `uploads/` folder.

**70. Is the API Key safe?**
Yes, it is kept in the `.env` file, which is excluded from Git via `.gitignore`.

**71. Does WhatsApp encrypt these messages?**
Yes, the messages are end-to-end encrypted by WhatsApp itself before reaching the bot.

**72. Can other students see my history?**
Only if they have access to the server's files or the Admin Dashboard.

**73. What happens to the session data in `wa_bot_auth`?**
It contains the decryption keys for your WhatsApp account. It is highly sensitive and is ignored in version control.

**74. Is there a way to password-protect the Admin Dashboard?**
Yes, standard HTTP basic auth could be added for better security.

**75. Do you store the user's phone number?**
Yes, as a "JID" (unique identifier) to track their individual chat history.

**76. How long is the history kept?**
The current script limits history to the last 500 interactions to keep the file size manageable.

**77. Is Gemini AI storing my health data?**
Google's API has strict privacy policies for developers; data sent via API is generally not used to train their models (depending on the tier).

**78. What if the server is hacked?**
The admin should use strong passwords for the hosting platform and never share their `.env` file.

**79. Can the bot be used anonymously?**
No, as it requires a WhatsApp number to function, but the user can use an alias if they wish.

**80. Is the disclaimer legally enough?**
In most jurisdictions, a clear disclaimer and identifying as an AI "preliminary guide" helps mitigate risk, but it's not a legal guarantee.

---

## 🌋 Category 6: Challenges & Solutions (81-90)

**81. What was the biggest technical challenge?**
Connecting AI to WhatsApp without using the expensive official API.

**82. How did you solve the "Headings" problem on WhatsApp?**
By using Regex (Regular Expressions) in `ai.js` to strip `#` and replace them with standard formatting.

**83. How do you handle cases where two people message at the same time?**
We use an asynchronous event listener that creates separate "task contexts" for each user.

**84. Why did you include a Disclaimer on every message?**
To ensure that even if a user starts a conversation in the middle, they are always reminded that the bot is an AI.

**85. How did you make the bot understand Hindi and Hinglish?**
By leveraging the native multilingual capabilities of the Gemini model, which is one of the best in the world for Indian languages.

**86. What if the AI key runs out of free quota?**
The bot sends a fallback message: "❌ Model Error: Unable to process the request due to server restrictions or quota."

**87. How did you handle rotating QR codes?**
By using `socket.io` (or in this case, a basic auto-refresh script on the Admin page) to fetch the latest QR from the server.

**88. How was the OCR accuracy improved?**
By using "Flash" which is optimized for quick image reading and structured extraction.

**89. Why did the bot sometimes repeat itself?**
This was solved by "Cleaning" the injected history to remove the previous disclaimers, giving the AI a fresh context.

**90. How did you ensure the bot stays online 24/7?**
By using tools like `pm2` or hosting on "Always-on" platforms like Railway.

---

## 🚀 Category 7: Future Scope & Scalability (91-100)

**91. Can this be integrated with Hospital booking?**
Yes, the bot could be connected to hospital APIs to book an appointment with the suggested doctor specialty.

**92. Could it support Voice Messages?**
Yes, in the future, we can add a Speech-to-Text module (like OpenAI Whisper) to let users "speak" their symptoms.

**93. What about a Mobile App?**
Since it's on WhatsApp, it's already on everyone's mobile, which is much better than asking users to download a new app.

**94. Can we add a "Medicine Reminder"?**
Yes, we could store a user's prescription time and send them a WhatsApp message when it's time for their pill.

**95. Can it handle Group Chats?**
It currently works in DMs to ensure privacy, but group functionality could be enabled for family health groups.

**96. Can we use a local AI model (like Llama 3)?**
Yes, if we have a powerful local server, we could replace the Gemini API call with a local Ollama endpoint for 100% privacy.

**97. Could it sync with smartwatches?**
Yes, by connecting to Apple Health or Google Fit APIs, it could analyze heart rate or sleep data too.

**98. How can we make it faster?**
By using a "Stream" response where the bot sends chunks of text as they are generated (though limited by WhatsApp's API).

**99. Can it suggest nearby pharmacies?**
Yes, by using the Google Maps API, it could find the nearest chemist for the user.

**100. What is the ultimate goal of NaMo Aarogya?**
To be a reliable, virtual health companion for every Indian, ensuring no one is left without a basic health guidance.

---
*Created with NaMo Aarogya AI Development Team*
