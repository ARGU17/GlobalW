/* =========================================================
   NEXUS RTS — UI.JS
   Renderizado de interfaz:
   KPIs superiores, panel país, construcción, economía,
   eventos, selectores, botones y sincronización visual.
   ========================================================= */

"use strict";

/* =========================================================
   RENDER GLOBAL
========================================================= */

function renderAll() {
  renderTopBar();
  renderCountrySelector();
  renderCountryPanel();
  renderBuildPanel();
  renderEconomyPanel();
  renderEventsPanel();
  renderMapPanels();

  if (typeof renderLocalMap === "function") {
    renderLocalMap();
  }

  if (typeof updateWorldMapLayer === "function") {
    updateWorldMapLayer();
  }
}

/* =========================================================
   TOP BAR
========================================================= */

function renderTopBar() {
  const country = getSelectedCountry();

  renderGlobalKPIs(country);
  renderClock();
  renderSpeedButtons();
}

function renderGlobalKPIs(country) {
  const container = document.getElementById("global-kpis");

  if (!container || !country) return;

  const data = [
    {
      label: "💰 Tesorería",
      value: formatEuro(country.treasury),
      detail: `${formatEuro(calculateDailyFiscalBalance(country))}/día`
    },
    {
      label: "📊 PIB",
      value: formatEuro(country.gdp),
      detail: `${formatEuro(calculateDailyGDPDelta(country))}/día`
    },
    {
      label: "👥 Población",
      value: formatNumber(country.population),
      detail: `${formatNumber(calculateDailyPopulationDelta(country))}/día`
    },
    {
      label: "⚡ Energía",
      value: `${formatNumber(country.energyProduction)} MW`,
      detail: `Inst. ${formatNumber(country.installedPower)} MW`
    },
    {
      label: "🏭 Industria",
      value: `Nivel ${getIndustrialLevel(country)}`,
      detail: `Índice ${getIndustrialIndex(country).toFixed(1)}`
    },
    {
      label: "🛡️ Militar",
      value: formatNumber(country.military),
      detail: `Ranking ${country.powerRank || "-"}º`
    },
    {
      label: "🙂 Felicidad",
      value: `${country.happiness.toFixed(1)}/100`,
      detail: `${signed(calculateDailyHappinessDelta(country), 3)}/día`
    },
    {
      label: "🧱 Estabilidad",
      value: `${country.stability.toFixed(1)}/100`,
      detail: `${signed(calculateDailyStabilityDelta(country), 3)}/día`
    },
    {
      label: "🌿 CO₂ país",
      value: `${formatNumber(country.co2)} t`,
      detail: `Atm. ${getGlobalCO2PPM().toFixed(1)} ppm`
    },
    {
      label: "⚗️ Investigación",
      value: formatNumber(country.research),
      detail: `Cyber ${formatNumber(country.cyber)}`
    }
  ];

  container.innerHTML = data.map(item => `
    <div class="kpi">
      <div class="kpi-label">${item.label}</div>
      <div class="kpi-value">${item.value}</div>
      <div class="kpi-detail">${item.detail}</div>
    </div>
  `).join("");
}

function renderClock() {
  const date = document.getElementById("sim-date");
  const time = document.getElementById("sim-time");
  const status = document.getElementById("sim-status");
  const pauseButton = document.getElementById("pause-button");

  if (date) {
    date.textContent = getSimulationDateLabel();
  }

  if (time) {
    time.textContent = getSimulationTimeLabel();
  }

  if (status) {
    status.textContent =
      `Día ${getDayOfYear()} · Año ${getSimulationYear()} · ${NEXUS.paused ? "Pausado" : "En curso"}`;
  }

  if (pauseButton) {
    pauseButton.textContent = NEXUS.paused ? "▶" : "⏸";
  }
}

function renderSpeedButtons() {
  document.querySelectorAll("[data-speed]").forEach(button => {
    button.classList.toggle(
      "active",
      Number(button.dataset.speed) === Number(NEXUS.speed)
    );
  });
}

/* =========================================================
   SELECTOR DE PAÍS
========================================================= */

function renderCountrySelector() {
  const selector = document.getElementById("country-selector");

  if (!selector || !NEXUS.state?.countries) return;

  const currentValue = selector.value || NEXUS.selectedCountry;

  selector.innerHTML = NEXUS.state.countries
    .map(country => `
      <option value="${country.name}" ${country.name === NEXUS.selectedCountry ? "selected" : ""}>
        ${country.flag} ${country.name}
      </option>
    `)
    .join("");

  if (currentValue && NEXUS.state.countries.some(c => c.name === currentValue)) {
    selector.value = NEXUS.selectedCountry;
  }
}

/* =========================================================
   PANEL PAÍS
========================================================= */

function renderCountryPanel() {
  const container = document.getElementById("country-content");
  const country = getSelectedCountry();

  if (!container || !country) return;

  container.innerHTML = `
    <div class="country-header">
      <div class="country-flag">${country.flag}</div>
      <div>
        <h2 class="country-name">${country.name}</h2>
        <div class="country-capital">${country.capital}</div>
      </div>
    </div>

    <div class="tabs">
      <button class="active">Resumen</button>
      <button>Economía</button>
      <button>Población</button>
      <button>Militar</button>
      <button>Recursos</button>
    </div>

    <div class="card card-strong">
      <h3>Estado político</h3>
      ${dataRow("Gobierno", country.government)}
      ${dataRow("Ideología", country.ideology)}
      ${dataRow("Relación internacional", `${country.relation.toFixed(1)}/100`)}
      ${dataRow("Sanciones", formatNumber(country.sanctions))}
      ${dataRow("Riesgo de guerra", `${(country.warRisk || 0).toFixed(1)}/100`)}
    </div>

    <div class="card">
      <h3>Información general</h3>
      ${dataRow("Superficie", `${formatNumber(country.area)} km²`)}
      ${dataRow("Capital", country.capital)}
      ${dataRow("Población", formatNumber(country.population))}
      ${dataRow("Fuerza laboral", formatNumber(country.laborForce))}
      ${dataRow("Desempleo", formatNumber(country.unemployment))}
    </div>

    <div class="card">
      <h3>Economía</h3>
      ${dataRow("Tesorería", formatEuro(country.treasury))}
      ${dataRow("PIB nominal", formatEuro(country.gdp))}
      ${dataRow("PIB per cápita", formatEuro(country.gdpPerCapita))}
      ${dataRow("Deuda pública", formatEuro(country.debt))}
      ${dataRow("Reservas", formatEuro(country.reserves))}
      ${dataRow("Balanza comercial", formatEuro(country.balance))}
      ${dataRow("Importaciones", formatEuro(country.imports))}
      ${dataRow("Exportaciones", formatEuro(country.exports))}
      ${dataRow("Tipo fiscal efectivo", `${(country.taxRate * 100).toFixed(1)}%`)}
    </div>

    <div class="card">
      <h3>Recursos y energía</h3>
      ${dataRow("Producción eléctrica", `${formatNumber(country.energyProduction)} MW`)}
      ${dataRow("Potencia instalada", `${formatNumber(country.installedPower)} MW`)}
      ${dataRow("Demanda eléctrica", `${formatNumber(country.energyDemand)} MW`)}
      ${dataRow("Balance energético", `${formatNumber(country.energyProduction - country.energyDemand)} MW`)}
      ${dataRow("Producción alimentos", `${formatNumber(country.foodProduction)} t/día`)}
      ${dataRow("Agua disponible", `${formatNumber(country.waterProduction)} m³/día`)}
      ${dataRow("Emisiones CO₂", `${formatNumber(country.co2)} t`)}
      ${dataRow("Riesgo climático", `${country.climateRisk}/100`)}
    </div>

    <div class="card">
      <h3>Capacidades estratégicas</h3>
      ${dataRow("Poder militar", formatNumber(country.military))}
      ${dataRow("Ranking militar", `${country.powerRank || "-"}º`)}
      ${dataRow("Capacidad cyber", formatNumber(country.cyber))}
      ${dataRow("Investigación", formatNumber(country.research))}
    </div>

    <div class="card">
      <h3>Decisiones estratégicas</h3>
      <div class="button-grid">
        ${policyButton("stimulus", "📈 Estímulo", "250 M€")}
        ${policyButton("green", "🌱 Verde", "220 M€")}
        ${policyButton("military", "🛡 Rearme", "200 M€")}
        ${policyButton("research", "⚗️ I+D", "180 M€")}
        ${policyButton("taxup", "💶 Subir fiscalidad", "+tesoro")}
        ${policyButton("taxdown", "🧾 Bajar fiscalidad", "60 M€")}
      </div>
    </div>
  `;
}

function policyButton(id, title, detail) {
  return `
    <button class="action-button" data-policy="${id}">
      <strong>${title}</strong>
      <span>${detail}</span>
    </button>
  `;
}

/* =========================================================
   PANEL CONSTRUCCIÓN
========================================================= */

function renderBuildPanel() {
  const container = document.getElementById("build-content");
  const country = getSelectedCountry();

  if (!container || !country) return;

  const tabs = Object.keys(BUILDINGS)
    .map(category => `
      <button 
        data-build-tab="${category}" 
        class="${NEXUS.activeBuildTab === category ? "active" : ""}">
        ${getBuildCategoryName(category)}
      </button>
    `)
    .join("");

  const buildings = BUILDINGS[NEXUS.activeBuildTab] || [];

  const rows = buildings.map(building => {
    const defaultRegion = country.regions?.[0];
    const cost = getConstructionCost(building, defaultRegion);
    const days = getConstructionDuration(building, defaultRegion);

    return `
      <tr>
        <td>
          <strong>${building.icon} ${building.name}</strong><br>
          <span class="small">${building.effect}</span>
        </td>
        <td>${formatEuro(cost)}</td>
        <td>${days} días</td>
        <td>
          <select data-region-selector="${building.id}">
            ${country.regions.map(region => `
              <option value="${region.id}">
                ${region.name}
              </option>
            `).join("")}
          </select>
        </td>
        <td>
          <button class="success" data-building-id="${building.id}">
            Construir
          </button>
        </td>
      </tr>
    `;
  }).join("");

  container.innerHTML = `
    <div class="tabs">${tabs}</div>

    <div class="notice">
      La construcción se ejecuta sobre regiones reales o nodos operativos del país seleccionado.
      En España se utilizan ciudades y nodos como Madrid, Barcelona, Valencia, Bilbao, Gijón y Cádiz.
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Edificio</th>
            <th>Coste</th>
            <th>Tiempo</th>
            <th>Región</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <h3 class="section-title" style="margin-top:12px;">Cola de construcción</h3>
    ${renderConstructionQueue(country)}
  `;
}

function renderConstructionQueue(country) {
  if (!country.constructionQueue || country.constructionQueue.length === 0) {
    return `<div class="small">Sin construcciones activas.</div>`;
  }

  return country.constructionQueue.map(project => {
    const progress =
      100 * (1 - project.remainingDays / project.totalDays);

    return `
      <div class="queue-item">
        <div class="queue-item-header">
          <span class="queue-item-name">${project.icon} ${project.buildingName}</span>
          <span class="queue-item-days">${project.remainingDays}/${project.totalDays} días</span>
        </div>
        <div class="progress">
          <span style="width:${progress}%"></span>
        </div>
        <div class="small" style="margin-top:5px;">
          Coste ejecutado: ${formatEuro(project.cost)}
        </div>
      </div>
    `;
  }).join("");
}

function getBuildCategoryName(category) {
  const names = {
    residential: "Residencial",
    industries: "Industrias",
    infrastructure: "Infraestructura",
    energy: "Energía",
    parks: "Parques",
    military: "Militar"
  };

  return names[category] || category;
}

/* =========================================================
   PANEL ECONOMÍA
========================================================= */

function renderEconomyPanel() {
  const container = document.getElementById("economy-content");
  const country = getSelectedCountry();

  if (!container || !country) return;

  container.innerHTML = `
    <div class="card card-strong">
      <h3>Indicadores nacionales</h3>
      ${meter("Felicidad", country.happiness, 100)}
      ${meter("Estabilidad", country.stability, 100)}
      ${meter("Relación internacional", country.relation, 100)}
      ${meter("Riesgo climático", country.climateRisk, 100, true)}
      ${meter("Riesgo de guerra", country.warRisk || 0, 100, true)}
    </div>

    <div class="card">
      <h3>Balance diario</h3>
      ${dataRow("Balance fiscal", `${formatEuro(calculateDailyFiscalBalance(country))}/día`)}
      ${dataRow("Variación PIB", `${formatEuro(calculateDailyGDPDelta(country))}/día`)}
      ${dataRow("Variación población", `${formatNumber(calculateDailyPopulationDelta(country))}/día`)}
      ${dataRow("Variación CO₂", `${formatNumber(calculateDailyCO2Delta(country))} t/día`)}
      ${dataRow("CO₂ global", `${getGlobalCO2PPM().toFixed(2)} ppm`)}
      ${dataRow("Temp. global", `+${getGlobalTemperatureDelta().toFixed(2)} °C`)}
    </div>

    <div class="card">
      <h3>Bolsa nacional</h3>
      ${renderMarketRows()}
    </div>

    <div class="card">
      <h3>Ranking global</h3>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>País</th>
              <th>PIB</th>
              <th>Militar</th>
              <th>Estabilidad</th>
            </tr>
          </thead>
          <tbody>
            ${renderGlobalRankingRows()}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderMarketRows() {
  if (!NEXUS.state.market) return "";

  return NEXUS.state.market.map(asset => `
    <div class="market-row">
      <div>
        <div class="market-name">${asset.name}</div>
        <div class="market-sector">${asset.sector}</div>
      </div>
      <div class="market-price">${asset.price.toFixed(2)} €</div>
      <div class="${asset.delta >= 0 ? "market-delta-positive" : "market-delta-negative"}">
        ${asset.delta >= 0 ? "+" : ""}${asset.delta.toFixed(2)}%
      </div>
    </div>
  `).join("");
}

function renderGlobalRankingRows() {
  return [...NEXUS.state.countries]
    .sort((a, b) => b.gdp - a.gdp)
    .slice(0, 12)
    .map(country => `
      <tr>
        <td>${country.flag} ${country.name}</td>
        <td>${formatEuro(country.gdp)}</td>
        <td>${formatNumber(country.military)}</td>
        <td>${country.stability.toFixed(1)}</td>
      </tr>
    `)
    .join("");
}

/* =========================================================
   PANEL EVENTOS
========================================================= */

function renderEventsPanel() {
  const container = document.getElementById("events-content");

  if (!container) return;

  if (!NEXUS.state.events || NEXUS.state.events.length === 0) {
    container.innerHTML = `<div class="small">Sin eventos recientes.</div>`;
    return;
  }

  container.innerHTML = NEXUS.state.events.map(event => `
    <div class="event">
      <div class="event-icon">${event.icon}</div>
      <div class="event-time">${event.time}</div>
      <div class="event-message">${event.message}</div>
    </div>
  `).join("");
}

/* =========================================================
   MAP PANELS
========================================================= */

function renderMapPanels() {
  renderLayerButtonsState();
}

function renderLayerButtonsState() {
  document.querySelectorAll("[data-layer]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.layer === NEXUS.activeLayer
    );
  });
}

/* =========================================================
   HELPERS VISUALES
========================================================= */

function dataRow(label, value) {
  return `
    <div class="data-row">
      <span class="data-row-label">${label}</span>
      <span class="data-row-value">${value}</span>
    </div>
  `;
}

function meter(label, value, max = 100, dangerHigh = false) {
  const normalized = Math.max(0, Math.min(100, value / max * 100));

  let cls = "";

  if (dangerHigh) {
    if (normalized > 65) cls = "progress-danger";
    else if (normalized > 40) cls = "progress-warning";
  } else {
    if (normalized < 35) cls = "progress-danger";
    else if (normalized < 60) cls = "progress-warning";
  }

  return `
    <div class="meter">
      <div class="meter-header">
        <span class="meter-label">${label}</span>
        <span class="meter-value">${value.toFixed ? value.toFixed(1) : value}/${max}</span>
      </div>
      <div class="progress ${cls}">
        <span style="width:${normalized}%"></span>
      </div>
    </div>
  `;
}

function signed(value, decimals = 2) {
  const sign = value >= 0 ? "+" : "";
  return sign + value.toFixed(decimals);
}

function getIndustrialLevel(country) {
  return Math.max(1, Math.round(country.gdp / 400_000_000_000));
}

function getIndustrialIndex(country) {
  return country.gdp / country.population / 1000;
}

/* =========================================================
   INICIALIZACIÓN UI
========================================================= */

function initializeUI() {
  renderAll();
}

/* =========================================================
   EXPORT GLOBAL
========================================================= */

window.initializeUI = initializeUI;
window.renderAll = renderAll;

window.renderTopBar = renderTopBar;
window.renderGlobalKPIs = renderGlobalKPIs;
window.renderClock = renderClock;
window.renderSpeedButtons = renderSpeedButtons;

window.renderCountrySelector = renderCountrySelector;
window.renderCountryPanel = renderCountryPanel;
window.renderBuildPanel = renderBuildPanel;
window.renderEconomyPanel = renderEconomyPanel;
window.renderEventsPanel = renderEventsPanel;
window.renderMapPanels = renderMapPanels;

window.dataRow = dataRow;
window.meter = meter;
window.signed = signed;
window.getIndustrialLevel = getIndustrialLevel;
window.getIndustrialIndex = getIndustrialIndex;
