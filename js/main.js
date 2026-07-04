

/* =========================================================
   NEXUS RTS — MAIN.JS v3
   Entrada principal, tiempo lento, eventos UI y estado global
   ========================================================= */
"use strict";
const NEXUS_CONFIG = {
  saveKey: "nexus_rts_save_v3",
  defaultCountry: "España",
  defaultLayer: "political",
  defaultSpeed: 1,
  tickMs: 1000,
  secondsPerDayAtX1: 10,
  startDate: {
    year: 2026,
    month: 6,
    day: 3,
    hour: 14,
    minute: 35,
    second: 22
  }
};
let NEXUS = {
  state: null,
  selectedCountry: NEXUS_CONFIG.defaultCountry,
  selectedRegionId: "madrid",
  activeLayer: NEXUS_CONFIG.defaultLayer,
  activeBuildTab: "industries",
  activeEconomyTab: "budget",
  activeTargetCountry: "Francia",
  paused: false,
  speed: NEXUS_CONFIG.defaultSpeed,
  dayAccumulator: 0,
  simDate: null,
  simClock: {
    hour: NEXUS_CONFIG.startDate.hour,
    minute: NEXUS_CONFIG.startDate.minute,
    second: NEXUS_CONFIG.startDate.second
  },
  timer: null
};
document.addEventListener("DOMContentLoaded", () => {
  try {
    bootNexus();
  } catch (error) {
    console.error(error);
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
  NEXUS.state.countries.forEach(country => {
    if (typeof initializeCountrySites === "function") {
      initializeCountrySites(country);
    }
    ensureCountryRuntimeFields(country);
  });
  rankCountriesByMilitaryPower();
  addEvent("🚀", "NEXUS v3 iniciado. Simulación diaria lenta activada: x1 = 1 día cada 10 segundos.");
  addEvent("🇪🇸", "España seleccionada como país inicial.");
  initializeUI();
  initializeMaps();
  renderAll();
  bindGlobalEvents();
  NEXUS.timer = setInterval(gameLoop, NEXUS_CONFIG.tickMs);
}
function validateDependencies() {
  const required = [
    "COUNTRY_DATA",
    "BUILDINGS",
    "createInitialGameState",
    "simulateOneDay",
    "initializeMaps",
    "renderAll"
  ];
  const missing = required.filter(name => typeof window[name] === "undefined");
  if (missing.length) {
    throw new Error("Faltan dependencias: " + missing.join(", "));
  }
  if (typeof L === "undefined") {
    throw new Error("Leaflet no está cargado.");
  }
}
/* =========================================================
   TIEMPO
========================================================= */
function gameLoop() {
  if (NEXUS.paused) {
    renderClock();
    return;
  }
  NEXUS.dayAccumulator += NEXUS.speed;
  if (NEXUS.dayAccumulator >= NEXUS_CONFIG.secondsPerDayAtX1) {
    const daysToSimulate = Math.floor(
      NEXUS.dayAccumulator / NEXUS_CONFIG.secondsPerDayAtX1
    );
    NEXUS.dayAccumulator -= daysToSimulate * NEXUS_CONFIG.secondsPerDayAtX1;
    for (let i = 0; i < daysToSimulate; i++) {
      simulateOneDay();
    }
    renderAll();
  } else {
    advanceClockSeconds(NEXUS.speed);
    renderClock();
  }
}
function advanceClockSeconds(seconds) {
  NEXUS.simClock.second += seconds;
  while (NEXUS.simClock.second >= 60) {
    NEXUS.simClock.second -= 60;
    NEXUS.simClock.minute += 1;
  }
  while (NEXUS.simClock.minute >= 60) {
    NEXUS.simClock.minute -= 60;
    NEXUS.simClock.hour += 1;
  }
  while (NEXUS.simClock.hour >= 24) {
    NEXUS.simClock.hour -= 24;
  }
}
function advanceSimulationDate(days = 1) {
  NEXUS.simDate.setDate(NEXUS.simDate.getDate() + days);
}
function togglePause() {
  NEXUS.paused = !NEXUS.paused;
  renderAll();
}
function setSimulationSpeed(speed) {
  NEXUS.speed = Number(speed);
  NEXUS.paused = false;
  renderAll();
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
    String(Math.floor(NEXUS.simClock.hour)).padStart(2, "0") + ":" +
    String(Math.floor(NEXUS.simClock.minute)).padStart(2, "0") + ":" +
    String(Math.floor(NEXUS.simClock.second)).padStart(2, "0")
  );
}
function getDayOfYear() {
  const start = new Date(NEXUS.simDate.getFullYear(), 0, 0);
  return Math.floor((NEXUS.simDate - start) / 86400000);
}
/* =========================================================
   SELECCIÓN
========================================================= */
function getSelectedCountry() {
  return NEXUS.state.countries.find(c => c.name === NEXUS.selectedCountry);
}
function getSelectedRegion() {
  const country = getSelectedCountry();
  if (!country?.regions?.length) return null;
  return (
    country.regions.find(r => r.id === NEXUS.selectedRegionId) ||
    country.regions[0]
  );
}
function selectCountry(countryName) {
  const country = NEXUS.state.countries.find(c => c.name === countryName);
  if (!country) return;
  NEXUS.selectedCountry = country.name;
  if (!country.regions?.length) {
    initializeCountrySites(country);
  }
  NEXUS.selectedRegionId = country.regions[0]?.id || "capital";
  NEXUS.activeTargetCountry =
    NEXUS.state.countries.find(c => c.name !== country.name)?.name || "";
  addEvent("🧭", `País seleccionado: ${country.flag} ${country.name}.`);
  if (typeof focusMapsOnSelectedCountry === "function") {
    focusMapsOnSelectedCountry();
  }
  renderAll();
}
function selectRegion(regionId) {
  const country = getSelectedCountry();
  if (!country?.regions?.some(r => r.id === regionId)) return;
  NEXUS.selectedRegionId = regionId;
  if (typeof focusLocalMapOnRegion === "function") {
    focusLocalMapOnRegion(regionId);
  }
  renderAll();
}
function setActiveLayer(layer) {
  NEXUS.activeLayer = layer;
  updateWorldMapLayer();
  renderAll();
}
function setActiveBuildTab(tab) {
  NEXUS.activeBuildTab = tab;
  renderAll();
}
function setActiveEconomyTab(tab) {
  NEXUS.activeEconomyTab = tab;
  renderAll();
}
/* =========================================================
   EVENTOS DE INTERFAZ
========================================================= */
function bindGlobalEvents() {
  document.body.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    handleButtonClick(button);
  });
  document.body.addEventListener("change", event => {
    handleInputChange(event.target);
  });
  document.body.addEventListener("input", event => {
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
  if (button.dataset.layer) {
    setActiveLayer(button.dataset.layer);
  }
  if (button.dataset.buildTab) {
    setActiveBuildTab(button.dataset.buildTab);
  }
  if (button.dataset.economyTab) {
    setActiveEconomyTab(button.dataset.economyTab);
  }
  if (button.dataset.buildingId) {
    startConstruction(button.dataset.buildingId, NEXUS.selectedRegionId);
  }
  if (button.dataset.unitProduce) {
    const qty = Number(
      document.getElementById(`unit-qty-input-${button.dataset.unitProduce}`)?.value || 1
    );
    startMilitaryProduction(button.dataset.unitProduce, qty, NEXUS.selectedRegionId);
  }
  if (button.dataset.policyApply) {
    applyStrategicPolicy(button.dataset.policyApply);
  }
  if (button.dataset.operation) {
    executeForeignOperation(button.dataset.operation, NEXUS.activeTargetCountry);
  }
  if (button.dataset.ideology) {
    changeIdeology(button.dataset.ideology);
  }
  if (button.dataset.regime) {
    changeRegime(button.dataset.regime);
  }
  if (button.dataset.marketBuy) {
    buyShares(button.dataset.marketBuy);
  }
  if (button.dataset.marketSell) {
    sellShares(button.dataset.marketSell);
  }
  if (button.dataset.marketOpa) {
    attemptTakeover(button.dataset.marketOpa);
  }
  if (button.dataset.createCompany) {
    createCustomCompany();
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
  }
}
function handleInputChange(input) {
  if (input.id === "country-selector") {
    selectCountry(input.value);
  }
  if (input.id === "region-selector") {
    selectRegion(input.value);
  }
  if (input.id === "target-country-selector") {
    NEXUS.activeTargetCountry = input.value;
    renderAll();
  }
  if (input.dataset.slider) {
    const output = document.getElementById(`${input.dataset.slider}-value`);
    if (output) output.textContent = input.value;
  }
  if (input.id === "tax-slider") {
    const country = getSelectedCountry();
    country.taxRate = Number(input.value) / 100;
    renderAll();
  }
}
/* =========================================================
   GUARDADO
========================================================= */
function saveGame() {
  const payload = {
    state: NEXUS.state,
    selectedCountry: NEXUS.selectedCountry,
    selectedRegionId: NEXUS.selectedRegionId,
    activeLayer: NEXUS.activeLayer,
    activeBuildTab: NEXUS.activeBuildTab,
    activeEconomyTab: NEXUS.activeEconomyTab,
    activeTargetCountry: NEXUS.activeTargetCountry,
    paused: NEXUS.paused,
    speed: NEXUS.speed,
    simDate: NEXUS.simDate.toISOString(),
    simClock: NEXUS.simClock
  };
  localStorage.setItem(NEXUS_CONFIG.saveKey, JSON.stringify(payload));
  addEvent("💾", "Partida guardada.");
  renderAll();
}
function loadGame() {
  const raw = localStorage.getItem(NEXUS_CONFIG.saveKey);
  if (!raw) {
    alert("No hay partida guardada.");
    return;
  }
  try {
    const payload = JSON.parse(raw);
    NEXUS.state = payload.state;
    NEXUS.selectedCountry = payload.selectedCountry || "España";
    NEXUS.selectedRegionId = payload.selectedRegionId || "madrid";
    NEXUS.activeLayer = payload.activeLayer || "political";
    NEXUS.activeBuildTab = payload.activeBuildTab || "industries";
    NEXUS.activeEconomyTab = payload.activeEconomyTab || "budget";
    NEXUS.activeTargetCountry = payload.activeTargetCountry || "Francia";
    NEXUS.paused = Boolean(payload.paused);
    NEXUS.speed = payload.speed || 1;
    NEXUS.simDate = new Date(payload.simDate);
    NEXUS.simClock = payload.simClock || NEXUS.simClock;
    NEXUS.state.countries.forEach(ensureCountryRuntimeFields);
    addEvent("📂", "Partida cargada.");
    if (typeof rebuildMapsAfterLoad === "function") {
      rebuildMapsAfterLoad();
    }
    renderAll();
  } catch (error) {
    console.error(error);
    alert("No se pudo cargar la partida.");
  }
}
function resetGame() {
  if (!confirm("¿Reiniciar simulación?")) return;
  localStorage.removeItem(NEXUS_CONFIG.saveKey);
  location.reload();
}
/* =========================================================
   RUNTIME FIELDS
========================================================= */
function ensureCountryRuntimeFields(country) {
  country.treasury ??= country.gdp * 0.0008;
  country.debt ??= country.gdp * 0.31;
  country.laborForce ??= Math.round(country.population * 0.5);
  country.unemployment ??= Math.round(country.population * 0.045);
  country.foodProduction ??= Math.round(country.population * 0.118);
  country.foodConsumption ??= Math.round(country.population * 0.105);
  country.waterProduction ??= Math.round(country.population * 0.387);
  country.climateRisk ??= 25;
  country.sanctions ??= 0;
  country.warRisk ??= 0;
  country.reputation ??= 60;
  country.greenPolicy ??= false;
  country.renewablesMW ??= 0;
  country.previousGDP ??= country.gdp;
  country.constructionQueue ??= [];
  country.militaryQueue ??= [];
  country.units ??= {};
  country.companies ??= [];
  country.portfolio ??= {};
  country.socialSpending ??= country.gdp * 0.18;
  country.pensions ??= country.gdp * 0.12;
  country.healthSpending ??= country.gdp * 0.075;
  country.educationSpending ??= country.gdp * 0.055;
  country.defenseSpending ??= country.gdp * 0.018;
  country.regime ??= country.government;
  country.nextElectionYear ??= getSimulationYear() + 2;
  country.ideology ??= country.ideology || "Centro";
}
/* =========================================================
   RANKING
========================================================= */
function rankCountriesByMilitaryPower() {
  const sorted = [...NEXUS.state.countries].sort((a, b) => b.military - a.military);
  sorted.forEach((country, index) => {
    country.powerRank = index + 1;
  });
}
function rankBy(countries, key, ascending = false) {
  const selected = getSelectedCountry();
  const sorted = [...countries].sort((a, b) =>
    ascending ? a[key] - b[key] : b[key] - a[key]
  );
  return sorted.findIndex(c => c.name === selected.name) + 1;
}
/* =========================================================
   UTILIDADES
========================================================= */
function addEvent(icon, message) {
  if (!NEXUS.state.events) NEXUS.state.events = [];
  NEXUS.state.events.unshift({
    icon,
    message,
    time: getSimulationTimeLabel(),
    date: getSimulationDateLabel()
  });
  if (NEXUS.state.events.length > 120) {
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
    <div style="max-width:900px;margin:40px auto;padding:20px;background:#190711;color:white;border:1px solid #ff4b55;border-radius:12px;">
      <h1>⚠ Error al iniciar NEXUS</h1>
      <pre>${error.message}</pre>
    </div>
  `;
}
/* =========================================================
   EXPORT GLOBAL
========================================================= */
window.NEXUS = NEXUS;
window.NEXUS_CONFIG = NEXUS_CONFIG;
window.getSelectedCountry = getSelectedCountry;
window.getSelectedRegion = getSelectedRegion;
window.selectCountry = selectCountry;
window.selectRegion = selectRegion;
window.advanceSimulationDate = advanceSimulationDate;
window.getSimulationYear = getSimulationYear;
window.getSimulationDateLabel = getSimulationDateLabel;
window.getSimulationTimeLabel = getSimulationTimeLabel;
window.getDayOfYear = getDayOfYear;
window.togglePause = togglePause;
window.setSimulationSpeed = setSimulationSpeed;
window.setActiveLayer = setActiveLayer;
window.setActiveBuildTab = setActiveBuildTab;
window.setActiveEconomyTab = setActiveEconomyTab;
window.saveGame = saveGame;
window.loadGame = loadGame;
window.resetGame = resetGame;
window.ensureCountryRuntimeFields = ensureCountryRuntimeFields;
window.rankCountriesByMilitaryPower = rankCountriesByMilitaryPower;
window.rankBy = rankBy;
window.addEvent = addEvent;
window.formatEuro = formatEuro;
window.formatNumber = formatNumber;
window.clamp = clamp;
window.randomBetween = randomBetween;

Siguiente: js/data.js.