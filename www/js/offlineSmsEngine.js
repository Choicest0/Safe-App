import { CONFIG } from "./config.js";

export class OfflineSmsEngine {
  constructor(onLog) {
    this.onLog = onLog;
    this.lastSent = 0;
  }

  async sendSilentOfflineSMS(alertTitle, coords, forceSend = false) {
    const now = Date.now();
    if (!forceSend && now - this.lastSent < 60000) return;
    this.lastSent = now;

    const gpsLink = coords
      ? `https://google.com{coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`
      : "GPS Acquiring (School Route)";

    const smsText = `[SafeRoute] ${CONFIG.studentName}: ${alertTitle}. Location: ${gpsLink}`;

    try {
      if (window.AndroidSmsBridge && typeof window.AndroidSmsBridge.sendSms === "function") {
        window.AndroidSmsBridge.sendSms(CONFIG.primaryGuardianPhone, smsText);
        this.onLog(`✅ Offline SIM SMS Sent: ${alertTitle}`);
      } else {
        this.onLog(`⚠️ Native SMS Bridge unavailable — check APK permissions`);
        alert(`SMS Preview:\nTo: ${CONFIG.primaryGuardianPhone}\n${smsText}`);
      }
    } catch (err) {
      this.onLog(`⚠️ SMS Error: ${err.message}`);
    }
  }
}
