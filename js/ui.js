"use strict";

window.NEXUS_UI = (() => {
  let state;
  let actions = {};
  let bound = false;
  const fmt0 = n => new Intl.NumberFormat("es-ES", {maximumFractionDigits:0}).format(Number(n)||0);
  const fmt1 = n => new Intl.NumberFormat("es-ES", {minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(n)||0);
  const money = n => `${fmt1(n)} mil M€`;
  const pct = n => `${fmt1(n)}%`;
  const esc = value => String(value ?? "").replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));

  function initialize(nextState, nextActions) {
    state = nextState;
    actions = nextActions || {};
    bindGlobalControls();
    renderAll();
  }

  function bindGlobalControls() {
    if (bound) return;
    bound = true;
    document.addEventListener("click", event => {
      const nav = event.target.closest("[data-panel]");
      if (nav) { actions.setPanel?.(nav.dataset.panel); return; }
      const jump = event.target.closest("[data-panel-jump]");
      if (jump) { actions.setPanel?.(jump.dataset.panelJump); return; }
      const layer = event.target.closest("[data-map-layer]");
      if (layer) { actions.setMapLayer?.(layer.dataset.mapLayer); return; }
      const speed = event.target.closest("[data-speed]");
      if (speed) { actions.setSpeed?.(Number(speed.dataset.speed)); return; }
      const action = event.target.closest("[data-action]");
      if (action) handleAction(action.dataset.action, action.dataset);
    });
    document.getElementById("playPauseBtn")?.addEventListener("click", () => actions.toggleRun?.());
    document.getElementById("stepBtn")?.addEventListener("click", () => actions.stepMonth?.());
    document.getElementById("saveBtn")?.addEventListener("click", () => actions.save?.());
    document.getElementById("loadBtn")?.addEventListener("click", () => actions.load?.());
    document.getElementById("exportBtn")?.addEventListener("click", () => actions.exportSave?.());
    document.getElementById("menuSettingsBtn")?.addEventListener("click", () => actions.setPanel?.("settings"));
    document.getElementById("countryDetailsBtn")?.addEventListener("click", openCountryModal);
    document.getElementById("closeModalBtn")?.addEventListener("click", closeModal);
    document.getElementById("modalBackdrop")?.addEventListener("click", e => { if (e.target.id === "modalBackdrop") closeModal(); });
    document.getElementById("countrySelect")?.addEventListener("change", e => actions.selectCountry?.(e.target.value));
    document.addEventListener("input", event => {
      const budget = event.target.closest("[data-budget]");
      if (budget) { actions.updateBudget?.(budget.dataset.budget, Number(budget.value)); budget.parentElement.querySelector("output").textContent = `${budget.value}%`; }
      const tax = event.target.closest("[data-tax-rate]");
      if (tax) { actions.updateTaxRate?.(Number(tax.value)); tax.parentElement.querySelector("output").textContent = `${tax.value}%`; }
    });
    document.addEventListener("keydown", event => {
      if (["INPUT","TEXTAREA","SELECT"].includes(event.target.tagName)) return;
      if (event.code === "Space") { event.preventDefault(); actions.toggleRun?.(); }
      if (event.key === "1") actions.setSpeed?.(1);
      if (event.key === "2") actions.setSpeed?.(2);
      if (event.key === "4") actions.setSpeed?.(4);
      if (event.key.toLowerCase() === "s" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); actions.save?.(); }
    });
  }

  function handleAction(type, d) {
    const map = {
      invest: () => actions.investRegion?.(d.kind),
      build: () => actions.buildInRegion?.(d.buildingId),
      upgradeBuilding: () => actions.upgradeBuilding?.(d.buildingId),
      queueUnit: () => actions.queueUnit?.(d.unitId),
      startProject: () => actions.startProject?.(d.projectId),
      buyShares: () => actions.buyShares?.(d.companyId, Number(d.pct || 5)),
      sellShares: () => actions.sellShares?.(d.companyId, Number(d.pct || 5)),
      takeover: () => actions.takeover?.(d.companyId),
      diplomacy: () => actions.diplomacy?.(d.countryId, d.kind),
      operation: () => actions.operation?.(d.countryId, d.operationId),
      war: () => actions.war?.(d.countryId, d.kind),
      nuclear: () => actions.nuclearAlert?.(Number(d.delta || 0)),
      research: () => actions.startResearch?.(d.techId),
      policy: () => actions.enactPolicy?.(d.policyId),
      repair: () => actions.repair?.(),
      import: () => openImportModal(),
      reset: () => actions.reset?.(),
      closeModal: closeModal,
      doctrine: () => actions.setDoctrine?.(d.value),
      contextTab: () => { state.contextTab=d.value; renderContext(); }
    };
    map[type]?.();
  }

  function renderAll() {
    if (!state) return;
    renderTopBar();
    renderNavigation();
    renderCountrySelector();
    renderInspector();
    renderNationalSystems();
    renderResourceSummary();
    renderPanel();
    renderContext();
    renderMiniEvents();
    renderMarketTicker();
    renderSimulationStatus();
    window.NEXUS_MAP_ENGINE?.render();
  }

  function renderTopBar() {
    const c = NEXUS_ECONOMY.getCountry(state);
    set("currentDate", new Date(`${state.date}T00:00:00`).toLocaleDateString("es-ES", {month:"long",year:"numeric"}));
    set("selectedCountryLabel", `${c.flag} ${c.name}`);
    set("topTreasury", money(c.economy.treasury));
    set("topGDP", money(c.economy.gdp));
    set("topPopulation", `${fmt1(c.economy.population)} M`);
    set("topGrowth", pct(c.economy.growth));
    set("topStability", fmt1(c.systems.stability));
    set("topEnergy", fmt1(c.systems.energy));
    set("topTech", fmt1(c.systems.technology));
    set("topMilitary", fmt1(c.systems.military));
    set("topInfluence", fmt1(c.influence));
    const play = document.getElementById("playPauseBtn"); if (play) play.textContent = state.running ? "⏸" : "▶";
    document.querySelectorAll("[data-speed]").forEach(b => b.classList.toggle("active", Number(b.dataset.speed)===state.speed));
  }

  function renderNavigation() {
    document.querySelectorAll("[data-panel]").forEach(b => b.classList.toggle("active", b.dataset.panel === state.activePanel));
    document.querySelectorAll("[data-map-layer]").forEach(b => b.classList.toggle("active", b.dataset.mapLayer === state.mapLayer));
  }

  function renderCountrySelector() {
    const select=document.getElementById("countrySelect"); if(!select)return;
    select.innerHTML=state.countries.map(c=>`<option value="${c.id}" ${c.id===state.selectedCountryId?"selected":""}>${c.flag} ${esc(c.name)}</option>`).join("");
  }

  function renderInspector() {
    const c=NEXUS_ECONOMY.getCountry(state); const box=document.getElementById("countryInspector"); if(!box)return;
    const rank=[...state.countries].sort((a,b)=>b.economy.gdp-a.economy.gdp).findIndex(x=>x.id===c.id)+1;
    box.innerHTML=`<div class="country-hero"><div class="country-flag">${c.flag}</div><div><h2>${esc(c.name)}</h2><p>${esc(c.government.ideology)} · ${esc(c.militaryDoctrine)}</p></div></div>
      <div class="info-list">${info("Capital",c.id==="ESP"?"Madrid":c.name)}${info("Gobierno",c.government.regime)}${info("PIB mundial",`#${rank}`)}${info("PIB per cápita",`${fmt0(c.economy.gdp*1000/c.economy.population)} €`)}${info("Deuda",pct(c.economy.debtRatio))}${info("Rating",c.economy.rating)}${info("Inflación",pct(c.economy.inflation))}${info("Desempleo",pct(c.economy.unemployment))}${info("Balanza comercial",money(c.economy.tradeBalance))}${info("Legitimidad",pct(c.government.legitimacy))}</div>`;
  }

  function renderNationalSystems() {
    const c=NEXUS_ECONOMY.getCountry(state); const box=document.getElementById("nationalSystems"); if(!box)return;
    box.innerHTML=[["Industria",c.systems.industry],["Tecnología",c.systems.technology],["Logística",c.systems.logistics],["Energía",c.systems.energy],["Renovables",c.systems.renewables],["Militar",c.systems.military],["Inteligencia",c.systems.intelligence],["Aprobación",c.systems.approval]].map(([l,v])=>meterLine(l,v)).join("");
  }

  function renderResourceSummary() {
    const c=NEXUS_ECONOMY.getCountry(state); const box=document.getElementById("resourceSummary"); if(!box)return;
    box.innerHTML=`${resourceLine("⚡","Balance energético",`${fmt1(c.economy.energyBalance)} pts`,c.economy.energyBalance>=0)}${resourceLine("🌾","Balance alimentario",`${fmt1(c.economy.foodBalance)} pts`,c.economy.foodBalance>=0)}${resourceLine("🚢","Exportaciones",money(c.economy.exports),true)}${resourceLine("📦","Importaciones",money(c.economy.imports),false)}${resourceLine("🏦","Reservas",money(c.economy.reserves),true)}${resourceLine("⛽","Stock combustible",pct(c.strategicStockpile.fuel),c.strategicStockpile.fuel>55)}`;
  }

  function renderPanel() {
    const box=document.getElementById("mainPanel"); if(!box)return;
    const renderers={overview:renderOverview,economy:renderEconomy,regions:renderRegions,industry:renderIndustry,technology:renderTechnology,military:renderMilitary,diplomacy:renderDiplomacy,intelligence:renderIntelligence,objectives:renderObjectives,events:renderEvents,settings:renderSettings};
    box.innerHTML=(renderers[state.activePanel]||renderOverview)();
  }

  function renderOverview() {
    const c=NEXUS_ECONOMY.getCountry(state); const budget=NEXUS_ECONOMY.calculateDetailedBudget(c,state);
    return `${heading("Resumen estratégico",`${c.flag} ${c.name} · visión integral`, `<button data-action="policy" data-policy-id="industrial">Activar política industrial</button>`)}
      <div class="kpi-grid">${kpi("Crecimiento",pct(c.economy.growth),"Potencial estructural")}${kpi("Balance mensual",money(budget.monthlyBalance),budget.monthlyBalance>=0?"Superávit":"Déficit",budget.monthlyBalance>=0?"positive":"negative")}${kpi("Productividad",fmt1(c.economy.productivity),"Índice nacional")}${kpi("Inflación",pct(c.economy.inflation),"Objetivo 2%")}${kpi("Empleo",pct(100-c.economy.unemployment),"Tasa ocupación")}${kpi("Puntuación",fmt0(state.score),"Objetivos completados")}</div>
      <div class="dashboard-grid">
        <section class="card span-2"><div class="card-title"><h3>Evolución macroeconómica</h3><span>36 meses</span></div>${sparkline(c.history.gdp,"#42b9ff")}<div class="metric-row">PIB <b>${money(c.economy.gdp)}</b> · Deuda <b>${pct(c.economy.debtRatio)}</b> · Confianza <b>${pct(c.economy.confidence)}</b></div></section>
        <section class="card"><div class="card-title"><h3>Fortalezas</h3><span>Ventajas nacionales</span></div><ul class="feature-list">${c.strengths.map(x=>`<li><span>●</span>${esc(x)}</li>`).join("")}</ul><div class="card-title" style="margin-top:12px"><h3>Riesgos</h3></div><ul class="feature-list">${c.risks.map(x=>`<li><span class="warning">▲</span>${esc(x)}</li>`).join("")}</ul></section>
        <section class="card span-2"><div class="card-title"><h3>Proyectos nacionales</h3><span>Infraestructura y soberanía</span></div><div class="project-grid">${state.nationalProjects.map(projectCard).join("")}</div></section>
        <section class="card"><div class="card-title"><h3>Políticas activas</h3><span>${c.activePolicies.length}/6</span></div>${c.activePolicies.length?c.activePolicies.map(p=>{const d=NEXUS_CATALOG.policies.find(x=>x.id===p.policyId);return `<div class="info-row"><span>${d.icon} ${d.name}</span><b>${p.months}m</b></div>`}).join(""):`<p class="muted">No hay políticas temporales activas.</p>`}</section>
        <section class="card span-3"><div class="card-title"><h3>España territorial</h3><span>17 comunidades autónomas</span></div>${regionalMiniMap()}</section>
      </div>`;
  }

  function renderEconomy() {
    const c=NEXUS_ECONOMY.getCountry(state),d=NEXUS_ECONOMY.calculateDetailedBudget(c,state);
    return `${heading("Ministerio de Economía y Hacienda","Fiscalidad, gasto, deuda, comercio y sectores")}
      <div class="kpi-grid">${kpi("Ingresos/mes",money(d.monthlyRevenue),"Fiscal y empresarial")}${kpi("Gastos/mes",money(d.monthlySpending),"Ministerios y deuda")}${kpi("Balance",money(d.monthlyBalance),d.monthlyBalance>=0?"Superávit":"Déficit",d.monthlyBalance>=0?"positive":"negative")}${kpi("Deuda",pct(c.economy.debtRatio),c.economy.rating)}${kpi("Tipos",pct(c.economy.interestRate),"Coste monetario")}${kpi("Comercio",money(c.economy.tradeBalance),"Exportaciones - importaciones")}</div>
      <div class="economy-layout">
        <section class="card span-2"><div class="card-title"><h3>Presupuesto nacional</h3><span>% del PIB</span></div><div class="budget-grid">${Object.entries(c.budgets).map(([k,v])=>budgetSlider(k,v)).join("")}${taxSlider(c.economy.taxRate)}</div></section>
        <section class="card"><div class="card-title"><h3>Desglose fiscal anual</h3></div><div class="info-list">${info("IRPF y rentas",money(d.income))}${info("Sociedades",money(d.corporate))}${info("Consumo",money(d.consumption))}${info("Empresas controladas",money(d.controlled))}${info("Ministerios",money(d.ministries))}${info("Intereses deuda",money(d.debtService))}${info("Defensa operativa",money(d.militaryUpkeep))}</div></section>
        <section class="card span-2"><div class="card-title"><h3>Estructura productiva</h3><span>Índices sectoriales</span></div><div class="kpi-grid four">${Object.entries(c.sectors).slice(0,8).map(([k,v])=>kpi(sectorName(k),`${fmt1(v)}%`,"Peso/capacidad")).join("")}</div></section>
        <section class="card"><div class="card-title"><h3>Transmisión económica</h3></div>${systemMeter("Productividad",c.economy.productivity,"Industria, tecnología y logística")}${systemMeter("Confianza",c.economy.confidence,"Inversión y ciclo")}${systemMeter("Vivienda",100-c.economy.housingPressure,"Accesibilidad residencial")}${systemMeter("Gobierno",c.government.efficiency,"Eficiencia administrativa")}</section>
        <section class="card span-3"><div class="card-title"><h3>Históricos</h3><span>PIB · deuda · inflación · empleo</span></div><div class="kpi-grid four"><div>${sparkline(c.history.gdp,"#4abfff")}</div><div>${sparkline(c.history.debt,"#ffca62")}</div><div>${sparkline(c.history.inflation,"#ff7b88")}</div><div>${sparkline(c.history.unemployment,"#9f8cff")}</div></div></section>
      </div>`;
  }

  function renderRegions() {
    const region=NEXUS_ECONOMY.getRegion(state); const buildings=region.buildings.map(b=>({...b,def:NEXUS_CATALOG.buildings.find(d=>d.id===b.typeId)}));
    return `${heading("Administración territorial","Selecciona, invierte, construye y despliega capacidades")}
      <div class="region-layout"><aside class="region-list">${state.regions.map(r=>`<button class="region-item ${r.id===region.id?"active":""}" data-action="selectRegion" data-region-id="${r.id}" onclick="NEXUS_ACTIONS.selectRegion('${r.id}')"><b>${esc(r.name)}</b><small>${r.specialization}</small><strong>${money(r.gdp)}</strong></button>`).join("")}</aside>
      <section class="region-detail"><div class="panel-heading"><div><h2>${esc(region.name)}</h2><p>${esc(region.capital)} · ${esc(region.specialization)}</p></div><div class="panel-actions"><button data-action="invest" data-kind="infrastructure">Infraestructura</button><button data-action="invest" data-kind="industry">Industria</button><button data-action="invest" data-kind="energy">Energía</button><button data-action="invest" data-kind="stability">Cohesión</button></div></div>
      <div class="kpi-grid four">${kpi("PIB",money(region.gdp),`${fmt1(region.population)} M hab.`)}${kpi("Desempleo",pct(region.unemployment),"Mercado laboral")}${kpi("Aprobación",pct(region.approval),"Gobierno regional")}${kpi("Energía",`${fmt1(region.energySupply)}/${fmt1(region.energyDemand)}`,"Oferta / demanda")}</div>
      <div class="dashboard-grid"><section class="card"><div class="card-title"><h3>Capacidades</h3></div>${systemMeter("Infraestructura",region.infra,"Redes y transporte")}${systemMeter("Industria",region.industry,"Producción")}${systemMeter("Energía",region.energy,"Generación")}${systemMeter("Estabilidad",region.stability,"Cohesión")}${systemMeter("Defensa",region.defense,"Protección territorial")}</section>
      <section class="card span-2"><div class="card-title"><h3>Instalaciones</h3><span>${buildings.length} activas</span></div><div class="building-grid">${buildings.map(b=>buildingCard(b,region)).join("")}</div></section>
      <section class="card span-3"><div class="card-title"><h3>Construir nueva capacidad</h3><span>Tesorería ${money(NEXUS_ECONOMY.getCountry(state).economy.treasury)}</span></div><div class="building-grid">${NEXUS_CATALOG.buildings.map(buildCatalogCard).join("")}</div></section></div></section></div>`;
  }

  function renderIndustry() {
    const c=NEXUS_ECONOMY.getCountry(state); const foreign=state.companies.filter(x=>x.countryId!==c.id); const controlled=state.companies.filter(x=>x.ownership.player>=51);
    return `${heading("Industria, bolsa y control empresarial","Participaciones estatales, OPAs y cadenas estratégicas")}
      <div class="kpi-grid">${kpi("Empresas",fmt0(state.companies.length),"Cotizadas")}${kpi("Controladas",fmt0(controlled.length),"Participación ≥ 51%")}${kpi("Cartera",money(state.companies.reduce((s,x)=>s+x.marketCap*x.ownership.player/100,0)),"Valor de mercado")}${kpi("Industria",fmt1(c.systems.industry),"Capacidad")}${kpi("Exportaciones",money(c.economy.exports),"Anuales")}${kpi("Confianza",pct(c.economy.confidence),"Inversión")}</div>
      <div class="dashboard-grid"><section class="card span-3"><div class="card-title"><h3>Mercado corporativo</h3><span>Comprar, vender o lanzar OPA</span></div><div class="company-grid">${state.companies.map(companyCard).join("")}</div></section>
      <section class="card span-2"><div class="card-title"><h3>Materias primas</h3><span>Precios globales</span></div><div class="kpi-grid three">${state.resources.map(r=>kpi(`${r.icon} ${r.name}`,fmt1(r.price),`${r.trend>=0?"▲":"▼"} ${Math.abs(r.trend).toFixed(2)}%`,r.trend>=0?"positive":"negative")).join("")}</div></section>
      <section class="card"><div class="card-title"><h3>Empresas extranjeras</h3></div><div class="info-list">${foreign.slice(0,8).map(x=>info(x.name,`${x.ownership.player}%`)).join("")}</div></section></div>`;
  }

  function renderTechnology() {
    const c=NEXUS_ECONOMY.getCountry(state); const branches=[...new Set(NEXUS_CATALOG.technologies.map(t=>t.branch))]; const branch=state.research.selectedBranch||branches[0];
    return `${heading("Investigación y tecnología",`${fmt1(c.researchPoints)} puntos disponibles · ${c.completedTechs.length} completadas`)}
      <div class="branch-tabs">${branches.map(b=>`<button class="${b===branch?"active":""}" onclick="NEXUS_STATE.research.selectedBranch='${b}';NEXUS_UI.renderAll()">${b}</button>`).join("")}</div>
      <div class="tech-grid">${NEXUS_CATALOG.technologies.filter(t=>t.branch===branch).map(t=>techCard(t,c)).join("")}</div>
      <div class="dashboard-grid"><section class="card span-2"><div class="card-title"><h3>Cola de investigación</h3></div>${queueHTML(c.techQueue,"tech")}</section><section class="card"><div class="card-title"><h3>Capacidad científica</h3></div>${systemMeter("Tecnología",c.systems.technology,"Nivel nacional")}${systemMeter("Inteligencia",c.systems.intelligence,"Sensores y datos")}${systemMeter("Educación",Math.min(100,c.budgets.education*13),"Inversión educativa")}</section></div>`;
  }

  function renderMilitary() {
    const c=NEXUS_ECONOMY.getCountry(state); const power=c.units.reduce((sum,u)=>sum+(state.unitCatalog.find(d=>d.id===u.typeId)?.power||0)*u.readiness/100,0);
    return `${heading("Fuerzas Armadas",`${c.militaryDoctrine} · producción, despliegue y preparación`, `<select onchange="NEXUS_ACTIONS.setDoctrine(this.value)"><option>${c.militaryDoctrine}</option><option>Defensa territorial</option><option>Disuasión avanzada</option><option>Proyección expedicionaria</option></select>`)}
      <div class="kpi-grid">${kpi("Poder efectivo",fmt0(power),"Unidades desplegadas")}${kpi("Preparación",pct(c.militaryReadiness),"Promedio")}${kpi("Personal",fmt0(c.units.reduce((s,u)=>s+(state.unitCatalog.find(d=>d.id===u.typeId)?.manpower||0),0)),"Militares")}${kpi("Combustible",pct(c.strategicStockpile.fuel),"Reserva")}${kpi("Munición",pct(c.strategicStockpile.munitions),"Reserva")}${kpi("Nuclear",c.nuclear.warheads?`${fmt0(c.nuclear.warheads)} / A${c.nuclear.alert}`:"No nuclear",c.nuclear.doctrine)}</div>
      <div class="military-layout"><section class="card span-2"><div class="card-title"><h3>Catálogo de producción</h3><span>${state.unitCatalog.length} sistemas</span></div><div class="unit-catalog">${state.unitCatalog.map(unitCard).join("")}</div></section>
      <section class="card"><div class="card-title"><h3>Cola militar</h3></div>${queueHTML(c.productionQueue.filter(q=>q.kind==="unit"),"unit")}</section>
      <section class="card span-3"><div class="card-title"><h3>Unidades desplegadas</h3><span>${c.units.length} formaciones</span></div><div class="deployed-grid">${c.units.map(deployedUnit).join("")}</div></section>
      <section class="card span-2"><div class="card-title"><h3>Conflictos activos</h3><span>${state.wars.filter(w=>!w.ended).length}</span></div>${state.wars.filter(w=>!w.ended).length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Conflicto</th><th>Meses</th><th>War score</th></tr></thead><tbody>${state.wars.filter(w=>!w.ended).map(w=>`<tr><td>${NEXUS_ECONOMY.getCountry(state,w.attacker).name} vs ${NEXUS_ECONOMY.getCountry(state,w.defender).name}</td><td>${w.months}</td><td>${w.warScore}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">No hay guerras activas.</p>`}</section>
      <section class="card"><div class="card-title"><h3>Postura estratégica</h3></div>${c.nuclear.warheads?`<div class="action-list"><button data-action="nuclear" data-delta="1">☢️ Elevar alerta</button><button data-action="nuclear" data-delta="-1">🕊️ Reducir alerta</button></div>`:`<p class="muted">Sin arsenal nuclear.</p>`}${systemMeter("Agotamiento",c.warExhaustion,"Desgaste de guerra")}</section></div>`;
  }

  function renderDiplomacy() {
    const c=NEXUS_ECONOMY.getCountry(state); const others=state.countries.filter(x=>x.id!==c.id).sort((a,b)=>(c.relations[b.id]||0)-(c.relations[a.id]||0));
    return `${heading("Diplomacia y comercio internacional","Relaciones, alianzas, sanciones, ayuda y rutas comerciales")}
      <div class="kpi-grid four">${kpi("Influencia",fmt1(c.influence),"Poder blando")}${kpi("Tratados",fmt0(c.treaties.length),"Activos")}${kpi("Sanciones",fmt0(c.sanctionLevel),"Nivel recibido")}${kpi("Rutas",fmt0(state.tradeRoutes.filter(r=>r.a===c.id||r.b===c.id).length),"Comerciales")}</div>
      <div class="diplomacy-grid">${others.map(x=>diplomacyCard(x,c)).join("")}</div>
      <div class="dashboard-grid"><section class="card span-2"><div class="card-title"><h3>Rutas comerciales</h3></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Ruta</th><th>Volumen</th><th>Eficiencia</th><th>Riesgo</th></tr></thead><tbody>${state.tradeRoutes.map(r=>{const a=NEXUS_ECONOMY.getCountry(state,r.a),b=NEXUS_ECONOMY.getCountry(state,r.b);return `<tr><td>${a.flag} ${a.name} ↔ ${b.flag} ${b.name}</td><td>${fmt1(r.volume)}</td><td>${pct(r.efficiency)}</td><td>${pct(r.risk)}</td></tr>`}).join("")}</tbody></table></div></section><section class="card"><div class="card-title"><h3>Tratados</h3></div>${c.treaties.length?c.treaties.map(t=>info(t.type,NEXUS_ECONOMY.getCountry(state,t.partner)?.name||t.partner)).join(""):`<p class="muted">Sin tratados formales adicionales.</p>`}</section></div>`;
  }

  function renderIntelligence() {
    const c=NEXUS_ECONOMY.getCountry(state),others=state.countries.filter(x=>x.id!==c.id); const selected=others.find(x=>x.id===state.intelTarget)||others[0]; state.intelTarget=selected.id;
    return `${heading("Centro Nacional de Inteligencia","Reconocimiento, ciberoperaciones e influencia")}
      <div class="intel-layout"><section class="card"><div class="card-title"><h3>Objetivo</h3></div><select style="width:100%" onchange="NEXUS_STATE.intelTarget=this.value;NEXUS_UI.renderAll()">${others.map(x=>`<option value="${x.id}" ${x.id===selected.id?"selected":""}>${x.flag} ${x.name}</option>`).join("")}</select>${systemMeter("Capacidad propia",c.systems.intelligence,"Inteligencia")}${systemMeter("Defensa objetivo",selected.systems.intelligence,"Contrainteligencia")}<div class="info-list">${info("Relación",pct(c.relations[selected.id]||0))}${info("Riesgo diplomático",state.world.tension>55?"Alto":"Moderado")}</div></section>
      <section class="card span-2"><div class="card-title"><h3>Operaciones</h3><span>Coste y probabilidad variables</span></div><div class="building-grid">${NEXUS_CATALOG.operations.map(op=>operationCard(op,selected)).join("")}</div></section>
      <section class="card span-3"><div class="card-title"><h3>Informes disponibles</h3></div>${Object.keys(c.intelReports).length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>País</th><th>Fecha</th><th>PIB</th><th>Militar</th><th>Tecnología</th><th>Preparación</th></tr></thead><tbody>${Object.entries(c.intelReports).map(([id,r])=>`<tr><td>${NEXUS_ECONOMY.getCountry(state,id).name}</td><td>${r.date}</td><td>${money(r.gdp)}</td><td>${fmt1(r.military)}</td><td>${fmt1(r.technology)}</td><td>${pct(r.readiness)}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">Ejecuta reconocimiento estratégico para obtener informes.</p>`}</section></div>`;
  }

  function renderObjectives() {
    return `${heading("Objetivos nacionales","Condiciones estratégicas y puntuación",`<span class="score-badge">${state.score} pts</span>`)}<div class="objective-grid">${state.objectives.map(o=>`<article class="objective-card ${o.completed?"completed":""}"><h3>${o.icon} ${esc(o.name)}</h3><p>${esc(o.description)}</p><div class="info-row"><span>${o.completed?`Completado ${o.completedDate}`:"En progreso"}</span><b>+${o.reward}</b></div></article>`).join("")}</div>`;
  }

  function renderEvents() {
    return `${heading("Cronología mundial","Decisiones, crisis y evolución del sistema")}<div class="kpi-grid four">${kpi("Tensión mundial",pct(state.world.tension),"Seguridad")}${kpi("Estrés energético",pct(state.world.energyStress),"Mercados")}${kpi("Estrés alimentario",pct(state.world.foodStress),"Suministro")}${kpi("Clima",`${state.world.climate.toFixed(2)} °C`,"Anomalía")}</div><div class="event-list" style="margin-top:8px">${state.events.map(eventRow).join("")}</div>`;
  }

  function renderSettings() {
    return `${heading("Configuración y partida","Guardado local, importación y preferencias")}
      <div class="settings-grid"><section class="setting-card"><h3>Simulación</h3>${toggleSetting("autosave","Autoguardado",state.settings.autosave)}${toggleSetting("reducedMotion","Reducir animaciones",state.settings.reducedMotion)}${toggleSetting("denseUI","Interfaz compacta",state.settings.denseUI)}${toggleSetting("showMapLabels","Etiquetas del mapa",state.settings.showMapLabels)}</section>
      <section class="setting-card"><h3>Partida</h3><div class="action-list"><button data-action="repair">🛠️ Reparar estado</button><button data-action="import">📥 Importar guardado</button><button onclick="NEXUS_ACTIONS.exportSave()">📤 Exportar JSON</button><button class="danger-btn" data-action="reset">♻ Reiniciar campaña</button></div></section>
      <section class="setting-card"><h3>Controles</h3><div class="info-list">${info("Espacio","Pausa/continuar")}${info("1 / 2 / 4","Velocidad")}${info("Ctrl/Cmd + S","Guardar")}</div></section>
      <section class="setting-card"><h3>Integridad</h3><div class="info-list">${info("Versión",state.version)}${info("Países",state.countries.length)}${info("Regiones",state.regions.length)}${info("Empresas",state.companies.length)}${info("Unidades",state.countries.reduce((s,c)=>s+c.units.length,0))}</div></section></div>`;
  }

  function renderContext() {
    const box=document.getElementById("contextPanel"); if(!box)return; const c=NEXUS_ECONOMY.getCountry(state); const region=NEXUS_ECONOMY.getRegion(state);
    const tabs=`<div class="context-tabs"><button data-action="contextTab" data-value="actions" class="${state.contextTab==="actions"?"active":""}">Acciones</button><button data-action="contextTab" data-value="queue" class="${state.contextTab==="queue"?"active":""}">Colas</button><button data-action="contextTab" data-value="status" class="${state.contextTab==="status"?"active":""}">Estado</button></div>`;
    let html=tabs;
    if(state.contextTab==="queue") html+=queueHTML(c.productionQueue,"all")+queueHTML(c.techQueue,"tech");
    else if(state.contextTab==="status") html+=`${systemMeter("Tesorería",Math.min(100,c.economy.treasury/3),money(c.economy.treasury))}${systemMeter("Deuda",Math.max(0,100-c.economy.debtRatio/1.8),pct(c.economy.debtRatio))}${systemMeter("Legitimidad",c.government.legitimacy,"Gobierno")}${systemMeter("Preparación",c.militaryReadiness,"Fuerzas Armadas")}`;
    else if(state.activePanel==="regions") html+=NEXUS_CATALOG.buildings.slice(0,9).map(b=>actionCard(b.icon,b.name,b.description,`<button data-action="build" data-building-id="${b.id}">${money(b.cost)}</button>`)).join("");
    else if(state.selectedCountryId!=="ESP") {
      const player=state.countries.find(x=>x.id==="ESP");
      const conflict=state.wars.find(w=>!w.ended&&((w.attacker==="ESP"&&w.defender===c.id)||(w.defender==="ESP"&&w.attacker===c.id)));
      html+=actionCard("🤝","Acuerdo comercial",`Mejora relación y crecimiento.`,`<button data-action="diplomacy" data-country-id="${c.id}" data-kind="trade">Firmar</button>`)+actionCard("🛰️","Reconocimiento",`Obtén un informe estratégico.`,`<button data-action="operation" data-country-id="${c.id}" data-operation-id="intel">Ejecutar</button>`)+actionCard("⛔","Embargo",`Presión económica y diplomática.`,`<button data-action="diplomacy" data-country-id="${c.id}" data-kind="embargo">Aplicar</button>`)+actionCard("⚔️",conflict?"Negociar alto el fuego":"Declarar conflicto",conflict?`War score ${conflict.warScore}`:`Requiere relación hostil y preparación >55.`,`<button data-action="war" data-country-id="${c.id}" data-kind="${conflict?"ceasefire":"declare"}">${conflict?"Alto el fuego":"Declarar"}</button>`);
    }
    else html+=NEXUS_CATALOG.policies.map(p=>actionCard(p.icon,p.name,p.description,`<button data-action="policy" data-policy-id="${p.id}">${money(p.cost)}</button>`)).join("");
    box.innerHTML=html||`<p class="muted">Sin acciones disponibles.</p>`;
    set("contextTitle",state.activePanel==="regions"?region.name:c.name);
  }

  function renderMiniEvents(){const box=document.getElementById("miniEvents");if(!box)return;box.innerHTML=state.events.slice(0,6).map(e=>`<div class="mini-event"><span>${eventIcon(e.type)}</span><p>${esc(e.title)}</p><time>${e.date.slice(0,7)}</time></div>`).join("")}
  function renderMarketTicker(){const box=document.getElementById("marketTicker");if(!box)return;box.innerHTML=state.resources.slice(0,6).map(r=>`<div class="market-line"><span>${r.icon}</span><b>${r.name}</b><strong class="${r.trend>=0?"positive":"negative"}">${fmt1(r.price)} ${r.trend>=0?"▲":"▼"}</strong></div>`).join("")}
  function renderSimulationStatus(){set("gameStatus",state.running?`Simulación activa · x${state.speed}`:"Simulación pausada");set("scoreStatus",`Puntuación ${state.score}`)}

  function openCountryModal(){const c=NEXUS_ECONOMY.getCountry(state);openModal(`${c.flag} ${c.name}`,`<div class="kpi-grid four">${kpi("PIB",money(c.economy.gdp),"")}${kpi("Población",`${fmt1(c.economy.population)} M`,"")}${kpi("Influencia",fmt1(c.influence),"")}${kpi("Legitimidad",pct(c.government.legitimacy),"")}</div><div class="dashboard-grid"><section class="card"><div class="card-title"><h3>Gobierno</h3></div>${info("Régimen",c.government.regime)}${info("Ideología",c.government.ideology)}${info("Eficiencia",pct(c.government.efficiency))}${info("Corrupción",pct(c.government.corruption))}</section><section class="card span-2"><div class="card-title"><h3>Capacidades</h3></div><div class="kpi-grid four">${Object.entries(c.systems).slice(0,8).map(([k,v])=>kpi(systemName(k),fmt1(v),"")).join("")}</div></section></div>`)}
  function openModal(title,html){set("modalTitle",title);const c=document.getElementById("modalContent");if(c)c.innerHTML=html;const b=document.getElementById("modalBackdrop");if(b)b.hidden=false}
  function closeModal(){const b=document.getElementById("modalBackdrop");if(b)b.hidden=true}
  function openImportModal(){openModal("Importar partida",`<div class="form-grid"><label>Pega el JSON exportado<textarea id="importText" rows="14"></textarea></label><button onclick="NEXUS_ACTIONS.importSave(document.getElementById('importText').value)">Importar</button></div>`)}
  function toast(message,type="info"){const box=document.getElementById("toastContainer");if(!box)return;const el=document.createElement("div");el.className=`toast ${type}`;el.textContent=message;box.appendChild(el);setTimeout(()=>el.remove(),4300)}

  function regionalMiniMap(){return `<svg viewBox="50 90 760 510" style="width:100%;height:285px">${state.regions.map(r=>`<polygon points="${r.polygon}" fill="${regionColor(r)}" stroke="#d8f4ff" stroke-width="1" opacity=".94" onclick="NEXUS_ACTIONS.selectRegion('${r.id}')" style="cursor:pointer"><title>${r.name}</title></polygon>`).join("")}${state.regions.map(r=>{const p=center(r.polygon);return `<text x="${p.x}" y="${p.y}" text-anchor="middle" fill="#fff" font-size="8" font-weight="800" style="paint-order:stroke;stroke:#06101a;stroke-width:2">${shortRegion(r.name)}</text>`}).join("")}</svg>`}
  function projectCard(p){const c=NEXUS_ECONOMY.getCountry(state);const active=c.productionQueue.find(q=>q.projectId===p.id);const done=c.projects.includes(p.id)&&!active;return `<article class="project-card"><div><span class="project-icon">◆</span><h4>${esc(p.name)}</h4><p>${money(p.cost)} · ${p.months} meses</p>${active?progress(p.totalMonths||p.months,active.monthsRemaining):""}</div>${done?`<b class="positive">HECHO</b>`:active?`<b>${active.monthsRemaining}m</b>`:`<button data-action="startProject" data-project-id="${p.id}">Iniciar</button>`}</article>`}
  function buildingCard(b,r){return `<article class="building-card"><header><h3>${b.def?.icon||"🏢"} ${esc(b.def?.name||b.typeId)}</h3><b>N${b.level}</b></header><p>Condición ${pct(b.condition)} · ${esc(b.def?.description||"")}</p><footer><button data-action="upgradeBuilding" data-building-id="${b.id}">Mejorar</button></footer></article>`}
  function buildCatalogCard(b){return `<article class="building-card"><header><h3>${b.icon} ${esc(b.name)}</h3><b>${money(b.cost)}</b></header><p>${esc(b.description)}</p><footer><button data-action="build" data-building-id="${b.id}">Construir · ${b.months}m</button></footer></article>`}
  function companyCard(c){const owner=NEXUS_ECONOMY.getCountry(state,c.countryId);const controlled=c.ownership.player>=51;return `<article class="company-card ${controlled?"controlled":""}"><header><div><h3>${owner.flag} ${esc(c.name)}</h3><p>${esc(c.sector)}</p></div><b>${money(c.marketCap)}</b></header>${sparkline(c.history,c.ownership.player?"#55dc97":"#47b8ff")}<div class="kpi-grid three">${kpi("Precio",fmt1(c.price),"€/acc.")}${kpi("Participación",pct(c.ownership.player),controlled?"CONTROL":"Estado")}${kpi("Empleo",fmt0(c.employees),"personas")}</div><footer><button data-action="buyShares" data-company-id="${c.id}" data-pct="5">Comprar 5%</button><button data-action="sellShares" data-company-id="${c.id}" data-pct="5">Vender 5%</button><button data-action="takeover" data-company-id="${c.id}">OPA</button></footer></article>`}
  function techCard(t,c){const done=c.completedTechs.includes(t.id),active=c.techQueue.find(q=>q.techId===t.id),locked=t.requires.some(x=>!c.completedTechs.includes(x));return `<article class="tech-card ${locked?"locked":""}"><header><h3>${t.icon} ${esc(t.name)}</h3><b>${done?"✓":t.cost}</b></header><p>${esc(t.description)}</p><div class="info-row"><span>Duración</span><b>${t.months}m</b></div>${active?progress(active.totalMonths,active.monthsRemaining):done?`<b class="positive">COMPLETADA</b>`:`<button data-action="research" data-tech-id="${t.id}" ${locked?"disabled":""}>Investigar</button>`}</article>`}
  function unitCard(u){return `<article class="unit-card"><div class="unit-visual"><span>${u.category}</span><img src="${u.icon}" alt="${esc(u.name)}"></div><div class="unit-info"><h3>${esc(u.name)}</h3><p class="muted" style="font-size:8px">${esc(u.description||"")}</p><div class="unit-stats"><span>Ataque <b>${u.stats.attack}</b></span><span>Defensa <b>${u.stats.defense}</b></span><span>Alcance <b>${u.stats.range}</b></span><span>Movilidad <b>${u.stats.mobility}</b></span><span>Coste <b>${money(u.cost)}</b></span><span>Plazo <b>${u.months}m</b></span></div><button data-action="queueUnit" data-unit-id="${u.id}">Producir</button></div></article>`}
  function deployedUnit(u){const d=state.unitCatalog.find(x=>x.id===u.typeId),r=state.regions.find(x=>x.id===u.regionId);return `<article class="deployed-unit"><img src="${d?.icon}" alt=""><div><h4>${esc(u.name)}</h4><p>${r?.name||"Despliegue exterior"}</p><span>${pct(u.readiness)} · EXP ${fmt0(u.experience)}</span></div></article>`}
  function diplomacyCard(target,c){const rel=c.relations[target.id]||50;const conflict=state.wars.find(w=>!w.ended&&((w.attacker===c.id&&w.defender===target.id)||(w.attacker===target.id&&w.defender===c.id)));return `<article class="diplomacy-card"><header><div class="flag-large">${target.flag}</div><div><h3>${target.name}</h3><p>${target.ai.focus} · Influencia ${fmt1(target.influence)}</p></div><b class="${rel>=70?"positive":rel<40?"negative":"warning"}">${fmt1(rel)}</b></header><div class="meter"><i style="width:${rel}%"></i></div><footer><button data-action="diplomacy" data-country-id="${target.id}" data-kind="trade">Comercio</button><button data-action="diplomacy" data-country-id="${target.id}" data-kind="aid">Ayuda</button><button data-action="diplomacy" data-country-id="${target.id}" data-kind="alliance">Alianza</button><button data-action="diplomacy" data-country-id="${target.id}" data-kind="embargo">Embargo</button><button data-action="war" data-country-id="${target.id}" data-kind="${conflict?"ceasefire":"declare"}">${conflict?"Paz":"Guerra"}</button></footer></article>`}
  function operationCard(op,target){return `<article class="building-card"><header><h3>${op.icon} ${op.name}</h3><b>${money(op.cost)}</b></header><p>${op.description}</p><footer><button data-action="operation" data-country-id="${target.id}" data-operation-id="${op.id}">Ejecutar contra ${target.name}</button></footer></article>`}
  function queueHTML(queue,kind){if(!queue?.length)return `<div class="empty-state"><span>⌛</span><p>Sin proyectos activos.</p></div>`;return `<div class="queue-list">${queue.map(q=>`<div class="queue-item"><div><b>${q.name}</b><small>${q.monthsRemaining}m</small></div>${progress(q.totalMonths,q.monthsRemaining)}</div>`).join("")}</div>`}
  function eventRow(e){return `<article class="event-row"><div class="event-icon">${eventIcon(e.type)}</div><time>${e.date}</time><div><h4>${esc(e.title)}</h4><p>${esc(e.text)}</p></div></article>`}
  function actionCard(icon,title,text,button){return `<article class="action-card"><div class="icon">${icon}</div><div><h4>${esc(title)}</h4><p>${esc(text)}</p></div>${button}</article>`}
  function toggleSetting(key,label,value){return `<label class="info-row"><span>${label}</span><input type="checkbox" ${value?"checked":""} onchange="NEXUS_ACTIONS.updateSetting('${key}',this.checked)"></label>`}
  function budgetSlider(k,v){return `<div class="slider-card"><label><span>${budgetName(k)}</span><output>${v}%</output></label><input type="range" min="0.5" max="15" step="0.1" value="${v}" data-budget="${k}"></div>`}
  function taxSlider(v){return `<div class="slider-card"><label><span>Presión fiscal</span><output>${v}%</output></label><input type="range" min="10" max="52" step="0.5" value="${v}" data-tax-rate></div>`}
  function progress(total,remaining){const p=Math.max(0,Math.min(100,(1-remaining/Math.max(total,1))*100));return `<div class="progress"><i style="width:${p}%"></i></div>`}
  function sparkline(values,color="#47b8ff"){const arr=(values?.length?values:[0,1]);const min=Math.min(...arr),max=Math.max(...arr);const pts=arr.map((v,i)=>`${(i/(Math.max(1,arr.length-1))*300).toFixed(1)},${(100-(v-min)/Math.max(.0001,max-min)*82-9).toFixed(1)}`).join(" ");return `<svg class="sparkline" viewBox="0 0 300 110" preserveAspectRatio="none"><defs><linearGradient id="g${color.replace(/[^a-z0-9]/gi,'')}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><polyline points="0,108 ${pts} 300,108" fill="url(#g${color.replace(/[^a-z0-9]/gi,'')})" stroke="none"/><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`}
  function kpi(label,value,detail="",cls=""){return `<div class="kpi-card ${cls}"><span>${label}</span><b>${value}</b><small>${detail}</small></div>`}
  function heading(title,subtitle,actionsHTML=""){return `<div class="panel-heading"><div><h2>${title}</h2><p>${subtitle}</p></div><div class="panel-actions">${actionsHTML}</div></div>`}
  function info(label,value){return `<div class="info-row"><span>${label}</span><b>${value}</b></div>`}
  function meterLine(label,value){return `<div class="system-line"><span>${label}</span><b>${fmt1(value)}</b><div class="meter"><i style="width:${Math.max(0,Math.min(100,value))}%"></i></div></div>`}
  function systemMeter(label,value,detail){return `<div class="system-meter"><div><span>${label}</span><b>${fmt1(value)}</b></div><div class="meter"><i style="width:${Math.max(0,Math.min(100,value))}%"></i></div><small>${detail}</small></div>`}
  function resourceLine(icon,label,value,good){return `<div class="resource-line"><span>${icon}</span><b>${label}</b><strong class="${good?"positive":"warning"}">${value}</strong></div>`}
  function set(id,value){const el=document.getElementById(id);if(el)el.textContent=value}
  function center(points){const p=points.split(" ").map(x=>x.split(",").map(Number));return{x:p.reduce((s,x)=>s+x[0],0)/p.length,y:p.reduce((s,x)=>s+x[1],0)/p.length}}
  function regionColor(r){const v=(r.infra+r.industry+r.energy+r.stability)/4;return v>88?"#41d294":v>80?"#35a8c8":v>70?"#437bc0":"#695d88"}
  function shortRegion(n){return n.replace("Comunidad de ","").replace("Comunitat Valenciana","Valencia").replace("Castilla-La Mancha","C.-La Mancha").replace("Castilla y León","C. y León").replace("Región de ","")}
  function eventIcon(t){return({system:"⚙️",economy:"💶",energy:"⚡",social:"👥",diplomacy:"🤝",intel:"🛰️",military:"🛡️",project:"🏗️",region:"🗺️",market:"📈",technology:"🔬",policy:"🏛️",objective:"🎯",climate:"🌡️",defense:"⚔️",industry:"🏭"})[t]||"📰"}
  function budgetName(k){return({health:"Sanidad",education:"Educación",defense:"Defensa",infrastructure:"Infraestructura",research:"I+D",welfare:"Protección social"})[k]||k}
  function sectorName(k){return({services:"Servicios",industry:"Industria",public:"Sector público",agriculture:"Agricultura",construction:"Construcción",tourism:"Turismo",automotive:"Automoción",energy:"Energía",digital:"Digital",defense:"Defensa"})[k]||k}
  function systemName(k){return({industry:"Industria",technology:"Tecnología",logistics:"Logística",energy:"Energía",food:"Alimentos",military:"Militar",intelligence:"Inteligencia",stability:"Estabilidad",approval:"Aprobación",renewables:"Renovables"})[k]||k}

  return {initialize,renderAll,renderContext,toast,openModal,closeModal};
})();
