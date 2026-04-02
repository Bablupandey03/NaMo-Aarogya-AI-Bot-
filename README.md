# 🩺 NaMo Aarogya - AI Health Assistant (WhatsApp Bot)

[![Node.js](https://img.shields.io/badge/Node.js-v20.x-green.svg)](https://nodejs.org/)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Integrates-25D366.svg)](https://www.whatsapp.com/)
[![Gemini](https://img.shields.io/badge/AI-Gemini%20Flash-blue.svg)](https://deepmind.google/technologies/gemini/)
[![DeepSeek](https://img.shields.io/badge/AI-DeepSeek--V3-blueviolet.svg)](https://www.deepseek.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

**NaMo Aarogya** is a state-of-the-art, professional WhatsApp bot designed to provide high-quality preliminary health guidance. It uses a dual-model AI intelligence (DeepSeek-V3 for reasoning and Gemini Flash for Multi-modal analysis) to interpret symptoms, analyze medical reports (PDF/Images), and manage patient reminders.

---

## 🌟 Key Features

### 🧠 Dual-Model Intelligence
- **DeepSeek-V3**: Powering high-speed, intelligent text-based medical reasoning and symptom analysis.
- **Google Gemini Flash**: Handling complex multi-modal inputs like medical images, lab reports, PDFs, and voice messages.

### 📄 Multi-Modal Medical Analysis
- **Image Scanning**: Analyze prescriptions, X-rays, and physical symptoms from photos.
- **PDF Report Analysis**: Summarize and explain large medical lab reports in simple terms.
- **Voice Message Support**: Users can send voice notes for queries, making it accessible for everyone.

### 🔔 Smart Health Utilities
- **Medicine Reminders**: Built-in state machine to set daily reminders for medications (e.g., *"Remind me to take Calpol at 18:30"*).
- **Nearby Hospital Finder**: Location-based helper to find hospitals and medical stores in your area.
- **Global Request Queue**: Robust handling of high traffic using an asynchronous queue system to avoid API rate limits.

### 🛡️ Strict Professional Boundaries
- **Health Domain Focus**: Automatically filters out non-medical queries (jokes, code, etc.) with a professional refusal message.
- **WhatsApp Optimized Formatting**: Uses bolding, bullet points (•), and emojis for readability on mobile devices.

### 🖥️ Admin Control Center
- **Live Dashboard**: Monitor bot status and user interactions in real-time via a clean web interface.
- **Broadcast System**: Send critical health updates or announcements to all registered users simultaneously.

---

## 🛠️ Technical Stack

- **Backend**: [Node.js](https://nodejs.org/) (Express.js)
- **WhatsApp Protocol**: [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) 
- **AI Models**: DeepSeek API & Google Generative AI (Gemini)
- **Scheduling**: [node-cron](https://www.npmjs.com/package/node-cron) for medicine reminders
- **Media Engine**: [FFmpeg](https://ffmpeg.org/) for audio processing
- **Deployment**: [Docker](https://www.docker.com/) & [Railway](https://railway.app/) ready

---

## ⚙️ Professional Setup & Installation

### 1. Prerequisites
- **Node.js v20.x** or higher.
- **FFmpeg** installed on your system (for voice messages).
- API Keys for **Gemini** (Google AI Studio) and **DeepSeek**.

### 2. Clone the Repository
```bash
git clone https://github.com/Bablupandey03/NaMo-Aarogya-AI-Bot-.git
cd NaMo-Aarogya-AI-Bot-
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configuration (`.env`)
Create a `.env` file in the root directory and add your credentials:
```env
# Server Config
PORT=3001

# AI API Keys
GEMINI_API_KEY=your_gemini_key
GEMINI_API_KEY_BACKUP=your_backup_gemini_key (Optional)
DEEPSEEK_API_KEY=your_deepseek_key

# Node Environment
NODE_ENV=production
```

### 5. Start the Application
```bash
npm start
```
A QR code will be generated. Scan it via WhatsApp **Linked Devices** to start the bot.

---

## 🐳 Docker Deployment
The project is container-ready. To deploy using Docker:
```bash
docker build -t namo-aarogya-bot .
docker run -p 3001:3001 --env-file .env namo-aarogya-bot
```

---

## 👥 Meet the Team

| Role | Name | GitHub |
| :--- | :--- | :--- |
| **Lead Developer** | **Bablu Kumar** | [@Bablupandey03](https://github.com/Bablupandey03) |
| **Assistant Developer** | **Mrityunjay Pandey** | [@jurel6576-cyber](https://github.com/jurel6576-cyber) |

---

## ⚠️ Disclaimer
> [!IMPORTANT]
> **NaMo Aarogya** is an AI assistant intended for **preliminary guidance only**. It is **not** a diagnostic tool or a substitute for professional medical advice. Always consult a qualified physician for any health-related concerns.

---
*Developed with ❤️ to empower digital healthcare in India.*
