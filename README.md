# 🩺 NaMo Aarogya - AI Health Assistant

[![Node.js](https://img.shields.io/badge/Node.js-v18.x-green.svg)](https://nodejs.org/)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Integrates-25D366.svg)](https://www.whatsapp.com/)
[![Gemini](https://img.shields.io/badge/AI-Gemini%20Flash-blue.svg)](https://deepmind.google/technologies/gemini/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**NaMo Aarogya** is a professional, production-ready WhatsApp bot designed to provide preliminary health guidance. Powered by Google's Gemini AI, it interprets symptoms, analyzes medical reports, and offers wellness tips while maintaining strict clinical boundaries.

---

## 🚀 Key Features

- **🧠 Advanced Symptom Analysis:** Understands complex health queries in English, Hindi, and Hinglish.
- **📄 Medical Report OCR:** Analyze images of prescriptions, lab reports, and scans for simplified explanations.
- **🛡️ Strict Health Domain:** Automatically identifies and rejects non-health related queries (coding, jokes, etc.) to maintain professional integrity.
- **📱 WhatsApp Optimized:** Rich text formatting (bolding, custom bullets, emojis) tailored for a seamless mobile experience.
- **📜 Persistent Context:** Remembers recent chat history for contextually aware medical guidance.
- **🖥️ Admin Dashboard:** Built-in Express server for monitoring bot interactions.

---

## 🛠️ Tech Stack

- **Engine:** [Node.js](https://nodejs.org/)
- **WhatsApp API:** [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) (High-performance WA Web API)
- **AI Core:** [Google Gemini API](https://ai.google.dev/)
- **State Management:** Local JSON history manager
- **Deployment:** Dockerized, ready for Railway/Heroku

---

## 📋 Prerequisites

- **Node.js** (v18 or higher recommended)
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)
- A WhatsApp account to use as the bot host.

---

## ⚙️ Installation & Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/jurel6576-cyber/NaMo-Aarogya-AI-Bot-.git
   cd NaMo-Aarogya-AI-Bot-
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

4. **Start the Bot:**
   ```bash
   npm start
   ```

5. **Authentication:**
   A QR code will appear in your terminal. Scan it using **WhatsApp > Linked Devices > Link a Device**.

---

## 🐳 Docker Deployment

The project includes a `Dockerfile` for easy containerized deployment.

```bash
docker build -t namo-aarogya-bot .
docker run -p 3000:3000 --env-file .env namo-aarogya-bot
```

---

## ⚠️ Disclaimer

> [!IMPORTANT]
> **NaMo Aarogya** is an AI-powered assistant designed for **preliminary guidance only**. It is **not** a replacement for professional medical advice, diagnosis, or treatment. Users should always consult with a qualified healthcare provider before making any medical decisions.

---

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or new features, feel free to open an issue or submit a pull request.

---

## 📄 License

This project is licensed under the **ISC License**.

---
*Developed with ❤️ for a healthier India.*
