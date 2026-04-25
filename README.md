# 🚀 All Social Video Downloader

![UI Showcase](https://i.ibb.co/8GYQfH4/asvd.png)

A sleek, premium, single-page web application that allows users to instantly download high-quality videos and audio from all major social media platforms including Instagram, TikTok, YouTube, X (Twitter), and Facebook.

## ✨ Features
- **Universal Support:** Paste a link from almost any social platform, and the backend engine automatically determines the source and extracts the raw media.
- **Direct MP4 & Audio:** Provides options to download the highest quality MP4 video or extract the audio directly.
- **Lightning Fast:** Uses `yt-dlp` on the backend to directly fetch Content Delivery Network (CDN) links without heavily burdening the server.

## 🛠️ Technology Stack
- **Frontend:** Vanilla JavaScript + HTML/CSS (Bundled with Vite)
- **Backend:** Node.js + Express
- **Download Engine:** `youtube-dl-exec` (yt-dlp wrapper)
- **Deployment:** AWS EC2, Nginx, PM2

## 💻 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/asvd.git
   cd asvd
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server (Frontend):**
   ```bash
   npm run dev
   ```

4. **Start the Backend API:**
   ```bash
   npm run server
   ```

## 🌐 Production Deployment
This project is designed to be hosted on an AWS EC2 instance. The frontend is built into static files and served via Nginx, while the backend API is kept alive 24/7 using PM2 and reverse-proxied through Nginx.

---
*Built with ❤️ and designed for speed.*
