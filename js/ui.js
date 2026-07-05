/* =========================================================
   UI.JS v1
   BLOQUE 1/15
   Motor de interfaz gráfica
========================================================= */

window.NEXUS_UI = {

    activePanel: "dashboard",

    openedPanels: new Set(),

    notifications: [],

    modal: null,

    loading: false

};

/* =========================================================
   INICIALIZACIÓN
========================================================= */

function initializeUI(){

    registerUIButtonEvents();

    restoreUIPreferences();

    openPanel("dashboard");

    updateTopBar();

}

/* =========================================================
   PANELES
========================================================= */

function openPanel(panelId){

    document
        .querySelectorAll(".ui-panel")
        .forEach(panel=>{

            panel.classList.remove("active");

        });

    const panel=document.getElementById(panelId);

    if(panel){

        panel.classList.add("active");

        NEXUS_UI.activePanel=panelId;

        NEXUS_UI.openedPanels.add(panelId);

    }

}

function closePanel(panelId){

    const panel=document.getElementById(panelId);

    if(panel)
        panel.classList.remove("active");

}

function togglePanel(panelId){

    const panel=document.getElementById(panelId);

    if(!panel)return;

    if(panel.classList.contains("active"))
        closePanel(panelId);
    else
        openPanel(panelId);

}

/* =========================================================
   MODALES
========================================================= */

function openModal(title,html){

    const modal=document.getElementById("modal");

    if(!modal)return;

    modal.style.display="flex";

    modal.querySelector(".modal-title").innerHTML=title;

    modal.querySelector(".modal-content")
        .innerHTML=html;

    NEXUS_UI.modal=title;

}

function closeModal(){

    const modal=document.getElementById("modal");

    if(!modal)return;

    modal.style.display="none";

    NEXUS_UI.modal=null;

}

/* =========================================================
   LOADING
========================================================= */

function showLoading(text="Cargando..."){

    const loading=document.getElementById("loadingOverlay");

    if(!loading)return;

    loading.style.display="flex";

    loading.querySelector("span").textContent=text;

    NEXUS_UI.loading=true;

}

function hideLoading(){

    const loading=document.getElementById("loadingOverlay");

    if(!loading)return;

    loading.style.display="none";

    NEXUS_UI.loading=false;

}

/* =========================================================
   NOTIFICACIONES
========================================================= */

function notify(icon,message,type="info"){

    const notification={

        id:Date.now()+Math.random(),

        icon,

        message,

        type

    };

    NEXUS_UI.notifications.push(notification);

    renderNotifications();

    setTimeout(()=>{

        NEXUS_UI.notifications=
            NEXUS_UI.notifications.filter(
                n=>n.id!==notification.id
            );

        renderNotifications();

    },5000);

}

function renderNotifications(){

    const container=
        document.getElementById("notifications");

    if(!container)return;

    container.innerHTML="";

    NEXUS_UI.notifications.forEach(n=>{

        const div=document.createElement("div");

        div.className=
            `notification ${n.type}`;

        div.innerHTML=`
            <span class="icon">${n.icon}</span>
            <span>${n.message}</span>
        `;

        container.appendChild(div);

    });

}

/* =========================================================
   TOP BAR
========================================================= */

function updateTopBar(){

    const country=getSelectedCountry();

    if(!country)return;

    setText(
        "topCountry",
        country.name
    );

    setText(
        "topDate",
        getSimulationDateText()
    );

    setText(
        "topMoney",
        formatMoney(country.treasury)
    );

    setText(
        "topGDP",
        formatMoney(country.gdp)
    );

    setText(
        "topPopulation",
        formatNumber(country.population)
    );

    setText(
        "topHappiness",
        `${Math.round(country.happiness)}%`
    );

    setText(
        "topStability",
        `${Math.round(country.stability)}%`
    );

}

/* =========================================================
   UTILIDADES DOM
========================================================= */

function setText(id,value){

    const e=document.getElementById(id);

    if(e)
        e.textContent=value;

}

function setHTML(id,value){

    const e=document.getElementById(id);

    if(e)
        e.innerHTML=value;

}

function show(id){

    const e=document.getElementById(id);

    if(e)
        e.style.display="";

}

function hide(id){

    const e=document.getElementById(id);

    if(e)
        e.style.display="none";

}

/* =========================================================
   BOTONES
========================================================= */

function registerUIButtonEvents(){

    document
        .querySelectorAll("[data-panel]")
        .forEach(button=>{

            button.onclick=()=>{

                openPanel(
                    button.dataset.panel
                );

            };

        });

}

/* =========================================================
   PREFERENCIAS
========================================================= */

function saveUIPreferences(){

    localStorage.setItem(

        "nexus_ui",

        JSON.stringify({

            panel:NEXUS_UI.activePanel

        })

    );

}

function restoreUIPreferences(){

    try{

        const data=
            JSON.parse(
                localStorage.getItem("nexus_ui")
            );

        if(data?.panel)
            openPanel(data.panel);

    }catch(e){}

}

/* =========================================================
   RENDER GENERAL
========================================================= */

function renderUI(){

    updateTopBar();

    renderNotifications();

}

/* =========================================================
   EXPORT GLOBAL
========================================================= */

window.initializeUI=initializeUI;

window.openPanel=openPanel;
window.closePanel=closePanel;
window.togglePanel=togglePanel;

window.openModal=openModal;
window.closeModal=closeModal;

window.showLoading=showLoading;
window.hideLoading=hideLoading;

window.notify=notify;
window.renderNotifications=renderNotifications;

window.renderUI=renderUI;
window.updateTopBar=updateTopBar;

window.setText=setText;
window.setHTML=setHTML;
window.show=show;
window.hide=hide;

/* =========================================================
   AUTOARRANQUE
========================================================= */

document.addEventListener("DOMContentLoaded",()=>{

    initializeUI();

});


/* =========================================================
   UI.JS v1
   BLOQUE 2/15
   Motor de mapa: país, región, capas, hover y selección.
========================================================= */

window.NEXUS_MAP_UI = {
  activeLayer: "political",
  zoom: 1,
  selectedCountry: "España",
  selectedRegionId: null
};

function initializeMapUI() {
  renderMapLayerButtons();
  renderCountrySelector();
  renderMap();
}

function renderMap() {
  renderWorldMapUI();
  renderRegionMapUI();
  updateMapInfoPanel();
}

function renderWorldMapUI() {
  const container = document.getElementById("worldMap");
  if (!container) return;

  const countries = NEXUS.state.countries || [];

  container.innerHTML = countries.map(country => {
    const color = getLayerColor(country, NEXUS_MAP_UI.activeLayer, countries);
    const selected = country.name === NEXUS.state.selectedCountry ? "selected" : "";

    return `
      <button
        class="country-token ${selected}"
        style="--country-color:${color}"
        data-country="${country.name}"
        title="${country.name}">
        <span>${country.flag || "🌐"}</span>
        <strong>${country.name}</strong>
      </button>
    `;
  }).join("");

  container.querySelectorAll("[data-country]").forEach(btn => {
    btn.onclick = () => {
      setPlayableCountry(btn.dataset.country);
      NEXUS_MAP_UI.selectedCountry = btn.dataset.country;
      renderMap();
      renderUI();
    };

    btn.onmouseenter = () => {
      const country = getCountryByName(NEXUS.state.countries, btn.dataset.country);
      if (country) showCountryTooltip(country);
    };

    btn.onmouseleave = hideMapTooltip;
  });
}

function renderRegionMapUI() {
  const container = document.getElementById("regionMap");
  if (!container) return;

  const country = getSelectedCountry();
  if (!country) return;

  container.innerHTML = (country.regions || []).map(region => {
    const selected = region.id === NEXUS.state.selectedRegionId ? "selected" : "";
    const icon = getRegionIcon(region);
    const damage = region.damageLevel ? `damage-${Math.min(5, Math.round(region.damageLevel))}` : "";

    return `
      <button
        class="region-token ${selected} ${getRegionMarkerClass(region)} ${damage}"
        data-region="${region.id}"
        title="${region.name}">
        <span class="region-icon">${icon}</span>
        <strong>${region.name}</strong>
        <small>${formatNumber(region.population || 0)} hab · ${formatMoney(region.gdp || 0)}</small>
      </button>
    `;
  }).join("");

  container.querySelectorAll("[data-region]").forEach(btn => {
    btn.onclick = () => {
      setSelectedRegion(btn.dataset.region);
      NEXUS_MAP_UI.selectedRegionId = btn.dataset.region;
      renderMap();
    };

    btn.onmouseenter = () => {
      const region = country.regions.find(r => r.id === btn.dataset.region);
      if (region) showRegionTooltip(country, region);
    };

    btn.onmouseleave = hideMapTooltip;
  });
}

function renderMapLayerButtons() {
  const container = document.getElementById("mapLayers");
  if (!container) return;

  container.innerHTML = Object.entries(MAP_LAYERS).map(([id, layer]) => `
    <button class="layer-btn ${NEXUS_MAP_UI.activeLayer === id ? "active" : ""}" data-layer="${id}">
      ${layer.icon || "🗺️"} ${layer.name}
    </button>
  `).join("");

  container.querySelectorAll("[data-layer]").forEach(btn => {
    btn.onclick = () => {
      NEXUS_MAP_UI.activeLayer = btn.dataset.layer;
      renderMapLayerButtons();
      renderWorldMapUI();
    };
  });
}

function renderCountrySelector() {
  const select = document.getElementById("countrySelector");
  if (!select) return;

  select.innerHTML = (NEXUS.state.countries || []).map(country => `
    <option value="${country.name}" ${country.name === NEXUS.state.selectedCountry ? "selected" : ""}>
      ${country.flag || "🌐"} ${country.name}
    </option>
  `).join("");

  select.onchange = () => {
    setPlayableCountry(select.value);
    renderMap();
    renderUI();
  };
}

function updateMapInfoPanel() {
  const box = document.getElementById("mapInfo");
  if (!box) return;

  const country = getSelectedCountry();
  const region = getSelectedRegion();

  if (!country) return;

  box.innerHTML = `
    <h3>${country.flag || "🌐"} ${country.name}</h3>
    <div class="mini-grid">
      <div><span>PIB</span><b>${formatMoney(country.gdp)}</b></div>
      <div><span>Población</span><b>${formatNumber(country.population)}</b></div>
      <div><span>Estabilidad</span><b>${Math.round(country.stability || 0)}%</b></div>
      <div><span>Poder militar</span><b>${formatNumber(calculateEffectiveMilitaryPower(country))}</b></div>
    </div>
    ${region ? `
      <hr>
      <h4>📍 ${region.name}</h4>
      <p>${getRegionIcon(region)} ${region.type || "región"} · ${formatNumber(region.population || 0)} hab.</p>
      <p>Edificios: ${(region.buildings || []).length}</p>
    ` : ""}
  `;
}

function showCountryTooltip(country) {
  const tip = getOrCreateMapTooltip();

  tip.innerHTML = `
    <b>${country.flag || "🌐"} ${country.name}</b>
    <span>PIB: ${formatMoney(country.gdp)}</span>
    <span>Población: ${formatNumber(country.population)}</span>
    <span>Estabilidad: ${Math.round(country.stability || 0)}%</span>
    <span>Militar: #${country.rankMilitary || "-"} · PIB: #${country.rankGDP || "-"}</span>
  `;

  tip.classList.add("visible");
}

function showRegionTooltip(country, region) {
  const tip = getOrCreateMapTooltip();

  tip.innerHTML = `
    <b>${getRegionIcon(region)} ${region.name}</b>
    <span>${country.name}</span>
    <span>PIB regional: ${formatMoney(region.gdp || 0)}</span>
    <span>Población: ${formatNumber(region.population || 0)}</span>
    <span>Daño: ${Math.round(region.damageLevel || 0)}/10</span>
  `;

  tip.classList.add("visible");
}

function hideMapTooltip() {
  const tip = document.getElementById("mapTooltip");
  if (tip) tip.classList.remove("visible");
}

function getOrCreateMapTooltip() {
  let tip = document.getElementById("mapTooltip");

  if (!tip) {
    tip = document.createElement("div");
    tip.id = "mapTooltip";
    tip.className = "map-tooltip";
    document.body.appendChild(tip);

    document.addEventListener("mousemove", event => {
      tip.style.left = `${event.clientX + 14}px`;
      tip.style.top = `${event.clientY + 14}px`;
    });
  }

  return tip;
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 2
========================================================= */

window.initializeMapUI = initializeMapUI;
window.renderMap = renderMap;
window.renderWorldMapUI = renderWorldMapUI;
window.renderRegionMapUI = renderRegionMapUI;
window.renderMapLayerButtons = renderMapLayerButtons;
window.renderCountrySelector = renderCountrySelector;
window.updateMapInfoPanel = updateMapInfoPanel;
window.showCountryTooltip = showCountryTooltip;
window.showRegionTooltip = showRegionTooltip;
window.hideMapTooltip = hideMapTooltip;
window.getOrCreateMapTooltip = getOrCreateMapTooltip;


/* =========================================================
   UI.JS v1
   BLOQUE 3/15
   Dashboard superior, rankings mundiales y KPIs principales.
========================================================= */

function renderDashboard() {
  const country = getSelectedCountry();
  if (!country) return;

  renderTopBar();
  renderRankingStrip(country);
  renderMainKPIGrid(country);
  renderWorldSummary();
}

function renderTopBar() {
  const country = getSelectedCountry();
  if (!country) return;

  setText("topCountry", `${country.flag || "🌐"} ${country.name}`);
  setText("topDate", getSimulationDateText());
  setText("topSpeed", `x${NEXUS.simulation?.speed || 1}`);
  setText("topTreasury", formatMoney(country.treasury));
  setText("topGDP", formatMoney(country.gdp));
  setText("topPopulation", formatNumber(country.population));
  setText("topStability", `${Math.round(country.stability || 0)}%`);
  setText("topHappiness", `${Math.round(country.happiness || 0)}%`);
}

function renderRankingStrip(country = getSelectedCountry()) {
  const box = document.getElementById("rankingStrip");
  if (!box || !country) return;

  const items = [
    ["💶", "PIB", country.rankGDP],
    ["👥", "Población", country.rankPopulation],
    ["🛡️", "Militar", country.rankMilitary],
    ["🔬", "Tecnología", country.rankResearch]
  ];

  box.innerHTML = items.map(([icon, label, rank]) => `
    <div class="ranking-card">
      <span>${icon}</span>
      <small>${label}</small>
      <b>#${rank || "-"}</b>
    </div>
  `).join("");
}

function renderMainKPIGrid(country = getSelectedCountry()) {
  const box = document.getElementById("dashboardKPIs");
  if (!box || !country) return;

  const kpis = [
    ["💶", "Tesorería", formatMoney(country.treasury)],
    ["📈", "PIB", formatMoney(country.gdp)],
    ["👥", "Población", formatNumber(country.population)],
    ["🏦", "Deuda", `${Math.round(getDebtRatio(country) * 100)}% PIB`],
    ["🧾", "Impuestos", `${Math.round((country.taxRate || 0) * 100)}%`],
    ["😊", "Felicidad", `${Math.round(country.happiness || 0)}%`],
    ["🏛️", "Estabilidad", `${Math.round(country.stability || 0)}%`],
    ["📊", "Inflación", `${((country.inflation || 0) * 100).toFixed(1)}%`],
    ["⚡", "Energía", formatNumber(getEnergyBalance(country))],
    ["🌾", "Comida", formatNumber(getFoodBalance(country))],
    ["🛡️", "Militar", formatNumber(calculateEffectiveMilitaryPower(country))],
    ["🌍", "CO₂", formatNumber(country.co2 || 0)]
  ];

  box.innerHTML = kpis.map(([icon, label, value]) => `
    <div class="kpi-card">
      <span class="kpi-icon">${icon}</span>
      <small>${label}</small>
      <b>${value}</b>
    </div>
  `).join("");
}

function renderWorldSummary() {
  const box = document.getElementById("worldSummary");
  if (!box) return;

  const world = NEXUS.state.world || {};
  const totals = NEXUS.state.worldTotals || getWorldTotals(NEXUS.state.countries || []);

  box.innerHTML = `
    <div class="world-card">
      <span>🌡️</span>
      <small>Temp. global</small>
      <b>${Number(world.temperatureDelta || 0).toFixed(2)} °C</b>
    </div>
    <div class="world-card">
      <span>🌫️</span>
      <small>CO₂ ppm</small>
      <b>${Number(world.co2ppm || 0).toFixed(1)}</b>
    </div>
    <div class="world-card">
      <span>⚔️</span>
      <small>Tensión</small>
      <b>${Math.round(world.tension || 0)}%</b>
    </div>
    <div class="world-card">
      <span>💶</span>
      <small>PIB mundial</small>
      <b>${formatMoney(totals.gdp || 0)}</b>
    </div>
  `;
}

function renderSimulation() {
  renderDashboard();
  renderMap?.();
  renderActivePanel?.();
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 3
========================================================= */

window.renderDashboard = renderDashboard;
window.renderTopBar = renderTopBar;
window.renderRankingStrip = renderRankingStrip;
window.renderMainKPIGrid = renderMainKPIGrid;
window.renderWorldSummary = renderWorldSummary;
window.renderSimulation = renderSimulation;

/* =========================================================
   UI.JS v1
   BLOQUE 4/15
   Gestión de regiones, ciudades y construcción
========================================================= */

function renderCitiesPanel() {

    const container =
        document.getElementById("citiesPanel");

    if (!container) return;

    const country =
        getSelectedCountry();

    if (!country) return;

    const regions =
        country.regions || [];

    container.innerHTML =

        `
        <div class="panel-header">

            <h2>🏙️ Regiones de ${country.name}</h2>

            <div>

                ${regions.length} regiones

            </div>

        </div>

        <div id="citiesList"></div>

        <div id="regionDetails"></div>

        `;

    renderCitiesList();

    renderSelectedRegion();

}

/* ========================================================= */

function renderCitiesList(){

    const list =
        document.getElementById("citiesList");

    if(!list) return;

    const country =
        getSelectedCountry();

    list.innerHTML="";

    country.regions.forEach(region=>{

        const card=
            document.createElement("div");

        card.className="city-card";

        if(
            region.id===
            NEXUS.state.selectedRegionId
        )
            card.classList.add("selected");

        card.innerHTML=`

            <div class="city-title">

                ${getRegionIcon(region)}

                <b>${region.name}</b>

            </div>

            <div class="city-data">

                👥 ${formatNumber(region.population)}

            </div>

            <div class="city-data">

                💶 ${formatMoney(region.gdp)}

            </div>

            <div class="city-data">

                🏗️ ${(region.buildings||[]).length} edificios

            </div>

        `;

        card.onclick=()=>{

            setSelectedRegion(region.id);

            renderSelectedRegion();

            renderCitiesList();

        };

        list.appendChild(card);

    });

}

/* ========================================================= */

function renderSelectedRegion(){

    const panel=
        document.getElementById("regionDetails");

    if(!panel)return;

    const region=
        getSelectedRegion();

    if(!region){

        panel.innerHTML=
            "<p>No hay región seleccionada.</p>";

        return;

    }

    panel.innerHTML=`

        <h3>

            ${getRegionIcon(region)}

            ${region.name}

        </h3>

        <div class="region-grid">

            <div>

                👥

                ${formatNumber(region.population)}

            </div>

            <div>

                💶

                ${formatMoney(region.gdp)}

            </div>

            <div>

                🏭

                ${(region.buildings||[]).length}

                edificios

            </div>

            <div>

                ⚠️

                ${Math.round(region.damageLevel||0)}/10

            </div>

        </div>

        <div id="regionBuildings"></div>

        <div id="constructionQueue"></div>

        <button
            onclick="openConstructionWindow()">

            ➕ Construir

        </button>

    `;

    renderRegionBuildings();

    renderConstructionQueue();

}

/* ========================================================= */

function renderRegionBuildings(){

    const div=
        document.getElementById(
            "regionBuildings"
        );

    if(!div)return;

    const region=
        getSelectedRegion();

    const buildings=
        region.buildings||[];

    div.innerHTML="<h4>Edificios</h4>";

    buildings.forEach(building=>{

        const def=
            findBuildingById(
                building.buildingId
            );

        div.innerHTML+=`

            <div class="building-row">

                <span>

                    ${def?.icon||"🏢"}

                    ${def?.name||building.buildingId}

                </span>

                <b>

                    Nivel ${building.level}

                </b>

            </div>

        `;

    });

}

/* ========================================================= */

function renderConstructionQueue(){

    const div=
        document.getElementById(
            "constructionQueue"
        );

    if(!div)return;

    const country=
        getSelectedCountry();

    div.innerHTML="<h4>Construcción</h4>";

    if(
        !country.constructionQueue.length
    ){

        div.innerHTML+="<p>Sin proyectos activos.</p>";

        return;

    }

    country.constructionQueue.forEach(project=>{

        div.innerHTML+=`

            <div class="queue-row">

                <span>

                    ${project.icon}

                    ${project.name}

                </span>

                <span>

                    ${project.remainingDays} días

                </span>

            </div>

        `;

    });

}

/* ========================================================= */

function openConstructionWindow(){

    const region=
        getSelectedRegion();

    if(!region)return;

    let html="";

    AVAILABLE_BUILDINGS.forEach(building=>{

        html+=`

        <button
            class="construction-btn"
            onclick="buildFromUI('${building.id}')">

            ${building.icon}

            ${building.name}

        </button>

        `;

    });

    openModal(

        "Construcción",

        html

    );

}

/* ========================================================= */

function buildFromUI(buildingId){

    constructBuilding(buildingId);

    closeModal();

    renderCitiesPanel();

    renderDashboard();

}

/* ========================================================= */

window.renderCitiesPanel=
renderCitiesPanel;

window.renderCitiesList=
renderCitiesList;

window.renderSelectedRegion=
renderSelectedRegion;

window.renderRegionBuildings=
renderRegionBuildings;

window.renderConstructionQueue=
renderConstructionQueue;

window.openConstructionWindow=
openConstructionWindow;

window.buildFromUI=
buildFromUI;


/* =========================================================
   UI.JS v1
   BLOQUE 5/15
   Panel económico: presupuesto, impuestos, deuda, inflación.
========================================================= */

function renderEconomyPanel() {
  const box = document.getElementById("economyPanel");
  if (!box) return;

  const country = getSelectedCountry();
  if (!country) return;

  const budget = getBudgetBreakdown(country);

  box.innerHTML = `
    <div class="panel-header">
      <h2>💶 Economía de ${country.name}</h2>
      <button onclick="quickBalancePass()">⚖️ Balance rápido</button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card"><span>PIB</span><b>${formatMoney(country.gdp)}</b></div>
      <div class="kpi-card"><span>Tesorería</span><b>${formatMoney(country.treasury)}</b></div>
      <div class="kpi-card"><span>Deuda</span><b>${Math.round(getDebtRatio(country) * 100)}% PIB</b></div>
      <div class="kpi-card"><span>Inflación</span><b>${((country.inflation || 0) * 100).toFixed(1)}%</b></div>
      <div class="kpi-card"><span>Déficit diario</span><b>${formatMoney(budget.balance)}</b></div>
      <div class="kpi-card"><span>Confianza</span><b>${Math.round(country.businessConfidence || 0)}%</b></div>
    </div>

    <h3>🧾 Fiscalidad</h3>
    <label class="slider-row">
      <span>Impuestos: <b>${Math.round((country.taxRate || 0) * 100)}%</b></span>
      <input type="range" min="5" max="55" value="${Math.round((country.taxRate || 0.2) * 100)}"
        oninput="setTaxRateFromUI(this.value)">
    </label>

    <h3>🏛️ Presupuesto anual</h3>
    <div class="budget-grid">
      ${renderSpendingSlider("social", "Gasto social", country.socialSpending, country.gdp)}
      ${renderSpendingSlider("pensions", "Pensiones", country.pensions, country.gdp)}
      ${renderSpendingSlider("health", "Sanidad", country.healthSpending, country.gdp)}
      ${renderSpendingSlider("education", "Educación", country.educationSpending, country.gdp)}
      ${renderSpendingSlider("defense", "Defensa", country.defenseSpending, country.gdp)}
    </div>

    <h3>📊 Ingresos / gastos diarios</h3>
    <div class="table-wrap">
      <table>
        <tr><th>Concepto</th><th>Valor diario</th></tr>
        <tr><td>Impuestos</td><td>${formatMoney(budget.income.taxes)}</td></tr>
        <tr><td>Balanza comercial</td><td>${formatMoney(budget.income.trade)}</td></tr>
        <tr><td>Empresas estatales/controladas</td><td>${formatMoney(budget.income.stateCompanies)}</td></tr>
        <tr><td>Gasto social</td><td>${formatMoney(budget.expenses.social)}</td></tr>
        <tr><td>Pensiones</td><td>${formatMoney(budget.expenses.pensions)}</td></tr>
        <tr><td>Sanidad</td><td>${formatMoney(budget.expenses.health)}</td></tr>
        <tr><td>Educación</td><td>${formatMoney(budget.expenses.education)}</td></tr>
        <tr><td>Defensa</td><td>${formatMoney(budget.expenses.defense)}</td></tr>
        <tr><td>Intereses deuda</td><td>${formatMoney(budget.expenses.debtInterest)}</td></tr>
        <tr><th>Balance</th><th>${formatMoney(budget.balance)}</th></tr>
      </table>
    </div>
  `;
}

function renderSpendingSlider(key, label, value, gdp) {
  const pct = Math.round((value || 0) / Math.max(gdp || 1, 1) * 1000) / 10;

  return `
    <label class="slider-row">
      <span>${label}: <b>${pct}% PIB</b></span>
      <input type="range" min="0" max="25" step="0.1" value="${pct}"
        oninput="adjustSpendingFromUI('${key}', this.value)">
    </label>
  `;
}

function setTaxRateFromUI(value) {
  const country = getSelectedCountry();
  if (!country) return;

  setTaxRate(country, Number(value));
  renderEconomyPanel();
  renderDashboard();
}

function adjustSpendingFromUI(key, value) {
  const country = getSelectedCountry();
  if (!country) return;

  adjustSpending(country, key, Number(value));
  renderEconomyPanel();
  renderDashboard();
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 5
========================================================= */

window.renderEconomyPanel = renderEconomyPanel;
window.renderSpendingSlider = renderSpendingSlider;
window.setTaxRateFromUI = setTaxRateFromUI;
window.adjustSpendingFromUI = adjustSpendingFromUI;


/* =========================================================
   UI.JS v1
   BLOQUE 6/15
   Panel industrial: empresas nacionales, industria, energía,
   comida, logística y creación de compañías.
========================================================= */

function renderIndustryPanel() {
  const box = document.getElementById("industryPanel");
  if (!box) return;

  const country = getSelectedCountry();
  if (!country) return;

  const food = getFoodSystemBreakdown(country);
  const energy = getEnergySystemBreakdown(country);
  const logistics = getLogisticsBreakdown(country);

  box.innerHTML = `
    <div class="panel-header">
      <h2>🏭 Industria de ${country.name}</h2>
      <button onclick="openCreateCompanyModal()">➕ Crear empresa</button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card"><span>Índice industrial</span><b>${Math.round(getIndustrialIndex(country))}</b></div>
      <div class="kpi-card"><span>Nivel industrial</span><b>${getIndustrialLevel(country)}</b></div>
      <div class="kpi-card"><span>Energía</span><b>${formatNumber(energy.balance)}</b></div>
      <div class="kpi-card"><span>Comida</span><b>${formatNumber(food.balance)}</b></div>
      <div class="kpi-card"><span>Logística</span><b>${Math.round(logistics.logistics)}%</b></div>
      <div class="kpi-card"><span>Riesgo suministro</span><b>${Math.round(logistics.supplyChainRisk)}%</b></div>
    </div>

    <h3>⚡ Energía</h3>
    <div class="table-wrap">
      <table>
        <tr><th>Producción</th><td>${formatNumber(energy.production)}</td></tr>
        <tr><th>Demanda</th><td>${formatNumber(energy.demand)}</td></tr>
        <tr><th>Potencia instalada</th><td>${formatNumber(energy.installedPower)}</td></tr>
        <tr><th>Renovables</th><td>${formatNumber(energy.renewables)}</td></tr>
        <tr><th>Autosuficiencia</th><td>${Math.round(energy.selfSufficiency * 100)}%</td></tr>
      </table>
    </div>

    <h3>🌾 Alimentación</h3>
    <div class="table-wrap">
      <table>
        <tr><th>Producción</th><td>${formatNumber(food.production)}</td></tr>
        <tr><th>Consumo</th><td>${formatNumber(food.consumption)}</td></tr>
        <tr><th>Balance</th><td>${formatNumber(food.balance)}</td></tr>
        <tr><th>Consumo per cápita</th><td>${food.perCapitaConsumption.toFixed(2)}</td></tr>
        <tr><th>Autosuficiencia</th><td>${Math.round(food.selfSufficiency * 100)}%</td></tr>
      </table>
    </div>

    <h3>🏢 Empresas nacionales</h3>
    <div class="company-grid">
      ${(country.companies || []).map(company => renderCompanyMiniCard(company, country)).join("")}
    </div>

    <h3>🚚 Logística</h3>
    <button onclick="buildEmergencyLogistics()">🚚 Plan logístico de emergencia</button>
  `;
}

function renderCompanyMiniCard(company, country) {
  normalizeCompanyHistory(company);

  return `
    <div class="company-card">
      <div class="company-head">
        <b>${company.name}</b>
        <span>${company.sector || "Industria"}</span>
      </div>
      <div class="company-price">${formatMoney(company.price)}</div>
      <small>Capitalización: ${formatMoney(company.marketCap || company.price * (company.shares || 100000000))}</small>
      <small>Control: ${company.controller || country.name}</small>
    </div>
  `;
}

function openCreateCompanyModal() {
  openModal("Crear empresa", `
    <label>Nombre de empresa</label>
    <input id="newCompanyName" placeholder="Ej. Audi Iberia Motorsport">

    <label>Sector</label>
    <select id="newCompanySector">
      <option>Automoción</option>
      <option>Defensa</option>
      <option>Energía</option>
      <option>Tecnología</option>
      <option>Alimentación</option>
      <option>Finanzas</option>
      <option>Infraestructura</option>
    </select>

    <label>Precio inicial</label>
    <input id="newCompanyPrice" type="number" value="25">

    <button onclick="createCompanyFromUI()">🏢 Crear</button>
  `);
}

function createCompanyFromUI() {
  const name = document.getElementById("newCompanyName")?.value;
  const sector = document.getElementById("newCompanySector")?.value;
  const price = Number(document.getElementById("newCompanyPrice")?.value || 25);

  if (!name) {
    notify("⛔", "Introduce un nombre de empresa.", "error");
    return;
  }

  createNationalCompany(name, sector, price);
  closeModal();
  renderIndustryPanel();
  renderDashboard();
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 6
========================================================= */

window.renderIndustryPanel = renderIndustryPanel;
window.renderCompanyMiniCard = renderCompanyMiniCard;
window.openCreateCompanyModal = openCreateCompanyModal;
window.createCompanyFromUI = createCompanyFromUI;



/* =========================================================
   UI.JS v1
   BLOQUE 7/15
   Bolsa, Mercados y Empresas
========================================================= */

function renderStockMarketPanel() {

    const container =
        document.getElementById("stockMarketPanel");

    if (!container) return;

    const country =
        getSelectedCountry();

    const companies =
        getAllTradableCompanies()
        .sort((a,b)=>b.marketCap-a.marketCap);

    container.innerHTML = `

    <div class="panel-header">

        <h2>📈 Bolsa Internacional</h2>

        <div>

            <button onclick="refreshStockMarketPanel()">

                🔄 Actualizar

            </button>

        </div>

    </div>

    <div class="stock-summary">

        <div class="summary-card">

            <h3>💰 Tesorería</h3>

            <span>${formatMoney(country.treasury)}</span>

        </div>

        <div class="summary-card">

            <h3>📊 Empresas</h3>

            <span>${companies.length}</span>

        </div>

        <div class="summary-card">

            <h3>🏢 Participaciones</h3>

            <span>${Object.keys(country.portfolio||{}).length}</span>

        </div>

    </div>

    <div id="companyTable"></div>

    <hr>

    <div id="portfolioPanel"></div>

    `;

    renderCompanyTable(companies);

    renderPortfolio();

}

/* ========================================================= */

function renderCompanyTable(companies){

    const div =
        document.getElementById("companyTable");

    if(!div)return;

    div.innerHTML=`

    <table class="stock-table">

        <thead>

        <tr>

            <th>Empresa</th>

            <th>País</th>

            <th>Sector</th>

            <th>Precio</th>

            <th>Capitalización</th>

            <th></th>

        </tr>

        </thead>

        <tbody>

        ${companies.map(company=>`

        <tr>

            <td>${company.name}</td>

            <td>${company.country}</td>

            <td>${company.sector}</td>

            <td>${formatMoney(company.price)}</td>

            <td>${formatMoney(company.marketCap)}</td>

            <td>

                <button onclick="openCompany('${company.id}')">

                    Ver

                </button>

            </td>

        </tr>

        `).join("")}

        </tbody>

    </table>

    `;

}

/* ========================================================= */

function renderPortfolio(){

    const div=
        document.getElementById("portfolioPanel");

    if(!div)return;

    const country=
        getSelectedCountry();

    const portfolio=
        Object.values(country.portfolio||{});

    div.innerHTML="<h3>💼 Mi cartera</h3>";

    if(portfolio.length===0){

        div.innerHTML+="<p>No tienes acciones.</p>";

        return;

    }

    portfolio.forEach(position=>{

        const company=
            getCompanyById(position.companyId);

        if(!company)return;

        div.innerHTML+=`

        <div class="portfolio-row">

            <span>

                ${company.name}

            </span>

            <span>

                ${position.shares.toLocaleString()} acc.

            </span>

            <span>

                ${formatMoney(company.price)}

            </span>

            <button
                onclick="sellSharesUI('${company.id}')">

                Vender

            </button>

        </div>

        `;

    });

}

/* ========================================================= */

function openCompany(companyId){

    const company=
        getCompanyById(companyId);

    if(!company)return;

    openModal(

        company.name,

        `

        <h3>${company.name}</h3>

        <p>

            🌍 ${company.country}

        </p>

        <p>

            🏭 ${company.sector}

        </p>

        <p>

            💰 ${formatMoney(company.price)}

        </p>

        <p>

            📊 ${formatMoney(company.marketCap)}

        </p>

        <p>

            👑 Control:

            ${company.controller||company.country}

        </p>

        <hr>

        <button
            onclick="buySharesUI('${company.id}')">

            Comprar acciones

        </button>

        <button
            onclick="launchOPAUI('${company.id}')">

            Lanzar OPA

        </button>

        <button
            onclick="showCompanyHistory('${company.id}')">

            Histórico

        </button>

        `

    );

}

/* ========================================================= */

function buySharesUI(companyId){

    const amount=
        prompt(
            "¿Cuántas acciones?"
        );

    if(!amount)return;

    buyShares(
        companyId,
        Number(amount)
    );

    closeModal();

    renderStockMarketPanel();

}

/* ========================================================= */

function sellSharesUI(companyId){

    const amount=
        prompt(
            "Acciones a vender"
        );

    if(!amount)return;

    sellShares(
        companyId,
        Number(amount)
    );

    renderStockMarketPanel();

}

/* ========================================================= */

function launchOPAUI(companyId){

    if(

        confirm(

            "¿Lanzar una OPA?"

        )

    ){

        launchTakeover(
            companyId,
            51
        );

        closeModal();

        renderStockMarketPanel();

    }

}

/* ========================================================= */

function showCompanyHistory(companyId){

    const company=
        getCompanyById(companyId);

    if(!company)return;

    alert(

        company.history
        .slice(-20)
        .join(" → ")

    );

}

/* ========================================================= */

function refreshStockMarketPanel(){

    renderStockMarketPanel();

}

/* ========================================================= */

window.renderStockMarketPanel=
renderStockMarketPanel;

window.renderCompanyTable=
renderCompanyTable;

window.renderPortfolio=
renderPortfolio;

window.openCompany=
openCompany;

window.buySharesUI=
buySharesUI;

window.sellSharesUI=
sellSharesUI;

window.launchOPAUI=
launchOPAUI;

window.showCompanyHistory=
showCompanyHistory;

window.refreshStockMarketPanel=
refreshStockMarketPanel;

/* =========================================================
   UI.JS v1
   BLOQUE 8/15
   Investigación, tecnologías y cola tecnológica.
========================================================= */

function renderTechnologyPanel() {
  const box = document.getElementById("technologyPanel");
  if (!box) return;

  const country = getSelectedCountry();
  if (!country) return;

  const data = getResearchBreakdown(country);

  box.innerHTML = `
    <div class="panel-header">
      <h2>🔬 Investigación de ${country.name}</h2>
      <button onclick="renderTechnologyPanel()">🔄 Actualizar</button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card"><span>Investigación</span><b>${formatNumber(data.research)}</b></div>
      <div class="kpi-card"><span>Cyber</span><b>${formatNumber(data.cyber)}</b></div>
      <div class="kpi-card"><span>Educación</span><b>${Math.round(data.educationQuality)}%</b></div>
      <div class="kpi-card"><span>Innovación</span><b>${Math.round(data.innovationIndex)}%</b></div>
    </div>

    <h3>⏳ Cola tecnológica</h3>
    <div class="queue-list">
      ${renderTechnologyQueue(data.technologyQueue)}
    </div>

    <h3>🧬 Tecnologías disponibles</h3>
    <div class="tech-grid">
      ${data.availableTechnologies.map(tech => renderTechnologyCard(country, tech)).join("")}
    </div>

    <h3>✅ Completadas</h3>
    <div class="tag-list">
      ${(data.completedTechnologies || []).map(id => {
        const t = TECHNOLOGIES.find(x => x.id === id);
        return `<span class="tag">✅ ${t?.name || id}</span>`;
      }).join("") || "<p>Sin tecnologías completadas.</p>"}
    </div>
  `;
}

function renderTechnologyQueue(queue = []) {
  if (!queue.length) return "<p>Sin investigaciones activas.</p>";

  return queue.map(project => {
    const progress = clamp(100 * (1 - project.remainingDays / Math.max(project.totalDays, 1)), 0, 100);

    return `
      <div class="queue-row">
        <div>
          <b>🔬 ${project.name}</b>
          <small>${project.remainingDays} días restantes</small>
        </div>
        <div class="progress-bar">
          <div style="width:${progress}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderTechnologyCard(country, tech) {
  const affordable =
    country.research >= tech.requiredResearch &&
    country.treasury >= tech.cost;

  const progress = getTechnologyProgress(country, tech.id);

  return `
    <div class="tech-card ${affordable ? "" : "locked"}">
      <h4>${tech.icon || "🔬"} ${tech.name}</h4>
      <p>${tech.description || ""}</p>
      <small>Año: ${tech.year} · Coste: ${formatMoney(tech.cost)}</small>
      <small>Requiere investigación: ${formatNumber(tech.requiredResearch)}</small>

      ${progress ? `
        <div class="progress-bar">
          <div style="width:${progress.progress}%"></div>
        </div>
        <small>${Math.round(progress.progress)}%</small>
      ` : `
        <button ${affordable ? "" : "disabled"} onclick="startTechnologyFromUI('${tech.id}')">
          Investigar
        </button>
      `}
    </div>
  `;
}

function startTechnologyFromUI(technologyId) {
  startTechnologyResearch(technologyId);
  renderTechnologyPanel();
  renderDashboard();
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 8
========================================================= */

window.renderTechnologyPanel = renderTechnologyPanel;
window.renderTechnologyQueue = renderTechnologyQueue;
window.renderTechnologyCard = renderTechnologyCard;
window.startTechnologyFromUI = startTechnologyFromUI;

/* =========================================================
   UI.JS v1
   BLOQUE 9/15
   Fuerzas Armadas: tierra, aire, mar, misiles y nuclear.
========================================================= */

function renderMilitaryPanel() {
  const box = document.getElementById("militaryPanel");
  if (!box) return;

  const country = getSelectedCountry();
  if (!country) return;

  const mil = getMilitaryBreakdown(country);
  const ops = getMilitaryOperationalStatus(country);
  const air = getAdvancedAirWarBreakdown(country);
  const naval = getNavalWarBreakdown(country);
  const missile = getMissileWarfareBreakdown(country);
  const nuclear = getNuclearBreakdown(country);

  box.innerHTML = `
    <div class="panel-header">
      <h2>🛡️ Fuerzas Armadas de ${country.name}</h2>
      <button onclick="grantPlayerMilitary()">➕ Refuerzos debug</button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card"><span>Poder efectivo</span><b>${formatNumber(ops.effectivePower)}</b></div>
      <div class="kpi-card"><span>Preparación</span><b>${Math.round(ops.readiness || 0)}%</b></div>
      <div class="kpi-card"><span>Logística</span><b>${Math.round(ops.logistics || 0)}%</b></div>
      <div class="kpi-card"><span>Entrenamiento</span><b>${Math.round(ops.training || 0)}%</b></div>
      <div class="kpi-card"><span>Modernización</span><b>${Math.round(ops.modernization || 0)}%</b></div>
      <div class="kpi-card"><span>Reservistas</span><b>${formatNumber(ops.reservePersonnel || 0)}</b></div>
    </div>

    <h3>🎖️ Unidades</h3>
    <div class="table-wrap">
      <table>
        <tr><th>Unidad</th><th>Tipo</th><th>Cantidad</th><th>Poder</th><th>Mantenimiento/día</th></tr>
        ${mil.units.map(u => `
          <tr>
            <td>${u.icon} ${u.name}</td>
            <td>${u.type}</td>
            <td>${formatNumber(u.count)}</td>
            <td>${formatNumber(u.power)}</td>
            <td>${formatMoney(u.upkeepDaily)}</td>
          </tr>
        `).join("") || `<tr><td colspan="5">Sin unidades.</td></tr>`}
      </table>
    </div>

    <h3>🏭 Producción militar</h3>
    <div class="toolbar">
      <button onclick="openMilitaryProductionModal()">🛠️ Producir unidades</button>
      <button onclick="renderMilitaryPanel()">🔄 Actualizar</button>
    </div>
    <div class="queue-list">
      ${renderMilitaryQueue(country)}
    </div>

    <h3>✈️ Aire · 🚢 Mar · 🚀 Misiles · ☢️ Nuclear</h3>
    <div class="kpi-grid">
      <div class="kpi-card"><span>Poder aéreo</span><b>${formatNumber(air.airPower)}</b></div>
      <div class="kpi-card"><span>Defensa aérea</span><b>${formatNumber(air.airDefense)}</b></div>
      <div class="kpi-card"><span>Poder naval</span><b>${formatNumber(naval.totalNavalPower)}</b></div>
      <div class="kpi-card"><span>Submarinos</span><b>${formatNumber(naval.submarinePower)}</b></div>
      <div class="kpi-card"><span>Misiles</span><b>${formatNumber(missile.cruiseCapability)}</b></div>
      <div class="kpi-card"><span>Nuclear</span><b>${nuclear.hasCapability ? `${formatNumber(nuclear.warheads)} ojivas` : "No"}</b></div>
    </div>

    <h3>⚔️ Operaciones</h3>
    <div class="actions-grid">
      <button onclick="openForeignOperationModal()">🎯 Operaciones exteriores</button>
      <button onclick="openAirMissionModal()">✈️ Misión aérea</button>
      <button onclick="openMissileStrikeModal()">🚀 Ataque misil</button>
      <button onclick="openEWModal()">📡 Guerra electrónica</button>
      <button onclick="openBlockadeModal()">🚢 Bloqueo naval</button>
      <button onclick="raiseNuclearAlert(getSelectedCountry(),1)">☢️ Elevar alerta nuclear</button>
      <button onclick="lowerNuclearAlert()">🕊️ Bajar alerta nuclear</button>
    </div>
  `;
}

function renderMilitaryQueue(country = getSelectedCountry()) {
  const queue = country.militaryQueue || [];
  if (!queue.length) return "<p>Sin producción militar activa.</p>";

  return queue.map(project => {
    const progress = getMilitaryProductionProgress(project);

    return `
      <div class="queue-row">
        <div>
          <b>${project.icon || "🎖️"} ${project.name}</b>
          <small>${project.quantity} unidades · ${project.remainingDays} días</small>
        </div>
        <div class="progress-bar"><div style="width:${progress}%"></div></div>
      </div>
    `;
  }).join("");
}

function openMilitaryProductionModal() {
  const country = getSelectedCountry();
  const units = getAvailableMilitaryUnitsForCountry(country);

  openModal("Producción militar", `
    <div class="modal-grid">
      ${units.map(unit => `
        <div class="unit-card">
          <h4>${unit.icon || "🎖️"} ${unit.name}</h4>
          <small>${unit.type || ""} · ${unit.domain || ""}</small>
          <p>Coste: ${formatMoney(unit.cost || 0)} · Días: ${unit.days || 30}</p>
          <p>Poder: ${formatNumber(unit.power || 0)} · Mant.: ${formatMoney(unit.upkeep || 0)}/día</p>
          <input id="qty-${unit.id}" type="number" min="1" value="1">
          <button onclick="startMilitaryProductionFromUI('${unit.id}')">Producir</button>
        </div>
      `).join("")}
    </div>
  `);
}

function startMilitaryProductionFromUI(unitId) {
  const qty = Number(document.getElementById(`qty-${unitId}`)?.value || 1);
  startMilitaryProduction(unitId, qty);
  closeModal();
  renderMilitaryPanel();
  renderDashboard();
}

function countryOptionsHTML(excludeSelected = true) {
  const selected = getSelectedCountry()?.name;

  return (NEXUS.state.countries || [])
    .filter(c => !excludeSelected || c.name !== selected)
    .map(c => `<option value="${c.name}">${c.flag || "🌐"} ${c.name}</option>`)
    .join("");
}

function openForeignOperationModal() {
  const attacker = getSelectedCountry();

  openModal("Operaciones exteriores", `
    <label>País objetivo</label>
    <select id="foreignTarget" onchange="renderForeignOperationOptions()">
      ${countryOptionsHTML(true)}
    </select>
    <div id="foreignOperationOptions"></div>
  `);

  renderForeignOperationOptions();
}

function renderForeignOperationOptions() {
  const targetName = document.getElementById("foreignTarget")?.value;
  const attacker = getSelectedCountry();
  const target = getCountryByName(NEXUS.state.countries, targetName);
  const box = document.getElementById("foreignOperationOptions");
  if (!box || !attacker || !target) return;

  const ops = getForeignOperationBreakdown(attacker, target);

  box.innerHTML = ops.map(op => `
    <div class="operation-card ${op.allowed && op.affordable ? "" : "locked"}">
      <h4>${op.icon || "🎯"} ${op.name}</h4>
      <p>${op.description || ""}</p>
      <small>Coste: ${formatMoney(op.cost)} · Éxito: ${Math.round(op.successChance * 100)}%</small>
      <button ${op.allowed && op.affordable ? "" : "disabled"}
        onclick="executeForeignOperationFromUI('${op.id}')">
        Ejecutar
      </button>
    </div>
  `).join("");
}

function executeForeignOperationFromUI(operationId) {
  const target = document.getElementById("foreignTarget")?.value;
  executeForeignOperation(operationId, target);
  closeModal();
  renderMilitaryPanel();
}

function openAirMissionModal() {
  const country = getSelectedCountry();
  const air = getAdvancedAirWarBreakdown(country);

  openModal("Misión aérea", `
    <label>Objetivo</label>
    <select id="airTarget">${countryOptionsHTML(true)}</select>
    <div class="modal-grid">
      ${air.availableMissions.map(m => `
        <div class="operation-card">
          <h4>${m.icon} ${m.name}</h4>
          <small>Coste: ${formatMoney(m.cost)}</small>
          <button onclick="launchAirMissionFromUI('${m.id}')">Lanzar</button>
        </div>
      `).join("")}
    </div>
  `);
}

function launchAirMissionFromUI(type) {
  const target = document.getElementById("airTarget")?.value;
  launchAirMission(type, target);
  closeModal();
  renderMilitaryPanel();
}

function openMissileStrikeModal() {
  const country = getSelectedCountry();
  const missile = getMissileWarfareBreakdown(country);

  openModal("Ataque con misiles", `
    <label>Objetivo</label>
    <select id="missileTarget">${countryOptionsHTML(true)}</select>
    <div class="modal-grid">
      ${missile.availableStrikes.map(s => `
        <div class="operation-card">
          <h4>${s.icon} ${s.name}</h4>
          <small>Coste: ${formatMoney(s.cost)}</small>
          <button onclick="launchMissileStrikeFromUI('${s.id}')">Lanzar</button>
        </div>
      `).join("")}
    </div>
  `);
}

function launchMissileStrikeFromUI(type) {
  const target = document.getElementById("missileTarget")?.value;
  launchMissileStrike(target, type);
  closeModal();
  renderMilitaryPanel();
}

function openEWModal() {
  const country = getSelectedCountry();
  const ew = getElectronicWarfareBreakdown(country);

  openModal("Guerra electrónica", `
    <label>Objetivo</label>
    <select id="ewTarget">${countryOptionsHTML(true)}</select>
    <div class="modal-grid">
      ${ew.operations.map(op => `
        <div class="operation-card">
          <h4>${op.icon} ${op.name}</h4>
          <small>Coste: ${formatMoney(op.cost)}</small>
          <button onclick="executeEWFromUI('${op.id}')">Ejecutar</button>
        </div>
      `).join("")}
    </div>
  `);
}

function executeEWFromUI(type) {
  const target = document.getElementById("ewTarget")?.value;
  executeElectronicWarfare(type, target);
  closeModal();
  renderMilitaryPanel();
}

function openBlockadeModal() {
  openModal("Bloqueo naval", `
    <label>Objetivo</label>
    <select id="blockadeTarget">${countryOptionsHTML(true)}</select>
    <button onclick="startBlockadeFromUI()">🚢 Iniciar bloqueo</button>
  `);
}

function startBlockadeFromUI() {
  const target = document.getElementById("blockadeTarget")?.value;
  startNavalBlockade(target);
  closeModal();
  renderMilitaryPanel();
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 9
========================================================= */

window.renderMilitaryPanel = renderMilitaryPanel;
window.renderMilitaryQueue = renderMilitaryQueue;
window.openMilitaryProductionModal = openMilitaryProductionModal;
window.startMilitaryProductionFromUI = startMilitaryProductionFromUI;
window.countryOptionsHTML = countryOptionsHTML;
window.openForeignOperationModal = openForeignOperationModal;
window.renderForeignOperationOptions = renderForeignOperationOptions;
window.executeForeignOperationFromUI = executeForeignOperationFromUI;
window.openAirMissionModal = openAirMissionModal;
window.launchAirMissionFromUI = launchAirMissionFromUI;
window.openMissileStrikeModal = openMissileStrikeModal;
window.launchMissileStrikeFromUI = launchMissileStrikeFromUI;
window.openEWModal = openEWModal;
window.executeEWFromUI = executeEWFromUI;
window.openBlockadeModal = openBlockadeModal;
window.startBlockadeFromUI = startBlockadeFromUI;


/* =========================================================
   UI.JS v1
   BLOQUE 10/15
   Centro Diplomático Internacional
========================================================= */

function renderDiplomacyPanel(){

    const panel =
        document.getElementById(
            "diplomacyPanel"
        );

    if(!panel) return;

    const player =
        getSelectedCountry();

    const countries =
        NEXUS.state.countries
        .filter(c=>c.name!==player.name);

    panel.innerHTML=`

    <div class="panel-header">

        <h2>🌍 Diplomacia</h2>

        <button
            onclick="renderDiplomacyPanel()">

            🔄 Actualizar

        </button>

    </div>

    <div class="kpi-grid">

        <div class="kpi-card">

            <span>Reputación</span>

            <b>${Math.round(player.reputation)}</b>

        </div>

        <div class="kpi-card">

            <span>Sanciones</span>

            <b>${player.sanctions}</b>

        </div>

        <div class="kpi-card">

            <span>Tratados</span>

            <b>${player.treaties.length}</b>

        </div>

        <div class="kpi-card">

            <span>Influencia</span>

            <b>${player.globalInfluence}</b>

        </div>

    </div>

    <div id="diplomacyCountries"></div>

    <hr>

    <div id="activeTreaties"></div>

    `;

    renderDiplomaticCountries(countries);

    renderTreaties();

}

/* ========================================================= */

function renderDiplomaticCountries(countries){

    const div=
        document.getElementById(
            "diplomacyCountries"
        );

    if(!div)return;

    div.innerHTML="";

    countries.forEach(country=>{

        const relation=
            getRelationColor(
                country.relation
            );

        div.innerHTML+=`

        <div
            class="country-row">

            <div>

                ${country.flag}

                <b>

                    ${country.name}

                </b>

            </div>

            <div
                style="color:${relation.color}">

                ${relation.text}

            </div>

            <div>

                <button
                    onclick="openDiplomacyCountry('${country.name}')">

                    Gestionar

                </button>

            </div>

        </div>

        `;

    });

}

/* ========================================================= */

function openDiplomacyCountry(name){

    const country=
        getCachedCountry(name);

    if(!country)return;

    openModal(

        `🌍 ${country.name}`,

        `

        <h3>

            ${country.flag}

            ${country.name}

        </h3>

        <p>

            Relación:

            ${country.relation}

        </p>

        <p>

            Reputación:

            ${country.reputation}

        </p>

        <hr>

        <button
            onclick="sendAidUI('${name}')">

            💶 Ayuda económica

        </button>

        <button
            onclick="tradeAgreementUI('${name}')">

            🤝 Tratado comercial

        </button>

        <button
            onclick="allianceUI('${name}')">

            🛡️ Alianza

        </button>

        <button
            onclick="nonAggressionUI('${name}')">

            ☮️ No agresión

        </button>

        <button
            onclick="sanctionUI('${name}')">

            🚫 Sancionar

        </button>

        <button
            onclick="declareWarUI('${name}')">

            ⚔️ Declarar guerra

        </button>

        <button
            onclick="spyCountryUI('${name}')">

            🕵️ Espionaje

        </button>

        `

    );

}

/* ========================================================= */

function sendAidUI(country){

    const amount=
        Number(

            prompt(

                "Cantidad (€)",

                "100000000"

            )

        );

    if(!amount)return;

    sendEconomicAid(
        country,
        amount
    );

    closeModal();

    renderDiplomacyPanel();

}

/* ========================================================= */

function tradeAgreementUI(country){

    signTreaty(
        country,
        "trade"
    );

    closeModal();

    renderDiplomacyPanel();

}

/* ========================================================= */

function allianceUI(country){

    signTreaty(
        country,
        "alliance"
    );

    closeModal();

    renderDiplomacyPanel();

}

/* ========================================================= */

function nonAggressionUI(country){

    signTreaty(
        country,
        "nonAggression"
    );

    closeModal();

    renderDiplomacyPanel();

}

/* ========================================================= */

function sanctionUI(country){

    imposeSanctions(
        country,
        1
    );

    closeModal();

    renderDiplomacyPanel();

}

/* ========================================================= */

function declareWarUI(country){

    if(

        confirm(

            "¿Declarar la guerra?"

        )

    ){

        declareWar(

            getSelectedCountry().name,

            country,

            "Declaración diplomática"

        );

        closeModal();

        renderDiplomacyPanel();

    }

}

/* ========================================================= */

function spyCountryUI(country){

    executeSpyMission(

        country,

        "military_intelligence"

    );

    closeModal();

}

/* ========================================================= */

function renderTreaties(){

    const div=
        document.getElementById(
            "activeTreaties"
        );

    if(!div)return;

    const country=
        getSelectedCountry();

    div.innerHTML="<h3>📜 Tratados</h3>";

    if(
        country.treaties.length===0
    ){

        div.innerHTML+="<p>No existen tratados.</p>";

        return;

    }

    country.treaties.forEach(t=>{

        div.innerHTML+=`

        <div class="treaty-row">

            <span>

                📜

                ${t.type}

            </span>

            <span>

                ${t.country}

            </span>

        </div>

        `;

    });

}

/* ========================================================= */

function getRelationColor(value){

    if(value>=80)
        return{
            color:"#00c853",
            text:"Aliado"
        };

    if(value>=60)
        return{
            color:"#64dd17",
            text:"Amistoso"
        };

    if(value>=40)
        return{
            color:"#ffd600",
            text:"Neutral"
        };

    if(value>=20)
        return{
            color:"#ff9100",
            text:"Tensión"
        };

    return{

        color:"#ff1744",

        text:"Hostil"

    };

}

/* ========================================================= */

window.renderDiplomacyPanel=
renderDiplomacyPanel;

window.renderDiplomaticCountries=
renderDiplomaticCountries;

window.openDiplomacyCountry=
openDiplomacyCountry;

window.sendAidUI=
sendAidUI;

window.tradeAgreementUI=
tradeAgreementUI;

window.allianceUI=
allianceUI;

window.nonAggressionUI=
nonAggressionUI;

window.sanctionUI=
sanctionUI;

window.declareWarUI=
declareWarUI;

window.spyCountryUI=
spyCountryUI;

window.renderTreaties=
renderTreaties;

window.getRelationColor=
getRelationColor;



/* =========================================================
   UI.JS v1
   BLOQUE 11/15
   Centro de Inteligencia y Espionaje
========================================================= */

function renderSpyPanel() {
  const panel = document.getElementById("spyPanel");
  if (!panel) return;

  const country = getSelectedCountry();
  const data = getSpyBreakdown(country);

  panel.innerHTML = `
    <div class="panel-header">
      <h2>🕵️ Inteligencia de ${country.name}</h2>
      <button onclick="renderSpyPanel()">🔄 Actualizar</button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card"><span>Inteligencia</span><b>${Math.round(data.intelligence)}</b></div>
      <div class="kpi-card"><span>Cyber</span><b>${Math.round(data.cyber)}</b></div>
      <div class="kpi-card"><span>Seguridad interior</span><b>${Math.round(country.internalSecurity || 0)}%</b></div>
      <div class="kpi-card"><span>Reputación</span><b>${Math.round(country.reputation || 0)}</b></div>
    </div>

    <h3>🌍 Operaciones disponibles</h3>
    <label>País objetivo</label>
    <select id="spyTarget">
      ${countryOptionsHTML(true)}
    </select>

    <div class="actions-grid">
      ${data.operations.map(op => `
        <button onclick="executeSpyMissionFromUI('${op}')">
          ${getSpyMissionIcon(op)} ${getSpyMissionName(op)}
          <small>${formatMoney(getSpyMissionCost(op))}</small>
        </button>
      `).join("")}
    </div>

    <h3>📡 Informe militar del objetivo</h3>
    <button onclick="showMilitaryIntelFromUI()">🛰️ Revelar informe</button>
    <div id="militaryIntelBox"></div>
  `;
}

function executeSpyMissionFromUI(type) {
  const target = document.getElementById("spyTarget")?.value;
  if (!target) return;

  executeSpyMission(target, type);
  renderSpyPanel();
  renderDashboard();
}

function showMilitaryIntelFromUI() {
  const targetName = document.getElementById("spyTarget")?.value;
  const target = getCountryByName(NEXUS.state.countries, targetName);
  const box = document.getElementById("militaryIntelBox");

  if (!target || !box) return;

  const intel = revealMilitary(target);

  box.innerHTML = `
    <div class="table-wrap">
      <table>
        <tr><th>Poder militar</th><td>${formatNumber(intel.militaryPower)}</td></tr>
        <tr><th>Poder aéreo</th><td>${formatNumber(intel.airPower)}</td></tr>
        <tr><th>Poder naval</th><td>${formatNumber(intel.navalPower)}</td></tr>
        <tr><th>Misiles</th><td>${formatNumber(intel.missileCapability)}</td></tr>
        <tr><th>Nuclear</th><td>${intel.nuclear ? "Sí" : "No"}</td></tr>
        <tr><th>Preparación</th><td>${Math.round(intel.readiness || 0)}%</td></tr>
      </table>
    </div>
  `;
}

function getSpyMissionName(type) {
  return {
    steal_money: "Robar fondos",
    steal_technology: "Robar tecnología",
    sabotage: "Sabotaje",
    military_intelligence: "Inteligencia militar",
    industrial_spy: "Espionaje industrial",
    election_interference: "Interferir elecciones",
    coup: "Apoyar golpe"
  }[type] || type;
}

function getSpyMissionIcon(type) {
  return {
    steal_money: "💰",
    steal_technology: "🧬",
    sabotage: "🏭",
    military_intelligence: "🛰️",
    industrial_spy: "🏢",
    election_interference: "🗳️",
    coup: "⚔️"
  }[type] || "🕵️";
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 11
========================================================= */

window.renderSpyPanel = renderSpyPanel;
window.executeSpyMissionFromUI = executeSpyMissionFromUI;
window.showMilitaryIntelFromUI = showMilitaryIntelFromUI;
window.getSpyMissionName = getSpyMissionName;
window.getSpyMissionIcon = getSpyMissionIcon;



/* =========================================================
   UI.JS v1
   BLOQUE 12/15
   Noticias, eventos y cronología mundial.
========================================================= */

function renderEventsPanel() {
  const panel = document.getElementById("eventsPanel");
  if (!panel) return;

  const events = [...(NEXUS.state.events || [])].reverse();
  const global = getGlobalEventsBreakdown();

  panel.innerHTML = `
    <div class="panel-header">
      <h2>📰 Noticias y cronología</h2>
      <button onclick="renderEventsPanel()">🔄 Actualizar</button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card"><span>Tensión mundial</span><b>${Math.round(global.world.tension || 0)}%</b></div>
      <div class="kpi-card"><span>Estrés energético</span><b>${Math.round(global.world.energyStress || 0)}%</b></div>
      <div class="kpi-card"><span>Estrés alimentario</span><b>${Math.round(global.world.foodStress || 0)}%</b></div>
      <div class="kpi-card"><span>Inflación global</span><b>${Number(global.world.inflation || 0).toFixed(1)}%</b></div>
    </div>

    <h3>📦 Materias primas</h3>
    <div class="resource-grid">
      ${global.resources.map(r => `
        <div class="resource-card">
          <span>${r.icon}</span>
          <b>${r.name}</b>
          <small>${Number(r.price || 0).toFixed(2)} ${r.unit || ""}</small>
          <small class="${(r.trend || 0) >= 0 ? "good" : "bad"}">
            ${(r.trend || 0) >= 0 ? "▲" : "▼"} ${Math.abs(r.trend || 0).toFixed(2)}
          </small>
        </div>
      `).join("")}
    </div>

    <h3>🌍 Cronología</h3>
    <div class="event-list">
      ${events.map(e => renderEventRow(e)).join("") || "<p>Sin eventos todavía.</p>"}
    </div>
  `;
}

function renderEventRow(event) {
  return `
    <div class="event-row">
      <div class="event-icon">${event.icon || "🌐"}</div>
      <div>
        <b>${event.date || `Día ${event.day}, ${event.year}`}</b>
        <p>${event.message || event.name || ""}</p>
      </div>
    </div>
  `;
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 12
========================================================= */

window.renderEventsPanel = renderEventsPanel;
window.renderEventRow = renderEventRow;



/* =========================================================
   UI.JS v1
   BLOQUE 13/15
   Objetivos nacionales, logros y victoria
========================================================= */

function renderObjectivesPanel() {

    const panel =
        document.getElementById(
            "objectivesPanel"
        );

    if(!panel) return;

    const country =
        getSelectedCountry();

    const objectives =
        getObjectiveProgress(country);

    const victory =
        getVictoryStatus();

    const completed =
        objectives.filter(o=>o.completed).length;

    const percentage =
        Math.round(
            completed /
            Math.max(objectives.length,1)
            *100
        );

    panel.innerHTML=`

    <div class="panel-header">

        <h2>

            🎯 Objetivos Nacionales

        </h2>

        <button
            onclick="renderObjectivesPanel()">

            🔄 Actualizar

        </button>

    </div>

    <div class="kpi-grid">

        <div class="kpi-card">

            <span>

                Completados

            </span>

            <b>

                ${completed}/${objectives.length}

            </b>

        </div>

        <div class="kpi-card">

            <span>

                Progreso

            </span>

            <b>

                ${percentage}%

            </b>

        </div>

        <div class="kpi-card">

            <span>

                Tipo victoria

            </span>

            <b>

                ${victory.type || "—"}

            </b>

        </div>

        <div class="kpi-card">

            <span>

                Estado

            </span>

            <b>

                ${victory.achieved ?
                    "🏆 Victoria" :
                    "En progreso"}

            </b>

        </div>

    </div>

    <div id="objectiveCards"></div>

    <hr>

    <div id="victoryPanel"></div>

    `;

    renderObjectiveCards(
        objectives
    );

    renderVictoryPanel(
        victory
    );

}

/* ========================================================= */

function renderObjectiveCards(
    objectives
){

    const div=
        document.getElementById(
            "objectiveCards"
        );

    if(!div)return;

    div.innerHTML="";

    objectives.forEach(obj=>{

        div.innerHTML+=`

        <div class="objective-card
            ${obj.completed?
                "completed":
                ""}">

            <div>

                <h3>

                    ${obj.icon}

                    ${obj.name}

                </h3>

                <p>

                    ${obj.description}

                </p>

            </div>

            <div>

                ${
                    obj.completed ?

                    "✅"

                    :

                    "⏳"

                }

            </div>

        </div>

        `;

    });

}

/* ========================================================= */

function renderVictoryPanel(
    victory
){

    const div=
        document.getElementById(
            "victoryPanel"
        );

    if(!div)return;

    if(!victory.achieved){

        div.innerHTML=`

        <h3>

            🌍 Condiciones de victoria

        </h3>

        <ul>

            <li>
                Estar entre las 3 mayores economías.
            </li>

            <li>
                Ser una potencia militar.
            </li>

            <li>
                Mantener estabilidad superior al 70%.
            </li>

            <li>
                Completar la mayoría de objetivos nacionales.
            </li>

            <li>
                Evitar el colapso económico.
            </li>

        </ul>

        `;

        return;

    }

    div.innerHTML=`

        <div class="victory-box">

            <h2>

                🏆

                VICTORIA

            </h2>

            <h3>

                ${victory.type}

            </h3>

            <p>

                Año:

                ${victory.year}

            </p>

        </div>

    `;

}

/* ========================================================= */

function showAchievementNotification(
    title,
    description
){

    notify(

        "🏅",

        `${title} - ${description}`,

        "success"

    );

}

/* ========================================================= */

function showVictoryScreen(){

    const victory=
        getVictoryStatus();

    if(!victory.achieved)
        return;

    openModal(

        "🏆 Victoria",

        `

        <h2>

            ¡Has ganado!

        </h2>

        <p>

            Tipo:

            ${victory.type}

        </p>

        <p>

            Año:

            ${victory.year}

        </p>

        <button
            onclick="closeModal()">

            Continuar

        </button>

        `

    );

}

/* ========================================================= */

window.renderObjectivesPanel=
renderObjectivesPanel;

window.renderObjectiveCards=
renderObjectiveCards;

window.renderVictoryPanel=
renderVictoryPanel;

window.showAchievementNotification=
showAchievementNotification;

window.showVictoryScreen=
showVictoryScreen;


/* =========================================================
   UI.JS v1
   BLOQUE 14/15
   Configuración, guardado, carga, velocidad y debug.
========================================================= */

function renderSettingsPanel() {
  const panel = document.getElementById("settingsPanel");
  if (!panel) return;

  const status = getSimulationStatus();
  const perf = getSimulationPerformanceSummary();

  panel.innerHTML = `
    <div class="panel-header">
      <h2>⚙️ Configuración</h2>
      <button onclick="renderSettingsPanel()">🔄 Actualizar</button>
    </div>

    <h3>⏱️ Simulación</h3>
    <div class="actions-grid">
      <button onclick="hardStartSimulation()">▶️ Iniciar</button>
      <button onclick="hardPauseSimulation()">⏸️ Pausar</button>
      <button onclick="hardStepDay()">+1 día</button>
      <button onclick="hardStepMonth()">+1 mes</button>
      <button onclick="hardStepYear()">+1 año</button>
    </div>

    <label class="slider-row">
      <span>Velocidad actual: <b>x${status.speed}</b></span>
      <select onchange="setSpeedFromUI(this.value)">
        <option value="0.5" ${status.speed == 0.5 ? "selected" : ""}>0.5x</option>
        <option value="1" ${status.speed == 1 ? "selected" : ""}>1x</option>
        <option value="2" ${status.speed == 2 ? "selected" : ""}>2x</option>
        <option value="5" ${status.speed == 5 ? "selected" : ""}>5x</option>
        <option value="10" ${status.speed == 10 ? "selected" : ""}>10x</option>
      </select>
    </label>

    <h3>💾 Guardado</h3>
    <div class="actions-grid">
      <button onclick="saveGame('manual')">💾 Guardar</button>
      <button onclick="loadGame('manual')">📂 Cargar</button>
      <button onclick="exportGameToClipboard()">📤 Exportar JSON</button>
      <button onclick="openImportSaveModal()">📥 Importar JSON</button>
    </div>

    <h3>🧪 Debug</h3>
    <div class="actions-grid">
      <button onclick="toggleDebugMode()">🧪 Debug ON/OFF</button>
      <button onclick="repairSimulationState()">🛠️ Reparar estado</button>
      <button onclick="quickBalancePass()">⚖️ Balance rápido</button>
      <button onclick="grantPlayerFunds()">💶 Fondos</button>
      <button onclick="grantPlayerResearch()">🔬 Investigación</button>
      <button onclick="grantPlayerMilitary()">🛡️ Refuerzos</button>
      <button class="danger" onclick="resetSimulation()">♻️ Reiniciar</button>
    </div>

    <h3>📊 Estado técnico</h3>
    <div class="table-wrap">
      <table>
        <tr><th>Países</th><td>${perf.countries}</td></tr>
        <tr><th>Empresas</th><td>${perf.companies}</td></tr>
        <tr><th>Guerras activas</th><td>${perf.wars}</td></tr>
        <tr><th>Bloqueos</th><td>${perf.blockades}</td></tr>
        <tr><th>Eventos</th><td>${perf.events}</td></tr>
        <tr><th>Salud</th><td>${perf.health.ok ? "✅ OK" : "⚠️ Errores"}</td></tr>
      </table>
    </div>
  `;
}

function setSpeedFromUI(value) {
  setSimulationSpeed(Number(value));
  renderSettingsPanel();
  renderDashboard();
}

function openImportSaveModal() {
  openModal("Importar partida", `
    <textarea id="importSaveText" rows="12" placeholder="Pega aquí el JSON exportado"></textarea>
    <button onclick="importSaveFromUI()">📥 Importar</button>
  `);
}

function importSaveFromUI() {
  const raw = document.getElementById("importSaveText")?.value;
  if (!raw) return;

  importGameFromText(raw);
  closeModal();
  renderSettingsPanel();
  renderDashboard();
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 14
========================================================= */

window.renderSettingsPanel = renderSettingsPanel;
window.setSpeedFromUI = setSpeedFromUI;
window.openImportSaveModal = openImportSaveModal;
window.importSaveFromUI = importSaveFromUI;


/* =========================================================
   UI.JS v1
   BLOQUE 15/15
   Integración final, navegación, render inteligente y atajos.
========================================================= */

const PANEL_RENDERERS = {
  dashboard: renderDashboard,
  map: renderMap,
  cities: renderCitiesPanel,
  economy: renderEconomyPanel,
  industry: renderIndustryPanel,
  stock: renderStockMarketPanel,
  technology: renderTechnologyPanel,
  military: renderMilitaryPanel,
  diplomacy: renderDiplomacyPanel,
  spy: renderSpyPanel,
  events: renderEventsPanel,
  objectives: renderObjectivesPanel,
  settings: renderSettingsPanel
};

function renderActivePanel() {
  const id = NEXUS_UI.activePanel || "dashboard";
  PANEL_RENDERERS[id]?.();
}

function renderAllPanelsLight() {
  renderDashboard();
  renderActivePanel();
}

function navigateToPanel(panelId) {
  openPanel(panelId);
  renderActivePanel();
  saveUIPreferences();
}

function registerFinalUIEvents() {
  document.querySelectorAll("[data-panel]").forEach(btn => {
    btn.onclick = () => navigateToPanel(btn.dataset.panel);
  });

  document.addEventListener("keydown", event => {
    if (event.target?.tagName === "INPUT" || event.target?.tagName === "TEXTAREA") return;

    const keys = {
      "1": "dashboard",
      "2": "map",
      "3": "cities",
      "4": "economy",
      "5": "industry",
      "6": "stock",
      "7": "technology",
      "8": "military",
      "9": "diplomacy",
      "0": "settings"
    };

    if (keys[event.key]) navigateToPanel(keys[event.key]);
    if (event.code === "Space") NEXUS.simulation?.running ? hardPauseSimulation() : hardStartSimulation();
  });
}

const OLD_RENDER_SIMULATION_UI_FINAL = window.renderSimulation;

function renderSimulation() {
  renderAllPanelsLight();

  if (typeof OLD_RENDER_SIMULATION_UI_FINAL === "function") {
    try { OLD_RENDER_SIMULATION_UI_FINAL(); } catch(e) {}
  }
}

const OLD_INITIALIZE_UI_FINAL = window.initializeUI;

function initializeUI() {
  if (typeof OLD_INITIALIZE_UI_FINAL === "function") {
    try { OLD_INITIALIZE_UI_FINAL(); } catch(e) {}
  }

  registerFinalUIEvents();
  initializeMapUI?.();
  renderSimulation();
  notify("🚀", "Interfaz NEXUS cargada.", "success");
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 15
========================================================= */

window.PANEL_RENDERERS = PANEL_RENDERERS;
window.renderActivePanel = renderActivePanel;
window.renderAllPanelsLight = renderAllPanelsLight;
window.navigateToPanel = navigateToPanel;
window.registerFinalUIEvents = registerFinalUIEvents;
window.renderSimulation = renderSimulation;
window.initializeUI = initializeUI;




