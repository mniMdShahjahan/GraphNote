# Personal Knowledge Graph Manager

A full-stack application for managing and visualizing personal knowledge as an interactive graph.

## Tech Stack
- **Frontend**: React, Tailwind CSS, React Flow (Graph Visualization), Lucide React (Icons), Framer Motion (Animations).
- **Backend**: Node.js, Express (Full-stack mode).
- **Database & Auth**: Firebase (Firestore & Google Auth).
- **AI**: Google Gemini (Note analysis & relationship suggestions).

## Features
- **Interactive Graph**: Visualize notes as nodes and relationships as edges.
- **Markdown Support**: Write notes using full Markdown syntax.
- **AI-Powered**: Get suggestions for connecting your notes.
- **Real-time Sync**: Changes are synced instantly across devices via Firestore.
- **Secure**: Protected by Firebase Security Rules and Google OAuth.

## Setup Instructions
1. **Firebase**: The application is already connected to a provisioned Firebase project.
2. **Environment Variables**:
   - `GEMINI_API_KEY`: Required for AI features (automatically injected).
   - `APP_URL`: Automatically injected.
3. **Running Locally**:
   - `npm install`
   - `npm run dev` (Starts Express + Vite)
4. **Deployment**:
   - `npm run build`
   - `npm start`

## Architecture
- **Controller/Service/Repository**: The application follows a clean separation of concerns.
- **Firestore Rules**: Strict security rules ensure users can only access their own data.
- **Error Boundary**: Robust error handling for database and runtime issues.
