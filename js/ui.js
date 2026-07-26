"use strict";

window.NEXUS_UI = (() => {
  let state;
  let actions = {};
  let bound = false;
  let diplomacyQuery = "";
  let clockTimer = null;

  const E = () => window.NEXUS_ECONOMY;
  const C = () => window.NEXUS_CATALOG;
  const P = () => window.NEXUS_POLITICS;
  const fmt0 = n => new Intl.NumberFormat("es-ES", {maximumFractionDigits:0}).format(Number(n)||0);
  const fmt1 = n => new Intl.NumberFormat("es-ES", {minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(n)||0);
  const money = n => `${fmt1(n)} mil M€`;
  const pct = n => `${fmt1(n)}%`;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const controlled = () => E().getCountry(state);
  const selected = () => E().getSelectedCountry ? E().getSelectedCountry(state) : state.countries.find(c=>c.id===state.selectedCountryId)||controlled();
  const buildingDef = id => C().buildings.find(b=>b.id===id);
  const unitDef = id => state.unitCatalog.find(u=>u.id===id);

  function initialize(nextState, nextActions) {
    state = nextState;
    actions = nextActions || {};
    bindGlobalControls();
    if(!clockTimer)clockTimer=setInterval(renderClock,200);
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
      if (action) { handleAction(action.dataset.action, action.dataset); return; }
    });
    document.addEventListener("change", event => {
      if (event.target.id === "countrySelect") actions.selectCountry?.(event.target.value);
      if (event.target.matches("[data-region-select]")) actions.selectRegion?.(event.target.value);
      if (event.target.matches("[data-doctrine]")) actions.setDoctrine?.(event.target.value);
      if (event.target.matches("[data-setting]")) actions.updateSetting?.(event.target.dataset.setting, event.target.checked);
    });
    document.addEventListener("input", event => {
      const budget = event.target.closest("[data-budget]");
      if (budget) { actions.updateBudget?.(budget.dataset.budget, Number(budget.value)); budget.parentElement.querySelector("output").textContent = `${budget.value}%`; }
      const tax = event.target.closest("[data-tax-rate]");
      if (tax) { actions.updateTaxRate?.(Number(tax.value)); tax.parentElement.querySelector("output").textContent = `${tax.value}%`; }
      if (event.target.id === "diplomacySearch") { diplomacyQuery=event.target.value.trim().toLowerCase(); renderPanel(); }
    });
    document.getElementById("playPauseBtn")?.addEventListener("click", () => actions.toggleRun?.());
    document.getElementById("stepBtn")?.addEventListener("click", () => actions.stepDay?.());
    document.getElementById("saveBtn")?.addEventListener("click", () => actions.save?.());
    document.getElementById("loadBtn")?.addEventListener("click", () => actions.load?.());
    document.getElementById("exportBtn")?.addEventListener("click", () => actions.exportSave?.());
    document.getElementById("menuSettingsBtn")?.addEventListener("click", () => actions.setPanel?.("settings"));
    document.getElementById("countryDetailsBtn")?.addEventListener("click", openCountryModal);
    document.getElementById("closeModalBtn")?.addEventListener("click", closeModal);
    document.getElementById("modalBackdrop")?.addEventListener("click", e => { if (e.target.id === "modalBackdrop") closeModal(); });
    document.addEventListener("keydown", event => {
      if (["INPUT","TEXTAREA","SELECT"].includes(event.target.tagName)) return;
      if (event.code === "Space") { event.preventDefault(); actions.toggleRun?.(); }
      if (["1","2","4"].includes(event.key)) actions.setSpeed?.(Number(event.key));
      if (event.key.toLowerCase() === "s" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); actions.save?.(); }
    });
  }

  function handleAction(type, d) {
    const handlers = {
      selectRegion: () => actions.selectRegion?.(d.regionId),
      build: () => actions.buildInRegion?.(d.buildingId),
      upgradeBuilding: () => actions.upgradeBuilding?.(d.buildingId),
      setBatch: () => actions.setUnitBatch?.(Number(d.value)),
      queueUnit: () => actions.queueUnit?.(d.unitId, Number(d.quantity || state.unitBatch || 1)),
      deployUnit: () => { const select=document.getElementById(`deploy-${d.unitId}`); actions.deployUnit?.(d.unitId,select?.value||state.selectedRegionId); },
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
      doctrine: () => actions.setDoctrine?.(d.value),
      takeControl: () => actions.takeControl?.(d.countryId),
      changeRegime: () => actions.changeRegime?.(d.regimeId),
      appointParty: () => actions.appointParty?.(d.partyId),
      callElection: () => actions.callElection?.(),
      repair: () => actions.repair?.(),
      import: openImportModal,
      reset: () => actions.reset?.(),
      contextTab: () => { state.contextTab=d.value; renderContext(); }
    };
    handlers[type]?.();
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
    renderMapRegionList();
    renderSimulationStatus();
    window.NEXUS_MAP_ENGINE?.render();
  }

  function renderTopBar() {
    const c = controlled();
    set("currentDate", new Date(`${state.date}T12:00:00Z`).toLocaleDateString("es-ES", {weekday:"short",day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}));
    set("selectedCountryLabel", `Control: ${c.flag} ${c.name}`);
    set("topTreasury", money(c.economy.treasury)); set("topGDP", money(c.economy.gdp)); set("topPopulation", `${fmt1(c.economy.population)} M`);
    set("topGrowth", pct(c.economy.growth)); set("topStability", fmt1(c.systems.stability)); set("topEnergy", fmt1(c.systems.energy)); set("topTech", fmt1(c.systems.technology)); set("topMilitary", fmt1(c.systems.military)); set("topGovernment", c.government.regime);
    const play=document.getElementById("playPauseBtn"); if(play)play.textContent=state.running?"⏸":"▶";
    document.querySelectorAll("[data-speed]").forEach(b=>b.classList.toggle("active",Number(b.dataset.speed)===state.speed));
    renderClock();renderTopResources();
  }

  function clockFraction(){
    const sim=state.simulation||{};let fraction=Number(sim.clockFraction)||0;
    if(state.running&&sim.clockAnchor)fraction+=(Date.now()-sim.clockAnchor)/(10000/Math.max(1,state.speed||1));
    return clamp(fraction,0,.999999);
  }
  function renderClock(){
    if(!state)return;const total=Math.floor(clockFraction()*86400),h=Math.floor(total/3600),m=Math.floor(total%3600/60),sec=total%60;
    set("currentTime",`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`);
  }
  function renderTopResources(){
    const box=document.getElementById("topResourceStrip");if(!box)return;const c=controlled(),balances=c.resourceBalance||{};
    box.innerHTML=(state.resourceDefinitions||E().resourceDefinitions||[]).map(def=>{const r=balances[def.id]||{production:0,consumption:0,balance:0,unit:def.unit};return `<div class="top-resource ${r.balance>=0?"surplus":"deficit"}" title="${esc(def.name)}: producción ${fmt1(r.production)} ${esc(r.unit)}, consumo ${fmt1(r.consumption)} ${esc(r.unit)}"><span>${def.icon}</span><div><b>${esc(def.name)}</b><small>${fmt1(r.production)} / ${fmt1(r.consumption)} ${esc(r.unit)}</small></div><strong>${r.balance>=0?"+":""}${fmt1(r.balance)}</strong></div>`}).join("");
  }

  function renderNavigation() {
    document.querySelectorAll("[data-panel]").forEach(b=>b.classList.toggle("active",b.dataset.panel===state.activePanel));
    document.querySelectorAll("[data-map-layer]").forEach(b=>b.classList.toggle("active",b.dataset.mapLayer===state.mapLayer));
  }

  function renderCountrySelector() {
    const select=document.getElementById("countrySelect"); if(!select)return;
    const sorted=[...state.countries].sort((a,b)=>a.name.localeCompare(b.name,"es"));
    select.innerHTML=sorted.map(c=>`<option value="${c.id}" ${c.id===state.selectedCountryId?"selected":""}>${c.flag} ${esc(c.name)}</option>`).join("");
  }

  function renderInspector() {
    const c=selected(), player=controlled(), box=document.getElementById("countryInspector"); if(!box)return;
    const rank=[...state.countries].sort((a,b)=>b.economy.gdp-a.economy.gdp).findIndex(x=>x.id===c.id)+1;
    const ruling=c.politics?.parties?.find(p=>p.id===c.politics.rulingPartyId);
    box.innerHTML=`<div class="country-hero"><div class="country-flag">${c.flag}</div><div><h2>${esc(c.name)}</h2><p>${esc(c.government.regime)}</p></div></div>
      <div class="control-badge ${c.id===player.id?"owned":"inspect"}">${c.id===player.id?"PAÍS CONTROLADO":"SOLO INSPECCIÓN"}</div>
      <div class="info-list">${info("Gobierno",ruling?.name||c.government.ideology)}${info("PIB mundial",`#${rank}`)}${info("PIB per cápita",`${fmt0(c.economy.gdp*1000/Math.max(.1,c.economy.population))} €`)}${info("Deuda",pct(c.economy.debtRatio))}${info("Inflación",pct(c.economy.inflation))}${info("Desempleo",pct(c.economy.unemployment))}${info("Preparación",pct(c.militaryReadiness))}</div>
      ${c.id!==player.id?`<button class="primary-btn full" data-action="takeControl" data-country-id="${c.id}">Tomar control de ${esc(c.name)}</button>`:""}`;
  }

  function renderNationalSystems() {
    const c=controlled(),box=document.getElementById("nationalSystems");if(!box)return;
    box.innerHTML=[["Industria",c.systems.industry],["Tecnología",c.systems.technology],["Logística",c.systems.logistics],["Energía",c.systems.energy],["Alimentos",c.systems.food],["Militar",c.systems.military],["Inteligencia",c.systems.intelligence],["Aprobación",c.systems.approval]].map(([l,v])=>meterLine(l,v)).join("");
  }

  function renderResourceSummary() {
    const c=controlled(),m=c.economicModel||{},box=document.getElementById("resourceSummary");if(!box)return;
    box.innerHTML=resourceLine("⚡","Oferta / demanda",`${fmt1(m.energySupply)} / ${fmt1(m.energyDemand)}`,m.energySupply>=m.energyDemand)+resourceLine("🏭","Uso industrial",pct(m.industrialUtilization||0),(m.industrialUtilization||0)>60)+resourceLine("🚢","Balanza comercial",money(c.economy.tradeBalance),c.economy.tradeBalance>=0)+resourceLine("⛽","Combustible",pct(c.strategicStockpile.fuel),c.strategicStockpile.fuel>50)+resourceLine("💥","Munición",pct(c.strategicStockpile.munitions),c.strategicStockpile.munitions>50);
  }

  function renderPanel() {
    const box=document.getElementById("mainPanel");if(!box)return;
    const renderers={overview:renderOverview,economy:renderEconomy,regions:renderRegions,industry:renderIndustry,stock:renderStock,politics:renderPolitics,technology:renderTechnology,military:renderMilitary,diplomacy:renderDiplomacy,intelligence:renderIntelligence,objectives:renderObjectives,events:renderEvents,settings:renderSettings};
    box.innerHTML=(renderers[state.activePanel]||renderOverview)();
  }

  function renderOverview() {
    const c=controlled(),s=selected(),budget=safeBudget(c),wars=state.wars.filter(w=>!w.ended);
    return `${heading("Centro de mando nacional",`${c.flag} ${c.name} · un día de juego cada 10 segundos a x1`,`<button data-panel-jump="economy">Abrir economía</button><button data-panel-jump="military">Abrir mando militar</button>`)}
      <div class="kpi-grid">${kpi("Crecimiento",pct(c.economy.growth),"Variación anual")}${kpi("Balance mensual",money(budget.monthlyBalance),budget.monthlyBalance>=0?"Superávit":"Déficit",budget.monthlyBalance>=0?"positive":"negative")}${kpi("Capacidad industrial",fmt1(c.economicModel?.capacityScore),`${fmt0(c.economicModel?.facilityJobs)} empleos`)}${kpi("Energía",`${fmt1(c.economicModel?.energySupply)}/${fmt1(c.economicModel?.energyDemand)}`,"Oferta / demanda")}${kpi("Preparación",pct(c.militaryReadiness),`${fmt0(totalUnits(c))} activos`)}${kpi("Guerras",fmt0(wars.length),"Conflictos mundiales")}</div>
      <div class="dashboard-grid">
        <section class="card span-2"><div class="card-title"><h3>Evolución del PIB</h3><span>Histórico mensual</span></div>${sparkline(c.history.gdp,"#42b9ff")}<div class="metric-row">PIB <b>${money(c.economy.gdp)}</b> · Deuda <b>${pct(c.economy.debtRatio)}</b> · Rating <b>${esc(c.economy.rating)}</b></div></section>
        <section class="card"><div class="card-title"><h3>País inspeccionado</h3><span>${s.id===c.id?"Controlado":"Exterior"}</span></div>${info("País",`${s.flag} ${s.name}`)}${info("PIB",money(s.economy.gdp))}${info("Régimen",s.government.regime)}${info("Relación",s.id===c.id?"—":fmt1(c.relations[s.id]??50))}${s.id!==c.id?`<button class="primary-btn full" data-action="takeControl" data-country-id="${s.id}">Cambiar país controlado</button>`:""}</section>
        <section class="card span-2"><div class="card-title"><h3>Infraestructura productiva</h3><span>Instalaciones únicas y ampliables</span></div>${facilitySummary(c)}</section>
        <section class="card"><div class="card-title"><h3>Gobierno</h3><span>${fmt1(c.politics.politicalCapital)} capital político</span></div>${info("Régimen",c.government.regime)}${info("Partido",partyName(c))}${info("Legitimidad",pct(c.government.legitimacy))}${info("Elecciones",c.politics.daysToElection<9000?`${fmt0(c.politics.daysToElection)} días`:"No competitivas")}</section>
        <section class="card span-3"><div class="card-title"><h3>Conflictos activos</h3><span>Resolución diaria</span></div>${wars.length?wars.map(warCompact).join(""):`<div class="empty-state"><span>🕊️</span><p>No hay guerras activas.</p></div>`}</section>
      </div>`;
  }

  function renderEconomy() {
    const c=controlled(),d=safeBudget(c),m=c.economicModel||{},labor=c.laborModel||{},productive=c.productiveModel||{};
    return `${heading("Economía nacional","Fiscalidad, gasto, deuda, capacidad productiva, empleo y comercio")}
      <div class="kpi-grid">${kpi("Ingresos / mes",money(d.monthlyRevenue),"Tesoro")}${kpi("Gasto / mes",money(d.monthlySpending),"Administración")}${kpi("Balance",money(d.monthlyBalance),d.monthlyBalance>=0?"Superávit":"Déficit",d.monthlyBalance>=0?"positive":"negative")}${kpi("Productividad",fmt1(c.economy.productivity),"Índice")}${kpi("Uso industrial",pct(m.industrialUtilization),"Capacidad utilizada")}${kpi("Dependencia exterior",pct(m.tradeDependency),"Importaciones / PIB")}${kpi("Empleo industrial",fmt0(m.facilityJobs||0),"puestos directos")}${kpi("Nuevos puestos",fmt0(labor.pendingJobs||labor.jobChange||0),"impacto mensual")}</div>
      <div class="economy-layout">
        <section class="card span-2"><div class="card-title"><h3>Presupuesto nacional</h3><span>% del PIB</span></div><div class="budget-grid">${Object.entries(c.budgets).map(([k,v])=>budgetSlider(k,v)).join("")}${taxSlider(c.economy.taxRate)}</div></section>
        <section class="card"><div class="card-title"><h3>Cuenta exterior</h3></div>${info("Exportaciones",money(c.economy.exports))}${info("Importaciones",money(c.economy.imports))}${info("Balanza",money(c.economy.tradeBalance))}${info("Reservas",money(c.economy.reserves))}${info("Tipo de interés",pct(c.economy.interestRate))}</section>
        <section class="card span-2"><div class="card-title"><h3>Modelo productivo</h3><span>La capacidad depende de instalaciones, energía, empleo y logística</span></div><div class="kpi-grid four">${kpi("Producción",fmt1(m.industrialOutput),"índice")}${kpi("Empleo directo",fmt0(m.facilityJobs),"puestos")}${kpi("Capacidad",fmt1(m.capacityScore),"puntos")}${kpi("Penalización",pct(m.shortagePenalty),"escasez")}</div><div class="sector-bars">${Object.entries(c.sectors).map(([k,v])=>meterLine(sectorName(k),v)).join("")}</div></section>
        <section class="card"><div class="card-title"><h3>Demografía y mercado laboral</h3><span>Actualización al cierre de cada mes</span></div>${info("Población",`${fmt1(c.economy.population)} M`)}${info("Desempleo",pct(c.economy.unemployment))}${info("Vacantes",fmt0(labor.jobVacancies||0))}${info("Migración neta anual",pct(labor.netMigrationAnnual||0))}${info("Crecimiento natural anual",pct(labor.naturalGrowthAnnual||0))}</section>
        <section class="card span-2"><div class="card-title"><h3>Transformación del modelo productivo</h3><span>Las ampliaciones industriales reequilibran los sectores</span></div><div class="sector-bars">${Object.entries(productive).filter(([,v])=>Number.isFinite(Number(v))).map(([k,v])=>meterLine(sectorName(k),v)).join("")}</div></section>
        <section class="card"><div class="card-title"><h3>Coherencia económica</h3></div><ul class="feature-list"><li><span>●</span>Una instalación de cada tipo por territorio.</li><li><span>●</span>Las ampliaciones aumentan nivel, capacidad, producción y empleo.</li><li><span>●</span>Infraestructura, energía y tecnología limitan proyectos.</li><li><span>●</span>Empleo, migración y población se recalculan mensualmente.</li></ul></section>
      </div>`;
  }

  function renderRegions() {
    const c=controlled();
    if(c.id!=="ESP") return renderNationalTerritory(c);
    const region=state.regions.find(r=>r.id===state.selectedRegionId)||state.regions[0];
    state.selectedRegionId=region.id;
    const used=region.buildings.reduce((s,b)=>s+(buildingDef(b.typeId)?.slots||1),0);
    return `${heading("Comunidades autónomas","Selecciona una región; instalaciones y unidades aparecen en el mapa al acercarte",`<select data-region-select>${state.regions.map(r=>`<option value="${r.id}" ${r.id===region.id?"selected":""}>${esc(r.name)}</option>`).join("")}</select>`)}
      <div class="region-layout"><div class="region-list">${state.regions.map(r=>`<button class="region-item ${r.id===region.id?"active":""}" data-action="selectRegion" data-region-id="${r.id}"><b>${esc(r.name)}</b><small>${fmt1(r.population)} M · PIB ${money(r.gdp)}</small><small>${esc(r.specialization)}</small></button>`).join("")}</div>
      <div class="region-detail"><div class="kpi-grid four">${kpi("PIB",money(region.gdp),region.capital)}${kpi("Infraestructura",fmt1(region.infra),"capacidad")}${kpi("Industria",fmt1(region.industry),"índice")}${kpi("Energía",fmt1(region.energy),"índice")}${kpi("Slots",`${used}/${region.capacitySlots}`,"ocupados")}${kpi("Desempleo",pct(region.unemployment),"regional")}${kpi("Estabilidad",pct(region.stability),"social")}${kpi("Defensa",fmt1(region.defense),"territorial")}${kpi("Empleo industrial",fmt0(region.directJobs||0),"puestos directos")}${kpi("Variación empleo",`${(region.employmentImpact||0)>=0?"+":""}${fmt0(region.employmentImpact||0)}`,"último cierre")}</div>
      <section class="card"><div class="card-title"><h3>Instalaciones de ${esc(region.name)}</h3><span>Marcadores visibles en el mapa</span></div><div class="building-grid">${region.buildings.length?region.buildings.map(facilityCard).join(""):`<p class="muted">No hay instalaciones.</p>`}</div></section>
      <section class="card"><div class="card-title"><h3>Nueva capacidad</h3><span>No se permiten duplicados absurdos; amplía niveles</span></div><div class="building-grid">${C().buildings.map(buildCard).join("")}</div></section></div></div>`;
  }

  function renderNationalTerritory(c) {
    const used=c.facilities.reduce((s,b)=>s+(buildingDef(b.typeId)?.slots||1),0);
    return `${heading(`Territorio nacional · ${c.flag} ${c.name}`,"Para países no españoles la capacidad se gestiona a escala nacional")}
      <div class="kpi-grid four">${kpi("Instalaciones",fmt0(c.facilities.length),"localizadas")}${kpi("Slots usados",fmt0(used),"nacionales")}${kpi("Logística",fmt1(c.systems.logistics),"requisito")}${kpi("Energía",fmt1(c.systems.energy),"requisito")}</div>
      <section class="card"><div class="card-title"><h3>Capacidad existente</h3><span>Visible al ampliar el mapa</span></div><div class="building-grid">${c.facilities.length?c.facilities.map(facilityCard).join(""):`<div class="empty-state"><span>🏗️</span><p>No hay instalaciones registradas.</p></div>`}</div></section>
      <section class="card"><div class="card-title"><h3>Planificación nacional</h3><span>Un proyecto único por tipo</span></div><div class="building-grid">${C().buildings.map(buildCard).join("")}</div></section>`;
  }

  function renderIndustry() {
    const c=controlled(),facilities=c.id==="ESP"?state.regions.flatMap(r=>r.buildings.map(b=>({...b,place:r.name}))):c.facilities.map(b=>({...b,place:c.name}));
    return `${heading("Industria, energía e infraestructuras","Capacidad física, empresas y proyectos en cola")}
      <div class="kpi-grid four">${kpi("Instalaciones",fmt0(facilities.length),"activas")}${kpi("Empleo directo",fmt0(c.economicModel.facilityJobs),"personas")}${kpi("Producción",fmt1(c.economicModel.industrialOutput),"índice")}${kpi("Utilización",pct(c.economicModel.industrialUtilization),"capacidad")}</div>
      <section class="card"><div class="card-title"><h3>Mapa de activos productivos</h3><span>Haz zoom para ver cada instalación</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Activo</th><th>Localización</th><th>Nivel</th><th>Capacidad</th><th>Empleo</th><th>Energía</th></tr></thead><tbody>${facilities.map(f=>{const d=buildingDef(f.typeId)||{};return `<tr><td>${d.icon||"🏢"} ${esc(d.name||f.typeId)}</td><td>${esc(f.place)}</td><td>${f.level||1}/${d.maxLevel||4}</td><td>${esc(d.capacity||"—")}</td><td>${fmt0((d.jobs||0)*(f.level||1))}</td><td>${(d.energy||0)*(f.level||1)>0?"+":""}${fmt1((d.energy||0)*(f.level||1))}</td></tr>`}).join("")}</tbody></table></div></section>
      <section class="card"><div class="card-title"><h3>Empresas estratégicas nacionales</h3><span>Mercado de capitales global</span></div><div class="company-grid">${state.companies.filter(x=>x.countryId===c.id).slice(0,8).map(companyCard).join("")||`<p class="muted">No hay empresas cotizadas nacionales en el escenario.</p>`}</div><button class="primary-btn" data-panel-jump="stock">Abrir Bolsa global</button></section>`;
  }

  function renderStock(){
    const c=controlled(),indices=state.market?.indices||{},companies=[...state.companies].sort((a,b)=>(b.marketCap||0)-(a.marketCap||0));
    const portfolio=companies.reduce((sum,x)=>sum+(x.marketCap||0)*(E().getHolding?.(state,x.id,c.id)||0)/100,0);
    const controlledCompanies=companies.filter(x=>(E().getHolding?.(state,x.id,c.id)||0)>=51).length;
    return `${heading("Bolsa y participaciones estratégicas","Empresas reales como referencia; precios y estados financieros completamente simulados",`<span class="simulation-badge">DATOS FICTICIOS · NO EN VIVO</span>`)}
      <div class="kpi-grid four">${kpi("Cartera pública",money(portfolio),"valor simulado")}${kpi("Empresas controladas",fmt0(controlledCompanies),"participación ≥51%")}${kpi("Sentimiento",fmt1(state.market?.sentiment||50),"0–100")}${kpi("Cotizadas",fmt0(companies.length),"mercado global")}</div>
      <section class="card"><div class="card-title"><h3>Índices simulados</h3><span>Actualización diaria</span></div><div class="market-index-grid">${Object.entries(indices).map(([name,x])=>`<article class="market-index"><span>${esc(name)}</span><b>${fmt1(x.value)}</b><strong class="${x.change>=0?"positive":"negative"}">${x.change>=0?"+":""}${fmt1(x.change)}%</strong>${sparkline(state.market?.history?.[name]||[x.value],x.change>=0?"#54dda1":"#ff6d7a")}</article>`).join("")}</div></section>
      <section class="card"><div class="card-title"><h3>Mercado global</h3><span>Compra, vende o lanza una OPA con la tesorería del país controlado</span></div><div class="company-grid stock-grid">${companies.map(companyCard).join("")}</div></section>`;
  }

  function renderPolitics() {
    const c=controlled(),reg=P().getRegime(c.politics.regimeId),ruling=c.politics.parties.find(p=>p.id===c.politics.rulingPartyId);
    return `${heading("Sistema político","Régimen, partidos, legitimidad y transición institucional",`<button data-action="callElection">Convocar elecciones</button>`)}
      <div class="kpi-grid four">${kpi("Régimen",reg.name,`Pluralismo ${reg.pluralism}`)}${kpi("Gobierno",ruling?.name||"—",ruling?.ideology||"")}${kpi("Capital político",fmt1(c.politics.politicalCapital),"0–100")}${kpi("Legitimidad",pct(c.government.legitimacy),"Gobierno")}</div>
      <div class="politics-layout"><section class="card"><div class="card-title"><h3>Partidos nacionales</h3><span>${c.politics.realPartyData?"Nombres reales · escenario simulado":"Estructura generada para simulación"}</span></div><div class="party-list">${c.politics.parties.sort((a,b)=>b.popularity-a.popularity).map(party=>partyCard(party,c)).join("")}</div></section>
      <section class="card span-2"><div class="card-title"><h3>Cambiar régimen</h3><span>Coste político y transición de estabilidad</span></div><div class="regime-grid">${P().regimes.map(r=>regimeCard(r,c)).join("")}</div></section></div>`;
  }

  function renderTechnology() {
    const c=controlled(),branches=[...new Set(C().technologies.map(t=>t.branch))];
    return `${heading("Investigación y soberanía tecnológica",`${C().technologies.length} tecnologías en ${branches.length} ramas`)}
      <div class="kpi-grid four">${kpi("Puntos I+D",fmt0(c.researchPoints),"disponibles")}${kpi("Completadas",fmt0(c.completedTechs.length),"tecnologías")}${kpi("En curso",fmt0(c.techQueue.length),"proyectos")}${kpi("Nivel nacional",fmt1(c.systems.technology),"capacidad")}</div>
      ${branches.map(branch=>`<section class="card"><div class="card-title"><h3>${esc(branch)}</h3><span>${C().technologies.filter(t=>t.branch===branch).length} tecnologías</span></div><div class="tech-grid">${C().technologies.filter(t=>t.branch===branch).map(t=>techCard(t,c)).join("")}</div></section>`).join("")}`;
  }

  function renderMilitary() {
    const c=controlled(),activeWars=state.wars.filter(w=>!w.ended),batch=state.unitBatch||1;
    return `${heading("Mando de Fuerzas Armadas","Producción por cantidades reales, despliegue geográfico y guerra diaria")}
      <div class="kpi-grid four">${kpi("Efectivos y material",fmt0(totalUnits(c)),"cantidad total")}${kpi("Preparación",pct(c.militaryReadiness),"nacional")}${kpi("Doctrina",c.militaryDoctrine,"operativa")}${kpi("Agotamiento",pct(c.warExhaustion),"de guerra")}</div>
      <section class="card"><div class="card-title"><h3>Multiplicador de producción</h3><span>Pedido actual x${batch}</span></div><div class="batch-controls">${[1,10,100,1000].map(v=>`<button data-action="setBatch" data-value="${v}" class="${v===batch?"active":""}">x${v}</button>`).join("")}</div><div class="unit-catalog">${state.unitCatalog.map(u=>unitCard(u,batch)).join("")}</div></section>
      <section class="card"><div class="card-title"><h3>Unidades desplegadas</h3><span>Se muestran en el mapa al hacer zoom</span></div><div class="deployed-grid">${c.units.filter(u=>u.quantity>0).map(deployedUnit).join("")}</div></section>
      <section class="card"><div class="card-title"><h3>Cola de producción</h3><span>Días restantes</span></div>${queueHTML(c.productionQueue)}</section>
      <section class="card"><div class="card-title"><h3>Centro de guerra</h3><span>${activeWars.length} conflictos activos</span></div>${activeWars.length?activeWars.map(warCard).join(""):`<div class="empty-state"><span>🕊️</span><p>Selecciona un país hostil y declara la guerra desde Diplomacia.</p></div>`}</section>`;
  }

  function renderDiplomacy() {
    const c=controlled(),sel=selected();
    const routes=(state.tradeRoutes||[]).filter(r=>r.active!==false&&r.countries?.includes(c.id));
    let others=state.countries.filter(x=>x.id!==c.id);
    if(diplomacyQuery)others=others.filter(x=>`${x.name} ${x.id}`.toLowerCase().includes(diplomacyQuery));
    others.sort((a,b)=>(c.relations[b.id]??50)-(c.relations[a.id]??50));
    const featured=others.slice(0,36);
    return `${heading("Diplomacia mundial","197 entidades soberanas, relaciones, comercio, sanciones y guerra",`<input id="diplomacySearch" value="${esc(diplomacyQuery)}" placeholder="Buscar país…">`)}
      <section class="card selected-diplomacy"><div class="country-hero"><div class="country-flag">${sel.flag}</div><div><h2>${esc(sel.name)}</h2><p>${esc(sel.government.regime)} · Relación ${sel.id===c.id?"—":fmt1(c.relations[sel.id]??50)}</p></div></div>${sel.id!==c.id?diplomacyActions(sel,c):`<p class="muted">Este es el país controlado.</p>`}</section>
      <section class="card"><div class="card-title"><h3>🚢 Corredores comerciales marítimos</h3><span>${routes.reduce((sum,r)=>sum+(r.ships?.length||0),0)} buques operativos</span></div><div class="trade-route-grid">${routes.length?routes.map(r=>tradeRouteCard(r,c)).join(""):`<p class="muted">Firma un acuerdo comercial para activar una ruta y asignar buques de suministro.</p>`}</div></section>
      <div class="diplomacy-grid">${featured.map(x=>diplomacyCard(x,c)).join("")}</div>${others.length>featured.length?`<p class="muted center">Mostrando ${featured.length} de ${others.length}. Usa la búsqueda para localizar cualquier país.</p>`:""}`;
  }

  function renderIntelligence() {
    const c=controlled(),target=selected().id===c.id?state.countries.find(x=>x.id!==c.id):selected();
    return `${heading("Inteligencia estratégica","Reconocimiento, influencia, sabotaje y ciberoperaciones")}
      <div class="intel-layout"><section class="card"><div class="country-hero"><div class="country-flag">${target.flag}</div><div><h2>${esc(target.name)}</h2><p>Objetivo seleccionado en mapa</p></div></div>${systemMeter("Capacidad propia",c.systems.intelligence,"Inteligencia")}${systemMeter("Defensa objetivo",target.systems.intelligence,"Contrainteligencia")}${info("Relación",fmt1(c.relations[target.id]??50))}</section>
      <section class="card span-2"><div class="card-title"><h3>Operaciones</h3><span>El riesgo depende de ambas capacidades</span></div><div class="building-grid">${C().operations.map(op=>operationCard(op,target)).join("")}</div></section>
      <section class="card span-3"><div class="card-title"><h3>Informes</h3></div>${Object.keys(c.intelReports).length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>País</th><th>Fecha</th><th>PIB</th><th>Militar</th><th>Tecnología</th></tr></thead><tbody>${Object.entries(c.intelReports).map(([id,r])=>`<tr><td>${esc(E().getCountry(state,id)?.name||id)}</td><td>${r.date}</td><td>${money(r.gdp)}</td><td>${fmt1(r.military)}</td><td>${fmt1(r.technology)}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">Aún no hay informes.</p>`}</section></div>`;
  }

  function renderObjectives() {
    return `${heading("Objetivos nacionales","Hitos, recompensas y puntuación",`<span class="score-badge">${state.score} pts</span>`)}<div class="objective-grid">${state.objectives.map(o=>`<article class="objective-card ${o.completed?"completed":""}"><h3>${o.icon} ${esc(o.name)}</h3><p>${esc(o.description)}</p><div class="info-row"><span>${o.completed?`Completado ${o.completedDate}`:"En progreso"}</span><b>+${o.reward}</b></div></article>`).join("")}</div>`;
  }

  function renderEvents() {
    return `${heading("Cronología mundial","Economía, política, producción y batallas por día")}<div class="kpi-grid four">${kpi("Tensión",pct(state.world.tension),"mundial")}${kpi("Energía",pct(state.world.energyStress),"estrés")}${kpi("Alimentos",pct(state.world.foodStress),"estrés")}${kpi("Guerras",fmt0(state.wars.filter(w=>!w.ended).length),"activas")}</div><div class="event-list">${state.events.slice(0,160).map(eventRow).join("")}</div>`;
  }

  function renderSettings() {
    return `${heading("Configuración y partida","Guardado local, importación y preferencias")}
      <div class="settings-grid"><section class="setting-card"><h3>Simulación</h3>${toggleSetting("autosave","Autoguardado semanal",state.settings.autosave)}${toggleSetting("reducedMotion","Reducir animaciones",state.settings.reducedMotion)}${toggleSetting("denseUI","Interfaz compacta",state.settings.denseUI)}${toggleSetting("showMapLabels","Etiquetas del mapa",state.settings.showMapLabels)}</section>
      <section class="setting-card"><h3>Tiempo</h3>${info("x1","1 día / 10 s reales")}${info("x2","1 día / 5 s reales")}${info("x4","1 día / 2,5 s reales")}${info("Paso manual","+1 día")}</section>
      <section class="setting-card"><h3>Partida</h3><div class="action-list"><button data-action="repair">🛠 Reparar estado</button><button data-action="import">📥 Importar guardado</button><button onclick="NEXUS_ACTIONS.exportSave()">📤 Exportar JSON</button><button class="danger-btn" data-action="reset">♻ Reiniciar campaña</button></div></section>
      <section class="setting-card"><h3>Integridad</h3>${info("Versión",state.version)}${info("Países",state.countries.length)}${info("Tecnologías",C().technologies.length)}${info("Unidades",fmt0(state.countries.reduce((s,c)=>s+totalUnits(c),0)))}</section></div>`;
  }

  function renderContext() {
    const box=document.getElementById("contextPanel");if(!box)return;const c=controlled(),s=selected();
    const tabs=`<div class="context-tabs"><button data-action="contextTab" data-value="actions" class="${state.contextTab==="actions"?"active":""}">Acciones</button><button data-action="contextTab" data-value="queue" class="${state.contextTab==="queue"?"active":""}">Colas</button><button data-action="contextTab" data-value="status" class="${state.contextTab==="status"?"active":""}">Estado</button></div>`;
    let html=tabs;
    if(state.contextTab==="queue")html+=queueHTML(c.productionQueue)+queueHTML(c.techQueue);
    else if(state.contextTab==="status")html+=systemMeter("Tesorería",Math.min(100,c.economy.treasury/3),money(c.economy.treasury))+systemMeter("Legitimidad",c.government.legitimacy,"Gobierno")+systemMeter("Preparación",c.militaryReadiness,"Fuerzas Armadas")+systemMeter("Estabilidad",c.systems.stability,"Nacional");
    else if(s.id!==c.id)html+=actionCard("🎮","Cambiar país",`Asume el control total de ${s.name}.`,`<button data-action="takeControl" data-country-id="${s.id}">Tomar control</button>`)+actionCard("🤝","Comercio",`Mejora relación y actividad.`,`<button data-action="diplomacy" data-country-id="${s.id}" data-kind="trade">Proponer</button>`)+actionCard("⛔","Embargo",`Reduce relación antes de una guerra.`,`<button data-action="diplomacy" data-country-id="${s.id}" data-kind="embargo">Aplicar</button>`)+actionCard("⚔️","Conflicto",`El combate se resuelve cada día.`,`<button data-action="war" data-country-id="${s.id}" data-kind="${warBetween(c.id,s.id)?"ceasefire":"declare"}">${warBetween(c.id,s.id)?"Alto el fuego":"Declarar guerra"}</button>`);
    else html+=C().policies.slice(0,6).map(p=>actionCard(p.icon,p.name,p.description,`<button data-action="policy" data-policy-id="${p.id}">${money(p.cost)}</button>`)).join("");
    box.innerHTML=html;set("contextTitle",s.name);
  }

  function renderMiniEvents(){const box=document.getElementById("miniEvents");if(!box)return;box.innerHTML=state.events.slice(0,7).map(e=>`<div class="mini-event"><span>${eventIcon(e.type)}</span><p>${esc(e.title)}</p><time>${e.date.slice(5)}</time></div>`).join("")}
  function renderMarketTicker(){const box=document.getElementById("marketTicker");if(!box)return;const indices=Object.entries(state.market?.indices||{}).slice(0,5);box.innerHTML=indices.map(([name,x])=>`<div class="market-line"><span>📊</span><b>${esc(name)}</b><strong class="${x.change>=0?"positive":"negative"}">${fmt1(x.value)} ${x.change>=0?"▲":"▼"}</strong></div>`).join("")+`<button class="full" data-panel-jump="stock">Abrir Bolsa</button>`}
  function renderMapRegionList(){
    const box=document.getElementById("mapRegionList");if(!box)return;const show=state.selectedCountryId==="ESP"||state.controlledCountryId==="ESP";
    box.hidden=!show;if(!show)return;box.innerHTML=`<header><b>Comunidades autónomas</b><small>Clic para centrar</small></header><div>${state.regions.map(r=>`<button data-action="selectRegion" data-region-id="${r.id}" class="${r.id===state.selectedRegionId?"active":""}"><span>${esc(r.name)}</span><small>${fmt1(r.population)} M · ${fmt0(r.directJobs||0)} empleos directos</small></button>`).join("")}</div>`;
  }

  function renderSimulationStatus(){set("gameStatus",state.running?`Activa · x${state.speed} · 1 día/${fmt1(10/state.speed)} s`:"Simulación pausada");set("scoreStatus",`Puntuación ${state.score}`)}

  function facilitySummary(c){const list=c.id==="ESP"?state.regions.flatMap(r=>r.buildings.map(b=>({...b,place:r.name}))):c.facilities.map(b=>({...b,place:c.name}));if(!list.length)return `<p class="muted">Sin instalaciones.</p>`;return `<div class="facility-strip">${list.slice(0,16).map(f=>{const d=buildingDef(f.typeId)||{};return `<div title="${esc(f.place)}"><span>${d.icon||"🏢"}</span><b>${esc(d.name||f.typeId)}</b><small>N${f.level||1} · ${esc(f.place)}</small></div>`}).join("")}</div>`}
  function facilityCard(f){const d=buildingDef(f.typeId)||{};return `<article class="building-card"><header><h3>${d.icon||"🏢"} ${esc(d.name||f.typeId)}</h3><b>N${f.level||1}</b></header><p>${esc(d.capacity||d.description||"")} · ${fmt0((d.jobs||0)*(f.level||1))} empleos</p><footer><button data-action="upgradeBuilding" data-building-id="${f.id}" ${(f.level||1)>=(d.maxLevel||4)?"disabled":""}>Ampliar nivel</button></footer></article>`}
  function buildCard(d){const c=controlled(),target=c.id==="ESP"?state.regions.find(r=>r.id===state.selectedRegionId)?.buildings:c.facilities,exists=target?.some(b=>b.typeId===d.id)||c.productionQueue.some(q=>q.kind==="facilityV2"&&q.buildingId===d.id&&(c.id!=="ESP"||q.regionId===state.selectedRegionId));return `<article class="building-card ${exists?"locked":""}"><header><h3>${d.icon} ${esc(d.name)}</h3><b>${money(d.cost)}</b></header><p>${esc(d.capacity||d.description)} · ${d.slots||1} slots · ${fmt0(d.jobs||0)} empleos</p><small>${requirementText(d)}</small><footer><button data-action="build" data-building-id="${d.id}" ${exists?"disabled":""}>${exists?"Existente: ampliar":"Construir"}</button></footer></article>`}
  function requirementText(d){const r=d.requires||{},a=[];if(r.infra)a.push(`Infra ${r.infra}`);if(r.energy)a.push(`Energía ${r.energy}`);if(r.technology)a.push(`Tech ${r.technology}`);if(r.coastal)a.push("Costa");return a.length?`Requisitos: ${a.join(" · ")}`:"Sin requisitos especiales"}
  function companyCard(c){const owner=E().getCountry(state,c.countryId),held=E().getHolding?.(state,c.id,controlled().id)||0,f=c.financials||{};return `<article class="company-card ${held>=51?"controlled":""}"><header><div><h3>${owner?.flag||"🏳️"} ${esc(c.name)}</h3><p>${esc(c.sector)} · ${esc(owner?.name||c.countryId)}</p></div><b>${money(c.marketCap)}</b></header>${sparkline(c.history,c.dayChange>=0?"#54dda1":"#ff6d7a")}<div class="stock-price-line"><strong>${fmt1(c.price)} €</strong><span class="${c.dayChange>=0?"positive":"negative"}">${c.dayChange>=0?"+":""}${fmt1(c.dayChange)}%</span></div><div class="company-facts"><span>Ingresos <b>${money(f.revenue||0)}</b></span><span>Beneficio <b>${money(f.profit||0)}</b></span><span>PER <b>${fmt1(f.pe||0)}</b></span><span>Dividendo <b>${pct(f.dividend||0)}</b></span></div><div class="kpi-grid three">${kpi("Participación",pct(held),held>=51?"CONTROL":"Cartera")}${kpi("Empleo",fmt0(c.employees),"personas")}${kpi("Margen",pct(f.margin||0),"operativo")}</div><footer><button data-action="buyShares" data-company-id="${c.id}" data-pct="1">Comprar 1%</button><button data-action="buyShares" data-company-id="${c.id}" data-pct="5">Comprar 5%</button><button data-action="sellShares" data-company-id="${c.id}" data-pct="5">Vender 5%</button><button data-action="takeover" data-company-id="${c.id}">OPA</button></footer></article>`}
  function partyCard(party,c){const ruling=party.id===c.politics.rulingPartyId;return `<article class="party-card ${ruling?"ruling":""}"><i style="background:${party.color}"></i><div><h3>${esc(party.name)}</h3><p>${esc(party.ideology)}</p></div><b>${pct(party.popularity)}</b><button data-action="appointParty" data-party-id="${party.id}" ${ruling?"disabled":""}>${ruling?"Gobierno":"Nombrar"}</button></article>`}
  function regimeCard(r,c){const active=c.politics.regimeId===r.id;return `<article class="regime-card ${active?"active":""}"><header><h3>${esc(r.name)}</h3><b>${r.pluralism}</b></header><p>${esc(r.description)}</p><div class="regime-metrics"><span>Pluralismo ${r.pluralism}</span><span>Mercado ${r.economicFreedom}</span><span>Control ${r.stateControl}</span></div><button data-action="changeRegime" data-regime-id="${r.id}" ${active?"disabled":""}>${active?"Régimen vigente":"Iniciar transición"}</button></article>`}
  function techCard(t,c){const done=c.completedTechs.includes(t.id),active=c.techQueue.find(q=>q.techId===t.id),locked=(t.requires||[]).some(x=>!c.completedTechs.includes(x));return `<article class="tech-card ${locked?"locked":""}"><header><h3>${t.icon} ${esc(t.name)}</h3><b>${done?"✓":t.cost}</b></header><p>${esc(t.description)}</p><div class="info-row"><span>Duración</span><b>${t.months} meses</b></div>${active?progress(active.totalMonths||t.months,active.monthsRemaining):done?`<b class="positive">COMPLETADA</b>`:`<button data-action="research" data-tech-id="${t.id}" ${locked?"disabled":""}>Investigar</button>`}</article>`}
  function unitCard(u,batch){const cost=(u.unitCost||u.cost||0)*batch;return `<article class="unit-card"><div class="unit-visual"><span>${esc(u.category)}</span><img src="${u.icon}" alt="${esc(u.name)}"></div><div class="unit-info"><h3>${esc(u.name)}</h3><p class="muted">${esc(u.description||"")}</p><div class="unit-stats"><span>Ataque <b>${u.stats.attack}</b></span><span>Defensa <b>${u.stats.defense}</b></span><span>Cantidad <b>${fmt0(batch)}</b></span><span>Coste <b>${money(cost)}</b></span><span>Plazo base <b>${fmt0(u.productionDays||60)} d</b></span><span>Tipo <b>${esc(u.unitName||"unidades")}</b></span></div><button data-action="queueUnit" data-unit-id="${u.id}" data-quantity="${batch}">Producir x${fmt0(batch)}</button></div></article>`}
  function deployedUnit(u){const d=unitDef(u.typeId),r=state.regions.find(x=>x.id===u.regionId);return `<article class="deployed-unit"><img src="${d?.icon||""}" alt=""><div><h4>${esc(d?.name||u.name)}</h4><p>${fmt0(u.quantity)} ${esc(d?.unitName||"unidades")} · ${r?.name||controlled().name}</p><span>${pct(u.readiness)} · EXP ${fmt0(u.experience)}</span>${controlled().id==="ESP"?`<select id="deploy-${u.id}">${state.regions.map(x=>`<option value="${x.id}" ${x.id===u.regionId?"selected":""}>${esc(x.name)}</option>`).join("")}</select><button data-action="deployUnit" data-unit-id="${u.id}">Desplegar</button>`:""}</div></article>`}
  function tradeRouteCard(route,c){const otherId=route.countries.find(id=>id!==c.id),other=E().getCountry(state,otherId),ships=route.ships||[],lead=ships[0],cargo=lead?.cargo||{};return `<article class="trade-route-card"><header><div><b>${c.flag} ${esc(c.name)} ⇄ ${other?.flag||"🏳️"} ${esc(other?.name||otherId)}</b><small>Volumen ${fmt1(route.volume||0)} · Eficiencia ${fmt1(route.efficiency||0)}%</small></div><strong>${ships.length} 🚢</strong></header><div class="trade-cargo"><span>${cargo.icon||"📦"}</span><div><b>${esc(cargo.name||"Carga mixta")}</b><small>${fmt1(cargo.quantity||0)} ${esc(cargo.unit||"")} · ${lead?.status||"En ruta"}</small></div></div><div class="meter"><i style="width:${clamp((lead?.progress||0)*100,0,100)}%"></i></div></article>`}

  function diplomacyActions(target,c){const conflict=warBetween(c.id,target.id);return `<div class="diplomacy-buttons"><button data-action="diplomacy" data-country-id="${target.id}" data-kind="trade">Comercio</button><button data-action="diplomacy" data-country-id="${target.id}" data-kind="aid">Ayuda</button><button data-action="diplomacy" data-country-id="${target.id}" data-kind="alliance">Alianza</button><button data-action="diplomacy" data-country-id="${target.id}" data-kind="embargo">Embargo</button><button class="danger-btn" data-action="war" data-country-id="${target.id}" data-kind="${conflict?"ceasefire":"declare"}">${conflict?"Alto el fuego":"Declarar guerra"}</button></div>`}
  function diplomacyCard(target,c){const rel=c.relations[target.id]??50;return `<article class="diplomacy-card"><header><div class="flag-large">${target.flag}</div><div><h3>${esc(target.name)}</h3><p>${esc(target.government.regime)}</p></div><b class="${rel>=70?"positive":rel<38?"negative":"warning"}">${fmt1(rel)}</b></header><div class="meter"><i style="width:${clamp(rel,0,100)}%"></i></div><footer><button onclick="NEXUS_ACTIONS.selectCountry('${target.id}')">Inspeccionar</button><button data-action="diplomacy" data-country-id="${target.id}" data-kind="trade">Comercio</button><button data-action="war" data-country-id="${target.id}" data-kind="${warBetween(c.id,target.id)?"ceasefire":"declare"}">${warBetween(c.id,target.id)?"Paz":"Guerra"}</button></footer></article>`}
  function operationCard(op,target){return `<article class="building-card"><header><h3>${op.icon} ${esc(op.name)}</h3><b>${money(op.cost)}</b></header><p>${esc(op.description)}</p><footer><button data-action="operation" data-country-id="${target.id}" data-operation-id="${op.id}">Ejecutar</button></footer></article>`}
  function warBetween(a,b){return state.wars.find(w=>!w.ended&&((w.attacker===a&&w.defender===b)||(w.attacker===b&&w.defender===a)))}
  function warCompact(w){const a=E().getCountry(state,w.attacker),d=E().getCountry(state,w.defender);return `<div class="war-line"><span>${a.flag} ${esc(a.name)}</span><div><b>${w.warScore>=0?"←":"→"} ${fmt1(Math.abs(w.warScore))}</b><div class="war-score"><i style="left:${clamp((w.warScore+100)/2,0,100)}%"></i></div><small>Día ${w.days||0}</small></div><span>${d.flag} ${esc(d.name)}</span></div>`}
  function warCard(w){const a=E().getCountry(state,w.attacker),d=E().getCountry(state,w.defender),battle=w.lastBattle;return `<article class="war-card"><header><div><h3>${a.flag} ${esc(a.name)} <span>vs</span> ${d.flag} ${esc(d.name)}</h3><p>Día ${w.days||0} · Control territorial ${fmt1(w.territoryControl||0)} · War score ${fmt1(w.warScore||0)}</p></div><b>${w.result||"GUERRA ACTIVA"}</b></header>${warCompact(w)}<div class="battle-grid"><div><h4>Fuerza atacante</h4>${forceComposition(a)}</div><div><h4>Fuerza defensora</h4>${forceComposition(d)}</div></div>${battle?`<div class="battle-report"><h4>⚔️ ${esc(battle.title)}</h4><p>${esc(battle.summary)}</p><div>${battle.attackerUnits.map(x=>`<span>${esc(x)}</span>`).join("")}</div><div>${battle.defenderUnits.map(x=>`<span>${esc(x)}</span>`).join("")}</div><small>Bajas del día: ${fmt0(battle.attackerLosses)} / ${fmt0(battle.defenderLosses)}</small></div>`:`<p class="muted">La primera batalla se generará al avanzar el día.</p>`}<footer><span>Bajas acumuladas: ${fmt0(w.attackerLosses)} / ${fmt0(w.defenderLosses)}</span>${(w.attacker===controlled().id||w.defender===controlled().id)?`<button data-action="war" data-country-id="${w.attacker===controlled().id?w.defender:w.attacker}" data-kind="ceasefire">Negociar alto el fuego</button>`:""}</footer></article>`}
  function forceComposition(c){const p=E().countryCombatPower(state,c);return p.byType.slice(0,5).map(x=>`<div class="force-row"><span>${esc(x.name)}</span><b>${fmt0(x.quantity)}</b></div>`).join("")}
  function totalUnits(c){return (c.units||[]).reduce((s,u)=>s+(Number(u.quantity)||0),0)}
  function queueHTML(queue=[]){if(!queue.length)return `<div class="empty-state"><span>⌛</span><p>Sin proyectos activos.</p></div>`;return `<div class="queue-list">${queue.map(q=>{const rem=q.daysRemaining??(q.monthsRemaining!=null?q.monthsRemaining*30:0),total=q.totalDays??(q.totalMonths!=null?q.totalMonths*30:1);return `<div class="queue-item"><div><b>${esc(q.name||q.techId||q.typeId||"Proyecto")}</b><small>${fmt0(rem)} días</small></div>${progress(total,rem)}</div>`}).join("")}</div>`}
  function projectCard(p){const c=controlled(),active=c.productionQueue.find(q=>q.projectId===p.id),done=c.projects.includes(p.id)&&!active;return `<article class="project-card"><div><h4>${esc(p.name)}</h4><p>${money(p.cost)} · ${p.months} meses</p></div>${done?`<b class="positive">HECHO</b>`:active?`<b>EN CURSO</b>`:`<button data-action="startProject" data-project-id="${p.id}">Iniciar</button>`}</article>`}
  function eventRow(e){return `<article class="event-row"><div class="event-icon">${eventIcon(e.type)}</div><time>${e.date}</time><div><h4>${esc(e.title)}</h4><p>${esc(e.text)}</p></div></article>`}
  function actionCard(icon,title,text,button){return `<article class="action-card"><div class="icon">${icon}</div><div><h4>${esc(title)}</h4><p>${esc(text)}</p></div>${button}</article>`}
  function openCountryModal(){const c=selected();openModal(`${c.flag} ${c.name}`,`<div class="kpi-grid four">${kpi("PIB",money(c.economy.gdp),"")}${kpi("Población",`${fmt1(c.economy.population)} M`,"")}${kpi("Militar",fmt1(c.systems.military),"")}${kpi("Tecnología",fmt1(c.systems.technology),"")}</div><section class="card">${info("Régimen",c.government.regime)}${info("Ideología",c.government.ideology)}${info("Legitimidad",pct(c.government.legitimacy))}${info("Instalaciones",fmt0(c.id==="ESP"?state.regions.reduce((s,r)=>s+r.buildings.length,0):c.facilities.length))}${info("Unidades",fmt0(totalUnits(c)))}</section>`)}
  function openModal(title,html){set("modalTitle",title);const c=document.getElementById("modalContent");if(c)c.innerHTML=html;const b=document.getElementById("modalBackdrop");if(b)b.hidden=false}
  function closeModal(){const b=document.getElementById("modalBackdrop");if(b)b.hidden=true}
  function openImportModal(){openModal("Importar partida",`<div class="form-grid"><label>Pega el JSON exportado<textarea id="importText" rows="14"></textarea></label><button onclick="NEXUS_ACTIONS.importSave(document.getElementById('importText').value)">Importar</button></div>`)}
  function toast(message,type="info"){const box=document.getElementById("toastContainer");if(!box)return;const el=document.createElement("div");el.className=`toast ${type}`;el.textContent=message;box.appendChild(el);setTimeout(()=>el.remove(),4300)}

  function safeBudget(c){try{return E().calculateDetailedBudget(c,state)}catch(_){return{monthlyRevenue:c.economy.monthlyRevenue||0,monthlySpending:c.economy.monthlySpending||0,monthlyBalance:c.economy.monthlyBalance||0}}}
  function budgetSlider(k,v){return `<div class="slider-card"><label><span>${budgetName(k)}</span><output>${v}%</output></label><input type="range" min="0.5" max="15" step="0.1" value="${v}" data-budget="${k}"></div>`}
  function taxSlider(v){return `<div class="slider-card"><label><span>Presión fiscal</span><output>${v}%</output></label><input type="range" min="10" max="52" step="0.5" value="${v}" data-tax-rate></div>`}
  function toggleSetting(key,label,value){return `<label class="info-row"><span>${label}</span><input type="checkbox" data-setting="${key}" ${value?"checked":""}></label>`}
  function progress(total,remaining){const p=clamp((1-remaining/Math.max(total,1))*100,0,100);return `<div class="progress"><i style="width:${p}%"></i></div>`}
  function sparkline(values,color="#47b8ff"){const arr=values?.length?values:[0,1],min=Math.min(...arr),max=Math.max(...arr),pts=arr.map((v,i)=>`${(i/Math.max(1,arr.length-1)*300).toFixed(1)},${(100-(v-min)/Math.max(.0001,max-min)*82-9).toFixed(1)}`).join(" ");return `<svg class="sparkline" viewBox="0 0 300 110" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`}
  function kpi(label,value,detail="",cls=""){return `<div class="kpi-card ${cls}"><span>${esc(label)}</span><b>${value}</b><small>${esc(detail)}</small></div>`}
  function heading(title,subtitle,actionsHTML=""){return `<div class="panel-heading"><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div><div class="panel-actions">${actionsHTML}</div></div>`}
  function info(label,value){return `<div class="info-row"><span>${esc(label)}</span><b>${value}</b></div>`}
  function meterLine(label,value){return `<div class="system-line"><span>${esc(label)}</span><b>${fmt1(value)}</b><div class="meter"><i style="width:${clamp(value,0,100)}%"></i></div></div>`}
  function systemMeter(label,value,detail){return `<div class="system-meter"><div><span>${esc(label)}</span><b>${fmt1(value)}</b></div><div class="meter"><i style="width:${clamp(value,0,100)}%"></i></div><small>${esc(detail)}</small></div>`}
  function resourceLine(icon,label,value,good){return `<div class="resource-line"><span>${icon}</span><b>${esc(label)}</b><strong class="${good?"positive":"warning"}">${value}</strong></div>`}
  function set(id,value){const el=document.getElementById(id);if(el)el.textContent=value}
  function clamp(v,a,b){return Math.max(a,Math.min(b,Number(v)||0))}
  function partyName(c){return c.politics?.parties?.find(p=>p.id===c.politics.rulingPartyId)?.name||c.government.ideology}
  function eventIcon(t){return({system:"⚙️",economy:"💶",energy:"⚡",social:"👥",diplomacy:"🤝",intel:"🛰️",military:"🛡️",battle:"⚔️",politics:"🗳️",project:"🏗️",region:"🗺️",market:"📈",technology:"🔬",policy:"🏛️",objective:"🎯",climate:"🌡️",defense:"⚔️",industry:"🏭",shipping:"🚢",trade:"🚢"})[t]||"📰"}
  function budgetName(k){return({health:"Sanidad",education:"Educación",defense:"Defensa",infrastructure:"Infraestructura",research:"I+D",welfare:"Protección social"})[k]||k}
  function sectorName(k){return({services:"Servicios",industry:"Industria",public:"Sector público",agriculture:"Agricultura",construction:"Construcción",tourism:"Turismo",automotive:"Automoción",energy:"Energía",digital:"Digital",defense:"Defensa"})[k]||k}

  return {initialize,renderAll,renderContext,toast,openModal,closeModal};
})();
