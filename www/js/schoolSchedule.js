import { CONFIG } from "./config.js";

export class SchoolScheduleGuard {
  constructor(smsEngine) {
    this.smsEngine = smsEngine;
    this.reachedHome = false;
  }

  isWithinWatchWindow() {
    const hour = new Date().getHours();
    return hour >= CONFIG.schoolHours.startHour && !this.reachedHome;
  }

  onZoneTransition(state, coords) {
    if (state === "AT_SCHOOL") {
      this.reachedHome = false;
      this.smsEngine.sendSilentOfflineSMS("SAFE CHECK-IN: Reached School Safely", coords);
    } else if (state === "IN_TRANSIT") {
      this.smsEngine.sendSilentOfflineSMS("COMMUTE STARTED: Left School for Home", coords);
    } else if (state === "AT_HOME") {
      this.reachedHome = true;
      this.smsEngine.sendSilentOfflineSMS("SAFE ARRIVAL: Reached Home Safely", coords, true);
    }
  }
}
