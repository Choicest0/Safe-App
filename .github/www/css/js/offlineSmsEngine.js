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
      if (window.Capacitor?.Plugins?.SmsSender) {
        await window.Capacitor.Plugins.SmsSender.send({
          phoneNumber: CONFIG.primaryGuardianPhone,
          message: smsText
        });
        this.onLog(`✅ Offline SMS Sent: ${alertTitle}`);
      } else {
        this.onLog(`📲 SMS Triggered: ${alertTitle}`);
        window.location.href = `sms:${CONFIG.primaryGuardianPhone}?body=${encodeURIComponent(smsText)}`;
      }
    } catch (err) {
      this.onLog(`⚠️ SMS Error: ${err.message}`);
    }
  }
}
