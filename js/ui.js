"use strict";

window.NEXUS_UI = (() => {
  let state;
  let actions;
  let bound = false;

  const money = value => `${Number(value).toLocaleString("es-ES", { maximumFractionDigits: 1 })} B€`;
  const number = value => Number(value).toLocaleString("es-ES", { maximumFractionDigits: 1 });
  const pct = value => `${Number(value).toFixed(1)}%`;

  function initialize(appState, actionHandlers) {
    state = appState;
    actions = actionHandlers;
    if (!bound) {
      bindNavigation();
      bindGlobalControls();
      bound = true;
    }
    renderAll();
  }

  function bindNavigation() {
    document.querySelectorAll("[data-panel]").forEach(button => {
      button.addEventListener("click", () => actions.setPanel(button.dataset.panel));
    });
  }

  function bindGlobalControls() {
    document.getElementById("playPauseBtn")?.addEventListener("click", actions.toggleRun);
    document.querySelectorAll("[data-speed]").forEach(button => button.addEventListener("click", () => actions.setSpeed(Number(button.dataset.speed))));
    document.getElementById("stepBtn")?.addEventListener("click", actions.stepMonth);
    document.getElementById("saveBtn")?.addEventListener("click", actions.save);
    document.getElementById("loadBtn")?.addEventListener("click", actions.load);
    document.getElementById("exportBtn")?.addEventListener("click", actions.exportSave);
    document.getElementById("importBtn")?.addEventListener("click", openImportModal);
    document.getElementById("worldModeBtn")?.addEventListener("click", () => actions.setMapMode("world"));
    document.getElementById("regionModeBtn")?.addEventListener("click", () => actions.setMapMode("regions"));
    document.getElementById("countrySelect")?.addEventListener("change", event => actions.selectCountry(event.target.value));
    document.getElementById("closeModalBtn")?.addEventListener("click", closeModal);
    document.getElementById("modalBackdrop")?.addEventListener("click", event => {
      if (event.target.id === "modalBackdrop") closeModal();
    });
  }

  function renderAll() {
    renderTopBar();
    renderNavigation();
    renderCountrySelector();
    renderPanel();
    renderContext();
    renderSimulationStatus();
  }

  function renderTopBar() {
    const country = NEXUS_ECONOMY.getCountry(state);
    document.getElementById("currentDate").textContent = new Date(`${state.date}T00:00:00`).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    document.getElementById("selectedCountryLabel").textContent = `${country.flag} ${country.name}`;
    document.getElementById("topTreasury").textContent = money(country.economy.treasury);
    document.getElementById("topGDP").textContent = money(country.economy.gdp);
    document.getElementById("topApproval").textContent = pct(country.systems.approval);
  }

  function renderNavigation() {
    document.querySelectorAll("[data-panel]").forEach(button => button.classList.toggle("active", button.dataset.panel === state.activePanel));
  }

  function renderCountrySelector() {
    const select = document.getElementById("countrySelect");
    select.innerHTML = state.countries.map(country => `<option value="${country.id}" ${country.id === state.selectedCountryId ? "selected" : ""}>${country.flag} ${country.name}</option>`).join("");
  }

  function renderSimulationStatus() {
    document.getElementById("playPauseBtn").textContent = state.running ? "⏸ Pausar" : "▶ Iniciar";
    document.querySelectorAll("[data-speed]").forEach(button => button.classList.toggle("active", Number(button.dataset.speed) === state.speed));
    document.getElementById("worldModeBtn").classList.toggle("active", state.mapMode === "world");
    document.getElementById("regionModeBtn").classList.toggle("active", state.mapMode === "regions");
  }

  function renderPanel() {
    const container = document.getElementById("mainPanel");
    const renderers = {
      overview: renderOverview,
      economy: renderEconomy,
      regions: renderRegions,
      industry: renderIndustry,
      military: renderMilitary,
      diplomacy: renderDiplomacy,
      events: renderEvents,
      settings: renderSettings
    };
    container.innerHTML = renderers[state.activePanel]?.() || renderOverview();
    bindPanelActions();
  }

  function renderOverview() {
    const country = NEXUS_ECONOMY.getCountry(state);
    const budget = NEXUS_ECONOMY.calculateBudget(country);
    const growth = NEXUS_ECONOMY.calculatePotentialGrowth(country);
    return `
      <div class="panel-heading">
        <div><span class="eyebrow">Centro de mando nacional</span><h2>${country.flag} ${country.name}</h2></div>
        <div class="status-badge strong">Escenario España reforzada</div>
      </div>
      <div class="kpi-grid six">
        ${kpi("PIB", money(country.economy.gdp), `${pct(country.economy.growth)} anual`, "good")}
        ${kpi("Tesorería", money(country.economy.treasury), budget.monthlyBalance >= 0 ? `+${money(budget.monthlyBalance)}/mes` : `${money(budget.monthlyBalance)}/mes`, budget.monthlyBalance >= 0 ? "good" : "bad")}
        ${kpi("Inflación", pct(country.economy.inflation), "Objetivo 2,0%", country.economy.inflation < 3.5 ? "good" : "warn")}
        ${kpi("Desempleo", pct(country.economy.unemployment), "Objetivo < 7%", country.economy.unemployment < 8 ? "good" : "warn")}
        ${kpi("Estabilidad", pct(country.systems.stability), "Gobernabilidad", "good")}
        ${kpi("Crecimiento potencial", pct(growth), "Según estructura actual", growth > 2 ? "good" : "warn")}
      </div>
      <div class="dashboard-grid">
        <section class="card span-2">
          <div class="card-title"><h3>Evolución del PIB</h3><span>Últimos ${country.history.gdp.length} meses</span></div>
          ${sparkline(country.history.gdp, "#57d7b3")}
          <div class="metric-row"><span>Industria <b>${country.systems.industry.toFixed(0)}</b></span><span>Tecnología <b>${country.systems.technology.toFixed(0)}</b></span><span>Logística <b>${country.systems.logistics.toFixed(0)}</b></span></div>
        </section>
        <section class="card">
          <div class="card-title"><h3>Fortalezas nacionales</h3><span>Ventajas estructurales</span></div>
          <ul class="feature-list">${country.strengths.map(item => `<li><span>◆</span>${item}</li>`).join("")}</ul>
        </section>
        <section class="card">
          <div class="card-title"><h3>Riesgos</h3><span>Áreas a vigilar</span></div>
          <ul class="feature-list risks">${country.risks.map(item => `<li><span>▲</span>${item}</li>`).join("")}</ul>
        </section>
        <section class="card span-2">
          <div class="card-title"><h3>Proyectos nacionales</h3><span>Transformación estructural</span></div>
          <div class="project-grid">${state.nationalProjects.map(project => projectCard(project, country)).join("")}</div>
        </section>
      </div>`;
  }

  function renderEconomy() {
    const country = NEXUS_ECONOMY.getCountry(state);
    const budget = NEXUS_ECONOMY.calculateBudget(country);
    return `
      <div class="panel-heading"><div><span class="eyebrow">Ministerio de Economía</span><h2>Política fiscal y presupuestaria</h2></div><div class="status-badge ${budget.annualBalance >= 0 ? "good" : "warn"}">${budget.annualBalance >= 0 ? "Superávit" : "Déficit"} ${money(Math.abs(budget.annualBalance))}</div></div>
      <div class="economy-layout">
        <section class="card">
          <div class="card-title"><h3>Presión fiscal</h3><span>${pct(country.economy.taxRate)}</span></div>
          ${slider("taxRate", country.economy.taxRate, 10, 52, 0.5, "Tipo efectivo nacional")}
          <div class="budget-summary">
            <div><span>Ingresos anuales</span><b>${money(budget.annualRevenue)}</b></div>
            <div><span>Gasto anual</span><b>${money(budget.annualSpending)}</b></div>
            <div><span>Servicio de deuda</span><b>${money(budget.debtService)}</b></div>
            <div><span>Deuda pública</span><b>${pct(country.economy.debtRatio)}</b></div>
          </div>
        </section>
        <section class="card span-2">
          <div class="card-title"><h3>Asignación presupuestaria</h3><span>% del PIB</span></div>
          <div class="budget-sliders">
            ${budgetSlider("health", "Sanidad", country.budgets.health, "❤️")}
            ${budgetSlider("education", "Educación", country.budgets.education, "🎓")}
            ${budgetSlider("defense", "Defensa", country.budgets.defense, "🛡")}
            ${budgetSlider("infrastructure", "Infraestructura", country.budgets.infrastructure, "▦")}
            ${budgetSlider("research", "I+D", country.budgets.research, "⌁")}
            ${budgetSlider("welfare", "Protección social", country.budgets.welfare, "◉")}
          </div>
        </section>
        <section class="card span-3">
          <div class="card-title"><h3>Indicadores de transmisión</h3><span>Cómo afectan las políticas</span></div>
          <div class="transmission-grid">
            ${systemMeter("Confianza empresarial", country.economy.confidence, "La inversión y el crecimiento reaccionan a fiscalidad, estabilidad e inflación.")}
            ${systemMeter("Capacidad industrial", country.systems.industry, "Impulsa exportaciones, producción militar y productividad.")}
            ${systemMeter("Autonomía energética", country.systems.energy, "Reduce inflación importada y mejora resiliencia.")}
            ${systemMeter("Innovación", country.systems.technology, "Eleva el crecimiento potencial y las empresas tecnológicas.")}
          </div>
        </section>
      </div>`;
  }

  function renderRegions() {
    const selected = NEXUS_ECONOMY.getRegion(state);
    return `
      <div class="panel-heading"><div><span class="eyebrow">Administración territorial</span><h2>Comunidades autónomas</h2></div><button class="primary-btn" data-map-regions>Ver mapa regional</button></div>
      <div class="region-layout">
        <div class="region-list">${state.regions.map(region => `<button class="region-list-item ${region.id === state.selectedRegionId ? "active" : ""}" data-select-region="${region.id}"><span><b>${region.name}</b><small>${region.specialization}</small></span><strong>${money(region.gdp)}</strong></button>`).join("")}</div>
        <section class="card region-detail">
          <div class="card-title"><h3>${selected.name}</h3><span>${selected.capital}</span></div>
          <div class="kpi-grid two">
            ${kpi("PIB regional", money(selected.gdp), `${number(selected.population)} M habitantes`, "good")}
            ${kpi("Especialización", selected.specialization, "Perfil productivo", "neutral")}
          </div>
          <div class="meter-stack">
            ${systemMeter("Infraestructura", selected.infra, "Carreteras, ferrocarril, puertos y nodos logísticos.")}
            ${systemMeter("Industria", selected.industry, "Capacidad manufacturera y de exportación.")}
            ${systemMeter("Energía", selected.energy, "Producción, redes y autonomía regional.")}
            ${systemMeter("Estabilidad", selected.stability, "Cohesión social y gobernabilidad.")}
          </div>
          <div class="action-grid four">
            <button data-invest-region="infrastructure">▦ Infraestructura<br><small>8 B€</small></button>
            <button data-invest-region="industry">🏭 Industria<br><small>10 B€</small></button>
            <button data-invest-region="energy">⚡ Energía<br><small>9 B€</small></button>
            <button data-invest-region="stability">◉ Cohesión<br><small>5 B€</small></button>
          </div>
        </section>
      </div>`;
  }

  function renderIndustry() {
    const country = NEXUS_ECONOMY.getCountry(state);
    return `
      <div class="panel-heading"><div><span class="eyebrow">Industria y capital</span><h2>Empresas estratégicas y OPAs</h2></div><div class="status-badge">Cartera estatal ${money(state.companies.reduce((sum, c) => sum + c.marketCap * c.ownership.player / 100, 0))}</div></div>
      <div class="company-grid">${state.companies.map(company => companyCard(company, country)).join("")}</div>`;
  }

  function renderMilitary() {
    const country = NEXUS_ECONOMY.getCountry(state);
    const upkeep = country.units.reduce((sum, unit) => sum + (state.unitCatalog.find(def => def.id === unit.typeId)?.upkeep || 0), 0);
    return `
      <div class="panel-heading"><div><span class="eyebrow">Ministerio de Defensa</span><h2>Producción y despliegue</h2></div><div class="status-badge strong">${country.units.length} unidades · ${money(upkeep)}/mes</div></div>
      <div class="military-layout">
        <section class="card span-2"><div class="card-title"><h3>Catálogo de unidades</h3><span>Aspecto visual y capacidad</span></div><div class="unit-catalog">${state.unitCatalog.map(unitCard).join("")}</div></section>
        <section class="card"><div class="card-title"><h3>Cola de producción</h3><span>${country.productionQueue.length} proyectos</span></div>${queueList(country)}</section>
        <section class="card span-3"><div class="card-title"><h3>Unidades desplegadas</h3><span>Selecciona regiones en el mapa</span></div><div class="deployed-grid">${country.units.map(unit => deployedUnit(unit)).join("")}</div></section>
      </div>`;
  }

  function renderDiplomacy() {
    const country = NEXUS_ECONOMY.getCountry(state);
    return `
      <div class="panel-heading"><div><span class="eyebrow">Relaciones exteriores</span><h2>Diplomacia e influencia</h2></div><div class="status-badge">Inteligencia ${country.systems.intelligence.toFixed(0)}</div></div>
      <div class="diplomacy-grid">${state.countries.filter(target => target.id !== country.id).map(target => diplomacyCard(country, target)).join("")}</div>`;
  }

  function renderEvents() {
    return `<div class="panel-heading"><div><span class="eyebrow">Sala de situación</span><h2>Eventos y decisiones</h2></div><div class="status-badge">${state.events.length} entradas</div></div><div class="timeline">${state.events.map(event => `<article class="timeline-item ${event.type}"><time>${new Date(`${event.date}T00:00:00`).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}</time><div><h3>${event.title}</h3><p>${event.text}</p></div></article>`).join("")}</div>`;
  }

  function renderSettings() {
    return `
      <div class="panel-heading"><div><span class="eyebrow">Sistema</span><h2>Guardado y configuración</h2></div><div class="status-badge strong">Alpha v1.0</div></div>
      <div class="settings-grid">
        <section class="card"><h3>Partida</h3><div class="action-grid"><button data-save>💾 Guardar</button><button data-load>📂 Cargar</button><button data-export>⇩ Exportar JSON</button><button data-import>⇧ Importar JSON</button></div></section>
        <section class="card"><h3>Simulación</h3><label class="toggle-row"><span>Autoguardado mensual</span><input type="checkbox" data-setting="autosave" ${state.settings.autosave ? "checked" : ""}></label><label class="toggle-row"><span>Reducir animaciones</span><input type="checkbox" data-setting="reducedMotion" ${state.settings.reducedMotion ? "checked" : ""}></label></section>
        <section class="card"><h3>Reiniciar</h3><p>Restablece el escenario España reforzada. Esta acción borra la campaña actual.</p><button class="danger-btn" data-reset>Reiniciar campaña</button></section>
      </div>`;
  }

  function renderContext() {
    const country = NEXUS_ECONOMY.getCountry(state);
    const region = NEXUS_ECONOMY.getRegion(state);
    document.getElementById("contextPanel").innerHTML = `
      <div class="context-flag">${country.flag}</div>
      <div><span class="eyebrow">País bajo control</span><h2>${country.name}</h2></div>
      <div class="context-kpis">
        <div><span>PIB</span><b>${money(country.economy.gdp)}</b></div>
        <div><span>Deuda</span><b>${pct(country.economy.debtRatio)}</b></div>
        <div><span>Militar</span><b>${country.systems.military.toFixed(0)}</b></div>
        <div><span>Tecnología</span><b>${country.systems.technology.toFixed(0)}</b></div>
      </div>
      <div class="context-section"><span class="eyebrow">Región activa</span><h3>${region.name}</h3><p>${region.specialization}</p><button class="secondary-btn full" data-open-regions>Gestionar región</button></div>
      <div class="context-section"><span class="eyebrow">Estado nacional</span>${compactMeter("Aprobación", country.systems.approval)}${compactMeter("Estabilidad", country.systems.stability)}${compactMeter("Energía", country.systems.energy)}${compactMeter("Logística", country.systems.logistics)}</div>`;
    document.querySelector("[data-open-regions]")?.addEventListener("click", () => actions.setPanel("regions"));
  }

  function bindPanelActions() {
    document.querySelectorAll("[data-budget]").forEach(input => input.addEventListener("input", event => {
      actions.updateBudget(event.target.dataset.budget, event.target.value);
      event.target.closest(".budget-control").querySelector("output").textContent = `${Number(event.target.value).toFixed(1)}%`;
    }));
    document.querySelector("[data-tax-rate]")?.addEventListener("input", event => {
      actions.updateTaxRate(event.target.value);
      event.target.closest(".budget-control").querySelector("output").textContent = `${Number(event.target.value).toFixed(1)}%`;
    });
    document.querySelectorAll("[data-select-region]").forEach(button => button.addEventListener("click", () => actions.selectRegion(button.dataset.selectRegion)));
    document.querySelector("[data-map-regions]")?.addEventListener("click", () => actions.setMapMode("regions"));
    document.querySelectorAll("[data-invest-region]").forEach(button => button.addEventListener("click", () => actions.investRegion(button.dataset.investRegion)));
    document.querySelectorAll("[data-queue-unit]").forEach(button => button.addEventListener("click", () => actions.queueUnit(button.dataset.queueUnit)));
    document.querySelectorAll("[data-start-project]").forEach(button => button.addEventListener("click", () => actions.startProject(button.dataset.startProject)));
    document.querySelectorAll("[data-buy-company]").forEach(button => button.addEventListener("click", () => actions.buyShares(button.dataset.buyCompany, 5)));
    document.querySelectorAll("[data-takeover]").forEach(button => button.addEventListener("click", () => actions.takeover(button.dataset.takeover)));
    document.querySelectorAll("[data-diplomacy]").forEach(button => button.addEventListener("click", () => actions.diplomacy(button.dataset.target, button.dataset.diplomacy)));
    document.querySelector("[data-save]")?.addEventListener("click", actions.save);
    document.querySelector("[data-load]")?.addEventListener("click", actions.load);
    document.querySelector("[data-export]")?.addEventListener("click", actions.exportSave);
    document.querySelector("[data-import]")?.addEventListener("click", openImportModal);
    document.querySelector("[data-reset]")?.addEventListener("click", actions.reset);
    document.querySelectorAll("[data-setting]").forEach(input => input.addEventListener("change", () => actions.updateSetting(input.dataset.setting, input.checked)));
  }

  function kpi(label, value, note, tone = "neutral") {
    return `<div class="kpi-card ${tone}"><span>${label}</span><b>${value}</b><small>${note}</small></div>`;
  }

  function slider(id, value, min, max, step, label) {
    return `<label class="budget-control"><span>${label}<output>${Number(value).toFixed(1)}%</output></span><input data-tax-rate id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
  }

  function budgetSlider(key, label, value, icon) {
    return `<label class="budget-control"><span><i>${icon}</i>${label}<output>${Number(value).toFixed(1)}%</output></span><input data-budget="${key}" type="range" min="0.5" max="15" step="0.1" value="${value}"></label>`;
  }

  function systemMeter(label, value, description) {
    return `<div class="system-meter"><div><span>${label}</span><b>${Number(value).toFixed(0)}</b></div><div class="meter"><i style="width:${Math.min(100, value)}%"></i></div><small>${description}</small></div>`;
  }

  function compactMeter(label, value) {
    return `<div class="compact-meter"><span>${label}</span><div class="meter"><i style="width:${value}%"></i></div><b>${Number(value).toFixed(0)}</b></div>`;
  }

  function sparkline(values, color) {
    const width = 520, height = 170, pad = 12;
    const min = Math.min(...values), max = Math.max(...values);
    const points = values.map((value, index) => {
      const x = pad + index * ((width - pad * 2) / Math.max(1, values.length - 1));
      const y = height - pad - ((value - min) / Math.max(1, max - min)) * (height - pad * 2);
      return `${x},${y}`;
    }).join(" ");
    return `<svg class="sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><polyline points="${points}" fill="none" stroke="${color}" stroke-width="4"/><polygon points="${points} ${width - pad},${height - pad} ${pad},${height - pad}" fill="url(#sparkFill)"/></svg>`;
  }

  function projectCard(project, country) {
    const queued = country.productionQueue.find(item => item.projectId === project.id);
    const completed = country.projects.includes(project.id) && !queued;
    return `<article class="project-card"><div><span class="project-icon">${project.id === "rail" ? "▦" : project.id === "chips" ? "⌁" : project.id === "energy" ? "⚡" : "🛡"}</span><h4>${project.name}</h4><p>${project.cost} B€ · ${project.months} meses</p></div>${queued ? `<div class="progress-wrap"><span>${queued.monthsRemaining} meses</span><div class="meter"><i style="width:${100 * (1 - queued.monthsRemaining / queued.totalMonths)}%"></i></div></div>` : completed ? `<span class="complete-tag">Completado</span>` : `<button class="secondary-btn" data-start-project="${project.id}">Iniciar</button>`}</article>`;
  }

  function companyCard(company, country) {
    const ownerCountry = state.countries.find(c => c.id === company.countryId);
    const controlled = company.ownership.player >= 51;
    return `<article class="company-card ${controlled ? "controlled" : ""}"><header><span>${ownerCountry?.flag || "🌐"}</span><div><h3>${company.name}</h3><p>${company.sector}</p></div></header>${sparkline(company.history, company.price >= company.history[0] ? "#57d7b3" : "#ff6f7d")}<div class="company-stats"><div><span>Precio</span><b>${company.price.toFixed(2)}€</b></div><div><span>Capitalización</span><b>${money(company.marketCap)}</b></div><div><span>Participación estatal</span><b>${company.ownership.player.toFixed(1)}%</b></div></div><footer><button data-buy-company="${company.id}">Comprar 5%</button><button class="primary-btn" data-takeover="${company.id}" ${controlled ? "disabled" : ""}>${controlled ? "Controlada" : "Lanzar OPA"}</button></footer></article>`;
  }

  function unitCard(unit) {
    return `<article class="unit-card"><div class="unit-visual"><img src="${unit.icon}" alt="${unit.name}"><span>${unit.category}</span></div><div class="unit-info"><h3>${unit.name}</h3><div class="unit-stats"><span>Potencia <b>${unit.power}</b></span><span>Coste <b>${unit.cost} B€</b></span><span>Plazo <b>${unit.months} m</b></span><span>Personal <b>${number(unit.manpower)}</b></span></div><button class="primary-btn full" data-queue-unit="${unit.id}">Crear en región activa</button></div></article>`;
  }

  function queueList(country) {
    if (!country.productionQueue.length) return `<div class="empty-state"><span>◌</span><p>No hay producción activa.</p></div>`;
    return `<div class="queue-list">${country.productionQueue.map(item => `<div class="queue-item"><div><b>${item.name}</b><small>${item.kind === "unit" ? "Unidad" : "Proyecto nacional"}</small></div><div class="progress-wrap"><span>${item.monthsRemaining} meses</span><div class="meter"><i style="width:${100 * (1 - item.monthsRemaining / item.totalMonths)}%"></i></div></div></div>`).join("")}</div>`;
  }

  function deployedUnit(unit) {
    const def = state.unitCatalog.find(item => item.id === unit.typeId);
    const region = state.regions.find(item => item.id === unit.regionId);
    return `<article class="deployed-unit"><img src="${def.icon}" alt="${def.name}"><div><h4>${unit.name}</h4><p>${region?.name || "Sin despliegue"}</p><span>Preparación ${unit.readiness.toFixed(0)}% · Experiencia ${unit.experience.toFixed(0)}%</span></div><div class="readiness-ring" style="--value:${unit.readiness}">${unit.strength.toFixed(0)}</div></article>`;
  }

  function diplomacyCard(country, target) {
    const relation = country.relations[target.id] ?? 50;
    const tone = relation >= 70 ? "good" : relation >= 45 ? "neutral" : "bad";
    return `<article class="diplomacy-card"><header><span class="flag-large">${target.flag}</span><div><h3>${target.name}</h3><p>Relación bilateral</p></div><b class="relation-score ${tone}">${relation.toFixed(0)}</b></header><div class="meter"><i style="width:${relation}%"></i></div><div class="diplomacy-stats"><span>PIB <b>${money(target.economy.gdp)}</b></span><span>Militar <b>${target.systems.military.toFixed(0)}</b></span></div><footer><button data-target="${target.id}" data-diplomacy="trade">Comercio</button><button data-target="${target.id}" data-diplomacy="aid">Ayuda</button><button data-target="${target.id}" data-diplomacy="intel">Inteligencia</button><button class="danger-lite" data-target="${target.id}" data-diplomacy="sanction">Sancionar</button></footer></article>`;
  }

  function openModal(title, html) {
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalContent").innerHTML = html;
    document.getElementById("modalBackdrop").hidden = false;
  }

  function closeModal() {
    document.getElementById("modalBackdrop").hidden = true;
  }

  function openImportModal() {
    openModal("Importar partida", `<p>Pega el JSON exportado:</p><textarea id="importText" class="import-area" rows="12"></textarea><button class="primary-btn full" id="confirmImport">Importar</button>`);
    document.getElementById("confirmImport").addEventListener("click", () => {
      const result = actions.importSave(document.getElementById("importText").value);
      if (result) closeModal();
    });
  }

  function toast(message, tone = "info") {
    const container = document.getElementById("toastContainer");
    const toastEl = document.createElement("div");
    toastEl.className = `toast ${tone}`;
    toastEl.textContent = message;
    container.appendChild(toastEl);
    setTimeout(() => toastEl.classList.add("show"), 10);
    setTimeout(() => {
      toastEl.classList.remove("show");
      setTimeout(() => toastEl.remove(), 250);
    }, 3200);
  }

  return { initialize, renderAll, renderPanel, renderContext, toast, openModal, closeModal };
})();
