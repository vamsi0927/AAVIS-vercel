# 🥗 Aavis Backend API

Backend server for the **Aavis Food Label Scanner** app — an AI-powered nutrition analyzer.

## 🚀 Features

- **`POST /api/analyze`** — Analyze food label text using AI (Groq primary, Gemini fallback)
- **`POST /api/chat`** — Chat with Aavis, the AI nutrition assistant
- **`POST /api/signup`** — Register a new user
- **`POST /api/login`** — Authenticate an existing user
- **`GET /api/health`** — Health check endpoint

## 📦 Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `3001`) |
| `GROQ_API_KEY` | Yes* | Groq API key for Llama 3.3 |
| `VITE_GEMINI_API_KEY` | Yes* | Google Gemini API key (fallback) |

*At least one API key is required.

### 3. Start the server

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

## ☁️ Cloud Deployment

### Render
1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add environment variables in the dashboard

### Railway
1. Create a new project on [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Add environment variables
4. Deploy — Railway auto-detects Node.js

### Vercel (Serverless)
> ⚠️ This is a traditional Express server. For Vercel, you'd need to wrap routes as serverless functions.

## 📡 API Usage

### Analyze Food Label
```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Ingredients: Sugar, Palm Oil, Wheat Flour..."}'
```

### Chat with Aavis
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Is palm oil bad for health?"}'
```

## 🛡️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **AI**: Groq (Llama 3.3) + Google Gemini (fallback)
- **Auth**: bcryptjs (password hashing)
