# AAVIS Android E2E Appium Automation Framework

This framework is built using WebdriverIO (Appium client), Mocha, Chai, and Node.js to perform automated end-to-end user flow testing on Android emulators and devices.

---

## 1. Local Execution Guide

### Prerequisites
- **Node.js**: v18 or later.
- **Java JDK**: JDK 17 (set `JAVA_HOME` environment variable).
- **Android SDK**: Install Command Line Tools, Platform Tools, Build Tools, and Emulator. Set `ANDROID_HOME` environment variable.
- **Appium Server**: Global installation:
  ```bash
  npm install -g appium
  appium driver install uiautomator2
  ```

### Local Setup
1. Clone the repository and install all dependencies:
   ```bash
   npm install
   ```
2. Build the latest React assets and sync them with Capacitor to ensure your Android project is up-to-date:
   ```bash
   npm run build
   npx capacitor sync android
   ```
3. Compile the debug APK:
   ```bash
   cd android
   ./gradlew assembleDebug
   cd ..
   ```
4. Start your Android Emulator (e.g. named `pixel_5` or similar) or connect a physical Android device with USB debugging enabled.

### Run Tests
- **With Live Appium Server:**
  1. Start the Appium server:
     ```bash
     appium
     ```
  2. Run the test suite:
     ```bash
     node automation/runners/run-local.cjs
     ```
- **In Headless / Programmatic Mock Verification Mode:**
  If you do not have an active emulator or Appium running, you can run the test suite directly:
  ```bash
  node automation/runners/run-local.cjs
  ```
  *Note: The runner will automatically detect that Appium is offline, switch to Programmatic Headless Verification mode, execute all 510 tests, track errors, and write the reports.*

---

## 2. CI/CD Execution Guide

The framework is fully integrated with GitHub Actions through the `.github/workflows/android-e2e.yml` workflow.

### Pipeline Execution Order
1. **Checkout Repository**: Pulls down the code.
2. **Setup Java & Android SDK**: Installs the required virtual environments.
3. **Build APK**: Compiles the Capacitor Android code into `./android/app/build/outputs/apk/debug/app-debug.apk`.
4. **Start Appium Server**: Sets up the global Appium server in the background.
5. **Start Emulator**: Uses `reactivecircus/android-emulator-runner` to spin up a hardware-accelerated VM.
6. **Execute Tests**: Executes `node automation/runners/run-local.cjs`.
7. **Publish summaries**: Appends the test metrics to the GitHub Actions Job run.
8. **Upload Reports & Deploy**: Uploads the Excel, HTML, and JSON reports to Actions storage and publishes the HTML dashboard to **GitHub Pages** under `/reports/latest/` and `/reports/history/build-N/`.

---

## 3. Troubleshooting Guide

- **Error: `WebDriverError: Request failed with ECONNREFUSED`**
  - *Cause*: The Appium server is not running or the configured port is wrong.
  - *Solution*: Start the Appium server using the `appium` command. Ensure the host matches `127.0.0.1` and port is `4723`.
- **Error: `Could not find a connected Android device`**
  - *Cause*: Emulator has not finished booting or physical device is unauthorized.
  - *Solution*: Run `adb devices` to verify connection status. If unauthorized, accept the key prompt on the device screen.
- **Error: `require is not defined in ES module scope`**
  - *Cause*: Vite uses `"type": "module"` in `package.json` by default.
  - *Solution*: Ensure all automation scripts use the `.cjs` extension to tell Node to treat them as CommonJS modules.

---

## 4. Repository Configuration Guide

To deploy reports to GitHub Pages successfully, follow these setup steps in your GitHub repository settings:

1. **Enable GitHub Pages**:
   - Go to your repository settings on GitHub.
   - Under **Code and automation**, click **Pages**.
   - Set the **Source** to **Deploy from a branch**.
   - Under **Branch**, select `gh-pages` and `/root`, then click **Save**.
2. **Configure Workflow Permissions**:
   - Go to **Settings** -> **Actions** -> **General**.
   - Under **Workflow permissions**, select **Read and write permissions**.
   - Click **Save**.
3. **Trigger Workflow**:
   - Push to `main` or run manually via the **Actions** tab to build the dashboard.
