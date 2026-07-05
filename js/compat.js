/* ==========================================================
   NEXUS GLOBAL
   compat.js
   Compatibilidad para Alpha
========================================================== */

"use strict";

window.NEXUS = window.NEXUS || {};
window.NEXUS_MAP = window.NEXUS_MAP || {};

console.log("Loading compat.js...");

/* ==========================================================
   UTILIDADES
========================================================== */

window.noop = window.noop || function(){};

function createIfMissing(id, tag = "div"){

    let el = document.getElementById(id);

    if(el) return el;

    el = document.createElement(tag);

    el.id = id;

    document.body.appendChild(el);

    console.warn("Created missing element:", id);

    return el;

}

/* ==========================================================
   CONTENEDORES HTML
========================================================== */

[
"dashboard",
"dashboardKPIs",
"rankingStrip",
"worldSummary",
"notifications",
"notificationContainer",
"modal",
"modalOverlay",
"modalContent",
"modalTitle",
"loadingOverlay",
"loadingScreen",
"mapTooltip",
"contextMenu",
"globalTooltip",
"countrySummary",
"countryIndicators",
"economyDashboard",
"industryList",
"resourcesTable",
"stockCompanies",
"technologyTree",
"armySummary",
"relationsTable",
"eventsFeed"

].forEach(id=>createIfMissing(id));

/* ==========================================================
   CANVAS
========================================================== */

if(!document.getElementById("gameMapCanvas")){

    const c=document.createElement("canvas");

    c.id="gameMapCanvas";

    document.body.appendChild(c);

}

window.NEXUS_MAP.canvas =
document.getElementById("gameMapCanvas");

window.NEXUS_MAP.ctx =
NEXUS_MAP.canvas.getContext("2d");

/* ==========================================================
   NOTIFICACIONES
========================================================== */

window.notify =
window.notify ||

function(icon,msg){

    console.log(icon,msg);

};

/* ==========================================================
   EVENTOS
========================================================== */

window.addEvent =
window.addEvent ||

function(icon,msg){

    console.log(icon,msg);

};

/* ==========================================================
   MODAL
========================================================== */

window.openModal =
window.openModal ||

function(title,html){

    const modal =
        document.getElementById("modalOverlay");

    if(!modal) return;

    modal.style.display="flex";

    const t=document.getElementById("modalTitle");
    const c=document.getElementById("modalContent");

    if(t) t.innerHTML=title;
    if(c) c.innerHTML=html;

};

window.closeModal =
window.closeModal ||

function(){

    const modal =
        document.getElementById("modalOverlay");

    if(modal)
        modal.style.display="none";

};

/* ==========================================================
   RENDER
========================================================== */

window.renderAll =
window.renderAll ||

function(){

    if(window.renderMapSystems)

        renderMapSystems();

};

/* ==========================================================
   MAPA
========================================================== */

window.resizeMap =
window.resizeMap ||

function(){

    const canvas =
        document.getElementById("gameMapCanvas");

    if(!canvas) return;

    canvas.width =
        window.innerWidth;

    canvas.height =
        window.innerHeight;

};

window.addEventListener(

    "resize",

    resizeMap

);

resizeMap();

/* ==========================================================
   CAPAS
========================================================== */

NEXUS_MAP.layers =
NEXUS_MAP.layers ||

{

terrain:true,

political:true,

regions:true,

cities:true,

resources:true,

industry:true,

energy:true,

military:true,

space:true,

sensors:true,

war:true,

missiles:true

};

window.toggleMapLayer =
window.toggleMapLayer ||

function(layer){

    if(layer in NEXUS_MAP.layers)

        NEXUS_MAP.layers[layer]=

        !NEXUS_MAP.layers[layer];

};

/* ==========================================================
   SIMULACIÓN
========================================================== */

window.togglePause =
window.togglePause ||

function(){

    NEXUS.paused=
    !NEXUS.paused;

};

window.setSimulationSpeed =
window.setSimulationSpeed ||

function(speed){

    NEXUS.settings=
    NEXUS.settings||{};

    NEXUS.settings.simulationSpeed=speed;

};

/* ==========================================================
   GUARDADO
========================================================== */

window.saveGame =
window.saveGame ||

function(){

    try{

        localStorage.setItem(

            "nexus-save",

            JSON.stringify(NEXUS)

        );

    }

    catch(e){

        console.warn(e);

    }

};

window.loadGame =
window.loadGame ||

function(){

    try{

        const data=

            localStorage.getItem(

                "nexus-save"

            );

        if(!data) return;

        Object.assign(

            NEXUS,

            JSON.parse(data)

        );

    }

    catch(e){

        console.warn(e);

    }

};

/* ==========================================================
   GEOJSON VACÍOS
========================================================== */

NEXUS_MAP.world =
NEXUS_MAP.world ||

{

features:[]

};

NEXUS_MAP.regions =
NEXUS_MAP.regions ||

{

features:[]

};

NEXUS_MAP.cities =
NEXUS_MAP.cities ||

{

features:[]

};

/* ==========================================================
   FUNCIONES PLACEHOLDER
========================================================== */

[
"renderTerrain",
"renderPoliticalMap",
"renderAdministrativeRegions",
"renderInfrastructure",
"renderEnergyLayer",
"renderResources",
"renderIndustryLayer",
"renderCities",
"renderLandUnits",
"renderAirUnits",
"renderNavalUnits",
"renderSensorLayer",
"renderSatellites",
"renderMissilesLayer",
"renderWarLayer",
"renderMapAnimations"

].forEach(name=>{

    if(!window[name])

        window[name]=noop;

});

/* ==========================================================
   MAPA
========================================================== */

window.geoToScreen =
window.geoToScreen ||

function(x,y){

    return{

        x:x*5+
        window.innerWidth/2,

        y:-y*5+
        window.innerHeight/2

    };

};

window.pointOnScreen =
window.pointOnScreen ||

function(){

    return true;

};

window.distanceGeo =
window.distanceGeo ||

function(x1,y1,x2,y2){

    return Math.sqrt(

        (x2-x1)**2+

        (y2-y1)**2

    );

};

/* ==========================================================
   PAÍS
========================================================== */

window.getSelectedCountry =
window.getSelectedCountry ||

function(){

    if(

        NEXUS.state &&

        NEXUS.state.countries &&

        NEXUS.state.countries.length

    )

        return NEXUS.state.countries[0];

    return null;

};

/* ==========================================================
   FINAL
========================================================== */

console.log("compat.js ready");


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