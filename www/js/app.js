import { CONFIG } from "./config.js";
import { OfflineSmsEngine } from "./offlineSmsEngine.js";
import { GeofenceEngine } from "./geofenceEngine.js";
import { SchoolScheduleGuard } from "./schoolSchedule.js";
import { FightDetector } from "./fightDetector.js";

let latestCoords = null;
let sirenCtx = null;
let sirenOsc = null;
let countdownTimer = null;

function addLog(msg) {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const li = document.createElement("li");
  li.innerHTML = `<span class="dot"></span> [${time}] ${msg}`;
  document.getElementById("sms-log-list")?.prepend(li);
}

function addParentTimeline(msg) {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const li = document.createElement("li");
  li.innerHTML = `<span class="dot"></span> <strong>${msg}</strong> — ${time}`;
  document.getElementById("timeline-list")?.prepend(li);
}

const smsEngine = new OfflineSmsEngine(addLog);
const scheduleGuard = new SchoolScheduleGuard(smsEngine);

const geofence = new GeofenceEngine((newState) => {
  const banner = document.getElementById("zone-status");
  if (newState === "AT_SCHOOL") {
    banner.textContent = "🏫 Safe Inside School • Watch Active";
    addParentTimeline("Arrived at School");
  } else if (newState === "AT_HOME") {
    banner.textContent = "🏠 Reached Home Safely";
    addParentTimeline("Reached Home Safely");
  } else {
    banner.textContent = "On Route to Home • GPS Active";
    addParentTimeline("Left School • Commuting Home");
  }

  if (scheduleGuard.isWithinWatchWindow() || newState === "AT_HOME") {
    scheduleGuard.onZoneTransition(newState, latestCoords);
  }
});

// Start Hardware GPS Watch (Works offline via GPS satellites)
function startOfflineGPS() {
  const onPosition = (pos) => {
    latestCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const res = geofence.evaluate(latestCoords);
    document.getElementById("distance-text").textContent = `Distance to Home: ${res.distHomeKm} km`;
  };

  const onError = () => {
    document.getElementById("distance-text").textContent = "Step outdoors / near window for GPS";
  };

  if (window.Capacitor?.Plugins?.Geolocation) {
    window.Capacitor.Plugins.Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 15000 },
      (pos, err) => {
        if (pos) onPosition(pos);
        else if (err) onError();
      }
    );
  } else if (navigator.geolocation) {
    navigator.geolocation.watchPosition(onPosition, onError, { enableHighAccuracy: true });
  }
}
startOfflineGPS();

// Automatic Fight / Violent Shake Sensor with 10-second Cancel Window
const fightDetector = new FightDetector((force) => {
  const modal = document.getElementById("fight-modal");
  const counterEl = document.getElementById("countdown-num");
  let seconds = 10;
  counterEl.textContent = seconds;
  modal.classList.remove("hidden");

  countdownTimer = setInterval(() => {
    seconds--;
    counterEl.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(countdownTimer);
      modal.classList.add("hidden");
      smsEngine.sendSilentOfflineSMS(
        `URGENT: Possible Fight or Impact (${force}G) Detected`,
        latestCoords,
        true
      );
      addParentTimeline("Fight / Impact Alert Triggered");
    }
  }, 1000);
});
fightDetector.start();

document.getElementById("cancel-fight-btn")?.addEventListener("click", () => {
  clearInterval(countdownTimer);
  document.getElementById("fight-modal").classList.add("hidden");
  addLog("Fight alert canceled by student");
});

document.getElementById("btn-fight-sensor")?.addEventListener("click", () => {
  const isOn = fightDetector.toggle();
  document.getElementById("sensor-status").textContent = isOn ? "Fight Sensor: ON" : "Fight Sensor: OFF";
  addLog(`Fight Sensor turned ${isOn ? "ON" : "OFF"}`);
});

document.getElementById("sos-trigger-btn")?.addEventListener("click", () => {
  smsEngine.sendSilentOfflineSMS("SOS EMERGENCY: Immediate Help Needed", latestCoords, true);
  addParentTimeline("Manual SOS Alert Sent");
});

document.getElementById("btn-fight-manual")?.addEventListener("click", () => {
  smsEngine.sendSilentOfflineSMS("PROBLEM ALERT: Student Reported Fight / Bullying", latestCoords, true);
  addParentTimeline("Fight / Bullying Reported");
});

document.getElementById("btn-safe-home")?.addEventListener("click", () => {
  smsEngine.sendSilentOfflineSMS("SAFE ARRIVAL: Student Confirmed Reached Home", latestCoords, true);
  addParentTimeline("Confirmed Reached Home");
});

document.getElementById("btn-share-gps")?.addEventListener("click", () => {
  smsEngine.sendSilentOfflineSMS("LIVE GPS CHECK-IN", latestCoords, true);
});

document.getElementById("btn-siren")?.addEventListener("click", (e) => {
  if (sirenOsc) {
    sirenOsc.stop();
    sirenOsc = null;
    e.currentTarget.querySelector("h3").textContent = "Loud Siren & Strobe";
    return;
  }
  sirenCtx = new (window.AudioContext || window.webkitAudioContext)();
  sirenOsc = sirenCtx.createOscillator();
  sirenOsc.type = "sawtooth";
  sirenOsc.frequency.setValueAtTime(980, sirenCtx.currentTime);
  sirenOsc.connect(sirenCtx.destination);
  sirenOsc.start();
  e.currentTarget.querySelector("h3").textContent = "STOP SIREN";
});

document.getElementById("guardian-display").textContent = CONFIG.primaryGuardianPhone;
if (navigator.getBattery) {
  navigator.getBattery().then((bat) => {
    const updateBat = () => {
      document.getElementById("battery-level").textContent = `${Math.round(bat.level * 100)}%`;
    };
    updateBat();
    bat.addEventListener("levelchange", updateBat);
  });
}

// Bottom Navigation Tabs
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.target).classList.add("active");
  });
});
