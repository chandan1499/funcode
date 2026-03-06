# FunCode — DSA Practice Platform

A LeetCode-style competitive DSA practice platform with **level-based weekly rooms**, **AI-generated question variants**, and **per-room leaderboards**.

## Features

- **5 Difficulty Levels**: Beginner → Easy → Medium → Hard → Pro
- **Weekly Rooms**: One active room per level, auto-created weekly with 10 random questions
- **AI Question Variants**: Groq LLaMA rewrites each question with a new theme for every user — same algorithm, fresh problem
- **localStorage Caching**: Variants stored in browser — fast, persistent for the room's lifetime, zero re-generation
- **In-Browser Code Execution**: JavaScript runs in a Web Worker sandbox (free, no API needed)
- **Per-Room Leaderboard**: 10 points per solved question, ranked by points → total solve time
- **Level-Up System**: Solve all 10 within the time limit to advance

## Level-Up Timing

| Level     | Time Limit (all 10 questions) |
|-----------|-------------------------------|
| Beginner  | 25 minutes                    |
| Easy      | 35 minutes                    |
| Medium    | 50 minutes                    |
| Hard      | 80 minutes                    |
| Pro       | 120 minutes                   |

## Setup

### 1. Firebase Project

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore** and **Google Authentication**
3. Copy your Firebase config

### 2. Groq API Key

Get a free API key at [console.groq.com](https://console.groq.com)

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

VITE_GROQ_API_KEY=...
```

### 4. Seed Questions to Firestore

```bash
# Install firebase-admin first
npm install -g firebase-admin

# Download your service account key from Firebase Console > Project Settings > Service Accounts
# Save it as serviceAccountKey.json in the project root

node seed/seedFirestore.cjs
```

### 5. Run the App

```bash
npm install
npm run dev
```

## Firestore Security Rules

Add these rules in your Firebase Console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /questions/{id} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if false;
      match /progress/{uid} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == uid;
      }
    }
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

## Tech Stack

- **React 19 + Vite** — frontend
- **TypeScript** — type safety
- **Tailwind CSS v4** — styling
- **Firebase** — Firestore + Google Auth
- **Groq SDK** — AI question variants (llama-3.3-70b-versatile)
- **Monaco Editor** — in-browser code editor
- **Web Worker** — sandboxed JavaScript execution
