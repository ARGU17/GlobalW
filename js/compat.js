"use strict";

window.NEXUS = window.NEXUS || {};
window.NEXUS_MAP = window.NEXUS_MAP || {};

console.log("compat.js hotfix loaded");

/* =========================
   CREAR ELEMENTOS FALTANTES
========================= */

function ensureEl(id, tag = "div", parent = document.body) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement(tag);
    el.id = id;
    parent.appendChild(el);
  }
  return el;
}

[
  "dashboard",
  "dashboardKPIs",
  "rankingStrip",
  "worldSummary",
  "worldMap",
  "regionMap",
  "mapLayers",
  "mapInfo",
  "notifications",
  "loadingOverlay"
].forEach(id => ensureEl(id));

/* =========================
   MODAL COMPATIBLE
========================= */

window.openModal = window.openModal || function(title, html) {
  const overlay = document.getElementById("modalOverlay") || ensureEl("modalOverlay");
  const titleEl = document.getElementById("modalTitle") || ensureEl("modalTitle");
  const contentEl = document.getElementById("modalContent") || ensureEl("modalContent");

  overlay.classList.remove("hidden");
  overlay.style.display = "flex";
  titleEl.innerHTML = title;
  contentEl.innerHTML = html;
};

window.closeModal = window.closeModal || function() {
  const overlay = document.getElementById("modalOverlay");
  if (overlay) {
    overlay.classList.add("hidden");
    overlay.style.display = "none";
  }
};

/* =========================
   ALIAS SIMULACIÓN
========================= */

window.initializeSimulation =
  window.initializeSimulation ||
  window.initializeSimulationEngine ||
  function() {
    if (window.createInitialGameState && !NEXUS.state) {
      NEXUS.state = createInitialGameState();
    }
  };

window.selectCountry =
  window.selectCountry ||
  function(codeOrName) {
    const countries = NEXUS.state?.countries || [];

    const country =
      countries.find(c => c.iso === codeOrName) ||
      countries.find(c => c.name === codeOrName) ||
      countries.find(c => c.name === "España") ||
      countries[0];

    if (!country) return;

    NEXUS.state.selectedCountry = country.name;

    if (window.setPlayableCountry) {
      try { setPlayableCountry(country.name); } catch(e) {}
    }

    window.renderAll?.();
  };

window.togglePause =
  window.togglePause ||
  function() {
    if (!NEXUS.simulation) {
      NEXUS.simulation = { running: false, speed: 1, timer: null };
    }

    if (NEXUS.simulation.running) {
      window.hardPauseSimulation?.();
    } else {
      window.hardStartSimulation?.();
    }
  };

/* =========================
   BOTONES DEL INDEX
========================= */

function bindButton(id, fn) {
  const btn = document.getElementById(id);
  if (btn) btn.onclick = fn;
}

document.addEventListener("DOMContentLoaded", () => {
  bindButton("pauseButton", () => togglePause());

  bindButton("speed1Button", () => window.setSimulationSpeed?.(1));
  bindButton("speed2Button", () => window.setSimulationSpeed?.(2));
  bindButton("speed5Button", () => window.setSimulationSpeed?.(5));

  bindButton("saveButton", () => window.saveGame?.("manual"));
  bindButton("loadButton", () => window.loadGame?.("manual"));
  bindButton("editorButton", () => window.toggleMapEditor?.());

  bindButton("overviewButton", () => window.navigateToPanel?.("dashboard"));
  bindButton("economyButton", () => window.navigateToPanel?.("economy"));
  bindButton("industryButton", () => window.navigateToPanel?.("industry"));
  bindButton("stockButton", () => window.navigateToPanel?.("stock"));
  bindButton("technologyButton", () => window.navigateToPanel?.("technology"));
  bindButton("constructionButton", () => window.navigateToPanel?.("cities"));
  bindButton("diplomacyButton", () => window.navigateToPanel?.("diplomacy"));
  bindButton("intelligenceButton", () => window.navigateToPanel?.("spy"));
  bindButton("militaryButton", () => window.navigateToPanel?.("military"));
  bindButton("settingsButton", () => window.navigateToPanel?.("settings"));

  setTimeout(() => {
    if (!NEXUS.state && window.createInitialGameState) {
      NEXUS.state = createInitialGameState();
    }

    if (window.initializeSimulationEngine) {
      initializeSimulationEngine();
    }

    selectCountry("España");

    window.renderAll?.();

    const loading = document.getElementById("loadingScreen");
    if (loading) loading.style.display = "none";
  }, 300);
});

/* =========================
   RENDER BÁSICO SI FALLA UI
========================= */

window.renderAll = window.renderAll || function() {
  window.renderSimulation?.();
  window.renderMapSystems?.();
};

console.log("compat.js hotfix ready");