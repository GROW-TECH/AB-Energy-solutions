# AB Energy Solutions - Android SIM Call Connector

This Android application automatically tracks SIM calls made and received on your sales executive's Android phone and pushes them in real-time to your **AB Energy Solutions CRM**.

---

## 📁 Project Location on your PC:
`c:\Users\Admin\Downloads\ab-energy-solutions---solar-crm-&-business-os\android-connector`

---

## 🚀 How to Build the APK in Android Studio (3 Simple Steps)

### Step 1: Open the Project in Android Studio
1. Open **Android Studio**.
2. Click **Open** (or **File > Open**).
3. Select the folder:  
   `c:\Users\Admin\Downloads\ab-energy-solutions---solar-crm-&-business-os\android-connector`
4. Wait 1-2 minutes for Gradle to sync.

### Step 2: Build the APK
1. In the top menu, click **Build**.
2. Click **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Once completed, a popup will appear at the bottom right saying:  
   `APK(s) generated successfully for module 'app' [locate]`.
4. Click **[locate]**. Your `.apk` file (usually named `app-debug.apk`) is ready!

### Step 3: Install on the Sales Executive's Phone
1. Send `app-debug.apk` to your phone (via WhatsApp, Google Drive, or USB cable).
2. Tap on the file to **Install**.
3. Open the app:
   - Enter your laptop / server URL (e.g., `http://192.168.1.15:3000` or your online CRM URL).
   - Enter the executive's mobile number (e.g., `+91 96552 47872`).
   - Tap **"Activate SIM Call Tracking"**.
   - Tap **Allow** when Android asks for Call Log permissions.

---

## 🌐 How to Find your Laptop's Wi-Fi IP for Testing
1. Open PowerShell or Command Prompt on your laptop.
2. Type:
   ```cmd
   ipconfig
   ```
3. Look for **IPv4 Address** under `Wireless LAN adapter Wi-Fi`:
   - Example: `192.168.1.15`
4. In the Android App, set the Server URL to:
   ```
   http://192.168.1.15:3000
   ```
*(Note: Your phone and laptop must be connected to the same Wi-Fi router for local testing).*

---

## ⚡ What Happens Automatically When Running:
- Executive dials a customer &rarr; Call finishes &rarr; Duration and number automatically synced to CRM.
- Customer calls executive &rarr; Call answered &rarr; Recorded as `INCOMING` with duration.
- Customer calls and executive misses &rarr; Recorded as `MISSED` with 0s duration &rarr; Triggers instant urgent callback alert on CRM dashboard!
