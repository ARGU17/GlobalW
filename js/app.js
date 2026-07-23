"use strict";

(() => {
  const SAVE_KEY = "nexus_alpha_v1_0_1_save";
  let state;
  let timer = null;

  function boot() {
    try {
      state = normalizeLoadedState(loadState()) || NEXUS_ECONOMY.createInitialState();
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
      const loader = document.getElementById("bootLoader");
      if (loader) loader.remove();
      const startOverlay = document.getElementById("startOverlay");
      if (startOverlay) startOverlay.hidden = true;
      const errorPanel = document.getElementById("bootError");
      const errorText = document.getElementById("bootErrorText");
      if (errorPanel) errorPanel.hidden = false;
      if (errorText) errorText.textContent = error?.message || String(error);
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
    const hasSave = Boolean(normalizeLoadedState(loadState()));
    continueBtn.hidden = !hasSave;
    startSpain.addEventListener("click", () => {
      state = NEXUS_ECONOMY.createInitialState();
      window.NEXUS_STATE = state;
      rebindState();
      overlay.hidden = true;
      NEXUS_UI.toast("Campaña iniciada con España reforzada.", "success");
    });
    continueBtn.addEventListener("click", () => {
      const loaded = normalizeLoadedState(loadState());
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

  function normalizeLoadedState(candidate) {
    if (!candidate || typeof candidate !== "object") return null;
    if (!Array.isArray(candidate.countries) || !Array.isArray(candidate.regions)) return null;

    const fresh = NEXUS_ECONOMY.createInitialState();
    const normalized = {
      ...fresh,
      ...candidate,
      settings: { ...fresh.settings, ...(candidate.settings || {}) },
      events: Array.isArray(candidate.events) ? candidate.events : fresh.events,
      notifications: Array.isArray(candidate.notifications) ? candidate.notifications : [],
      nationalProjects: fresh.nationalProjects,
      unitCatalog: fresh.unitCatalog
    };

    normalized.countries = fresh.countries.map(base => {
      const saved = candidate.countries.find(item => item?.id === base.id);
      if (!saved) return base;
      return {
        ...base,
        ...saved,
        economy: { ...base.economy, ...(saved.economy || {}) },
        systems: { ...base.systems, ...(saved.systems || {}) },
        budgets: { ...base.budgets, ...(saved.budgets || {}) },
        history: {
          ...base.history,
          ...(saved.history || {}),
          gdp: Array.isArray(saved.history?.gdp) ? saved.history.gdp : base.history.gdp,
          inflation: Array.isArray(saved.history?.inflation) ? saved.history.inflation : base.history.inflation,
          unemployment: Array.isArray(saved.history?.unemployment) ? saved.history.unemployment : base.history.unemployment,
          treasury: Array.isArray(saved.history?.treasury) ? saved.history.treasury : base.history.treasury
        },
        relations: { ...base.relations, ...(saved.relations || {}) },
        sanctions: Array.isArray(saved.sanctions) ? saved.sanctions : [],
        treaties: Array.isArray(saved.treaties) ? saved.treaties : [],
        projects: Array.isArray(saved.projects) ? saved.projects : [],
        units: Array.isArray(saved.units) ? saved.units : [],
        productionQueue: Array.isArray(saved.productionQueue) ? saved.productionQueue : [],
        regionInvestments: saved.regionInvestments && typeof saved.regionInvestments === "object" ? saved.regionInvestments : {}
      };
    });

    normalized.regions = fresh.regions.map(base => ({
      ...base,
      ...(candidate.regions.find(item => item?.id === base.id) || {})
    }));

    normalized.companies = fresh.companies.map(base => {
      const saved = Array.isArray(candidate.companies)
        ? candidate.companies.find(item => item?.id === base.id)
        : null;
      return saved ? {
        ...base,
        ...saved,
        history: Array.isArray(saved.history) ? saved.history : base.history,
        ownership: { ...base.ownership, ...(saved.ownership || {}) }
      } : base;
    });

    if (!normalized.countries.some(country => country.id === normalized.selectedCountryId)) {
      normalized.selectedCountryId = "ESP";
    }
    if (!normalized.regions.some(region => region.id === normalized.selectedRegionId)) {
      normalized.selectedRegionId = "MAD";
    }
    if (!["world", "regions"].includes(normalized.mapMode)) normalized.mapMode = "world";
    if (!["overview", "economy", "regions", "industry", "military", "diplomacy", "events", "settings"].includes(normalized.activePanel)) {
      normalized.activePanel = "overview";
    }
    normalized.speed = [1, 2, 4].includes(Number(normalized.speed)) ? Number(normalized.speed) : 1;
    normalized.running = Boolean(normalized.running);
    return normalized;
  }

  function manualLoad() {
    const loaded = normalizeLoadedState(loadState());
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
      const normalized = normalizeLoadedState(parsed);
      if (!normalized) throw new Error("Formato incompatible");
      state = normalized;
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
    if (!loader) return;
    requestAnimationFrame(() => loader.classList.add("hidden"));
    setTimeout(() => loader.remove(), 500);
  }

  window.addEventListener("error", event => {
    console.error("Unhandled error", event.error || event.message);
  });

  document.addEventListener("DOMContentLoaded", boot);
})();
