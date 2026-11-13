import { CONFIG } from "./config.js";

export class FightDetector {
  constructor(onImpactDetected) {
    this.onImpactDetected = onImpactDetected;
    this.enabled = true;
    this.cooldown = false;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  start() {
    window.addEventListener("devicemotion", (e) => {
      if (!this.enabled || this.cooldown) return;
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;

      const gForce = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
      if (gForce > CONFIG.fightDetectionSensitivity) {
        this.cooldown = true;
        this.onImpactDetected(gForce.toFixed(1));
        setTimeout(() => (this.cooldown = false), 15000);
      }
    });
  }
}
