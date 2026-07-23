"use strict";

(() => {
  const SAVE_KEY = "nexus_alpha_v1_save";
  let state;
  let timer = null;

  function boot() {
    try {
      state = loadState() || NEXUS_ECONOMY.createInitialState();
      window.NEXUS_STATE = state;
      NEXUS_UI.initialize(state, createActions());
      NEXUS_MAP_ENGINE.initialize(state, {
        selectCountry,
        selectRegion
      });
      bindStartScreen();
      syncLoop();
      if (state.settings.autosave) saveState(false);
      hideBootLoader();
    } catch (error) {
      console.error("NEXUS boot error", error);
      document.getElementById("bootError").hidden = false;
      document.getElementById("bootErrorText").textContent = error.message;
    }
  }

  function createActions() {
    return {
      setPanel,
      setMapMode,
      selectCountry,
      selectRegion,
      toggleRun,
      setSpeed,
      stepMonth,
      updateBudget,
      updateTaxRate,
      investRegion,
      queueUnit,
      startProject,
      buyShares,
      takeover,
      diplomacy,
      save: () => saveState(true),
      load: manualLoad,
      exportSave,
      importSave,
      reset,
      updateSetting
    };
  }

  function bindStartScreen() {
    const overlay = document.getElementById("startOverlay");
    const startSpain = document.getElementById("startSpainBtn");
    const continueBtn = document.getElementById("continueBtn");
    const hasSave = Boolean(localStorage.getItem(SAVE_KEY));
    continueBtn.hidden = !hasSave;
    startSpain.addEventListener("click", () => {
      state = NEXUS_ECONOMY.createInitialState();
      window.NEXUS_STATE = state;
      rebindState();
      overlay.hidden = true;
      NEXUS_UI.toast("Campaña iniciada con España reforzada.", "success");
    });
    continueBtn.addEventListener("click", () => {
      const loaded = loadState();
      if (loaded) {
        state = loaded;
        window.NEXUS_STATE = state;
        rebindState();
        overlay.hidden = true;
        NEXUS_UI.toast("Partida cargada.", "success");
      }
    });
    document.getElementById("observerBtn").addEventListener("click", () => {
      state = NEXUS_ECONOMY.createInitialState();
      state.selectedCountryId = "DEU";
      window.NEXUS_STATE = state;
      rebindState();
      overlay.hidden = true;
      NEXUS_UI.toast("Modo observador activo. Puedes cambiar de país en cualquier momento.", "info");
    });
  }

  function rebindState() {
    stopLoop();
    NEXUS_UI.initialize(state, createActions());
    NEXUS_MAP_ENGINE.initialize(state, { selectCountry, selectRegion });
    syncLoop();
  }

  function setPanel(panel) {
    state.activePanel = panel;
    NEXUS_UI.renderAll();
  }

  function setMapMode(mode) {
    if (mode === "regions" && state.selectedCountryId !== "ESP") {
      state.selectedCountryId = "ESP";
      NEXUS_UI.toast("El control regional detallado está disponible para España en esta Alpha.", "info");
    }
    state.mapMode = mode;
    if (mode === "regions") state.activePanel = state.activePanel === "overview" ? "regions" : state.activePanel;
    NEXUS_MAP_ENGINE.render();
    NEXUS_UI.renderAll();
  }

  function selectCountry(countryId) {
    if (!state.countries.some(country => country.id === countryId)) return;
    state.selectedCountryId = countryId;
    if (countryId !== "ESP" && state.mapMode === "regions") state.mapMode = "world";
    NEXUS_MAP_ENGINE.render();
    NEXUS_UI.renderAll();
  }

  function selectRegion(regionId) {
    if (!state.regions.some(region => region.id === regionId)) return;
    state.selectedCountryId = "ESP";
    state.selectedRegionId = regionId;
    state.mapMode = "regions";
    NEXUS_MAP_ENGINE.render();
    NEXUS_UI.renderAll();
  }

  function toggleRun() {
    state.running = !state.running;
    syncLoop();
    NEXUS_UI.renderAll();
  }

  function setSpeed(speed) {
    state.speed = [1, 2, 4].includes(speed) ? speed : 1;
    syncLoop();
    NEXUS_UI.renderAll();
  }

  function syncLoop() {
    stopLoop();
    if (!state.running) return;
    const interval = Math.max(220, 1200 / state.speed);
    timer = setInterval(stepMonth, interval);
  }

  function stopLoop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function stepMonth() {
    const summary = NEXUS_ECONOMY.tickMonth(state);
    if (state.settings.autosave) saveState(false);
    NEXUS_MAP_ENGINE.render();
    NEXUS_UI.renderAll();
    if (summary?.budget?.monthlyBalance < -8) NEXUS_UI.toast("El déficit mensual está aumentando la deuda.", "warning");
  }

  function updateBudget(key, value) {
    NEXUS_ECONOMY.updateBudget(state, key, value);
    NEXUS_UI.renderContext();
  }

  function updateTaxRate(value) {
    NEXUS_ECONOMY.updateTaxRate(state, value);
    NEXUS_UI.renderContext();
  }

  function investRegion(type) {
    const result = NEXUS_ECONOMY.investRegion(state, state.selectedRegionId, type);
    NEXUS_UI.toast(result.message, result.ok ? "success" : "error");
    NEXUS_MAP_ENGINE.render();
    NEXUS_UI.renderAll();
  }

  function queueUnit(typeId) {
    const result = NEXUS_ECONOMY.queueUnit(state, typeId, state.selectedRegionId);
    NEXUS_UI.toast(result.message, result.ok ? "success" : "error");
    NEXUS_UI.renderAll();
  }

  function startProject(projectId) {
    const result = NEXUS_ECONOMY.startProject(state, projectId);
    NEXUS_UI.toast(result.message, result.ok ? "success" : "error");
    NEXUS_UI.renderAll();
  }

  function buyShares(companyId, pct) {
    const result = NEXUS_ECONOMY.buyShares(state, companyId, pct);
    NEXUS_UI.toast(result.message, result.ok ? "success" : "error");
    NEXUS_UI.renderAll();
  }

  function takeover(companyId) {
    const result = NEXUS_ECONOMY.launchTakeover(state, companyId);
    NEXUS_UI.toast(result.message, result.ok ? "success" : "error");
    NEXUS_UI.renderAll();
  }

  function diplomacy(targetId, action) {
    const result = NEXUS_ECONOMY.diplomacyAction(state, targetId, action);
    NEXUS_UI.toast(result.message, result.ok ? "success" : "error");
    NEXUS_MAP_ENGINE.render();
    NEXUS_UI.renderAll();
  }

  function saveState(showToast = true) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      if (showToast) NEXUS_UI.toast("Partida guardada localmente.", "success");
      return true;
    } catch (error) {
      console.error(error);
      if (showToast) NEXUS_UI.toast("No se pudo guardar la partida.", "error");
      return false;
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn("Invalid save", error);
      return null;
    }
  }

  function manualLoad() {
    const loaded = loadState();
    if (!loaded) {
      NEXUS_UI.toast("No existe una partida guardada.", "warning");
      return;
    }
    state = loaded;
    window.NEXUS_STATE = state;
    rebindState();
    NEXUS_UI.toast("Partida cargada.", "success");
  }

  function exportSave() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nexus-alpha-${state.date}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    NEXUS_UI.toast("Guardado exportado.", "success");
  }

  function importSave(raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.countries || !parsed.regions || !parsed.version) throw new Error("Formato incompatible");
      state = parsed;
      window.NEXUS_STATE = state;
      rebindState();
      saveState(false);
      NEXUS_UI.toast("Partida importada.", "success");
      return true;
    } catch (error) {
      NEXUS_UI.toast(`Importación fallida: ${error.message}`, "error");
      return false;
    }
  }

  function reset() {
    if (!confirm("¿Reiniciar la campaña? Se perderá el progreso no exportado.")) return;
    localStorage.removeItem(SAVE_KEY);
    state = NEXUS_ECONOMY.createInitialState();
    window.NEXUS_STATE = state;
    rebindState();
    NEXUS_UI.toast("Campaña reiniciada.", "success");
  }

  function updateSetting(key, value) {
    state.settings[key] = value;
    document.body.classList.toggle("reduced-motion", state.settings.reducedMotion);
    saveState(false);
  }

  function hideBootLoader() {
    const loader = document.getElementById("bootLoader");
    requestAnimationFrame(() => loader.classList.add("hidden"));
    setTimeout(() => loader.remove(), 500);
  }

  window.addEventListener("error", event => {
    console.error("Unhandled error", event.error || event.message);
  });

  document.addEventListener("DOMContentLoaded", boot);
})();
