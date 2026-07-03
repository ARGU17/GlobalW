/* =========================================================
   NEXUS RTS — DIPLOMACY.JS
   Sistema diplomático:
   - relaciones bilaterales
   - sanciones
   - tratados
   - bloques internacionales
   - reputación
   - tensión mundial
   - votaciones estilo ONU
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURACIÓN DIPLOMÁTICA
========================================================= */

const DIPLOMACY_CONFIG = {
  defaultRelation: 55,
  maxRelation: 100,
  minRelation: 0,

  worldTensionDecayPerDay: 0.015,
  sanctionCostPerLevel: 2_500_000,
  treatyTrustGain: 0.8,
  treatyBreakPenalty: 6.5,

  councilVoteThreshold: 0.58,
  allianceThreshold: 72,
  hostileThreshold: 25
};

/* =========================================================
   TIPOS DE TRATADOS
========================================================= */

const TREATY_TYPES = {
  climate: {
    id: "climate",
    icon: "🌱",
    name: "Tratado climático",
    description: "Reduce emisiones, mejora reputación, limita crecimiento industrial contaminante.",
    upkeepPerDay: 900_000,
    reputationGain: 0.012,
    co2ReductionPerDay: 22_000
  },

  trade: {
    id: "trade",
    icon: "🚢",
    name: "Tratado comercial",
    description: "Aumenta exportaciones e importaciones, mejora PIB, eleva dependencia exterior.",
    upkeepPerDay: 300_000,
    exportGainPerDay: 1_500_000,
    importGainPerDay: 900_000,
    relationGain: 0.01
  },

  defense: {
    id: "defense",
    icon: "🛡️",
    name: "Tratado de defensa",
    description: "Reduce riesgo militar externo, pero aumenta tensión con rivales.",
    upkeepPerDay: 1_600_000,
    militaryReadinessGain: 65,
    relationGain: 0.008,
    tensionGain: 0.018
  },

  research: {
    id: "research",
    icon: "⚗️",
    name: "Acuerdo científico",
    description: "Aumenta investigación y cyber-capacidad mediante cooperación internacional.",
    upkeepPerDay: 700_000,
    researchGainPerDay: 0.35,
    cyberGainPerDay: 0.18,
    relationGain: 0.012
  },

  migration: {
    id: "migration",
    icon: "👥",
    name: "Acuerdo migratorio",
    description: "Gestiona flujos migratorios y mejora mano de obra, con coste social inicial.",
    upkeepPerDay: 450_000,
    populationGainPerDay: 120,
    laborGainPerDay: 75,
    happinessPenaltyPerDay: 0.002
  }
};

/* =========================================================
   BLOQUES INTERNACIONALES
========================================================= */

const DIPLOMATIC_BLOCS = {
  eu: {
    id: "eu",
    name: "Unión Europea",
    icon: "🇪🇺",
    members: ["España", "Francia", "Alemania", "Italia", "Portugal", "Suecia"],
    tradeBonus: 0.08,
    researchBonus: 0.06,
    relationBonus: 6
  },

  nato: {
    id: "nato",
    name: "OTAN",
    icon: "🛡️",
    members: ["España", "Francia", "Alemania", "Italia", "Portugal", "Reino Unido", "Estados Unidos", "Noruega", "Suecia", "Turquía"],
    militaryBonus: 0.08,
    deterrenceBonus: 8,
    tensionBonus: 2
  },

  brics: {
    id: "brics",
    name: "BRICS ampliado",
    icon: "🌐",
    members: ["Brasil", "Rusia", "India", "China"],
    tradeBonus: 0.06,
    industrialBonus: 0.05,
    relationBonus: 4
  },

  neutral: {
    id: "neutral",
    name: "Países no alineados",
    icon: "⚖️",
    members: [],
    relationBonus: 2,
    tensionReduction: 3
  }
};

/* =========================================================
   INICIALIZACIÓN DIPLOMÁTICA
========================================================= */

function initializeDiplomacy() {
  if (!NEXUS?.state?.countries) return;

  NEXUS.state.diplomacy ??= {
    relations: {},
    treaties: [],
    blocs: structuredCloneSafe(DIPLOMATIC_BLOCS),
    councilResolutions: [],
    worldTension: NEXUS.state.global?.worldTension ?? 18
  };

  initializeBilateralRelations();
  initializeDefaultTreaties();
  applyBlocMemberships();

  addEvent("🌐", "Sistema diplomático inicializado.");
}

function initializeBilateralRelations() {
  const countries = NEXUS.state.countries;
  const relations = NEXUS.state.diplomacy.relations;

  countries.forEach(a => {
    countries.forEach(b => {
      if (a.name === b.name) return;

      const key = relationKey(a.name, b.name);

      if (relations[key] !== undefined) return;

      relations[key] = calculateInitialRelation(a, b);
    });
  });
}

function calculateInitialRelation(a, b) {
  let value = DIPLOMACY_CONFIG.defaultRelation;

  if (a.government === b.government) value += 8;
  if (a.ideology === b.ideology) value += 6;

  if (sharesBloc(a.name, b.name, "eu")) value += 16;
  if (sharesBloc(a.name, b.name, "nato")) value += 12;
  if (sharesBloc(a.name, b.name, "brics")) value += 10;

  if (a.government === "Autoritario" && b.government === "Democracia") value -= 10;
  if (b.government === "Autoritario" && a.government === "Democracia") value -= 10;

  const gdpRatio = Math.min(a.gdp, b.gdp) / Math.max(a.gdp, b.gdp);
  value += gdpRatio * 4;

  return clamp(value + randomBetween(-5, 5), 0, 100);
}

function initializeDefaultTreaties() {
  const treaties = NEXUS.state.diplomacy.treaties;

  if (treaties.length > 0) return;

  createTreaty("climate", ["España", "Francia", "Alemania", "Italia", "Portugal", "Suecia", "Noruega"]);
  createTreaty("trade", ["España", "Francia", "Alemania", "Italia", "Portugal"]);
  createTreaty("defense", ["España", "Francia", "Alemania", "Reino Unido", "Estados Unidos"]);
  createTreaty("research", ["España", "Alemania", "Francia", "Suecia"]);
}

function applyBlocMemberships() {
  const countries = NEXUS.state.countries;

  countries.forEach(country => {
    country.blocs = [];

    Object.values(DIPLOMATIC_BLOCS).forEach(bloc => {
      if (bloc.members.includes(country.name)) {
        country.blocs.push(bloc.id);
      }
    });
  });
}

/* =========================================================
   TICK DIPLOMÁTICO
========================================================= */

function runDiplomacyTick() {
  if (!NEXUS?.state?.diplomacy) {
    initializeDiplomacy();
  }

  decayWorldTension();
  applyTreatyEffects();
  updateBilateralRelations();
  processCouncilResolutions();
  evaluateDiplomaticCrises();
}

function decayWorldTension() {
  NEXUS.state.diplomacy.worldTension = clamp(
    NEXUS.state.diplomacy.worldTension - DIPLOMACY_CONFIG.worldTensionDecayPerDay,
    0,
    100
  );

  if (NEXUS.state.global) {
    NEXUS.state.global.worldTension = NEXUS.state.diplomacy.worldTension;
  }
}

function applyTreatyEffects() {
  const treaties = NEXUS.state.diplomacy.treaties;

  treaties.forEach(treaty => {
    if (!treaty.active) return;

    const type = TREATY_TYPES[treaty.type];

    treaty.members.forEach(countryName => {
      const country = findCountryByName(countryName);
      if (!country) return;

      applyTreatyEffectToCountry(country, type, treaty);
    });
  });
}

function applyTreatyEffectToCountry(country, type, treaty) {
  if (!type) return;

  country.treasury -= type.upkeepPerDay || 0;

  if (type.reputationGain) {
    country.reputation = clamp((country.reputation || 60) + type.reputationGain, 0, 100);
  }

  if (type.co2ReductionPerDay) {
    country.co2 = Math.max(0, country.co2 - type.co2ReductionPerDay);
  }

  if (type.exportGainPerDay) {
    country.exports += type.exportGainPerDay;
  }

  if (type.importGainPerDay) {
    country.imports += type.importGainPerDay;
  }

  if (type.researchGainPerDay) {
    country.research += type.researchGainPerDay;
  }

  if (type.cyberGainPerDay) {
    country.cyber += type.cyberGainPerDay;
  }

  if (type.militaryReadinessGain) {
    country.military += type.militaryReadinessGain;
  }

  if (type.populationGainPerDay) {
    country.population += type.populationGainPerDay;
  }

  if (type.laborGainPerDay) {
    country.laborForce += type.laborGainPerDay;
  }

  if (type.happinessPenaltyPerDay) {
    country.happiness = clamp(country.happiness - type.happinessPenaltyPerDay, 0, 100);
  }
}

function updateBilateralRelations() {
  const countries = NEXUS.state.countries;

  countries.forEach(a => {
    countries.forEach(b => {
      if (a.name === b.name) return;

      const key = relationKey(a.name, b.name);
      const current = NEXUS.state.diplomacy.relations[key] ?? DIPLOMACY_CONFIG.defaultRelation;
      const delta = calculateRelationDelta(a, b);

      NEXUS.state.diplomacy.relations[key] = clamp(current + delta, 0, 100);
    });
  });
}

function calculateRelationDelta(a, b) {
  let delta = 0;

  if (sharesAnyBloc(a.name, b.name)) delta += 0.015;
  if (hasSharedTreaty(a.name, b.name)) delta += 0.018;

  delta += ((a.relation + b.relation) / 2 - 55) * 0.0002;

  delta -= Math.abs(a.government === b.government ? 0 : 1) * 0.006;
  delta -= (a.sanctions || 0) * 0.001;
  delta -= (b.sanctions || 0) * 0.001;

  if (a.co2 > 1_000_000_000 && b.government === "Democracia") delta -= 0.004;
  if (b.co2 > 1_000_000_000 && a.government === "Democracia") delta -= 0.004;

  return delta;
}

/* =========================================================
   TRATADOS
========================================================= */

function createTreaty(typeId, members) {
  const type = TREATY_TYPES[typeId];

  if (!type) {
    console.warn("Tipo de tratado no reconocido:", typeId);
    return null;
  }

  const treaty = {
    id: generateDiplomacyId("treaty"),
    type: typeId,
    name: type.name,
    icon: type.icon,
    members: [...members],
    active: true,
    createdAt: getSimulationDateLabel(),
    trust: 60
  };

  NEXUS.state.diplomacy.treaties.push(treaty);

  members.forEach(a => {
    members.forEach(b => {
      if (a === b) return;
      improveRelation(a, b, DIPLOMACY_CONFIG.treatyTrustGain);
    });
  });

  return treaty;
}

function leaveTreaty(countryName, treatyId) {
  const treaty = NEXUS.state.diplomacy.treaties.find(t => t.id === treatyId);

  if (!treaty || !treaty.members.includes(countryName)) return;

  treaty.members = treaty.members.filter(name => name !== countryName);

  const country = findCountryByName(countryName);

  if (country) {
    country.reputation = clamp((country.reputation || 60) - DIPLOMACY_CONFIG.treatyBreakPenalty, 0, 100);
    country.relation = clamp(country.relation - 2.5, 0, 100);
    country.sanctions += 0.4;
  }

  treaty.members.forEach(other => {
    worsenRelation(countryName, other, DIPLOMACY_CONFIG.treatyBreakPenalty);
  });

  increaseWorldTension(1.5);

  addEvent("🚪", `${countryName} abandona ${treaty.name}.`);
  renderAll();
}

function joinTreaty(countryName, treatyId) {
  const treaty = NEXUS.state.diplomacy.treaties.find(t => t.id === treatyId);

  if (!treaty || treaty.members.includes(countryName)) return;

  treaty.members.push(countryName);

  treaty.members.forEach(other => {
    if (other !== countryName) improveRelation(countryName, other, 2.2);
  });

  const country = findCountryByName(countryName);
  if (country) {
    country.reputation = clamp((country.reputation || 60) + 1.5, 0, 100);
  }

  addEvent("✍️", `${countryName} se une a ${treaty.name}.`);
  renderAll();
}

/* =========================================================
   SANCIONES
========================================================= */

function imposeSanction(sourceName, targetName, severity = 1) {
  const source = findCountryByName(sourceName);
  const target = findCountryByName(targetName);

  if (!source || !target) return;

  target.sanctions += severity;
  target.exports = Math.max(0, target.exports - severity * 18_000_000);
  target.imports = Math.max(0, target.imports - severity * 9_000_000);
  target.relation = clamp(target.relation - severity * 1.5, 0, 100);

  worsenRelation(sourceName, targetName, severity * 4);

  increaseWorldTension(severity * 0.7);

  addEvent("⛔", `${source.name} impone sanciones a ${target.name}. Severidad ${severity}.`);
}

function liftSanction(sourceName, targetName, severity = 1) {
  const target = findCountryByName(targetName);

  if (!target) return;

  target.sanctions = Math.max(0, target.sanctions - severity);
  improveRelation(sourceName, targetName, severity * 3);

  addEvent("✅", `${sourceName} reduce sanciones contra ${targetName}.`);
}

/* =========================================================
   CONSEJO INTERNACIONAL / ONU
========================================================= */

function proposeCouncilResolution(type, proposerName, targetName, severity = 1) {
  const resolution = {
    id: generateDiplomacyId("resolution"),
    type,
    proposerName,
    targetName,
    severity,
    createdAt: getSimulationDateLabel(),
    votes: {},
    processed: false
  };

  NEXUS.state.diplomacy.councilResolutions.push(resolution);

  addEvent("🏛️", `${proposerName} propone resolución internacional contra ${targetName}.`);

  return resolution;
}

function processCouncilResolutions() {
  const pending = NEXUS.state.diplomacy.councilResolutions.filter(r => !r.processed);

  pending.forEach(resolution => {
    voteCouncilResolution(resolution);

    if (resolutionPasses(resolution)) {
      enforceResolution(resolution);
    } else {
      addEvent("🏛️", `Resolución contra ${resolution.targetName} rechazada.`);
    }

    resolution.processed = true;
  });
}

function voteCouncilResolution(resolution) {
  NEXUS.state.countries.forEach(country => {
    resolution.votes[country.name] = calculateCouncilVote(country, resolution);
  });
}

function calculateCouncilVote(country, resolution) {
  const target = findCountryByName(resolution.targetName);
  const proposer = findCountryByName(resolution.proposerName);

  if (!target || !proposer) return false;

  let score = 50;

  const relationToTarget = getRelation(country.name, target.name);
  const relationToProposer = getRelation(country.name, proposer.name);

  score += (relationToProposer - 50) * 0.35;
  score -= (relationToTarget - 50) * 0.45;

  if (country.government === "Democracia" && target.government === "Autoritario") score += 8;
  if (sharesAnyBloc(country.name, target.name)) score -= 14;
  if (sharesAnyBloc(country.name, proposer.name)) score += 8;

  score += (target.sanctions || 0) * 2;
  score += Math.max(0, target.co2 - 1_000_000_000) / 120_000_000;

  return score > 55;
}

function resolutionPasses(resolution) {
  const votes = Object.values(resolution.votes);
  const yes = votes.filter(Boolean).length;

  return yes / Math.max(votes.length, 1) >= DIPLOMACY_CONFIG.councilVoteThreshold;
}

function enforceResolution(resolution) {
  switch (resolution.type) {
    case "sanction":
      imposeSanction(resolution.proposerName, resolution.targetName, resolution.severity);
      break;

    case "climate_warning":
      enforceClimateWarning(resolution);
      break;

    case "peacekeeping":
      enforcePeacekeeping(resolution);
      break;

    default:
      console.warn("Resolución desconocida:", resolution.type);
  }

  addEvent("🏛️", `Resolución internacional aprobada contra ${resolution.targetName}.`);
}

function enforceClimateWarning(resolution) {
  const target = findCountryByName(resolution.targetName);

  if (!target) return;

  target.reputation = clamp((target.reputation || 60) - 1.5 * resolution.severity, 0, 100);
  target.relation = clamp(target.relation - 0.8 * resolution.severity, 0, 100);
}

function enforcePeacekeeping(resolution) {
  const target = findCountryByName(resolution.targetName);

  if (!target) return;

  target.warRisk = clamp((target.warRisk || 0) - 8 * resolution.severity, 0, 100);
  target.stability = clamp(target.stability + 0.6 * resolution.severity, 0, 100);
}

/* =========================================================
   CRISIS DIPLOMÁTICAS
========================================================= */

function evaluateDiplomaticCrises() {
  const countries = NEXUS.state.countries;

  countries.forEach(country => {
    if (country.sanctions > 8 && Math.random() < 0.006) {
      proposeCouncilResolution("sanction", getSelectedCountry().name, country.name, 1);
    }

    if (country.co2 > 1_500_000_000 && Math.random() < 0.004) {
      proposeCouncilResolution("climate_warning", "Consejo Internacional", country.name, 1);
    }

    if ((country.warRisk || 0) > 70 && Math.random() < 0.01) {
      proposeCouncilResolution("peacekeeping", "Consejo Internacional", country.name, 1);
    }
  });
}

/* =========================================================
   RELACIONES BILATERALES
========================================================= */

function relationKey(a, b) {
  return [a, b].sort().join("::");
}

function getRelation(a, b) {
  if (!NEXUS?.state?.diplomacy?.relations) {
    return DIPLOMACY_CONFIG.defaultRelation;
  }

  return NEXUS.state.diplomacy.relations[relationKey(a, b)] ?? DIPLOMACY_CONFIG.defaultRelation;
}

function setRelation(a, b, value) {
  NEXUS.state.diplomacy.relations[relationKey(a, b)] = clamp(
    value,
    DIPLOMACY_CONFIG.minRelation,
    DIPLOMACY_CONFIG.maxRelation
  );
}

function improveRelation(a, b, delta) {
  setRelation(a, b, getRelation(a, b) + delta);
}

function worsenRelation(a, b, delta) {
  setRelation(a, b, getRelation(a, b) - delta);
}

function sharesBloc(aName, bName, blocId) {
  const bloc = DIPLOMATIC_BLOCS[blocId];
  if (!bloc) return false;

  return bloc.members.includes(aName) && bloc.members.includes(bName);
}

function sharesAnyBloc(aName, bName) {
  return Object.keys(DIPLOMATIC_BLOCS).some(blocId => sharesBloc(aName, bName, blocId));
}

function hasSharedTreaty(aName, bName) {
  if (!NEXUS?.state?.diplomacy?.treaties) return false;

  return NEXUS.state.diplomacy.treaties.some(treaty =>
    treaty.active &&
    treaty.members.includes(aName) &&
    treaty.members.includes(bName)
  );
}

/* =========================================================
   TENSIÓN MUNDIAL
========================================================= */

function increaseWorldTension(amount) {
  NEXUS.state.diplomacy.worldTension = clamp(
    NEXUS.state.diplomacy.worldTension + amount,
    0,
    100
  );

  if (NEXUS.state.global) {
    NEXUS.state.global.worldTension = NEXUS.state.diplomacy.worldTension;
  }
}

function decreaseWorldTension(amount) {
  NEXUS.state.diplomacy.worldTension = clamp(
    NEXUS.state.diplomacy.worldTension - amount,
    0,
    100
  );

  if (NEXUS.state.global) {
    NEXUS.state.global.worldTension = NEXUS.state.diplomacy.worldTension;
  }
}

/* =========================================================
   HELPERS
========================================================= */

function findCountryByName(name) {
  return NEXUS.state.countries.find(country => country.name === name);
}

function generateDiplomacyId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

/* =========================================================
   INTEGRACIÓN
========================================================= */

function runDiplomacySystemTick() {
  if (!NEXUS.state.diplomacy) {
    initializeDiplomacy();
  }

  runDiplomacyTick();
}

/* =========================================================
   EXPORT GLOBAL
========================================================= */

window.DIPLOMACY_CONFIG = DIPLOMACY_CONFIG;
window.TREATY_TYPES = TREATY_TYPES;
window.DIPLOMATIC_BLOCS = DIPLOMATIC_BLOCS;

window.initializeDiplomacy = initializeDiplomacy;
window.initializeBilateralRelations = initializeBilateralRelations;
window.initializeDefaultTreaties = initializeDefaultTreaties;
window.applyBlocMemberships = applyBlocMemberships;

window.runDiplomacyTick = runDiplomacyTick;
window.runDiplomacySystemTick = runDiplomacySystemTick;

window.createTreaty = createTreaty;
window.leaveTreaty = leaveTreaty;
window.joinTreaty = joinTreaty;

window.imposeSanction = imposeSanction;
window.liftSanction = liftSanction;

window.proposeCouncilResolution = proposeCouncilResolution;
window.processCouncilResolutions = processCouncilResolutions;
window.voteCouncilResolution = voteCouncilResolution;
window.enforceResolution = enforceResolution;

window.evaluateDiplomaticCrises = evaluateDiplomaticCrises;

window.relationKey = relationKey;
window.getRelation = getRelation;
window.setRelation = setRelation;
window.improveRelation = improveRelation;
window.worsenRelation = worsenRelation;

window.sharesBloc = sharesBloc;
window.sharesAnyBloc = sharesAnyBloc;
window.hasSharedTreaty = hasSharedTreaty;

window.increaseWorldTension = increaseWorldTension;
window.decreaseWorldTension = decreaseWorldTension;

window.findCountryByName = findCountryByName;
