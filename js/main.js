/* =========================================================
   NEXUS RTS — MAIN.JS
   Punto de entrada principal.
   Inicializa datos, simulación, mapas, interfaz y eventos.
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURACIÓN GLOBAL
========================================================= */

const NEXUS_CONFIG = {
  saveKey: "nexus_rts_save_v1",
  defaultCountry: "España",
  defaultLayer: "political",
  defaultSpeed: 7,
  startDate: {
    year: 2026,
    month: 6, // julio, porque JS cuenta enero como 0
    day: 3,
    hour: 14,
    minute: 35,
    second: 22
  },
  tickMs: 900
};

/* =========================================================
   ESTADO GLOBAL
========================================================= */

let NEXUS = {
  state: null,
  selectedCountry: NEXUS_CONFIG.defaultCountry,
  activeLayer: NEXUS_CONFIG.defaultLayer,
  activeBuildTab: "industries",
  paused: false,
  speed: NEXUS_CONFIG.defaultSpeed,
  simDate: null,
  simClock: {
    hour: NEXUS_CONFIG.startDate.hour,
    minute: NEXUS_CONFIG.startDate.minute,
    second: NEXUS_CONFIG.startDate.second
  },
  timer: null,
  mapsReady: false,
  uiReady: false
};

/* =========================================================
   BOOTSTRAP
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  try {
    bootNexus();
  } catch (error) {
    console.error("NEXUS boot error:", error);
    showFatalError(error);
  }
});

function bootNexus() {
  validateDependencies();

  NEXUS.simDate = new Date(
    NEXUS_CONFIG.startDate.year,
    NEXUS_CONFIG.startDate.month,
    NEXUS_CONFIG.startDate.day
  );

  NEXUS.state = createInitialGameState();

  if (typeof initializeCountrySites === "function") {
    NEXUS.state.countries.forEach(country => initializeCountrySites(country));
  }

  rankCountriesByMilitaryPower();

  addEvent("🌍", "Simulación iniciada con España como país seleccionado.");
  addEvent("🗺️", "Sistema cartográfico real activado con Leaflet y OpenStreetMap.");
  addEvent("🏗️", "Sistema de construcción por regiones inicializado.");

  initializeUI();
  initializeMaps();

  NEXUS.uiReady = true;
  NEXUS.mapsReady = true;

  renderAll();

  makeWindowsDraggable();
  bindGlobalEvents();

  NEXUS.timer = setInterval(gameLoop, NEXUS_CONFIG.tickMs);
}

/* =========================================================
   VALIDACIÓN DE DEPENDENCIAS
========================================================= */

function validateDependencies() {
  const requiredGlobals = [
    "COUNTRY_DATA",
    "BUILDINGS",
    "createInitialGameState",
    "simulateOneDay",
    "initializeMaps",
    "renderAll"
  ];

  const missing = requiredGlobals.filter(name => typeof window[name] === "undefined");

  if (missing.length > 0) {
    throw new Error(
      "Faltan módulos o variables requeridas: " + missing.join(", ") +
      ". Revisa que index.html cargue data.js, simulation.js, maps.js y ui.js antes de main.js."
    );
  }

  if (typeof L === "undefined") {
    throw new Error(
      "Leaflet no está cargado. Revisa el enlace CDN de Leaflet en index.html."
    );
  }
}

/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop() {
  if (NEXUS.paused) return;

  for (let i = 0; i < NEXUS.speed; i++) {
    simulateOneDay();
  }

  renderAll();
}

/* =========================================================
   CONTROL DE TIEMPO
========================================================= */

function togglePause() {
  NEXUS.paused = !NEXUS.paused;
  renderAll();
}

function setSimulationSpeed(speed) {
  NEXUS.speed = Number(speed);
  NEXUS.paused = false;
  renderAll();
}

function advanceSimulationDate(days = 1) {
  NEXUS.simDate.setDate(NEXUS.simDate.getDate() + days);
}

function getSimulationYear() {
  return NEXUS.simDate.getFullYear();
}

function getSimulationDateLabel() {
  return NEXUS.simDate.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function getSimulationTimeLabel() {
  return (
    String(NEXUS.simClock.hour).padStart(2, "0") + ":" +
    String(NEXUS.simClock.minute).padStart(2, "0") + ":" +
    String(NEXUS.simClock.second).padStart(2, "0")
  );
}

function getDayOfYear() {
  const start = new Date(NEXUS.simDate.getFullYear(), 0, 0);
  return Math.floor((NEXUS.simDate - start) / 86400000);
}

/* =========================================================
   PAÍS SELECCIONADO
========================================================= */

function getSelectedCountry() {
  return NEXUS.state.countries.find(
    country => country.name === NEXUS.selectedCountry
  );
}

function selectCountry(countryName) {
  const country = NEXUS.state.countries.find(c => c.name === countryName);

  if (!country) {
    console.warn("País no encontrado:", countryName);
    return;
  }

  NEXUS.selectedCountry = country.name;

  if (typeof focusMapsOnSelectedCountry === "function") {
    focusMapsOnSelectedCountry();
  }

  addEvent("🧭", "País seleccionado: " + country.flag + " " + country.name + ".");

  renderAll();
}

function rankCountriesByMilitaryPower() {
  const sorted = [...NEXUS.state.countries].sort((a, b) => b.military - a.military);
  sorted.forEach((country, index) => {
    country.powerRank = index + 1;
  });
}

/* =========================================================
   CAPAS DEL MAPA
========================================================= */

function setActiveLayer(layerName) {
  NEXUS.activeLayer = layerName;

  if (typeof updateWorldMapLayer === "function") {
    updateWorldMapLayer();
  }

  renderAll();
}

function setActiveBuildTab(tabName) {
  NEXUS.activeBuildTab = tabName;
  renderAll();
}

/* =========================================================
   GUARDADO / CARGA
========================================================= */

function saveGame() {
  const payload = {
    state: NEXUS.state,
    selectedCountry: NEXUS.selectedCountry,
    activeLayer: NEXUS.activeLayer,
    activeBuildTab: NEXUS.activeBuildTab,
    paused: NEXUS.paused,
    speed: NEXUS.speed,
    simDate: NEXUS.simDate.toISOString(),
    simClock: NEXUS.simClock
  };

  localStorage.setItem(NEXUS_CONFIG.saveKey, JSON.stringify(payload));

  addEvent("💾", "Partida guardada en este navegador.");
  renderAll();
}

function loadGame() {
  const raw = localStorage.getItem(NEXUS_CONFIG.saveKey);

  if (!raw) {
    alert("No hay ninguna partida guardada en este navegador.");
    return;
  }

  try {
    const payload = JSON.parse(raw);

    NEXUS.state = payload.state;
    NEXUS.selectedCountry = payload.selectedCountry || NEXUS_CONFIG.defaultCountry;
    NEXUS.activeLayer = payload.activeLayer || NEXUS_CONFIG.defaultLayer;
    NEXUS.activeBuildTab = payload.activeBuildTab || "industries";
    NEXUS.paused = Boolean(payload.paused);
    NEXUS.speed = payload.speed || NEXUS_CONFIG.defaultSpeed;
    NEXUS.simDate = new Date(payload.simDate);
    NEXUS.simClock = payload.simClock || {
      hour: NEXUS_CONFIG.startDate.hour,
      minute: NEXUS_CONFIG.startDate.minute,
      second: NEXUS_CONFIG.startDate.second
    };

    addEvent("📂", "Partida cargada correctamente.");

    if (typeof rebuildMapsAfterLoad === "function") {
      rebuildMapsAfterLoad();
    }

    renderAll();

  } catch (error) {
    console.error(error);
    alert("No se pudo cargar la partida. El guardado está corrupto o incompleto.");
  }
}

function resetGame() {
  const confirmed = confirm("¿Seguro que quieres reiniciar la simulación? Se perderá el estado actual si no lo has guardado.");

  if (!confirmed) return;

  localStorage.removeItem(NEXUS_CONFIG.saveKey);

  NEXUS.state = createInitialGameState();

  if (typeof initializeCountrySites === "function") {
    NEXUS.state.countries.forEach(country => initializeCountrySites(country));
  }

  rankCountriesByMilitaryPower();

  NEXUS.selectedCountry = NEXUS_CONFIG.defaultCountry;
  NEXUS.activeLayer = NEXUS_CONFIG.defaultLayer;
  NEXUS.activeBuildTab = "industries";
  NEXUS.paused = false;
  NEXUS.speed = NEXUS_CONFIG.defaultSpeed;
  NEXUS.simDate = new Date(
    NEXUS_CONFIG.startDate.year,
    NEXUS_CONFIG.startDate.month,
    NEXUS_CONFIG.startDate.day
  );
  NEXUS.simClock = {
    hour: NEXUS_CONFIG.startDate.hour,
    minute: NEXUS_CONFIG.startDate.minute,
    second: NEXUS_CONFIG.startDate.second
  };

  addEvent("♻", "Simulación reiniciada.");

  if (typeof rebuildMapsAfterLoad === "function") {
    rebuildMapsAfterLoad();
  }

  renderAll();
}

/* =========================================================
   EVENTOS DE INTERFAZ
========================================================= */

function bindGlobalEvents() {
  document.body.addEventListener("click", event => {
    const target = event.target.closest("button");

    if (!target) return;

    handleButtonClick(target);
  });

  document.body.addEventListener("change", event => {
    handleInputChange(event.target);
  });
}

function handleButtonClick(button) {
  if (button.dataset.action) {
    handleAction(button.dataset.action);
  }

  if (button.dataset.speed) {
    setSimulationSpeed(button.dataset.speed);
  }

  if (button.dataset.focusPanel) {
    focusPanel(button.dataset.focusPanel);
  }

  if (button.dataset.layer) {
    setActiveLayer(button.dataset.layer);
  }

  if (button.dataset.buildTab) {
    setActiveBuildTab(button.dataset.buildTab);
  }

  if (button.dataset.buildingId) {
    const selector = document.querySelector(
      `[data-region-selector="${button.dataset.buildingId}"]`
    );

    const regionId = selector ? selector.value : null;

    if (typeof startConstruction === "function") {
      startConstruction(button.dataset.buildingId, regionId);
    }
  }

  if (button.dataset.policy) {
    if (typeof executePolicy === "function") {
      executePolicy(button.dataset.policy);
    }
  }
}

function handleAction(action) {
  switch (action) {
    case "toggle-pause":
      togglePause();
      break;

    case "save-game":
      saveGame();
      break;

    case "load-game":
      loadGame();
      break;

    case "reset-game":
      resetGame();
      break;

    default:
      console.warn("Acción no reconocida:", action);
  }
}

function handleInputChange(input) {
  if (input.id === "country-selector") {
    selectCountry(input.value);
  }
}

function focusPanel(panelId) {
  const panel = document.getElementById(panelId);

  if (!panel) return;

  document.querySelectorAll(".window").forEach(windowElement => {
    windowElement.classList.remove("is-focused");
  });

  panel.classList.add("is-focused");
  panel.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center"
  });

  document.querySelectorAll("#main-nav button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.focusPanel === panelId
    );
  });
}

/* =========================================================
   VENTANAS MOVIBLES
========================================================= */

function makeWindowsDraggable() {
  document.querySelectorAll(".window").forEach(windowElement => {
    const titleBar = windowElement.querySelector(".window-title");

    if (!titleBar) return;

    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    let dragging = false;

    titleBar.addEventListener("pointerdown", event => {
      if (window.innerWidth <= 1100) return;

      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startLeft = windowElement.offsetLeft;
      startTop = windowElement.offsetTop;

      windowElement.classList.add("is-focused");

      try {
        titleBar.setPointerCapture(event.pointerId);
      } catch (_) {}
    });

    titleBar.addEventListener("pointermove", event => {
      if (!dragging) return;

      const dx = event.clientX - startX;
      const dy = event.clientY - startY;

      windowElement.style.left = `${startLeft + dx}px`;
      windowElement.style.top = `${startTop + dy}px`;
    });

    titleBar.addEventListener("pointerup", event => {
      dragging = false;

      try {
        titleBar.releasePointerCapture(event.pointerId);
      } catch (_) {}
    });
  });
}

/* =========================================================
   UTILIDADES GLOBALES
========================================================= */

function addEvent(icon, message) {
  if (!NEXUS.state.events) {
    NEXUS.state.events = [];
  }

  NEXUS.state.events.unshift({
    icon,
    message,
    time: getSimulationTimeLabel(),
    date: getSimulationDateLabel()
  });

  if (NEXUS.state.events.length > 80) {
    NEXUS.state.events.pop();
  }
}

function formatEuro(value) {
  return "€ " + Math.round(value).toLocaleString("es-ES");
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("es-ES");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function showFatalError(error) {
  document.body.innerHTML = `
    <div style="
      max-width: 900px;
      margin: 40px auto;
      padding: 20px;
      background: #190711;
      color: #fff;
      border: 1px solid #ff4d5f;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
    ">
      <h1>⚠ Error al iniciar NEXUS RTS</h1>
      <p>El juego no ha podido arrancar.</p>
      <pre style="
        white-space: pre-wrap;
        background: #070b12;
        padding: 12px;
        border-radius: 8px;
        color: #ffb4bf;
      ">${error.message}</pre>
      <p>
        Revisa que existan todos los archivos:
        <code>data.js</code>,
        <code>simulation.js</code>,
        <code>maps.js</code>,
        <code>ui.js</code>
        y que estén cargados antes que <code>main.js</code>.
      </p>
    </div>
  `;
}

/* =========================================================
   EXPOSICIÓN CONTROLADA GLOBAL
   Necesaria porque usamos scripts clásicos, no módulos ES.
========================================================= */

window.NEXUS = NEXUS;
window.NEXUS_CONFIG = NEXUS_CONFIG;

window.togglePause = togglePause;
window.setSimulationSpeed = setSimulationSpeed;
window.advanceSimulationDate = advanceSimulationDate;
window.getSimulationYear = getSimulationYear;
window.getSimulationDateLabel = getSimulationDateLabel;
window.getSimulationTimeLabel = getSimulationTimeLabel;
window.getDayOfYear = getDayOfYear;

window.getSelectedCountry = getSelectedCountry;
window.selectCountry = selectCountry;
window.rankCountriesByMilitaryPower = rankCountriesByMilitaryPower;

window.setActiveLayer = setActiveLayer;
window.setActiveBuildTab = setActiveBuildTab;

window.saveGame = saveGame;
window.loadGame = loadGame;
window.resetGame = resetGame;

window.addEvent = addEvent;
window.formatEuro = formatEuro;
window.formatNumber = formatNumber;
window.clamp = clamp;
window.randomBetween = randomBetween;
