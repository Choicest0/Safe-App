import { CONFIG } from "./config.js";

export class GeofenceEngine {
  constructor(onStateChange) {
    this.onStateChange = onStateChange;
    this.currentState = "UNKNOWN";
  }

  getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(lat2 - lat1);
    const dLon = rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  evaluate(coords) {
    const { school, home } = CONFIG.locations;
    const distSchool = this.getDistanceMeters(coords.lat, coords.lng, school.lat, school.lng);
    const distHome = this.getDistanceMeters(coords.lat, coords.lng, home.lat, home.lng);

    let state = "IN_TRANSIT";
    if (distSchool <= CONFIG.safeRadiusMeters) state = "AT_SCHOOL";
    else if (distHome <= CONFIG.safeRadiusMeters) state = "AT_HOME";

    if (state !== this.currentState) {
      this.currentState = state;
      this.onStateChange(state);
    }

    return { state, distHomeKm: (distHome / 1000).toFixed(2) };
  }
}
