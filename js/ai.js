/* =========================================================
   NEXUS RTS — AI.JS
   IA geopolítica:
   - Utility AI por país
   - decisiones económicas, militares, climáticas y diplomáticas
   - comportamiento según estabilidad, felicidad, deuda, sanciones,
     poder militar, energía y relación con el país seleccionado
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURACIÓN IA
========================================================= */

const AI_CONFIG = {
  decisionChancePerDay: 0.035,
  crisisDecisionChancePerDay: 0.085,
  maxActionsPerDay: 2,

  thresholds: {
    lowStability: 45,
    lowHappiness: 50,
    highDesperation: 70,
    highDebtToGDP: 1.2,
    badRelation: 30,
    energyDeficitRatio: 0.12,
    highClimateRisk: 65
  }
};

/* =========================================================
   TICK PRINCIPAL IA
========================================================= */

function runWorldAI() {
  if (!NEXUS?.state?.countries) return;

  const player = getSelectedCountry();

  NEXUS.state.countries.forEach(country => {
    if (country.name === player.name) return;

    runCountryAIDecision(country, player);
  });
}

function runCountryAIDecision(country, player) {
  ensureAIFields(country);

  updateAIMemory(country, player);

  const chance =
    country.desperation >= AI_CONFIG.thresholds.highDesperation
      ? AI_CONFIG.crisisDecisionChancePerDay
      : AI_CONFIG.decisionChancePerDay;

  if (Math.random() > chance) return;

  const actions = scoreAIActions(country, player);
  const selectedActions = selectTopAIActions(actions, AI_CONFIG.maxActionsPerDay);

  selectedActions.forEach(action => executeAIAction(country, player, action));
}

/* =========================================================
   CAMPOS IA
========================================================= */

function ensureAIFields(country) {
  country.ai ??= {
    lastAction: null,
    doctrine: inferAIDoctrine(country),
    aggression: inferAggression(country),
    compliance: inferCompliance(country),
    economicFocus: inferEconomicFocus(country),
    climatePriority: inferClimatePriority(country),
    militaryFocus: inferMilitaryFocus(country),
    memory: []
  };

  country.desperation = calculateAIDesperation(country);
}

function inferAIDoctrine(country) {
  if (country.government === "Autoritario") return "Estado fuerte";
  if (country.government === "Monarquía") return "Estabilidad energética";
  if (country.ideology?.includes("Tecnocrático")) return "Tecnocracia";
  if (country.ideology?.includes("Nórdico")) return "Bienestar";
  if (country.government === "Democracia") return "Equilibrio liberal";
  return "Pragmatismo";
}

function inferAggression(country) {
  let value = 0.25;

  if (country.government === "Autoritario") value += 0.25;
  if (country.ideology?.includes("Nacionalista")) value += 0.25;
  if (country.military > 500_000) value += 0.15;
  if (country.relation < 35) value += 0.12;

  return clamp(value, 0.05, 0.95);
}

function inferCompliance(country) {
  let value = 0.65;

  if (country.government === "Autoritario") value -= 0.25;
  if (country.government === "Monarquía") value -= 0.12;
  if (country.ideology?.includes("Nórdico")) value += 0.18;
  if (country.stability > 75) value += 0.08;
  if (country.sanctions > 0) value -= 0.1;

  return clamp(value, 0.05, 0.95);
}

function inferEconomicFocus(country) {
  let value = 0.55;

  if (country.gdpPerCapita < 15_000) value += 0.2;
  if (country.energyProduction < country.energyDemand) value += 0.15;
  if (country.unemployment > country.population * 0.07) value += 0.18;
  if (country.ideology?.includes("Tecnocrático")) value += 0.15;

  return clamp(value, 0.05, 0.95);
}

function inferClimatePriority(country) {
  let value = 0.45;

  if (country.ideology?.includes("Nórdico")) value += 0.22;
  if (country.government === "Democracia") value += 0.08;
  if (country.climateRisk > 60) value += 0.22;
  if (country.energyProduction < country.energyDemand) value -= 0.12;
  if (country.gdpPerCapita < 12_000) value -= 0.1;

  return clamp(value, 0.05, 0.95);
}

function inferMilitaryFocus(country) {
  let value = 0.3;

  if (country.government === "Autoritario") value += 0.22;
  if (country.relation < 35) value += 0.18;
  if (country.powerRank && country.powerRank <= 5) value += 0.15;
  if (country.stability < 45) value += 0.08;

  return clamp(value, 0.05, 0.95);
}

/* =========================================================
   MEMORIA / DESESPERACIÓN
========================================================= */

function updateAIMemory(country, player) {
  const record = {
    date: getSimulationDateLabel(),
    stability: country.stability,
    happiness: country.happiness,
    treasury: country.treasury,
    relationWithPlayer: country.relation,
    sanctions: country.sanctions,
    desperation: country.desperation
  };

  country.ai.memory.unshift(record);

  if (country.ai.memory.length > 30) {
    country.ai.memory.pop();
  }
}

function calculateAIDesperation(country) {
  const debtToGDP = country.debt / Math.max(country.gdp, 1);
  const energyDeficitRatio =
    Math.max(0, country.energyDemand - country.energyProduction) /
    Math.max(country.energyDemand, 1);

  const fiscalStress = country.treasury < 0 ? 18 : 0;
  const debtStress = Math.max(0, debtToGDP - 0.75) * 35;
  const stabilityStress = Math.max(0, 60 - country.stability) * 0.9;
  const happinessStress = Math.max(0, 60 - country.happiness) * 0.55;
  const sanctionsStress = country.sanctions * 1.6;
  const energyStress = energyDeficitRatio * 45;
  const climateStress = Math.max(0, country.climateRisk - 55) * 0.35;

  return clamp(
    fiscalStress +
      debtStress +
      stabilityStress +
      happinessStress +
      sanctionsStress +
      energyStress +
      climateStress,
    0,
    100
  );
}

/* =========================================================
   SCORING DE ACCIONES
========================================================= */

function scoreAIActions(country, player) {
  const ai = country.ai;
  const debtToGDP = country.debt / Math.max(country.gdp, 1);
  const energyDeficitRatio =
    Math.max(0, country.energyDemand - country.energyProduction) /
    Math.max(country.energyDemand, 1);

  return [
    {
      id: "industrial_stimulus",
      score:
        ai.economicFocus * 42 +
        country.desperation * 0.35 +
        Math.max(0, 55 - country.happiness) * 0.35 +
        Math.max(0, energyDeficitRatio - 0.08) * -35,
      reason: "impulso industrial"
    },
    {
      id: "green_transition",
      score:
        ai.climatePriority * 44 +
        country.climateRisk * 0.35 +
        country.co2 / 200_000_000 -
        country.desperation * 0.18,
      reason: "transición verde"
    },
    {
      id: "energy_expansion",
      score:
        energyDeficitRatio * 90 +
        ai.economicFocus * 22 +
        country.desperation * 0.18,
      reason: "déficit energético"
    },
    {
      id: "military_expansion",
      score:
        ai.militaryFocus * 42 +
        ai.aggression * 35 +
        Math.max(0, 40 - country.relation) * 0.55 +
        country.desperation * 0.12,
      reason: "rearme estratégico"
    },
    {
      id: "cyber_expansion",
      score:
        ai.militaryFocus * 28 +
        country.research * 0.012 +
        Math.max(0, 55 - country.relation) * 0.25,
      reason: "capacidades híbridas"
    },
    {
      id: "diplomatic_outreach",
      score:
        Math.max(0, 55 - country.relation) * 0.8 +
        ai.compliance * 24 +
        country.sanctions * 1.2 -
        ai.aggression * 12,
      reason: "recuperar relaciones"
    },
    {
      id: "sanction_player",
      score:
        Math.max(0, 35 - country.relation) * 1.2 +
        ai.aggression * 28 +
        country.military / 90_000 -
        ai.compliance * 12,
      reason: "presión diplomática"
    },
    {
      id: "break_treaty",
      score:
        country.desperation * 0.75 +
        (1 - ai.compliance) * 38 +
        Math.max(0, debtToGDP - 1) * 18 -
        country.sanctions * 0.9,
      reason: "romper restricciones"
    },
    {
      id: "austerity",
      score:
        Math.max(0, debtToGDP - 0.9) * 38 +
        Math.max(0, country.desperation - 50) * 0.35 -
        Math.max(0, 45 - country.happiness) * 0.6,
      reason: "control fiscal"
    },
    {
      id: "innovation_push",
      score:
        ai.economicFocus * 28 +
        country.research * 0.006 +
        country.gdpPerCapita / 3_000 -
        country.desperation * 0.12,
      reason: "I+D y productividad"
    }
  ]
    .map(action => ({
      ...action,
      score: clamp(action.score + randomBetween(-6, 6), 0, 100)
    }))
    .sort((a, b) => b.score - a.score);
}

function selectTopAIActions(actions, limit) {
  return actions
    .filter(action => action.score > 45)
    .slice(0, limit);
}

/* =========================================================
   EJECUCIÓN ACCIONES IA
========================================================= */

function executeAIAction(country, player, action) {
  switch (action.id) {
    case "industrial_stimulus":
      aiIndustrialStimulus(country, action);
      break;

    case "green_transition":
      aiGreenTransition(country, action);
      break;

    case "energy_expansion":
      aiEnergyExpansion(country, action);
      break;

    case "military_expansion":
      aiMilitaryExpansion(country, action);
      break;

    case "cyber_expansion":
      aiCyberExpansion(country, action);
      break;

    case "diplomatic_outreach":
      aiDiplomaticOutreach(country, action);
      break;

    case "sanction_player":
      aiSanctionPlayerAdvanced(country, player, action);
      break;

    case "break_treaty":
      aiBreakTreatyAdvanced(country, action);
      break;

    case "austerity":
      aiAusterity(country, action);
      break;

    case "innovation_push":
      aiInnovationPush(country, action);
      break;

    default:
      console.warn("Acción IA no implementada:", action.id);
  }

  country.ai.lastAction = action.id;
}

function aiIndustrialStimulus(country, action) {
  const cost = Math.min(country.treasury * 0.16, 220_000_000);

  if (cost <= 20_000_000) return;

  country.treasury -= cost;
  country.gdp += cost * 0.78;
  country.industrialOutput = (country.industrialOutput || country.gdp * 0.28) + cost * 0.45;
  country.unemployment = Math.max(0, country.unemployment - 6_000);
  country.co2 += cost / 220;

  maybeLogAI(country, "📈", `${country.name} lanza un estímulo industrial por ${formatEuro(cost)}.`);
}

function aiGreenTransition(country, action) {
  const cost = Math.min(country.treasury * 0.12, 180_000_000);

  if (cost <= 15_000_000) return;

  country.treasury -= cost;
  country.co2 = Math.max(0, country.co2 - cost / 80);
  country.energyProduction += Math.round(cost / 4_000_000);
  country.installedPower += Math.round(cost / 3_500_000);
  country.renewablesMW = (country.renewablesMW || 0) + Math.round(cost / 3_500_000);
  country.relation = clamp(country.relation + 1.2, 0, 100);
  country.happiness = clamp(country.happiness + 0.3, 0, 100);

  maybeLogAI(country, "🌱", `${country.name} acelera su transición energética.`);
}

function aiEnergyExpansion(country, action) {
  const cost = Math.min(country.treasury * 0.13, 210_000_000);

  if (cost <= 15_000_000) return;

  country.treasury -= cost;
  country.energyProduction += Math.round(cost / 1_200_000);
  country.installedPower += Math.round(cost / 1_050_000);
  country.gdp += cost * 0.18;
  country.co2 += cost / 900;

  maybeLogAI(country, "⚡", `${country.name} amplía su capacidad energética instalada.`);
}

function aiMilitaryExpansion(country, action) {
  const cost = Math.min(country.treasury * 0.10, 190_000_000);

  if (cost <= 12_000_000) return;

  country.treasury -= cost;
  country.military += Math.round(cost / 35_000);
  country.stability = clamp(country.stability + 0.25, 0, 100);
  country.relation = clamp(country.relation - 0.6, 0, 100);

  maybeLogAI(country, "🛡️", `${country.name} incrementa su gasto militar.`);
}

function aiCyberExpansion(country, action) {
  const cost = Math.min(country.treasury * 0.08, 120_000_000);

  if (cost <= 10_000_000) return;

  country.treasury -= cost;
  country.cyber += Math.round(cost / 180_000);
  country.research += Math.round(cost / 6_000_000);

  maybeLogAI(country, "🛰️", `${country.name} invierte en capacidades cibernéticas.`);
}

function aiDiplomaticOutreach(country, action) {
  country.relation = clamp(country.relation + randomBetween(1.2, 3.5), 0, 100);
  country.reputation = clamp((country.reputation || 60) + 0.6, 0, 100);
  country.sanctions = Math.max(0, country.sanctions - 0.4);

  maybeLogAI(country, "🤝", `${country.name} inicia una ofensiva diplomática.`);
}

function aiSanctionPlayerAdvanced(country, player, action) {
  if (country.relation > 45) return;

  player.sanctions += 0.6;
  player.relation = clamp(player.relation - 0.7, 0, 100);
  country.relation = clamp(country.relation - 0.4, 0, 100);

  maybeLogAI(country, "⛔", `${country.name} presiona para sancionar a ${player.name}.`);
}

function aiBreakTreatyAdvanced(country, action) {
  country.relation = clamp(country.relation - 2.8, 0, 100);
  country.reputation = clamp((country.reputation || 60) - 2.2, 0, 100);
  country.gdp += 65_000_000;
  country.co2 += 1_150_000;
  country.sanctions += 0.8;

  maybeLogAI(country, "🌐", `${country.name} rompe compromisos internacionales para ganar margen económico.`);
}

function aiAusterity(country, action) {
  country.publicSpending = (country.publicSpending || country.gdp * 0.21) * 0.97;
  country.debt = Math.max(0, country.debt - country.gdp * 0.0005);
  country.happiness = clamp(country.happiness - 0.45, 0, 100);
  country.economicStress = clamp((country.economicStress || 0) - 1.2, 0, 100);

  maybeLogAI(country, "📉", `${country.name} aprueba medidas de austeridad fiscal.`);
}

function aiInnovationPush(country, action) {
  const cost = Math.min(country.treasury * 0.11, 170_000_000);

  if (cost <= 12_000_000) return;

  country.treasury -= cost;
  country.research += Math.round(cost / 1_100_000);
  country.cyber += Math.round(cost / 750_000);
  country.gdp += cost * 0.25;

  maybeLogAI(country, "⚗️", `${country.name} aumenta su inversión en I+D.`);
}

/* =========================================================
   LOGGING IA
========================================================= */

function maybeLogAI(country, icon, message) {
  const important =
    country.name === NEXUS.selectedCountry ||
    country.relation < 35 ||
    country.powerRank <= 6 ||
    Math.random() < 0.35;

  if (important) {
    addEvent(icon, message);
  }
}

/* =========================================================
   OPERACIONES HÍBRIDAS
========================================================= */

function executeHybridOperation(attacker, target, type) {
  const attackPower = attacker.cyber + attacker.research * 0.4;
  const defensePower = target.cyber + target.stability * 12;
  const probability = clamp(attackPower / Math.max(attackPower + defensePower, 1), 0.05, 0.85);

  if (Math.random() > probability) {
    attacker.relation = clamp(attacker.relation - 1.5, 0, 100);
    addEvent("🚨", `Operación híbrida fallida atribuida a ${attacker.name}.`);
    return false;
  }

  switch (type) {
    case "grid":
      target.energyProduction = Math.max(0, target.energyProduction - 5_000);
      target.stability = clamp(target.stability - 0.6, 0, 100);
      addEvent("⚡", `${target.name} sufre sabotaje en su red eléctrica.`);
      break;

    case "finance":
      target.treasury = Math.max(0, target.treasury - 90_000_000);
      target.economicStress = clamp((target.economicStress || 0) + 3, 0, 100);
      addEvent("💸", `${target.name} sufre un ataque financiero.`);
      break;

    case "disinformation":
      target.happiness = clamp(target.happiness - 1.2, 0, 100);
      target.stability = clamp(target.stability - 1.5, 0, 100);
      addEvent("📡", `${target.name} sufre una campaña de desinformación.`);
      break;

    default:
      console.warn("Operación híbrida desconocida:", type);
  }

  return true;
}

/* =========================================================
   INTEGRACIÓN
   Llamar runWorldAI() desde simulateOneDay() si queremos
   sustituir o complementar la IA simple de simulation.js.
========================================================= */

function runAITick() {
  runWorldAI();
}

/* =========================================================
   EXPORT GLOBAL
========================================================= */

window.AI_CONFIG = AI_CONFIG;

window.runWorldAI = runWorldAI;
window.runCountryAIDecision = runCountryAIDecision;
window.ensureAIFields = ensureAIFields;
window.updateAIMemory = updateAIMemory;
window.calculateAIDesperation = calculateAIDesperation;

window.scoreAIActions = scoreAIActions;
window.selectTopAIActions = selectTopAIActions;
window.executeAIAction = executeAIAction;

window.aiIndustrialStimulus = aiIndustrialStimulus;
window.aiGreenTransition = aiGreenTransition;
window.aiEnergyExpansion = aiEnergyExpansion;
window.aiMilitaryExpansion = aiMilitaryExpansion;
window.aiCyberExpansion = aiCyberExpansion;
window.aiDiplomaticOutreach = aiDiplomaticOutreach;
window.aiSanctionPlayerAdvanced = aiSanctionPlayerAdvanced;
window.aiBreakTreatyAdvanced = aiBreakTreatyAdvanced;
window.aiAusterity = aiAusterity;
window.aiInnovationPush = aiInnovationPush;

window.executeHybridOperation = executeHybridOperation;
window.runAITick = runAITick;
