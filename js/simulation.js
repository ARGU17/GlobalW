/* =========================================================
   NEXUS RTS — SIMULATION.JS
   Motor de simulación:
   tiempo, economía, población, energía, CO₂, construcción,
   políticas nacionales, IA básica y eventos.
   ========================================================= */

"use strict";

/* =========================================================
   SIMULACIÓN PRINCIPAL
========================================================= */

function simulateOneDay() {
  const country = getSelectedCountry();

  if (!country) return;

  advanceSimulationDate(1);

  simulateSelectedCountry(country);
  simulateConstructionQueue(country);
  simulateMilitaryProductionQueue(country);
  simulateForeignCountries();
  simulateMarkets();
  simulateClimateSystem();
  simulateRandomEvents(country);

  rankCountriesByMilitaryPower();
}

/* =========================================================
   PAÍS SELECCIONADO
========================================================= */

function simulateSelectedCountry(country) {
  const dailyFiscalBalance = calculateDailyFiscalBalance(country);
  const populationDelta = calculateDailyPopulationDelta(country);
  const gdpDelta = calculateDailyGDPDelta(country);
  const energyDelta = calculateDailyEnergyDelta(country);
  const co2Delta = calculateDailyCO2Delta(country);

  country.treasury += dailyFiscalBalance;
  country.population += populationDelta;
  country.gdp += gdpDelta;
  country.energyProduction += energyDelta;
  country.co2 += co2Delta;

  country.happiness = clamp(
    country.happiness + calculateDailyHappinessDelta(country),
    5,
    95
  );

  country.stability = clamp(
    country.stability + calculateDailyStabilityDelta(country),
    5,
    98
  );

  country.relation = clamp(
    country.relation + calculateDailyDiplomacyDelta(country),
    0,
    100
  );

  country.climateRisk = clamp(
    calculateClimateRisk(country),
    0,
    100
  );

  country.unemployment = Math.max(
    0,
    country.unemployment + calculateDailyUnemploymentDelta(country)
  );

  country.foodProduction = Math.max(
    0,
    country.foodProduction + calculateDailyFoodDelta(country)
  );

  country.waterProduction = Math.max(
    0,
    country.waterProduction + calculateDailyWaterDelta(country)
  );

  country.cyber = Math.max(
    0,
    country.cyber + calculateDailyCyberDelta(country)
  );
}

/* =========================================================
   PAÍSES IA
========================================================= */

function simulateForeignCountries() {
  NEXUS.state.countries.forEach(country => {
    if (country.name === NEXUS.selectedCountry) return;

    const gdpNoise = randomBetween(-0.00002, 0.00008);
    const stabilityNoise = randomBetween(-0.05, 0.05);
    const relationNoise = randomBetween(-0.08, 0.08);

    country.gdp += Math.round(country.gdp * gdpNoise);
    country.population += Math.round((country.happiness - 55) * 7);
    country.co2 += Math.max(0, Math.round(country.installedPower * randomBetween(3, 9)));

    country.energyProduction = Math.max(
      0,
      country.energyProduction + Math.round(randomBetween(-120, 170))
    );

    country.happiness = clamp(
      country.happiness + randomBetween(-0.04, 0.04),
      5,
      95
    );

    country.stability = clamp(
      country.stability + stabilityNoise,
      5,
      95
    );

    country.relation = clamp(
      country.relation + relationNoise,
      0,
      100
    );

    country.climateRisk = clamp(
      calculateClimateRisk(country),
      0,
      100
    );

    runCountryAI(country);
  });
}

function runCountryAI(country) {
  const desperation =
    (100 - country.stability) * 0.35 +
    (100 - country.happiness) * 0.25 +
    country.sanctions * 0.9 +
    Math.max(0, -country.treasury / 1_000_000_000) * 10;

  country.desperation = clamp(desperation, 0, 100);

  if (country.desperation > 72 && Math.random() < 0.025) {
    aiBreakTreaty(country);
  }

  if (country.desperation > 55 && country.treasury > 150_000_000 && Math.random() < 0.02) {
    aiStimulus(country);
  }

  if (country.relation < 25 && Math.random() < 0.018) {
    aiSanctionPlayer(country);
  }

  if (
    country.military > getSelectedCountry().military * 1.6 &&
    country.relation < 20 &&
    Math.random() < 0.012
  ) {
    aiMilitaryCrisis(country);
  }
}

function aiBreakTreaty(country) {
  country.relation = clamp(country.relation - 6, 0, 100);
  country.reputation = clamp(country.reputation - 5, 0, 100);
  country.gdp += 85_000_000;
  country.co2 += 950_000;
  country.sanctions += 2;

  addEvent("🌐", `${country.name} viola un tratado internacional para sostener su economía.`);
}

function aiStimulus(country) {
  country.treasury -= 150_000_000;
  country.gdp += 110_000_000;
  country.unemployment = Math.max(0, country.unemployment - 4_000);
  country.co2 += 500_000;

  addEvent("📈", `${country.name} aprueba un estímulo industrial nacional.`);
}

function aiSanctionPlayer(country) {
  const player = getSelectedCountry();

  player.sanctions += 1;
  player.relation = clamp(player.relation - 1.5, 0, 100);

  addEvent("⛔", `${country.name} impulsa sanciones diplomáticas contra ${player.name}.`);
}

function aiMilitaryCrisis(country) {
  const player = getSelectedCountry();

  player.warRisk = clamp(player.warRisk + 8, 0, 100);
  player.stability = clamp(player.stability - 1.2, 0, 100);

  addEvent("🚨", `Crisis militar: ${country.name} moviliza fuerzas cerca de la esfera de influencia de ${player.name}.`);
}

/* =========================================================
   ECONOMÍA
========================================================= */

function calculateDailyFiscalBalance(country) {
  const taxIncome = country.gdp / 365 * country.taxRate;
  const exportsIncome = country.exports / 365 * 0.03;
  const importsCost = country.imports / 365 * 0.025;
  const militaryCost = country.military * 55;
  const energyCost = Math.max(0, country.energyDemand - country.energyProduction) * 180;
  const debtCost = country.debt * 0.000015;
  const sanctionsCost = country.sanctions * 2_500_000;

  return Math.round(
    taxIncome +
    exportsIncome -
    importsCost -
    militaryCost -
    energyCost -
    debtCost -
    sanctionsCost
  );
}

function calculateDailyGDPDelta(country) {
  const baselineGrowth = country.gdp * 0.00004;
  const stabilityEffect = (country.stability - 60) * 400_000;
  const happinessEffect = (country.happiness - 60) * 220_000;
  const energyDeficit = Math.max(0, country.energyDemand - country.energyProduction);
  const energyPenalty = energyDeficit * 700;
  const sanctionsPenalty = country.sanctions * 1_800_000;
  const climatePenalty = country.climateRisk * 95_000;

  const delta =
    baselineGrowth +
    stabilityEffect +
    happinessEffect -
    energyPenalty -
    sanctionsPenalty -
    climatePenalty +
    randomBetween(-4_000_000, 8_000_000);

  return Math.round(delta);
}

function calculateDailyPopulationDelta(country) {
  const base = country.population * 0.000008;
  const happinessPull = (country.happiness - 55) * 30;
  const stabilityPull = (country.stability - 55) * 18;
  const pollutionPenalty = country.co2 / 90_000_000;
  const warPenalty = country.warRisk ? country.warRisk * 15 : 0;
  const migration = happinessPull + stabilityPull - pollutionPenalty - warPenalty;

  return Math.round(base + migration);
}

function calculateDailyUnemploymentDelta(country) {
  const gdpEffect = country.gdp > country.previousGDP ? -120 : 90;
  const stabilityEffect = country.stability > 65 ? -25 : 35;
  const energyDeficit = Math.max(0, country.energyDemand - country.energyProduction);

  return Math.round(gdpEffect + stabilityEffect + energyDeficit * 0.02);
}

function calculateDailyHappinessDelta(country) {
  const economyEffect = country.gdpPerCapita / 100_000 * 0.015;
  const stabilityEffect = (country.stability - 60) * 0.001;
  const unemploymentEffect = -country.unemployment / country.population * 0.8;
  const pollutionEffect = -country.co2 / 2_000_000_000;
  const sanctionsEffect = -country.sanctions * 0.006;
  const warEffect = -(country.warRisk || 0) * 0.002;

  return (
    economyEffect +
    stabilityEffect +
    unemploymentEffect +
    pollutionEffect +
    sanctionsEffect +
    warEffect +
    randomBetween(-0.03, 0.04)
  );
}

function calculateDailyStabilityDelta(country) {
  const happinessEffect = (country.happiness - 65) * 0.002;
  const fiscalEffect = country.treasury > 0 ? 0.006 : -0.015;
  const unemploymentEffect = -country.unemployment / country.population * 0.55;
  const sanctionsEffect = -country.sanctions * 0.004;
  const warEffect = -(country.warRisk || 0) * 0.004;

  return (
    happinessEffect +
    fiscalEffect +
    unemploymentEffect +
    sanctionsEffect +
    warEffect +
    randomBetween(-0.025, 0.025)
  );
}

function calculateDailyDiplomacyDelta(country) {
  const democracyBonus = country.government === "Democracia" ? 0.01 : -0.005;
  const sanctionsEffect = -country.sanctions * 0.006;
  const pollutionEffect = -country.co2 / 8_000_000_000;
  const stabilityEffect = (country.stability - 60) * 0.0005;

  return democracyBonus + sanctionsEffect + pollutionEffect + stabilityEffect;
}

/* =========================================================
   ENERGÍA / RECURSOS / CLIMA
========================================================= */

function calculateDailyEnergyDelta(country) {
  const infrastructureEffect = country.installedPower - country.energyProduction;
  return Math.round(infrastructureEffect * 0.002);
}

function calculateDailyFoodDelta(country) {
  const climatePenalty = country.climateRisk * 12;
  const stabilityBonus = country.stability * 5;
  return Math.round(stabilityBonus - climatePenalty + randomBetween(-300, 400));
}

function calculateDailyWaterDelta(country) {
  const climatePenalty = country.climateRisk * 18;
  const infrastructureBonus = country.stability * 8;
  return Math.round(infrastructureBonus - climatePenalty + randomBetween(-500, 500));
}

function calculateDailyCO2Delta(country) {
  const industrialCO2 = country.gdp / 7_000_000;
  const energyCO2 = country.installedPower * 7;
  const renewableOffset = country.renewablesMW ? country.renewablesMW * 12 : 0;
  const policyOffset = country.greenPolicy ? 35_000 : 0;

  return Math.max(
    0,
    Math.round(industrialCO2 + energyCO2 - renewableOffset - policyOffset)
  );
}

function calculateClimateRisk(country) {
  const co2Factor = country.co2 / 140_000_000;
  const waterFactor = Math.max(0, 1_000_000 - country.waterProduction) / 35_000;
  const heatFactor = getGlobalTemperatureDelta() * 18;

  return Math.round(co2Factor + waterFactor + heatFactor);
}

function getGlobalCO2PPM() {
  const totalCO2 = NEXUS.state.countries.reduce((sum, c) => sum + c.co2, 0);
  return 422.1 + totalCO2 / 100_000_000_000;
}

function getGlobalTemperatureDelta() {
  return 1.28 + (getGlobalCO2PPM() - 422.1) * 0.018;
}

function simulateClimateSystem() {
  const globalTemp = getGlobalTemperatureDelta();

  if (Math.random() < globalTemp * 0.006) {
    const vulnerable = [...NEXUS.state.countries].sort(
      (a, b) => b.climateRisk - a.climateRisk
    )[0];

    if (vulnerable) {
      applyClimateDisaster(vulnerable);
    }
  }
}

function applyClimateDisaster(country) {
  const damage = Math.round(country.gdp * randomBetween(0.00008, 0.00022));

  country.treasury -= damage;
  country.happiness = clamp(country.happiness - randomBetween(0.3, 1.2), 0, 100);
  country.stability = clamp(country.stability - randomBetween(0.2, 0.8), 0, 100);

  addEvent(
    "🌪️",
    `Desastre climático en ${country.name}: daños estimados de ${formatEuro(damage)}.`
  );
}

/* =========================================================
   CONSTRUCCIÓN
========================================================= */

function startConstruction(buildingId, regionId) {
  const country = getSelectedCountry();
  const building = findBuildingById(buildingId);

  if (!building) {
    console.warn("Edificio no encontrado:", buildingId);
    return;
  }

  const region = findRegion(country, regionId);
  const cost = getConstructionCost(building, region);
  const duration = getConstructionDuration(building, region);

  if (country.treasury < cost) {
    addEvent(
      "⛔",
      `Tesorería insuficiente para construir ${building.name}. Faltan ${formatEuro(cost - country.treasury)}.`
    );
    renderAll();
    return;
  }

  country.treasury -= cost;

  country.constructionQueue.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    buildingId,
    regionId: region.id,
    buildingName: building.name,
    icon: building.icon,
    totalDays: duration,
    remainingDays: duration,
    cost,
    targetLevel: region.buildingId === buildingId ? region.level + 1 : 1
  });

  addEvent(
    "🏗️",
    `Iniciada construcción: ${building.name} en ${region.name}. Coste: ${formatEuro(cost)}.`
  );

  renderAll();
}

function simulateConstructionQueue(country) {
  if (!country.constructionQueue) {
    country.constructionQueue = [];
  }

  country.constructionQueue.forEach(project => {
    project.remainingDays -= 1;
  });

  const completed = country.constructionQueue.filter(
    project => project.remainingDays <= 0
  );

  country.constructionQueue = country.constructionQueue.filter(
    project => project.remainingDays > 0
  );

  completed.forEach(project => completeConstruction(country, project));
}

function completeConstruction(country, project) {
  const building = findBuildingById(project.buildingId);
  const region = findRegion(country, project.regionId);

  if (!building || !region) return;

  region.buildingId = building.id;
  region.level = project.targetLevel;

  country.gdp += building.gdp || 0;
  country.population += building.population || 0;
  country.laborForce += building.jobs || 0;
  country.unemployment = Math.max(0, country.unemployment - (building.jobs || 0));
  country.energyProduction += building.energy || 0;
  country.installedPower += Math.max(0, building.energy || 0);
  country.co2 += building.co2 || 0;
  country.happiness = clamp(country.happiness + (building.happiness || 0), 0, 100);
  country.research += building.research || 0;
  country.military += building.military || 0;
  country.cyber += building.cyber || 0;
  country.exports += Math.round((building.gdp || 0) * 0.12);

  if (building.renewableMW) {
    country.renewablesMW = (country.renewablesMW || 0) + building.renewableMW;
  }

  addEvent(
    "✅",
    `${country.name} completa ${building.name} en ${region.name}. Nivel ${region.level}.`
  );
}

function getConstructionCost(building, region) {
  const levelMultiplier =
    region && region.buildingId === building.id
      ? 1 + region.level * 0.65
      : 1;

  return Math.round(building.cost * levelMultiplier);
}

function getConstructionDuration(building, region) {
  const levelMultiplier =
    region && region.buildingId === building.id
      ? 0.55 + region.level * 0.2
      : 1;

  return Math.round(building.days * levelMultiplier);
}

function findBuildingById(buildingId) {
  for (const category of Object.values(BUILDINGS)) {
    const building = category.find(item => item.id === buildingId);
    if (building) return building;
  }

  return null;
}

function findRegion(country, regionId) {
  if (!country.regions || country.regions.length === 0) {
    initializeCountrySites(country);
  }

  if (!regionId) {
    return country.regions[0];
  }

  return country.regions.find(region => region.id === regionId) || country.regions[0];
}

/* =========================================================
   POLÍTICAS NACIONALES
========================================================= */

function executePolicy(policyId) {
  const country = getSelectedCountry();

  const policies = {
    stimulus: {
      cost: 250_000_000,
      execute: () => {
        country.gdp += 180_000_000;
        country.co2 += 1_200_000;
        country.laborForce += 8_500;
        country.unemployment = Math.max(0, country.unemployment - 8_500);
        addEvent("📈", "Estímulo industrial aprobado.");
      }
    },

    green: {
      cost: 220_000_000,
      execute: () => {
        country.co2 = Math.max(0, country.co2 - 3_200_000);
        country.relation = clamp(country.relation + 3, 0, 100);
        country.happiness = clamp(country.happiness + 1.2, 0, 100);
        country.greenPolicy = true;
        addEvent("🌱", "Programa de transición verde aprobado.");
      }
    },

    military: {
      cost: 200_000_000,
      execute: () => {
        country.military += 9_500;
        country.stability = clamp(country.stability + 0.6, 0, 100);
        country.warRisk = clamp((country.warRisk || 0) + 1.5, 0, 100);
        addEvent("🛡️", "Programa de rearme ejecutado.");
      }
    },

    research: {
      cost: 180_000_000,
      execute: () => {
        country.research += 160;
        country.cyber += 150;
        country.gdp += 55_000_000;
        addEvent("⚗️", "Plan nacional de I+D ejecutado.");
      }
    },

    taxup: {
      cost: 0,
      execute: () => {
        country.taxRate = clamp(country.taxRate + 0.01, 0.05, 0.55);
        country.treasury += 90_000_000;
        country.happiness = clamp(country.happiness - 0.8, 0, 100);
        addEvent("💶", "Subida fiscal aplicada.");
      }
    },

    taxdown: {
      cost: 60_000_000,
      execute: () => {
        country.taxRate = clamp(country.taxRate - 0.01, 0.05, 0.55);
        country.happiness = clamp(country.happiness + 0.9, 0, 100);
        addEvent("🧾", "Rebaja fiscal aplicada.");
      }
    }
  };

  const policy = policies[policyId];

  if (!policy) {
    console.warn("Política no reconocida:", policyId);
    return;
  }

  if (country.treasury < policy.cost) {
    addEvent(
      "⛔",
      `Tesorería insuficiente para ejecutar política. Faltan ${formatEuro(policy.cost - country.treasury)}.`
    );
    renderAll();
    return;
  }

  country.treasury -= policy.cost;
  policy.execute();

  renderAll();
}

/* =========================================================
   MERCADOS
========================================================= */

function simulateMarkets() {
  if (!NEXUS.state.market) return;

  const country = getSelectedCountry();

  NEXUS.state.market.forEach(asset => {
    const macroEffect =
      country.stability * 0.002 +
      country.happiness * 0.001 +
      country.research * 0.0003 -
      country.sanctions * 0.01 -
      country.climateRisk * 0.0008;

    const noise = randomBetween(-1.5, 1.8);
    asset.delta = noise + macroEffect;
    asset.price = Math.max(2, asset.price * (1 + asset.delta / 100));
  });
}

/* =========================================================
   EVENTOS ALEATORIOS
========================================================= */

function simulateRandomEvents(country) {
  if (Math.random() < 0.012) {
    cyberAttackEvent(country);
  }

  if (country.stability < 38 && Math.random() < 0.035) {
    protestEvent(country);
  }

  if (country.energyProduction < country.energyDemand && Math.random() < 0.025) {
    energyShortageEvent(country);
  }

  if (Math.random() < 0.018) {
    marketNewsEvent();
  }
}

function cyberAttackEvent(country) {
  const loss = Math.round(randomBetween(30_000_000, 120_000_000));

  country.treasury = Math.max(0, country.treasury - loss);
  country.stability = clamp(country.stability - 0.8, 0, 100);
  country.cyber = Math.max(0, country.cyber - 10);

  addEvent(
    "🕶️",
    `Ciberataque financiero contra ${country.name}: pérdidas de ${formatEuro(loss)}.`
  );
}

function protestEvent(country) {
  const cost = Math.round(randomBetween(20_000_000, 80_000_000));

  country.treasury -= cost;
  country.happiness = clamp(country.happiness - 1.4, 0, 100);
  country.stability = clamp(country.stability - 1.8, 0, 100);

  addEvent(
    "🔥",
    `Protestas internas en ${country.name}: coste de estabilización de ${formatEuro(cost)}.`
  );
}

function energyShortageEvent(country) {
  const penalty = Math.round(country.gdp * 0.00005);

  country.gdp -= penalty;
  country.happiness = clamp(country.happiness - 0.5, 0, 100);

  addEvent(
    "⚡",
    `Déficit energético en ${country.name}: impacto económico de ${formatEuro(penalty)}.`
  );
}

function marketNewsEvent() {
  const msg = randomBetween(0, 1) > 0.5
    ? "Los mercados internacionales reaccionan positivamente a la estabilidad macroeconómica."
    : "Los mercados internacionales muestran volatilidad por riesgo geopolítico.";

  addEvent("📰", msg);
}

function calculateDailyCyberDelta(country) {
  const researchEffect = country.research * 0.0008;
  const stabilityEffect = country.stability > 65 ? 0.08 : -0.03;
  const fundingEffect = country.treasury > 100_000_000 ? 0.05 : -0.02;
  const sanctionsEffect = country.sanctions * 0.01;

  return Math.max(
    0,
    researchEffect + stabilityEffect + fundingEffect - sanctionsEffect
  );
}

/* =========================================================
   EXPORT GLOBAL
========================================================= */

window.simulateOneDay = simulateOneDay;

window.simulateSelectedCountry = simulateSelectedCountry;
window.simulateForeignCountries = simulateForeignCountries;
window.runCountryAI = runCountryAI;

window.calculateDailyFiscalBalance = calculateDailyFiscalBalance;
window.calculateDailyGDPDelta = calculateDailyGDPDelta;
window.calculateDailyPopulationDelta = calculateDailyPopulationDelta;
window.calculateDailyEnergyDelta = calculateDailyEnergyDelta;
window.calculateDailyCO2Delta = calculateDailyCO2Delta;
window.calculateClimateRisk = calculateClimateRisk;
window.getGlobalCO2PPM = getGlobalCO2PPM;
window.getGlobalTemperatureDelta = getGlobalTemperatureDelta;

window.startConstruction = startConstruction;
window.simulateConstructionQueue = simulateConstructionQueue;
window.completeConstruction = completeConstruction;
window.getConstructionCost = getConstructionCost;
window.getConstructionDuration = getConstructionDuration;
window.findBuildingById = findBuildingById;
window.findRegion = findRegion;

window.executePolicy = executePolicy;
window.simulateMarkets = simulateMarkets;

window.calculateDailyCyberDelta = calculateDailyCyberDelta;
