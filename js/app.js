"use strict";

(() => {
  const SAVE_KEY = "nexus_alpha_v1_1_save";
  let state;
  let timer = null;

  function storageGet(key) {
    try { return window.localStorage?.getItem(key) ?? null; }
    catch (_) { return null; }
  }

  function storageSet(key, value) {
    try { window.localStorage?.setItem(key, value); return true; }
    catch (_) { return false; }
  }

  function storageRemove(key) {
    try { window.localStorage?.removeItem(key); return true; }
    catch (_) { return false; }
  }

  function boot() {
    try {
      state = normalizeLoadedState(loadState()) || NEXUS_ECONOMY.createInitialState();
      window.NEXUS_STATE = state;
      window.NEXUS_ACTIONS = createActions();
      NEXUS_UI.initialize(state, NEXUS_ACTIONS);
      NEXUS_MAP_ENGINE.initialize(state, { selectCountry, selectRegion });
      bindStartScreen();
      syncLoop();
      hideBootLoader();
    } catch (error) {
      console.error("NEXUS boot error", error);
      document.getElementById("bootLoader")?.remove();
      const overlay = document.getElementById("startOverlay"); if (overlay) overlay.hidden = true;
      const errorPanel = document.getElementById("bootError"); if (errorPanel) errorPanel.hidden = false;
      const errorText = document.getElementById("bootErrorText"); if (errorText) errorText.textContent = error?.stack || error?.message || String(error);
    }
  }

  function createActions() {
    return {
      setPanel, setMapLayer, selectCountry, selectRegion, toggleRun, setSpeed, stepMonth,
      updateBudget, updateTaxRate, investRegion, buildInRegion, upgradeBuilding,
      queueUnit, startProject, buyShares, sellShares, takeover,
      diplomacy, operation, war, nuclearAlert, startResearch, enactPolicy, setDoctrine,
      save: () => saveState(true), load: manualLoad, exportSave, importSave, reset,
      updateSetting, repair
    };
  }

  function bindStartScreen() {
    const overlay = document.getElementById("startOverlay");
    const continueBtn = document.getElementById("continueBtn");
    continueBtn.hidden = !Boolean(normalizeLoadedState(loadState()));
    document.getElementById("startSpainBtn")?.addEventListener("click", () => {
      state = NEXUS_ECONOMY.createInitialState(); state.selectedCountryId = "ESP"; state.mapMode="world";
      rebindState(); overlay.hidden = true; NEXUS_UI.toast("Campaña iniciada con España reforzada.", "success");
    });
    continueBtn?.addEventListener("click", () => {
      const loaded = normalizeLoadedState(loadState());
      if (loaded) { state=loaded; rebindState(); overlay.hidden=true; NEXUS_UI.toast("Partida cargada.","success"); }
    });
    document.getElementById("observerBtn")?.addEventListener("click", () => {
      state=NEXUS_ECONOMY.createInitialState(); state.selectedCountryId="DEU"; rebindState(); overlay.hidden=true; NEXUS_UI.toast("Modo observador activo.","info");
    });
  }

  function rebindState() {
    stopLoop();
    state = NEXUS_ECONOMY.hydrateState(state);
    window.NEXUS_STATE = state;
    window.NEXUS_ACTIONS = createActions();
    NEXUS_UI.initialize(state, NEXUS_ACTIONS);
    NEXUS_MAP_ENGINE.initialize(state, { selectCountry, selectRegion });
    syncLoop();
  }

  function setPanel(panel) {
    const allowed=["overview","economy","regions","industry","technology","military","diplomacy","intelligence","objectives","events","settings"];
    state.activePanel = allowed.includes(panel) ? panel : "overview";
    if (panel === "regions") { state.selectedCountryId="ESP"; state.mapMode="regions"; }
    else if (state.mapMode === "regions") state.mapMode="world";
    NEXUS_UI.renderAll();
  }

  function setMapLayer(layer) { state.mapLayer=layer; state.mapMode="world"; NEXUS_MAP_ENGINE.render(); NEXUS_UI.renderAll(); }

  function selectCountry(countryId) {
    if (!state.countries.some(c=>c.id===countryId)) return;
    state.selectedCountryId=countryId; state.mapMode="world";
    NEXUS_MAP_ENGINE.render(); NEXUS_UI.renderAll();
  }

  function selectRegion(regionId) {
    if (!state.regions.some(r=>r.id===regionId)) return;
    state.selectedCountryId="ESP"; state.selectedRegionId=regionId; state.mapMode="regions";
    if(state.activePanel!=="overview") state.activePanel="regions";
    NEXUS_MAP_ENGINE.render(); NEXUS_UI.renderAll();
  }

  function toggleRun() { state.running=!state.running; syncLoop(); NEXUS_UI.renderAll(); }
  function setSpeed(speed) { state.speed=[1,2,4].includes(speed)?speed:1; syncLoop(); NEXUS_UI.renderAll(); }
  function syncLoop() { stopLoop(); if(!state.running)return; timer=setInterval(stepMonth,Math.max(260,1300/state.speed)); }
  function stopLoop(){if(timer)clearInterval(timer);timer=null}

  function stepMonth() {
    const summary=NEXUS_ECONOMY.tickMonth(state);
    if(state.settings.autosave) saveState(false);
    NEXUS_MAP_ENGINE.render(); NEXUS_UI.renderAll();
    if(summary?.budget?.monthlyBalance < -8) NEXUS_UI.toast("El déficit mensual está elevando la deuda.","warning");
  }

  function updateBudget(key,value){NEXUS_ECONOMY.updateBudget(state,key,value);NEXUS_UI.renderContext()}
  function updateTaxRate(value){NEXUS_ECONOMY.updateTaxRate(state,value);NEXUS_UI.renderContext()}
  function investRegion(type){result(NEXUS_ECONOMY.investRegion(state,state.selectedRegionId,type));refresh()}
  function buildInRegion(buildingId){result(NEXUS_ECONOMY.buildInRegion(state,state.selectedRegionId,buildingId));refresh()}
  function upgradeBuilding(id){result(NEXUS_ECONOMY.upgradeBuilding(state,state.selectedRegionId,id));refresh()}
  function queueUnit(typeId){result(NEXUS_ECONOMY.queueUnit(state,typeId,state.selectedRegionId));refresh()}
  function startProject(projectId){result(NEXUS_ECONOMY.startProject(state,projectId));refresh()}
  function buyShares(companyId,pct){result(NEXUS_ECONOMY.buyShares(state,companyId,pct));refresh()}
  function sellShares(companyId,pct){result(NEXUS_ECONOMY.sellShares(state,companyId,pct));refresh()}
  function takeover(companyId){result(NEXUS_ECONOMY.launchTakeover(state,companyId));refresh()}
  function diplomacy(targetId,kind){result(NEXUS_ECONOMY.tradeAction(state,targetId,kind));refresh()}
  function operation(targetId,operationId){result(NEXUS_ECONOMY.runOperation(state,targetId,operationId));refresh()}
  function war(targetId,kind){result(NEXUS_ECONOMY.warAction(state,targetId,kind));refresh()}
  function nuclearAlert(delta){result(NEXUS_ECONOMY.setNuclearAlert(state,delta));refresh()}
  function startResearch(techId){result(NEXUS_ECONOMY.startResearch(state,techId));refresh()}
  function enactPolicy(policyId){result(NEXUS_ECONOMY.enactPolicy(state,policyId));refresh()}
  function setDoctrine(value){NEXUS_ECONOMY.getCountry(state).militaryDoctrine=value;NEXUS_UI.toast(`Doctrina actualizada: ${value}`,"success");refresh()}
  function result(r){if(r)NEXUS_UI.toast(r.message,r.ok?"success":"error")}
  function refresh(){NEXUS_MAP_ENGINE.render();NEXUS_UI.renderAll()}

  function saveState(show=true){const ok=storageSet(SAVE_KEY,JSON.stringify(state));if(show)NEXUS_UI.toast(ok?"Partida guardada localmente.":"El navegador bloqueó el guardado local.",ok?"success":"warning");return ok}
  function loadState(){const raw=storageGet(SAVE_KEY);if(!raw)return null;try{return JSON.parse(raw)}catch(_){return null}}
  function manualLoad(){const loaded=normalizeLoadedState(loadState());if(!loaded){NEXUS_UI.toast("No hay guardado compatible.","warning");return}state=loaded;rebindState();NEXUS_UI.toast("Partida cargada.","success")}
  function normalizeLoadedState(candidate){if(!candidate||typeof candidate!=="object"||!Array.isArray(candidate.countries))return null;try{return NEXUS_ECONOMY.hydrateState(candidate)}catch(e){console.warn("Guardado incompatible",e);return null}}

  function exportSave(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`nexus-v1.1-${state.date}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);NEXUS_UI.toast("Guardado exportado.","success")}
  function importSave(raw){try{const parsed=JSON.parse(raw);const normalized=normalizeLoadedState(parsed);if(!normalized)throw new Error("Formato incompatible");state=normalized;rebindState();NEXUS_UI.closeModal();NEXUS_UI.toast("Partida importada.","success")}catch(e){NEXUS_UI.toast(`Importación fallida: ${e.message}`,"error")}}
  function reset(){if(!confirm("¿Reiniciar la campaña?"))return;storageRemove(SAVE_KEY);state=NEXUS_ECONOMY.createInitialState();rebindState();NEXUS_UI.toast("Campaña reiniciada.","success")}
  function updateSetting(key,value){state.settings[key]=value;document.body.classList.toggle("reduced-motion",state.settings.reducedMotion);document.body.classList.toggle("dense-ui",state.settings.denseUI);NEXUS_UI.renderAll()}
  function repair(){try{state=NEXUS_ECONOMY.hydrateState(state);rebindState();NEXUS_UI.toast("Estado reparado.","success")}catch(e){NEXUS_UI.toast("No se pudo reparar.","error")}}
  function hideBootLoader(){requestAnimationFrame(()=>document.getElementById("bootLoader")?.classList.add("hidden"));setTimeout(()=>document.getElementById("bootLoader")?.remove(),650)}

  window.addEventListener("DOMContentLoaded",boot,{once:true});
})();
