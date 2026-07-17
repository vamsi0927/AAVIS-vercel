# AAVIS React Deployment & Selenium E2E Testing Documentation

This document outlines the step-by-step setup, configuration, and execution flows for deploying AAVIS to GitHub Pages and running automated Selenium E2E tests.

---

## Step 1 — Push Your Vite React Project to GitHub
Initialize your local repository, commit changes, and push to main:
```bash
git init
git add .
git commit -m "feat: setup react frontend and selenium automation"
git branch -M main
git remote add origin https://github.com/vamsi0927/AAVIS-vercel.git
git push -u origin main
```

---

## Step 2 — Configure Routing for GitHub Pages
By default, standard `BrowserRouter` causes `404 Page Not Found` errors when users refresh the page or try to access deep links directly on static hosting platforms like GitHub Pages.

To solve this, AAVIS uses **`HashRouter`** from `react-router-dom` in [App.tsx](file:///c:/Users/anvkp/.gemini/antigravity/scratch/aavis/src/App.tsx):
```typescript
import { HashRouter, Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <AppProvider>
      <HashRouter>
        <MobileFrame>
          <OfflineBanner />
          <AppContent />
        </MobileFrame>
      </HashRouter>
    </AppProvider>
  );
}
```
URLs will now format as `https://vamsi0927.github.io/AAVIS-vercel/#/login`, allowing direct URL navigation and page refreshes to resolve correctly.

---

## Step 3 — Install GitHub Pages package & Configure package.json
1. Install `gh-pages` as a devDependency:
   ```bash
   npm install gh-pages --save-dev
   ```
2. Configure [package.json](file:///c:/Users/anvkp/.gemini/antigravity/scratch/aavis/package.json) to set your homepage URL and deployment build scripts:
   ```json
   {
     "homepage": "https://vamsi0927.github.io/AAVIS-vercel",
     "scripts": {
       "build": "npx vite build",
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```
   *Note: Because AAVIS is a Vite React application, the compiled output is built inside the `dist` directory (not `build`), so we use `gh-pages -d dist`.*

---

## Step 4 — Secret Scan & Bypass Push Protection
When building the production bundle, Vite embeds environment keys (e.g. `VITE_GEMINI_API_KEY`) into the static bundle. If GitHub push protection blocks your push with a warning like `GCP API Key Bound to a Service Account`, do either of the following:

1. **Unblock the Secret (Recommended)**:
   Visit the unique URL generated in your terminal or go to:
   [GitHub Secret Scanning Allow Link](https://github.com/vamsi0927/AAVIS-vercel/security/secret-scanning/unblock-secret/3GcXc0Yxtp82AMD7c4vkxtOVgJw)
   and allow the secret as a false positive/whitelisted key.
2. **Build Without Secret**:
   Clear the API key from your local `.env` file before executing build/deploy:
   `VITE_GEMINI_API_KEY=""`

---

## Step 5 — Deploy to GitHub Pages
Execute the deploy script:
```bash
npm run deploy
```
This script will:
- Run `vite build` to package minified HTML, JS, and CSS files under `/dist`.
- Commit the `/dist` files to a special `gh-pages` branch.
- Push the branch to your origin repository.

---

## Step 6 — Enable GitHub Pages in Repository Settings
1. Navigate to your repository settings on GitHub: `vamsi0927/AAVIS-vercel`.
2. Click on **Pages** in the left sidebar.
3. Under **Build and deployment**, select **Deploy from a branch** as the source.
4. Set the branch selection to **`gh-pages`** and folder to **`/ (root)`**, then click **Save**.
5. Your live app will be available at:  
   `https://vamsi0927.github.io/AAVIS-vercel/`

---

## Step 7 — Run Selenium E2E Web Tests Locally
The selenium suite is structured under `/selenium` to test core pages (Login, Register, Dashboard) against the production or local build:
1. Make sure Selenium dependencies are installed:
   ```bash
   npm install selenium-webdriver mocha --save-dev
   ```
2. Set target configurations in `selenium/config/config.js` and execute tests locally:
   ```bash
   npm run selenium
   ```

---

## Step 8 — DevSecOps CI/CD Integration
Whenever you push code changes to `main`, GitHub Actions will automatically run the E2E verification workflow:
- Configures environment and installs dependencies.
- Runs static analysis and secret scanners.
- Executes automated Selenium browser tests headlessly.
- Deploys compiled reports directly to Pages.
