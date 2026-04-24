# CivicPulse — Connecting Needs with Action

## Live Deployment — Firebase Hosting

Step 1: Install Firebase CLI
npm install -g firebase-tools

Step 2: Login to Firebase
firebase login

Step 3: Build the app
npm run build

Step 4: Deploy
firebase deploy --only hosting

Your live URL will be: https://YOUR_PROJECT_ID.web.app

To redeploy after changes:
npm run build && firebase deploy --only hosting
