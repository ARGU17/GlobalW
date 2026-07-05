/* =========================================================
   NEXUS RTS — SIMULATION.JS v3
   Parte 1/12
   Núcleo de simulación, constantes, calendario, helpers
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURACIÓN DEL MOTOR
========================================================= */

const SIMULATION_CONFIG = {
  daysPerYear: 365,
  monthlyDay: 30,
  quarterlyDay: 91,
  annualDay: 365,

  maxHappiness: 100,
  maxStability: 100,
  maxRelation: 100,
  maxClimateRisk: 100,

  minTaxRate: 0.05,
  maxTaxRate: 0.55,

  baseInflation: 0.027,
  baseInterestRate: 0.035,

  foodPerCapitaYear: 1.04,
  waterPerCapitaYear: 350,
  energyPerCapitaMW: 0.004,

  defaultConstructionLevelCap: 5,
  defaultPolicyIntensity: 50,

  worldTensionDecayDaily: 0.015,
  climateTemperatureSensitivity: 0.000000000035,
  co2PpmSensitivity: 0.000000000018
};

/* =========================================================
   MOTOR PRINCIPAL — UN DÍA DE SIMULACIÓN
========================================================= */

function simulateOneDay() {
  const state = NEXUS.state;
  if (!state || !state.countries) return;

  advanceSimulationDate(1);

  state.countries.forEach(country => {
    ensureCountryRuntimeFields(country);
    normalizeCountry(country);

    simulateCountryDailyEconomy(country);
    simulateCountryBudget(country);
    simulateDemography(country);
    simulateFoodAndEnergy(country);
    simulateConstructionQueue(country);
    simulateMilitaryProductionQueue(country);
    simulateTechnologyQueue(country);
    simulatePoliticalPressure(country);
  });

  simulateWorldResources();
  simulateWorldMarkets();
  simulateInternationalAI();
  simulateGlobalClimate();
  simulateGlobalEvents();

  updateWorldAggregates();
  rankCountriesByMilitaryPower();
}

/* =========================================================
   CALENDARIO
========================================================= */

function isMonthlyTick() {
  return getDayOfYear() % SIMULATION_CONFIG.monthlyDay === 0;
}

function isQuarterlyTick() {
  return getDayOfYear() % SIMULATION_CONFIG.quarterlyDay === 0;
}

function isAnnualTick() {
  return getDayOfYear() === 1;
}

function getCurrentMonthIndex() {
  return NEXUS.simDate.getMonth();
}

function getCurrentMonthName() {
  return NEXUS.simDate.toLocaleDateString("es-ES", {
    month: "long"
  });
}

/* =========================================================
   HELPERS NUMÉRICOS
========================================================= */

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function percent(value) {
  return value / 100;
}

function applyMultiplier(value, multiplier) {
  return value * multiplier;
}

function dailyFromAnnual(value) {
  return value / SIMULATION_CONFIG.daysPerYear;
}

function annualFromDaily(value) {
  return value * SIMULATION_CONFIG.daysPerYear;
}

function boundedDelta(current, delta, min = 0, max = 100) {
  return clamp(current + delta, min, max);
}

function randomChance(probability) {
  return Math.random() < probability;
}

function weightedRandom(items, weightKey = "weight") {
  const total = items.reduce((sum, item) => sum + safeNumber(item[weightKey], 1), 0);
  let roll = Math.random() * total;

  for (const item of items) {
    roll -= safeNumber(item[weightKey], 1);
    if (roll <= 0) return item;
  }

  return items[items.length - 1];
}

/* =========================================================
   IDEOLOGÍA Y RÉGIMEN
========================================================= */

function getIdeology(country) {
  return IDEOLOGIES[country.ideology] || IDEOLOGIES.liberalism;
}

function getRegime(country) {
  return REGIMES[country.regime] || REGIMES.democracy;
}

function getTaxEfficiency(country) {
  const regime = getRegime(country);
  const ideology = getIdeology(country);

  return (regime.taxEfficiency || 1) * (ideology.taxModifier || 1);
}

function getPrivateInvestmentModifier(country) {
  const ideology = getIdeology(country);
  return ideology.privateInvestmentModifier || 1;
}

function getSocialSpendingModifier(country) {
  const ideology = getIdeology(country);
  return ideology.socialSpendingModifier || 1;
}

function getMilitaryModifier(country) {
  const ideology = getIdeology(country);
  return ideology.militaryModifier || 1;
}

/* =========================================================
   MÉTRICAS BÁSICAS
========================================================= */

function calculateDailyGDPDelta(country) {
  const taxDrag = Math.max(0, country.taxRate - 0.22) * 0.012;
  const stabilityEffect = (country.stability - 60) * 0.000025;
  const happinessEffect = (country.happiness - 60) * 0.000018;
  const sanctionsEffect = country.sanctions * 0.00003;
  const researchEffect = country.research * 0.00000002;
  const investmentModifier = getPrivateInvestmentModifier(country);

  const annualGrowth =
    0.018 * investmentModifier +
    stabilityEffect +
    happinessEffect +
    researchEffect -
    taxDrag -
    sanctionsEffect;

  return country.gdp * annualGrowth / SIMULATION_CONFIG.daysPerYear;
}

function calculateDailyPopulationDelta(country) {
  const baseBirthRate = 0.0045;
  const baseDeathRate = 0.0038;
  const happinessMigration = (country.happiness - 60) * 0.000002;
  const stabilityMigration = (country.stability - 60) * 0.0000015;
  const warPenalty = country.warRisk > 50 ? -0.00004 : 0;

  const annualRate =
    baseBirthRate -
    baseDeathRate +
    happinessMigration +
    stabilityMigration +
    warPenalty;

  return country.population * annualRate / SIMULATION_CONFIG.daysPerYear;
}

function calculateDailyHappinessDelta(country) {
  const foodBalance = country.foodProduction - country.foodConsumption;
  const energyBalance = country.energyProduction - country.energyDemand;

  const foodEffect = foodBalance < 0 ? -0.004 : 0.001;
  const energyEffect = energyBalance < 0 ? -0.003 : 0.001;
  const taxEffect = -(country.taxRate - 0.20) * 0.025;
  const socialEffect = country.socialSpending / Math.max(country.gdp, 1) * 0.012;
  const pollutionEffect = -country.co2 / Math.max(country.population, 1) * 0.00003;
  const warEffect = -country.warRisk * 0.0004;

  return foodEffect + energyEffect + taxEffect + socialEffect + pollutionEffect + warEffect;
}

function calculateDailyStabilityDelta(country) {
  const regime = getRegime(country);

  const happinessEffect = (country.happiness - 60) * 0.00045;
  const debtRatio = country.debt / Math.max(country.gdp, 1);
  const debtEffect = debtRatio > 1 ? -0.004 : 0.001;
  const sanctionsEffect = -country.sanctions * 0.0008;
  const regimeEffect = (regime.stability || 0) * 0.0004;
  const warEffect = -country.warRisk * 0.00055;

  return happinessEffect + debtEffect + sanctionsEffect + regimeEffect + warEffect;
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
   MÉTRICAS INDUSTRIALES
========================================================= */

function getIndustrialIndex(country) {
  let index = 0;

  country.regions.forEach(region => {
    (region.buildings || []).forEach(item => {
      const building = findBuildingById(item.buildingId);
      if (!building) return;

      if (
        building.category === "Industrias" ||
        building.category === "Infraestructura" ||
        building.militaryIndustry
      ) {
        index += (item.level || 1) * 10;
      }
    });
  });

  return index;
}

function getIndustrialLevel(country) {
  const index = getIndustrialIndex(country);

  if (index >= 240) return 5;
  if (index >= 160) return 4;
  if (index >= 90) return 3;
  if (index >= 40) return 2;
  return 1;
}

function getEnergyBalance(country) {
  return country.energyProduction - country.energyDemand;
}

function getFoodBalance(country) {
  return country.foodProduction - country.foodConsumption;
}

function getDebtRatio(country) {
  return country.debt / Math.max(country.gdp, 1);
}

function getGlobalCO2PPM() {
  return NEXUS.state.world.co2ppm;
}

/* =========================================================
   PLACEHOLDERS SEGUROS
   Las partes siguientes sustituyen/completan estas funciones.
========================================================= */

function simulateCountryDailyEconomy(country) {}
function simulateCountryBudget(country) {}
function simulateDemography(country) {}
function simulateFoodAndEnergy(country) {}
function simulateConstructionQueue(country) {}
function simulateMilitaryProductionQueue(country) {}
function simulateTechnologyQueue(country) {}
function simulatePoliticalPressure(country) {}
function simulateWorldResources() {}
function simulateWorldMarkets() {}
function simulateInternationalAI() {}
function simulateGlobalClimate() {}
function simulateGlobalEvents() {}
function updateWorldAggregates() {}

/* =========================================================
   EXPORT GLOBAL — PARTE 1
========================================================= */

window.SIMULATION_CONFIG = SIMULATION_CONFIG;

window.simulateOneDay = simulateOneDay;

window.isMonthlyTick = isMonthlyTick;
window.isQuarterlyTick = isQuarterlyTick;
window.isAnnualTick = isAnnualTick;
window.getCurrentMonthIndex = getCurrentMonthIndex;
window.getCurrentMonthName = getCurrentMonthName;

window.safeNumber = safeNumber;
window.percent = percent;
window.applyMultiplier = applyMultiplier;
window.dailyFromAnnual = dailyFromAnnual;
window.annualFromDaily = annualFromDaily;
window.boundedDelta = boundedDelta;
window.randomChance = randomChance;
window.weightedRandom = weightedRandom;

window.getIdeology = getIdeology;
window.getRegime = getRegime;
window.getTaxEfficiency = getTaxEfficiency;
window.getPrivateInvestmentModifier = getPrivateInvestmentModifier;
window.getSocialSpendingModifier = getSocialSpendingModifier;
window.getMilitaryModifier = getMilitaryModifier;

window.calculateDailyGDPDelta = calculateDailyGDPDelta;
window.calculateDailyPopulationDelta = calculateDailyPopulationDelta;
window.calculateDailyHappinessDelta = calculateDailyHappinessDelta;
window.calculateDailyStabilityDelta = calculateDailyStabilityDelta;
window.calculateDailyCyberDelta = calculateDailyCyberDelta;

window.getIndustrialIndex = getIndustrialIndex;
window.getIndustrialLevel = getIndustrialLevel;
window.getEnergyBalance = getEnergyBalance;
window.getFoodBalance = getFoodBalance;
window.getDebtRatio = getDebtRatio;
window.getGlobalCO2PPM = getGlobalCO2PPM;


/* =========================================================
   SIMULATION.JS v3
   Parte 2.1/12
   Economía diaria: PIB, fiscalidad, inflación, deuda,
   tesorería e ingresos públicos.
   ========================================================= */

function simulateCountryDailyEconomy(country) {
  const previousGDP = country.gdp;

  const gdpDelta = calculateDailyGDPDelta(country);
  const inflationDrag = calculateInflationDrag(country);
  const resourceShock = calculateResourceShockOnGDP(country);
  const confidenceEffect = calculateBusinessConfidenceEffect(country);

  country.gdp = Math.max(
    1_000_000_000,
    country.gdp + gdpDelta + resourceShock + confidenceEffect - inflationDrag
  );

  country.previousGDP = previousGDP;

  const dailyTaxRevenue = calculateDailyTaxRevenue(country);
  const dailyTradeBalance = calculateDailyTradeBalance(country);
  const dailyStateCompanyRevenue = calculateDailyStateCompanyRevenue(country);
  const dailyDebtInterest = calculateDailyDebtInterest(country);

  country.dailyTaxRevenue = dailyTaxRevenue;
  country.dailyTradeBalance = dailyTradeBalance;
  country.dailyStateCompanyRevenue = dailyStateCompanyRevenue;
  country.dailyDebtInterest = dailyDebtInterest;

  country.treasury +=
    dailyTaxRevenue +
    dailyTradeBalance +
    dailyStateCompanyRevenue -
    dailyDebtInterest;

  if (country.treasury < 0) {
    country.debt += Math.abs(country.treasury);
    country.treasury = 0;
    country.stability = boundedDelta(country.stability, -0.015, 0, 100);
  }

  country.balance = (country.exports || 0) - (country.imports || 0);

  updateCountryInflation(country);
  updateCountryConfidence(country);
}

function calculateDailyFiscalBalance(country) {
  const income =
    calculateDailyTaxRevenue(country) +
    calculateDailyTradeBalance(country) +
    calculateDailyStateCompanyRevenue(country);

  const expenses =
    calculateDailyPublicSpending(country) +
    calculateDailyDebtInterest(country);

  return income - expenses;
}

function calculateDailyTaxRevenue(country) {
  const taxableBase = country.gdp * 0.58;
  const effectiveTaxRate = country.taxRate * getTaxEfficiency(country);
  const compliancePenalty = Math.max(0, country.taxRate - 0.36) * 0.22;
  const sanctionsPenalty = country.sanctions * 0.002;

  const annualRevenue =
    taxableBase *
    effectiveTaxRate *
    Math.max(0.58, 1 - compliancePenalty - sanctionsPenalty);

  return dailyFromAnnual(annualRevenue);
}

function calculateDailyTradeBalance(country) {
  const tradeBalance = (country.exports || 0) - (country.imports || 0);

  const sanctionsDrag = country.sanctions * 0.015;
  const stabilityModifier = 1 + (country.stability - 60) * 0.001;
  const blocBonus = getBlocTradeBonus(country);

  return dailyFromAnnual(
    tradeBalance *
    Math.max(0.35, stabilityModifier + blocBonus - sanctionsDrag)
  );
}

function calculateDailyStateCompanyRevenue(country) {
  const companies = country.companies || [];

  const controlledCompanies = companies.filter(company => company.controlled || company.stateOwned);

  if (controlledCompanies.length === 0) {
    return dailyFromAnnual(country.gdp * 0.006);
  }

  const annualRevenue = controlledCompanies.reduce((sum, company) => {
    const marketCap = company.price * company.shares;
    const dividendYield = getSectorDividendYield(company.sector);
    return sum + marketCap * dividendYield;
  }, 0);

  return dailyFromAnnual(annualRevenue);
}

function calculateDailyDebtInterest(country) {
  const debt = Math.max(0, country.debt || 0);
  const riskPremium = calculateRiskPremium(country);
  const annualRate = SIMULATION_CONFIG.baseInterestRate + riskPremium;

  return dailyFromAnnual(debt * annualRate);
}

function calculateRiskPremium(country) {
  const debtRatio = getDebtRatio(country);
  const stabilityRisk = Math.max(0, 65 - country.stability) * 0.00045;
  const sanctionRisk = country.sanctions * 0.0008;
  const warRisk = country.warRisk * 0.00035;

  const debtRisk =
    debtRatio > 1.2 ? 0.025 :
    debtRatio > 0.9 ? 0.014 :
    debtRatio > 0.6 ? 0.006 :
    0.002;

  return debtRisk + stabilityRisk + sanctionRisk + warRisk;
}

function calculateInflationDrag(country) {
  const inflation = country.inflation ?? SIMULATION_CONFIG.baseInflation;
  const excessInflation = Math.max(0, inflation - 0.03);

  return country.gdp * excessInflation * 0.000035;
}

function calculateResourceShockOnGDP(country) {
  if (!NEXUS.state.resources) return 0;

  let impact = 0;

  for (const resource of NEXUS.state.resources) {
    const definition = STRATEGIC_RESOURCES.find(r => r.id === resource.id);
    if (!definition) continue;

    const priceMove = (resource.price - resource.lastPrice) / Math.max(resource.lastPrice, 1);

    const isProducer = isCountryResourceProducer(country, resource.id);
    const isConsumer = isCountryResourceConsumer(country, resource.id);

    if (isProducer) {
      impact += country.gdp * priceMove * 0.000015;
    }

    if (isConsumer) {
      impact -= country.gdp * Math.max(0, priceMove) * 0.000012;
    }
  }

  return impact;
}

function calculateBusinessConfidenceEffect(country) {
  const ideology = getIdeology(country);

  const ideologyEffect = (ideology.businessConfidence || 0) * 0.000002;
  const stabilityEffect = (country.stability - 60) * 0.000003;
  const taxEffect = -(country.taxRate - 0.22) * 0.00004;
  const sanctionsEffect = -country.sanctions * 0.000002;
  const warEffect = -country.warRisk * 0.000003;

  return country.gdp * (
    ideologyEffect +
    stabilityEffect +
    taxEffect +
    sanctionsEffect +
    warEffect
  );
}

function updateCountryInflation(country) {
  const energyDeficit = Math.max(0, country.energyDemand - country.energyProduction);
  const foodDeficit = Math.max(0, country.foodConsumption - country.foodProduction);
  const treasuryStress = country.treasury < country.gdp * 0.0002 ? 0.004 : 0;
  const warStress = country.warRisk * 0.00005;
  const sanctionsStress = country.sanctions * 0.0002;

  const energyInflation =
    energyDeficit / Math.max(country.energyDemand, 1) * 0.035;

  const foodInflation =
    foodDeficit / Math.max(country.foodConsumption, 1) * 0.028;

  const targetInflation =
    SIMULATION_CONFIG.baseInflation +
    energyInflation +
    foodInflation +
    treasuryStress +
    warStress +
    sanctionsStress;

  country.inflation = lerp(
    country.inflation ?? SIMULATION_CONFIG.baseInflation,
    targetInflation,
    0.025
  );
}

function updateCountryConfidence(country) {
  const ideology = getIdeology(country);
  const debtRatio = getDebtRatio(country);

  const confidence =
    50 +
    (country.stability - 60) * 0.55 +
    (country.happiness - 60) * 0.22 +
    (ideology.businessConfidence || 0) -
    Math.max(0, debtRatio - 0.8) * 18 -
    country.sanctions * 0.6 -
    country.warRisk * 0.35;

  country.businessConfidence = clamp(confidence, 0, 100);
}

function calculateDailyPublicSpending(country) {
  return dailyFromAnnual(
    (country.socialSpending || 0) +
    (country.pensions || 0) +
    (country.healthSpending || 0) +
    (country.educationSpending || 0) +
    (country.defenseSpending || 0)
  );
}

function getBlocTradeBonus(country) {
  let bonus = 0;

  for (const bloc of NEXUS.state.internationalBlocs || []) {
    if (!bloc.members.includes(country.name)) continue;

    bonus += bloc.effects?.tradeBonus || 0;
  }

  return bonus;
}

function getSectorDividendYield(sector = "") {
  const s = sector.toLowerCase();

  if (s.includes("energ")) return 0.045;
  if (s.includes("finanz") || s.includes("bank")) return 0.038;
  if (s.includes("defensa")) return 0.026;
  if (s.includes("tecnolog") || s.includes("software")) return 0.012;
  if (s.includes("automoción")) return 0.018;
  if (s.includes("aliment")) return 0.024;

  return 0.02;
}

function isCountryResourceProducer(country, resourceId) {
  const name = country.name;

  const producers = {
    oil: ["Estados Unidos", "Canadá", "Arabia Saudí", "Rusia", "Irán", "Brasil", "México", "Venezuela", "Nigeria", "Argelia", "Angola"],
    gas: ["Estados Unidos", "Canadá", "Rusia", "Irán", "Argelia", "Noruega", "Arabia Saudí"],
    uranium: ["Canadá", "Australia", "Rusia", "China"],
    lithium: ["Chile", "Argentina", "Australia", "China"],
    rare_earths: ["China", "Estados Unidos", "Australia"],
    wheat: ["Estados Unidos", "Canadá", "Francia", "Rusia", "Ucrania", "Argentina", "Australia"],
    steel: ["China", "India", "Japón", "Estados Unidos", "Alemania", "Corea del Sur"],
    semiconductors: ["Estados Unidos", "China", "Japón", "Corea del Sur", "Países Bajos", "Taiwán"]
  };

  return producers[resourceId]?.includes(name) || false;
}

function isCountryResourceConsumer(country, resourceId) {
  const heavyConsumers = {
    oil: ["España", "Alemania", "Francia", "Italia", "Japón", "Corea del Sur", "India", "China"],
    gas: ["España", "Alemania", "Italia", "Francia", "Japón", "Corea del Sur", "China"],
    uranium: ["Francia", "Estados Unidos", "Japón", "China", "Corea del Sur"],
    lithium: ["España", "Alemania", "Estados Unidos", "China", "Japón", "Corea del Sur"],
    rare_earths: ["España", "Alemania", "Estados Unidos", "China", "Japón", "Corea del Sur"],
    wheat: ["Egipto", "Marruecos", "Argelia", "Nigeria", "Indonesia", "España"],
    steel: ["España", "Estados Unidos", "Alemania", "India", "China", "México"],
    semiconductors: ["España", "Alemania", "Estados Unidos", "China", "Japón", "Corea del Sur"]
  };

  return heavyConsumers[resourceId]?.includes(country.name) || false;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/* =========================================================
   EXPORT GLOBAL — PARTE 2.1
========================================================= */

window.simulateCountryDailyEconomy = simulateCountryDailyEconomy;
window.calculateDailyFiscalBalance = calculateDailyFiscalBalance;
window.calculateDailyTaxRevenue = calculateDailyTaxRevenue;
window.calculateDailyTradeBalance = calculateDailyTradeBalance;
window.calculateDailyStateCompanyRevenue = calculateDailyStateCompanyRevenue;
window.calculateDailyDebtInterest = calculateDailyDebtInterest;
window.calculateRiskPremium = calculateRiskPremium;
window.calculateInflationDrag = calculateInflationDrag;
window.calculateResourceShockOnGDP = calculateResourceShockOnGDP;
window.calculateBusinessConfidenceEffect = calculateBusinessConfidenceEffect;
window.updateCountryInflation = updateCountryInflation;
window.updateCountryConfidence = updateCountryConfidence;
window.calculateDailyPublicSpending = calculateDailyPublicSpending;
window.getBlocTradeBonus = getBlocTradeBonus;
window.getSectorDividendYield = getSectorDividendYield;
window.isCountryResourceProducer = isCountryResourceProducer;
window.isCountryResourceConsumer = isCountryResourceConsumer;
window.lerp = lerp;


/* =========================================================
   SIMULATION.JS v3
   Parte 2.2/12
   Presupuesto del Estado: sanidad, educación, pensiones,
   defensa, gasto social, déficit, superávit y deuda.
   ========================================================= */

function simulateCountryBudget(country) {
  updatePublicSpendingTargets(country);
  applyDailyPublicSpending(country);
  applyDebtAndDeficitDynamics(country);
  updateFiscalStress(country);
}

function updatePublicSpendingTargets(country) {
  const ideology = getIdeology(country);
  const regime = getRegime(country);

  const socialModifier = ideology.socialSpendingModifier || 1;
  const publicModifier = ideology.publicSpendingModifier || 1;
  const militaryModifier = getMilitaryModifier(country);

  country.targetSocialSpending = country.gdp * 0.15 * socialModifier;
  country.targetPensions = country.gdp * 0.095 * socialModifier;
  country.targetHealthSpending = country.gdp * 0.072 * socialModifier;
  country.targetEducationSpending = country.gdp * 0.052 * publicModifier;
  country.targetDefenseSpending =
    country.gdp *
    (0.018 + country.warRisk * 0.00008) *
    militaryModifier;

  if (regime.id === "authoritarian") {
    country.targetDefenseSpending *= 1.18;
    country.targetSocialSpending *= 0.92;
  }

  country.socialSpending = lerp(country.socialSpending || 0, country.targetSocialSpending, 0.01);
  country.pensions = lerp(country.pensions || 0, country.targetPensions, 0.01);
  country.healthSpending = lerp(country.healthSpending || 0, country.targetHealthSpending, 0.01);
  country.educationSpending = lerp(country.educationSpending || 0, country.targetEducationSpending, 0.01);
  country.defenseSpending = lerp(country.defenseSpending || 0, country.targetDefenseSpending, 0.012);
}

function applyDailyPublicSpending(country) {
  const dailySpending = calculateDailyPublicSpending(country);

  country.dailyPublicSpending = dailySpending;
  country.treasury -= dailySpending;

  const socialRatio = country.socialSpending / Math.max(country.gdp, 1);
  const healthRatio = country.healthSpending / Math.max(country.gdp, 1);
  const educationRatio = country.educationSpending / Math.max(country.gdp, 1);
  const defenseRatio = country.defenseSpending / Math.max(country.gdp, 1);

  country.happiness = boundedDelta(
    country.happiness,
    socialRatio * 0.018 + healthRatio * 0.014 + educationRatio * 0.009,
    0,
    100
  );

  country.stability = boundedDelta(
    country.stability,
    socialRatio * 0.008 + defenseRatio * 0.006,
    0,
    100
  );

  country.research += educationRatio * 0.35;
  country.military += country.defenseSpending / 1_000_000_000 * 0.35;
}

function applyDebtAndDeficitDynamics(country) {
  const fiscalBalance = calculateDailyFiscalBalance(country);
  country.dailyFiscalBalance = fiscalBalance;

  if (fiscalBalance < 0) {
    const deficit = Math.abs(fiscalBalance);
    country.debt += deficit;

    if (country.treasury <= 0) {
      country.stability = boundedDelta(country.stability, -0.01, 0, 100);
      country.happiness = boundedDelta(country.happiness, -0.006, 0, 100);
    }
  } else {
    const repayment = Math.min(fiscalBalance * 0.25, country.debt * 0.00002);
    country.debt = Math.max(0, country.debt - repayment);
    country.treasury += fiscalBalance * 0.08;
  }

  country.debtRatio = getDebtRatio(country);
}

function updateFiscalStress(country) {
  const debtRatio = getDebtRatio(country);
  const deficitRatio = Math.abs(Math.min(0, country.dailyFiscalBalance || 0)) * 365 / Math.max(country.gdp, 1);
  const interestRatio = (country.dailyDebtInterest || 0) * 365 / Math.max(country.gdp, 1);

  country.fiscalStress = clamp(
    debtRatio * 38 +
    deficitRatio * 210 +
    interestRatio * 260 +
    country.sanctions * 1.4 -
    country.stability * 0.18,
    0,
    100
  );

  if (country.fiscalStress > 75) {
    country.stability = boundedDelta(country.stability, -0.025, 0, 100);
    country.businessConfidence = boundedDelta(country.businessConfidence || 50, -0.04, 0, 100);
  }

  if (country.fiscalStress > 90 && randomChance(0.008)) {
    country.debt += country.gdp * 0.0006;
    addEvent("⚠️", `${country.name}: tensión fiscal crítica; aumenta la prima de riesgo.`);
  }
}

function getBudgetBreakdown(country) {
  return {
    income: {
      taxes: calculateDailyTaxRevenue(country),
      trade: calculateDailyTradeBalance(country),
      stateCompanies: calculateDailyStateCompanyRevenue(country)
    },
    expenses: {
      social: dailyFromAnnual(country.socialSpending || 0),
      pensions: dailyFromAnnual(country.pensions || 0),
      health: dailyFromAnnual(country.healthSpending || 0),
      education: dailyFromAnnual(country.educationSpending || 0),
      defense: dailyFromAnnual(country.defenseSpending || 0),
      debtInterest: calculateDailyDebtInterest(country)
    },
    balance: calculateDailyFiscalBalance(country)
  };
}

function setTaxRate(country, taxPercent) {
  const taxRate = clamp(
    Number(taxPercent) / 100,
    SIMULATION_CONFIG.minTaxRate,
    SIMULATION_CONFIG.maxTaxRate
  );

  country.taxRate = taxRate;

  const excessTax = Math.max(0, taxRate - 0.28);
  const lowTax = Math.max(0, 0.18 - taxRate);

  country.happiness = boundedDelta(country.happiness, -excessTax * 8 + lowTax * 3, 0, 100);
  country.businessConfidence = boundedDelta(country.businessConfidence || 50, -excessTax * 10 + lowTax * 12, 0, 100);
}

function adjustSpending(country, key, percentOfGDP) {
  const value = country.gdp * (Number(percentOfGDP) / 100);

  if (key === "social") country.socialSpending = value;
  if (key === "pensions") country.pensions = value;
  if (key === "health") country.healthSpending = value;
  if (key === "education") country.educationSpending = value;
  if (key === "defense") country.defenseSpending = value;

  country.dailyFiscalBalance = calculateDailyFiscalBalance(country);
}

function calculatePublicServiceQuality(country) {
  const health = country.healthSpending / Math.max(country.population, 1);
  const education = country.educationSpending / Math.max(country.population, 1);
  const social = country.socialSpending / Math.max(country.population, 1);

  return clamp(
    health / 1200 +
    education / 1000 +
    social / 1400 +
    country.stability * 0.18,
    0,
    100
  );
}

function calculatePensionPressure(country) {
  const pensionRatio = country.pensions / Math.max(country.gdp, 1);
  const demographicPressure = country.population > 50_000_000 ? 1.05 : 0.95;

  return clamp(pensionRatio * 420 * demographicPressure, 0, 100);
}

function calculateDefenseReadiness(country) {
  const defenseRatio = country.defenseSpending / Math.max(country.gdp, 1);
  const spendingScore = defenseRatio * 1800;
  const militaryScore = country.military / Math.max(country.population, 1) * 1000;
  const cyberScore = country.cyber / 100;

  return clamp(spendingScore + militaryScore + cyberScore, 0, 100);
}

/* =========================================================
   EXPORT GLOBAL — PARTE 2.2
========================================================= */

window.simulateCountryBudget = simulateCountryBudget;
window.updatePublicSpendingTargets = updatePublicSpendingTargets;
window.applyDailyPublicSpending = applyDailyPublicSpending;
window.applyDebtAndDeficitDynamics = applyDebtAndDeficitDynamics;
window.updateFiscalStress = updateFiscalStress;
window.getBudgetBreakdown = getBudgetBreakdown;
window.setTaxRate = setTaxRate;
window.adjustSpending = adjustSpending;
window.calculatePublicServiceQuality = calculatePublicServiceQuality;
window.calculatePensionPressure = calculatePensionPressure;
window.calculateDefenseReadiness = calculateDefenseReadiness;



/* =========================================================
   SIMULATION.JS v3
   Parte 2.3/12
   Energía, alimentación, agua, recursos, comercio exterior
   y presión industrial.
   ========================================================= */

function simulateFoodAndEnergy(country) {
  updateFoodSystem(country);
  updateEnergySystem(country);
  updateWaterSystem(country);
  updateIndustrialResourcePressure(country);
  updateTradeFromResourceBalances(country);
}

function updateFoodSystem(country) {
  const baseConsumption = country.population * SIMULATION_CONFIG.foodPerCapitaYear;
  const happinessConsumptionModifier = 1 + (country.happiness - 60) * 0.0015;
  const warDisruption = 1 + country.warRisk * 0.001;
  const sanctionsDisruption = 1 + country.sanctions * 0.0015;

  country.foodConsumption = Math.max(
    0,
    baseConsumption * happinessConsumptionModifier * warDisruption * sanctionsDisruption
  );

  const agriculturalOutput = calculateAgriculturalOutput(country);
  const climatePenalty = 1 - clamp(country.climateRisk || 0, 0, 100) * 0.0025;
  const stabilityModifier = 1 + (country.stability - 60) * 0.001;

  country.foodProduction = Math.max(
    0,
    agriculturalOutput * climatePenalty * stabilityModifier
  );

  const foodBalance = country.foodProduction - country.foodConsumption;
  country.foodBalance = foodBalance;

  if (foodBalance < 0) {
    const deficitRatio = Math.abs(foodBalance) / Math.max(country.foodConsumption, 1);

    country.imports += Math.abs(foodBalance) * 250;
    country.happiness = boundedDelta(country.happiness, -deficitRatio * 0.045, 0, 100);
    country.stability = boundedDelta(country.stability, -deficitRatio * 0.025, 0, 100);
    country.inflation = (country.inflation || SIMULATION_CONFIG.baseInflation) + deficitRatio * 0.00004;
  } else {
    const surplusRatio = foodBalance / Math.max(country.foodConsumption, 1);

    country.exports += foodBalance * 180;
    country.happiness = boundedDelta(country.happiness, Math.min(0.006, surplusRatio * 0.012), 0, 100);
  }
}

function calculateAgriculturalOutput(country) {
  let output = country.population * 0.72;

  for (const region of country.regions || []) {
    for (const item of region.buildings || []) {
      const building = findBuildingById(item.buildingId);
      if (!building) continue;

      const level = item.level || 1;
      output += (building.foodProduction || 0) * level;
    }
  }

  const irrigationBonus = getBuildingLevelSum(country, "irrigated_farms") * 0.035;
  const greenhouseBonus = getBuildingLevelSum(country, "greenhouses") * 0.055;
  const technologyBonus = country.completedTechnologies?.includes("smart_cities") ? 0.01 : 0;

  return output * (1 + irrigationBonus + greenhouseBonus + technologyBonus);
}

function updateEnergySystem(country) {
  const baseDemand = country.population * SIMULATION_CONFIG.energyPerCapitaMW;
  const industrialDemand = getIndustrialIndex(country) * 4.8;
  const technologyDemand = country.research * 0.018;
  const militaryDemand = country.military * 0.00008;

  country.energyDemand = Math.max(
    1000,
    baseDemand + industrialDemand + technologyDemand + militaryDemand
  );

  const productionFromBuildings = calculateEnergyProductionFromBuildings(country);
  const installedEfficiency = calculateInstalledPowerEfficiency(country);

  country.energyProduction = Math.max(
    1000,
    productionFromBuildings * installedEfficiency
  );

  country.installedPower = Math.max(
    country.installedPower || 0,
    country.energyProduction * 1.08
  );

  const energyBalance = country.energyProduction - country.energyDemand;
  country.energyBalance = energyBalance;

  if (energyBalance < 0) {
    const deficitRatio = Math.abs(energyBalance) / Math.max(country.energyDemand, 1);

    country.imports += Math.abs(energyBalance) * 120000;
    country.gdp -= country.gdp * deficitRatio * 0.00004;
    country.happiness = boundedDelta(country.happiness, -deficitRatio * 0.05, 0, 100);
    country.businessConfidence = boundedDelta(country.businessConfidence || 50, -deficitRatio * 0.12, 0, 100);
    country.inflation = (country.inflation || SIMULATION_CONFIG.baseInflation) + deficitRatio * 0.00005;
  } else {
    const surplusRatio = energyBalance / Math.max(country.energyDemand, 1);

    country.exports += energyBalance * 85000;
    country.businessConfidence = boundedDelta(country.businessConfidence || 50, Math.min(0.02, surplusRatio * 0.08), 0, 100);
  }
}

function calculateEnergyProductionFromBuildings(country) {
  let production = country.population * 0.0024;

  for (const region of country.regions || []) {
    for (const item of region.buildings || []) {
      const building = findBuildingById(item.buildingId);
      if (!building) continue;

      const level = item.level || 1;

      if ((building.energy || 0) > 0) {
        production += building.energy * level;
      }

      if (building.renewableMW) {
        country.renewablesMW = (country.renewablesMW || 0) + building.renewableMW * 0.0002;
      }
    }
  }

  production += (country.renewablesMW || 0) * 0.32;

  return production;
}

function calculateInstalledPowerEfficiency(country) {
  let efficiency = 0.88;

  if (country.completedTechnologies?.includes("grid_storage")) {
    efficiency += 0.05;
  }

  if (country.completedTechnologies?.includes("smart_cities")) {
    efficiency += 0.025;
  }

  const instabilityPenalty = Math.max(0, 55 - country.stability) * 0.001;
  const sanctionsPenalty = country.sanctions * 0.0008;

  return clamp(efficiency - instabilityPenalty - sanctionsPenalty, 0.62, 1.08);
}

function updateWaterSystem(country) {
  const baseDemand = country.population * SIMULATION_CONFIG.waterPerCapitaYear;
  const agricultureDemand = calculateAgriculturalWaterDemand(country);
  const industrialDemand = getIndustrialIndex(country) * 85000;

  country.waterDemand = baseDemand + agricultureDemand + industrialDemand;

  let production = country.waterProduction || country.population * 340;

  const climatePenalty = 1 - clamp(country.climateRisk || 0, 0, 100) * 0.0018;
  const infrastructureBonus = getBuildingLevelSum(country, "grid") * 0.012 + getBuildingLevelSum(country, "roads") * 0.004;

  country.waterProduction = Math.max(
    0,
    production * climatePenalty * (1 + infrastructureBonus)
  );

  country.waterBalance = country.waterProduction - country.waterDemand;

  if (country.waterBalance < 0) {
    const deficitRatio = Math.abs(country.waterBalance) / Math.max(country.waterDemand, 1);

    country.foodProduction *= Math.max(0.75, 1 - deficitRatio * 0.08);
    country.happiness = boundedDelta(country.happiness, -deficitRatio * 0.04, 0, 100);
    country.climateRisk = boundedDelta(country.climateRisk, deficitRatio * 0.025, 0, 100);
  }
}

function calculateAgriculturalWaterDemand(country) {
  let demand = 0;

  for (const region of country.regions || []) {
    for (const item of region.buildings || []) {
      const building = findBuildingById(item.buildingId);
      if (!building) continue;

      demand += (building.waterDemand || 0) * (item.level || 1);
    }
  }

  return demand;
}

function updateIndustrialResourcePressure(country) {
  const industrialIndex = getIndustrialIndex(country);

  country.industrialEnergyPressure = industrialIndex * 0.012;
  country.industrialFoodPressure = industrialIndex * 0.002;
  country.industrialWaterPressure = industrialIndex * 0.006;

  const energyShortage = Math.max(0, country.energyDemand - country.energyProduction);
  const waterShortage = Math.max(0, country.waterDemand - country.waterProduction);

  const energyPenalty = energyShortage / Math.max(country.energyDemand, 1);
  const waterPenalty = waterShortage / Math.max(country.waterDemand, 1);

  const combinedPenalty = clamp(energyPenalty * 0.09 + waterPenalty * 0.04, 0, 0.12);

  country.gdp *= 1 - combinedPenalty / SIMULATION_CONFIG.daysPerYear;
  country.businessConfidence = boundedDelta(country.businessConfidence || 50, -combinedPenalty * 0.25, 0, 100);
}

function updateTradeFromResourceBalances(country) {
  const energyBalance = country.energyProduction - country.energyDemand;
  const foodBalance = country.foodProduction - country.foodConsumption;
  const industrialIndex = getIndustrialIndex(country);

  const exportCapacity =
    Math.max(0, energyBalance) * 65000 +
    Math.max(0, foodBalance) * 145 +
    industrialIndex * 1200000;

  const importNeed =
    Math.max(0, -energyBalance) * 85000 +
    Math.max(0, -foodBalance) * 220 +
    Math.max(0, 50 - country.stability) * 800000;

  const sanctionsDrag = 1 - clamp(country.sanctions * 0.018, 0, 0.65);
  const blocBonus = 1 + getBlocTradeBonus(country);

  country.exports = lerp(country.exports || 0, Math.max(1, exportCapacity * sanctionsDrag * blocBonus), 0.002);
  country.imports = lerp(country.imports || 0, Math.max(1, importNeed / Math.max(0.35, sanctionsDrag)), 0.002);

  country.balance = country.exports - country.imports;
}

/* =========================================================
   CONSUMOS Y BALANCES PARA UI
========================================================= */

function getFoodSystemBreakdown(country) {
  return {
    production: country.foodProduction || 0,
    consumption: country.foodConsumption || 0,
    balance: (country.foodProduction || 0) - (country.foodConsumption || 0),
    perCapitaConsumption: (country.foodConsumption || 0) / Math.max(country.population, 1),
    selfSufficiency: (country.foodProduction || 0) / Math.max(country.foodConsumption || 1, 1)
  };
}

function getEnergySystemBreakdown(country) {
  return {
    production: country.energyProduction || 0,
    demand: country.energyDemand || 0,
    installedPower: country.installedPower || 0,
    renewables: country.renewablesMW || 0,
    balance: (country.energyProduction || 0) - (country.energyDemand || 0),
    selfSufficiency: (country.energyProduction || 0) / Math.max(country.energyDemand || 1, 1)
  };
}

function getWaterSystemBreakdown(country) {
  return {
    production: country.waterProduction || 0,
    demand: country.waterDemand || 0,
    balance: (country.waterProduction || 0) - (country.waterDemand || 0),
    selfSufficiency: (country.waterProduction || 0) / Math.max(country.waterDemand || 1, 1)
  };
}

function getBuildingLevelSum(country, buildingId) {
  let sum = 0;

  for (const region of country.regions || []) {
    for (const item of region.buildings || []) {
      if (item.buildingId === buildingId) {
        sum += item.level || 1;
      }
    }
  }

  return sum;
}

/* =========================================================
   EXPORT GLOBAL — PARTE 2.3
========================================================= */

window.simulateFoodAndEnergy = simulateFoodAndEnergy;
window.updateFoodSystem = updateFoodSystem;
window.calculateAgriculturalOutput = calculateAgriculturalOutput;
window.updateEnergySystem = updateEnergySystem;
window.calculateEnergyProductionFromBuildings = calculateEnergyProductionFromBuildings;
window.calculateInstalledPowerEfficiency = calculateInstalledPowerEfficiency;
window.updateWaterSystem = updateWaterSystem;
window.calculateAgriculturalWaterDemand = calculateAgriculturalWaterDemand;
window.updateIndustrialResourcePressure = updateIndustrialResourcePressure;
window.updateTradeFromResourceBalances = updateTradeFromResourceBalances;
window.getFoodSystemBreakdown = getFoodSystemBreakdown;
window.getEnergySystemBreakdown = getEnergySystemBreakdown;
window.getWaterSystemBreakdown = getWaterSystemBreakdown;
window.getBuildingLevelSum = getBuildingLevelSum;


/* =========================================================
   SIMULATION.JS v3
   Parte 3.1/12
   Demografía, empleo, migración y presión social.
   ========================================================= */

function simulateDemography(country) {
  updatePopulation(country);
  updateEmployment(country);
  updateMigration(country);
  updateSocialPressure(country);
}

function updatePopulation(country) {
  const delta = calculateDailyPopulationDelta(country);

  country.population = Math.max(
    100_000,
    Math.round(country.population + delta)
  );

  country.laborForce = Math.round(country.population * getLaborForceRatio(country));
}

function getLaborForceRatio(country) {
  let ratio = 0.50;

  if (country.happiness > 75) ratio += 0.015;
  if (country.stability > 75) ratio += 0.01;
  if (country.warRisk > 50) ratio -= 0.025;
  if (country.fiscalStress > 80) ratio -= 0.015;

  return clamp(ratio, 0.42, 0.58);
}

function updateEmployment(country) {
  const availableJobs = calculateAvailableJobs(country);
  const laborForce = Math.max(country.laborForce || country.population * 0.5, 1);

  const unemployed = Math.max(0, laborForce - availableJobs);

  country.unemployment = Math.round(unemployed);
  country.unemploymentRate = clamp(unemployed / laborForce, 0, 0.45);

  const employmentPressure = country.unemploymentRate;

  country.happiness = boundedDelta(
    country.happiness,
    -employmentPressure * 0.035,
    0,
    100
  );

  country.stability = boundedDelta(
    country.stability,
    -employmentPressure * 0.025,
    0,
    100
  );

  country.businessConfidence = boundedDelta(
    country.businessConfidence || 50,
    -employmentPressure * 0.045,
    0,
    100
  );
}

function calculateAvailableJobs(country) {
  let jobs = Math.round(country.population * 0.44);

  for (const region of country.regions || []) {
    for (const item of region.buildings || []) {
      const building = findBuildingById(item.buildingId);
      if (!building) continue;

      jobs += (building.jobs || 0) * (item.level || 1);
    }
  }

  const gdpJobs = country.gdp / 180000;
  const confidenceModifier = 0.92 + (country.businessConfidence || 50) / 500;
  const sanctionsModifier = 1 - country.sanctions * 0.003;
  const warModifier = 1 - country.warRisk * 0.0015;

  return Math.max(
    0,
    Math.round((jobs + gdpJobs) * confidenceModifier * sanctionsModifier * warModifier)
  );
}

function updateMigration(country) {
  const attractiveness = calculateMigrationAttractiveness(country);

  country.migrationAttractiveness = attractiveness;

  const baseMigration = country.population * 0.000006;
  let migrationDelta = 0;

  if (attractiveness > 65) {
    migrationDelta = baseMigration * ((attractiveness - 65) / 35);
  }

  if (attractiveness < 38) {
    migrationDelta = -baseMigration * ((38 - attractiveness) / 38) * 1.8;
  }

  if (country.warRisk > 60) {
    migrationDelta -= country.population * 0.000025;
  }

  country.netMigrationDaily = Math.round(migrationDelta);
  country.population = Math.max(100000, Math.round(country.population + migrationDelta));

  if (migrationDelta < 0) {
    country.happiness = boundedDelta(country.happiness, -0.004, 0, 100);
  }
}

function calculateMigrationAttractiveness(country) {
  const foodScore = getFoodBalance(country) >= 0 ? 8 : -8;
  const energyScore = getEnergyBalance(country) >= 0 ? 6 : -6;
  const employmentScore = (1 - (country.unemploymentRate || 0.08)) * 22;
  const happinessScore = country.happiness * 0.22;
  const stabilityScore = country.stability * 0.24;
  const reputationScore = (country.reputation || 60) * 0.12;
  const warPenalty = country.warRisk * 0.35;
  const sanctionsPenalty = country.sanctions * 0.7;

  return clamp(
    foodScore +
    energyScore +
    employmentScore +
    happinessScore +
    stabilityScore +
    reputationScore -
    warPenalty -
    sanctionsPenalty,
    0,
    100
  );
}

function updateSocialPressure(country) {
  const unemploymentPressure = (country.unemploymentRate || 0) * 100;
  const inflationPressure = Math.max(0, (country.inflation || 0.027) - 0.035) * 600;
  const foodPressure = getFoodBalance(country) < 0 ? 12 : 0;
  const energyPressure = getEnergyBalance(country) < 0 ? 10 : 0;
  const fiscalPressure = (country.fiscalStress || 0) * 0.25;
  const warPressure = country.warRisk * 0.35;

  country.socialPressure = clamp(
    unemploymentPressure * 0.55 +
    inflationPressure +
    foodPressure +
    energyPressure +
    fiscalPressure +
    warPressure -
    country.happiness * 0.18 -
    country.stability * 0.12,
    0,
    100
  );

  if (country.socialPressure > 70) {
    country.stability = boundedDelta(country.stability, -0.018, 0, 100);
    country.happiness = boundedDelta(country.happiness, -0.014, 0, 100);
  }

  if (country.socialPressure > 88 && randomChance(0.006)) {
    addEvent("🔥", `${country.name}: protestas masivas por presión social elevada.`);
    country.stability = boundedDelta(country.stability, -0.8, 0, 100);
  }
}

function getDemographyBreakdown(country) {
  return {
    population: country.population,
    laborForce: country.laborForce || Math.round(country.population * 0.5),
    unemployment: country.unemployment || 0,
    unemploymentRate: country.unemploymentRate || 0,
    netMigrationDaily: country.netMigrationDaily || 0,
    migrationAttractiveness: country.migrationAttractiveness || 0,
    socialPressure: country.socialPressure || 0
  };
}

/* =========================================================
   EXPORT GLOBAL — PARTE 3.1
========================================================= */

window.simulateDemography = simulateDemography;
window.updatePopulation = updatePopulation;
window.getLaborForceRatio = getLaborForceRatio;
window.updateEmployment = updateEmployment;
window.calculateAvailableJobs = calculateAvailableJobs;
window.updateMigration = updateMigration;
window.calculateMigrationAttractiveness = calculateMigrationAttractiveness;
window.updateSocialPressure = updateSocialPressure;
window.getDemographyBreakdown = getDemographyBreakdown;


/* =========================================================
   SIMULATION.JS v3
   Parte 3.2/12
   Educación, investigación, innovación, cyber y tecnología.
   ========================================================= */

function simulateTechnologyQueue(country) {
  updateEducationAndResearch(country);
  updateCyberCapability(country);
  processTechnologyQueue(country);
  applyCompletedTechnologyEffects(country);
}

function updateEducationAndResearch(country) {
  const educationRatio = country.educationSpending / Math.max(country.gdp, 1);
  const universityLevels = getBuildingLevelSum(country, "university");
  const electronicsLevels = getBuildingLevelSum(country, "electronics");
  const cyberLevels = getBuildingLevelSum(country, "cyber");

  const stabilityModifier = 0.75 + country.stability / 100;
  const happinessModifier = 0.8 + country.happiness / 180;
  const sanctionsPenalty = 1 - clamp(country.sanctions * 0.012, 0, 0.45);

  const dailyResearchGain =
    (
      educationRatio * 850 +
      universityLevels * 0.9 +
      electronicsLevels * 0.35 +
      cyberLevels * 0.45
    ) *
    stabilityModifier *
    happinessModifier *
    sanctionsPenalty;

  country.research = Math.max(0, country.research + dailyResearchGain);

  country.educationQuality = clamp(
    educationRatio * 900 +
    universityLevels * 2.4 +
    country.stability * 0.18 +
    country.happiness * 0.12,
    0,
    100
  );
}

function updateCyberCapability(country) {
  const cyberFacilities = getBuildingLevelSum(country, "cyber");
  const researchBase = country.research * 0.00065;
  const defenseFunding = country.defenseSpending / Math.max(country.gdp, 1) * 10;
  const educationEffect = (country.educationQuality || 50) * 0.01;
  const instabilityPenalty = Math.max(0, 55 - country.stability) * 0.015;

  const delta =
    researchBase +
    cyberFacilities * 0.35 +
    defenseFunding +
    educationEffect -
    instabilityPenalty -
    country.sanctions * 0.025;

  country.cyber = Math.max(0, country.cyber + delta);
}

function startTechnologyResearch(technologyId) {
  const country = getSelectedCountry();
  const technology = TECHNOLOGIES.find(t => t.id === technologyId);

  if (!technology) return;

  country.technologyQueue ??= [];
  country.completedTechnologies ??= [];

  if (country.completedTechnologies.includes(technologyId)) {
    addEvent("ℹ️", `${technology.name} ya está investigada.`);
    renderAll();
    return;
  }

  if (country.technologyQueue.some(t => t.technologyId === technologyId)) {
    addEvent("ℹ️", `${technology.name} ya está en investigación.`);
    renderAll();
    return;
  }

  if (country.research < technology.requiredResearch) {
    addEvent("⛔", `Investigación insuficiente para ${technology.name}.`);
    renderAll();
    return;
  }

  if (country.treasury < technology.cost) {
    addEvent("⛔", `Tesorería insuficiente para investigar ${technology.name}.`);
    renderAll();
    return;
  }

  country.treasury -= technology.cost;

  country.technologyQueue.push({
    id: String(Date.now() + Math.random()),
    technologyId,
    name: technology.name,
    remainingDays: technology.days,
    totalDays: technology.days,
    cost: technology.cost
  });

  addEvent("🔬", `${country.name} inicia investigación: ${technology.name}.`);
  renderAll();
}

function processTechnologyQueue(country) {
  country.technologyQueue ??= [];
  country.completedTechnologies ??= [];

  for (const project of country.technologyQueue) {
    project.remainingDays -= 1;
  }

  const completed = country.technologyQueue.filter(project => project.remainingDays <= 0);
  country.technologyQueue = country.technologyQueue.filter(project => project.remainingDays > 0);

  for (const project of completed) {
    const technology = TECHNOLOGIES.find(t => t.id === project.technologyId);
    if (!technology) continue;

    country.completedTechnologies.push(technology.id);
    applyTechnologyEffect(country, technology);

    addEvent("✅", `${country.name} completa tecnología: ${technology.name}.`);
  }
}

function applyCompletedTechnologyEffects(country) {
  country.activeTechnologyEffects = {};

  for (const technologyId of country.completedTechnologies || []) {
    const technology = TECHNOLOGIES.find(t => t.id === technologyId);
    if (!technology) continue;

    mergeTechnologyEffects(country.activeTechnologyEffects, technology.effects || {});
  }
}

function mergeTechnologyEffects(target, effects) {
  for (const [key, value] of Object.entries(effects)) {
    if (typeof value !== "number") continue;

    target[key] = (target[key] || 0) + value;
  }
}

function applyTechnologyEffect(country, technology) {
  const effects = technology.effects || {};

  if (effects.gdpBonus) country.gdp += effects.gdpBonus;
  if (effects.gdpMultiplier) country.gdp *= effects.gdpMultiplier;

  if (effects.researchBonus) country.research += effects.researchBonus;
  if (effects.cyberBonus) country.cyber += effects.cyberBonus;
  if (effects.militaryBonus) country.military += effects.militaryBonus;

  if (effects.installedPowerBonusMW) country.installedPower += effects.installedPowerBonusMW;
  if (effects.energyProductionBonusMW) country.energyProduction += effects.energyProductionBonusMW;
  if (effects.co2Reduction) country.co2 = Math.max(0, country.co2 - effects.co2Reduction);

  if (effects.happinessBonus) country.happiness = boundedDelta(country.happiness, effects.happinessBonus, 0, 100);
  if (effects.stabilityBonus) country.stability = boundedDelta(country.stability, effects.stabilityBonus, 0, 100);
  if (effects.climateRiskReduction) country.climateRisk = boundedDelta(country.climateRisk, -effects.climateRiskReduction, 0, 100);
  if (effects.warRiskReduction) country.warRisk = boundedDelta(country.warRisk, -effects.warRiskReduction, 0, 100);
}

function getAvailableTechnologies(country) {
  const year = getSimulationYear();

  return TECHNOLOGIES.filter(technology => {
    if (technology.year > year) return false;
    if (country.completedTechnologies?.includes(technology.id)) return false;
    return true;
  });
}

function getTechnologyProgress(country, technologyId) {
  const project = country.technologyQueue?.find(item => item.technologyId === technologyId);
  if (!project) return null;

  return {
    remainingDays: project.remainingDays,
    totalDays: project.totalDays,
    progress: clamp(100 * (1 - project.remainingDays / project.totalDays), 0, 100)
  };
}

function calculateInnovationIndex(country) {
  const researchScore = country.research / 80;
  const educationScore = country.educationQuality || 50;
  const cyberScore = country.cyber / 70;
  const universityScore = getBuildingLevelSum(country, "university") * 1.8;
  const electronicsScore = getBuildingLevelSum(country, "electronics") * 1.2;

  return clamp(
    researchScore +
    educationScore * 0.35 +
    cyberScore +
    universityScore +
    electronicsScore,
    0,
    100
  );
}

function getResearchBreakdown(country) {
  return {
    research: country.research || 0,
    cyber: country.cyber || 0,
    educationQuality: country.educationQuality || 0,
    innovationIndex: calculateInnovationIndex(country),
    technologyQueue: country.technologyQueue || [],
    completedTechnologies: country.completedTechnologies || [],
    availableTechnologies: getAvailableTechnologies(country)
  };
}

/* =========================================================
   EXPORT GLOBAL — PARTE 3.2
========================================================= */

window.simulateTechnologyQueue = simulateTechnologyQueue;
window.updateEducationAndResearch = updateEducationAndResearch;
window.updateCyberCapability = updateCyberCapability;
window.startTechnologyResearch = startTechnologyResearch;
window.processTechnologyQueue = processTechnologyQueue;
window.applyCompletedTechnologyEffects = applyCompletedTechnologyEffects;
window.mergeTechnologyEffects = mergeTechnologyEffects;
window.applyTechnologyEffect = applyTechnologyEffect;
window.getAvailableTechnologies = getAvailableTechnologies;
window.getTechnologyProgress = getTechnologyProgress;
window.calculateInnovationIndex = calculateInnovationIndex;
window.getResearchBreakdown = getResearchBreakdown;


/* =========================================================
   SIMULATION.JS v3
   Parte 3.3.1/12
   Política interior: presión política, ideología, régimen,
   aprobación, polarización y legitimidad.
   ========================================================= */

function simulatePoliticalPressure(country) {
  updatePoliticalApproval(country);
  updatePolarization(country);
  updateRegimeLegitimacy(country);
  updateGovernmentEfficiency(country);
  updateInternalSecurity(country);
}

function updatePoliticalApproval(country) {
  const economyEffect = calculateEconomicApprovalEffect(country);
  const socialEffect = calculateSocialApprovalEffect(country);
  const securityEffect = calculateSecurityApprovalEffect(country);
  const ideologyEffect = calculateIdeologyApprovalEffect(country);

  const targetApproval = clamp(
    50 +
    economyEffect +
    socialEffect +
    securityEffect +
    ideologyEffect -
    (country.fiscalStress || 0) * 0.16 -
    (country.socialPressure || 0) * 0.24 -
    (country.sanctions || 0) * 0.55,
    0,
    100
  );

  country.approval = lerp(country.approval ?? targetApproval, targetApproval, 0.025);
}

function calculateEconomicApprovalEffect(country) {
  const gdpGrowth =
    ((country.gdp || 0) - (country.previousGDP || country.gdp || 1)) /
    Math.max(country.previousGDP || country.gdp || 1, 1);

  const growthScore = clamp(gdpGrowth * 120000, -18, 18);
  const unemploymentScore = -((country.unemploymentRate || 0.08) * 100 - 7) * 0.75;
  const inflationScore = -Math.max(0, (country.inflation || 0.027) - 0.03) * 520;
  const treasuryScore = country.treasury > country.gdp * 0.0004 ? 3 : -3;

  return growthScore + unemploymentScore + inflationScore + treasuryScore;
}

function calculateSocialApprovalEffect(country) {
  const serviceQuality = calculatePublicServiceQuality(country);
  const pensionPressure = calculatePensionPressure(country);
  const foodBalance = getFoodBalance(country);
  const energyBalance = getEnergyBalance(country);

  const serviceScore = (serviceQuality - 50) * 0.18;
  const pensionScore = -(pensionPressure - 45) * 0.05;
  const foodScore = foodBalance >= 0 ? 2.5 : -6;
  const energyScore = energyBalance >= 0 ? 1.5 : -4;

  return serviceScore + pensionScore + foodScore + energyScore;
}

function calculateSecurityApprovalEffect(country) {
  const defenseReadiness = calculateDefenseReadiness(country);
  const warRisk = country.warRisk || 0;
  const regime = getRegime(country);

  let score = (defenseReadiness - 50) * 0.08;

  if (warRisk > 50) score -= (warRisk - 50) * 0.28;
  else score += (50 - warRisk) * 0.035;

  score += (regime.stability || 0) * 0.18;

  return score;
}

function calculateIdeologyApprovalEffect(country) {
  const ideology = getIdeology(country);
  const regime = getRegime(country);

  let score = ideology.happinessModifier || 0;

  if (country.regime === "authoritarian") {
    score += regime.repression * 8;
    score -= Math.max(0, country.happiness - 55) * 0.05;
  }

  if (country.ideology === "green" && country.co2 / Math.max(country.population, 1) < 5) {
    score += 2;
  }

  if (country.ideology === "capitalist_liberalism" && (country.businessConfidence || 50) > 70) {
    score += 3;
  }

  if (country.ideology === "socialism" && calculatePublicServiceQuality(country) > 65) {
    score += 3;
  }

  return score;
}

function updatePolarization(country) {
  const inequalityProxy = calculateInequalityProxy(country);
  const socialStress = country.socialPressure || 0;
  const fiscalStress = country.fiscalStress || 0;
  const regime = getRegime(country);

  const targetPolarization = clamp(
    22 +
    inequalityProxy * 0.35 +
    socialStress * 0.28 +
    fiscalStress * 0.14 +
    country.sanctions * 0.35 +
    country.warRisk * 0.12 -
    regime.repression * 8,
    0,
    100
  );

  country.polarization = lerp(country.polarization ?? targetPolarization, targetPolarization, 0.018);
}

function calculateInequalityProxy(country) {
  const ideology = getIdeology(country);
  const taxEffect = (0.26 - country.taxRate) * 110;
  const socialEffect = 50 - (country.socialSpending / Math.max(country.gdp, 1)) * 250;
  const unemploymentEffect = (country.unemploymentRate || 0.08) * 110;
  const capitalistEffect = country.ideology === "capitalist_liberalism" ? 9 : 0;
  const socialistEffect = country.ideology === "socialism" ? -6 : 0;
  const businessEffect = (ideology.businessConfidence || 0) * 0.12;

  return clamp(
    38 +
    taxEffect +
    socialEffect +
    unemploymentEffect +
    capitalistEffect +
    socialistEffect +
    businessEffect,
    0,
    100
  );
}

function updateRegimeLegitimacy(country) {
  const approval = country.approval ?? 50;
  const stability = country.stability ?? 60;
  const happiness = country.happiness ?? 60;
  const socialPressure = country.socialPressure ?? 0;
  const polarization = country.polarization ?? 30;
  const regime = getRegime(country);

  const repressionStability =
    country.regime === "authoritarian"
      ? regime.repression * 18 - happiness * 0.08
      : 0;

  const targetLegitimacy = clamp(
    approval * 0.35 +
    stability * 0.28 +
    happiness * 0.18 +
    (100 - socialPressure) * 0.12 +
    (100 - polarization) * 0.07 +
    repressionStability,
    0,
    100
  );

  country.legitimacy = lerp(country.legitimacy ?? targetLegitimacy, targetLegitimacy, 0.018);

  if (country.legitimacy < 28) {
    country.stability = boundedDelta(country.stability, -0.02, 0, 100);
  }

  if (country.legitimacy < 18 && randomChance(0.004)) {
    addEvent("⚠️", `${country.name}: crisis de legitimidad del régimen.`);
  }
}

function updateGovernmentEfficiency(country) {
  const regime = getRegime(country);
  const education = country.educationQuality || 50;
  const cyber = country.cyber || 0;
  const stability = country.stability || 60;

  const targetEfficiency = clamp(
    40 +
    stability * 0.24 +
    education * 0.16 +
    Math.min(20, cyber / 250) +
    (regime.taxEfficiency - 1) * 45 -
    (country.polarization || 0) * 0.12 -
    (country.fiscalStress || 0) * 0.08,
    0,
    100
  );

  country.governmentEfficiency = lerp(
    country.governmentEfficiency ?? targetEfficiency,
    targetEfficiency,
    0.02
  );
}

function updateInternalSecurity(country) {
  const regime = getRegime(country);
  const defenseReadiness = calculateDefenseReadiness(country);
  const socialPressure = country.socialPressure || 0;
  const polarization = country.polarization || 0;

  const security = clamp(
    45 +
    defenseReadiness * 0.16 +
    country.cyber / 180 -
    socialPressure * 0.22 -
    polarization * 0.14 +
    regime.repression * 20,
    0,
    100
  );

  country.internalSecurity = lerp(country.internalSecurity ?? security, security, 0.025);

  if (country.internalSecurity < 25) {
    country.stability = boundedDelta(country.stability, -0.014, 0, 100);
  }
}

function getPoliticalBreakdown(country) {
  return {
    regime: country.regime,
    regimeName: getRegime(country).name,
    ideology: country.ideology,
    ideologyName: getIdeology(country).name,
    approval: country.approval || 0,
    legitimacy: country.legitimacy || 0,
    polarization: country.polarization || 0,
    governmentEfficiency: country.governmentEfficiency || 0,
    internalSecurity: country.internalSecurity || 0,
    socialPressure: country.socialPressure || 0,
    fiscalStress: country.fiscalStress || 0,
    nextElectionYear: country.nextElectionYear
  };
}

/* =========================================================
   EXPORT GLOBAL — PARTE 3.3.1
========================================================= */

window.simulatePoliticalPressure = simulatePoliticalPressure;
window.updatePoliticalApproval = updatePoliticalApproval;
window.calculateEconomicApprovalEffect = calculateEconomicApprovalEffect;
window.calculateSocialApprovalEffect = calculateSocialApprovalEffect;
window.calculateSecurityApprovalEffect = calculateSecurityApprovalEffect;
window.calculateIdeologyApprovalEffect = calculateIdeologyApprovalEffect;
window.updatePolarization = updatePolarization;
window.calculateInequalityProxy = calculateInequalityProxy;
window.updateRegimeLegitimacy = updateRegimeLegitimacy;
window.updateGovernmentEfficiency = updateGovernmentEfficiency;
window.updateInternalSecurity = updateInternalSecurity;
window.getPoliticalBreakdown = getPoliticalBreakdown;


/* =========================================================
   SIMULATION.JS v3
   Parte 3.3.2.1/12
   Sistema electoral, partidos políticos y campañas.
   ========================================================= */

function simulateElectionSystem(country) {

    initializeElectionData(country);

    if (isElectionYear(country)) {

        updatePartySupport(country);

        runElectionCampaign(country);

        if (isElectionDay(country)) {

            holdElection(country);

        }

    }

}

function initializeElectionData(country){

    country.parties ??= JSON.parse(JSON.stringify(ELECTION_PARTIES));

    country.government ??= {

        primeMinister:"",

        coalition:[],

        majority:false,

        seats:0,

        approval:country.approval ?? 55

    };

}

function isElectionYear(country){

    if(country.regime!=="democracy") return false;

    return getSimulationYear()>=country.nextElectionYear;

}

function isElectionDay(country){

    return getCurrentMonthIndex()===10 &&
           getDayOfYear()>315;

}

function updatePartySupport(country){

    const economy=calculateEconomicApprovalEffect(country);

    const society=calculateSocialApprovalEffect(country);

    const security=calculateSecurityApprovalEffect(country);

    const ideology=country.ideology;

    country.parties.forEach(party=>{

        let delta=0;

        switch(party.ideology){

            case "socialism":

                delta+=society*0.08;
                delta-=economy*0.02;
                break;

            case "capitalist_liberalism":

                delta+=economy*0.09;
                delta-=country.taxRate*12;
                break;

            case "green":

                delta+=(100-country.co2/country.population*100000)*0.02;
                break;

            case "nationalism":

                delta+=security*0.06;
                delta+=country.warRisk*0.04;
                break;

            case "centrism":

                delta+=country.stability*0.03;
                break;

        }

        delta+=(Math.random()-0.5)*2;

        party.support=clamp(
            party.support+delta,
            2,
            65
        );

    });

    normalizePartySupport(country);

}

function normalizePartySupport(country){

    const total=country.parties.reduce((s,p)=>s+p.support,0);

    country.parties.forEach(p=>{

        p.support=p.support/total*100;

    });

}

function runElectionCampaign(country){

    country.parties.forEach(party=>{

        const campaignStrength=

            party.support*0.18+

            (party.budget||50)*0.08+

            Math.random()*2;

        party.campaignScore=campaignStrength;

    });

}

function holdElection(country){

    let winner=null;

    let max=-1;

    country.parties.forEach(p=>{

        const votes=

            p.support+

            p.campaignScore*0.25+

            (Math.random()-0.5)*4;

        p.votes=votes;

        if(votes>max){

            max=votes;

            winner=p;

        }

    });

    calculateParliament(country);

    formGovernment(country,winner);

    country.nextElectionYear+=4;

    addEvent(
        "🗳️",
        `${country.name}: ${winner.name} gana las elecciones.`
    );

}

function calculateParliament(country){

    const seats=350;

    country.parties.forEach(party=>{

        party.seats=Math.round(

            party.support/100*seats

        );

    });

}

function formGovernment(country,winner){

    country.government.primeMinister=winner.leader;

    country.government.coalition=[winner.name];

    country.government.seats=winner.seats;

    country.government.majority=winner.seats>=176;

    if(!country.government.majority){

        const coalition=

            country.parties

            .filter(p=>p!==winner)

            .sort((a,b)=>b.support-a.support);

        for(const party of coalition){

            country.government.coalition.push(party.name);

            country.government.seats+=party.seats;

            if(country.government.seats>=176){

                country.government.majority=true;

                break;

            }

        }

    }

    applyGovernmentIdeology(country,winner.ideology);

}

function applyGovernmentIdeology(country,newIdeology){

    if(country.ideology===newIdeology) return;

    country.ideology=newIdeology;

    addEvent(
        "🏛️",
        `${country.name}: nuevo gobierno con ideología ${newIdeology}.`
    );

}

function callSnapElection(country){

    if(country.regime!=="democracy") return;

    country.nextElectionYear=getSimulationYear();

    addEvent(
        "📢",
        `${country.name}: elecciones anticipadas convocadas.`
    );

}

function getElectionPolling(country){

    return [...country.parties]

        .sort((a,b)=>b.support-a.support)

        .map(p=>({

            name:p.name,

            leader:p.leader,

            ideology:p.ideology,

            support:p.support.toFixed(1),

            seats:Math.round(p.support*3.5)

        }));

}

function getGovernmentData(country){

    return{

        primeMinister:country.government.primeMinister,

        coalition:country.government.coalition,

        seats:country.government.seats,

        majority:country.government.majority,

        approval:country.approval,

        legitimacy:country.legitimacy

    };

}

/* =========================================================
   EXPORT GLOBAL
========================================================= */

window.simulateElectionSystem=simulateElectionSystem;
window.initializeElectionData=initializeElectionData;
window.isElectionYear=isElectionYear;
window.isElectionDay=isElectionDay;
window.updatePartySupport=updatePartySupport;
window.normalizePartySupport=normalizePartySupport;
window.runElectionCampaign=runElectionCampaign;
window.holdElection=holdElection;
window.calculateParliament=calculateParliament;
window.formGovernment=formGovernment;
window.applyGovernmentIdeology=applyGovernmentIdeology;
window.callSnapElection=callSnapElection;
window.getElectionPolling=getElectionPolling;
window.getGovernmentData=getGovernmentData;


/* =========================================================
   SIMULATION.JS v3
   Parte 3.3.2.2/12
   Crisis políticas, mociones, golpes de Estado, revoluciones,
   referéndums y cambios de régimen.
   ========================================================= */

function simulatePoliticalCrisis(country) {
  if (!country) return;

  initializeElectionData(country);

  const crisisRisk = calculatePoliticalCrisisRisk(country);
  country.politicalCrisisRisk = crisisRisk;

  if (crisisRisk > 65 && randomChance(0.004)) {
    triggerPoliticalCrisis(country);
  }

  if (country.regime === "democracy") {
    checkNoConfidenceMotion(country);
  } else {
    checkAuthoritarianInstability(country);
  }

  checkRegimeTransitionPressure(country);
}

function calculatePoliticalCrisisRisk(country) {
  return clamp(
    (100 - (country.legitimacy || 50)) * 0.32 +
    (country.socialPressure || 0) * 0.28 +
    (country.polarization || 0) * 0.20 +
    (country.fiscalStress || 0) * 0.12 +
    (country.warRisk || 0) * 0.10 +
    (country.sanctions || 0) * 0.9 -
    (country.internalSecurity || 50) * 0.16,
    0,
    100
  );
}

function triggerPoliticalCrisis(country) {
  const regime = getRegime(country);

  if (country.regime === "democracy") {
    addEvent("🏛️", `${country.name}: crisis parlamentaria por baja legitimidad.`);
    country.stability = boundedDelta(country.stability, -1.2, 0, 100);
    country.approval = boundedDelta(country.approval || 50, -2.0, 0, 100);

    if ((country.legitimacy || 50) < 30) {
      callSnapElection(country);
    }

    return;
  }

  if (regime.repression > 0.55) {
    addEvent("🚨", `${country.name}: disturbios reprimidos por el aparato de seguridad.`);
    country.happiness = boundedDelta(country.happiness, -1.4, 0, 100);
    country.stability = boundedDelta(country.stability, -0.4, 0, 100);
    country.internalSecurity = boundedDelta(country.internalSecurity || 50, 1.8, 0, 100);
  } else {
    addEvent("🔥", `${country.name}: crisis interna amenaza la continuidad del régimen.`);
    country.stability = boundedDelta(country.stability, -1.6, 0, 100);
  }
}

function checkNoConfidenceMotion(country) {
  if (country.regime !== "democracy") return;
  if (!country.government) return;

  const weakMajority = !country.government.majority;
  const lowApproval = (country.approval || 50) < 34;
  const highPolarization = (country.polarization || 0) > 72;

  if ((weakMajority || lowApproval) && highPolarization && randomChance(0.003)) {
    addEvent("📉", `${country.name}: moción de censura presentada contra el gobierno.`);

    const successChance =
      0.25 +
      (weakMajority ? 0.22 : 0) +
      (lowApproval ? 0.20 : 0) +
      Math.max(0, 40 - (country.legitimacy || 50)) * 0.006;

    if (randomChance(successChance)) {
      addEvent("🗳️", `${country.name}: la moción prospera; se convocan elecciones anticipadas.`);
      country.stability = boundedDelta(country.stability, -1.5, 0, 100);
      callSnapElection(country);
    } else {
      addEvent("🏛️", `${country.name}: el gobierno supera la moción de censura.`);
      country.legitimacy = boundedDelta(country.legitimacy || 50, 1.2, 0, 100);
    }
  }
}

function checkAuthoritarianInstability(country) {
  if (country.regime !== "authoritarian" && country.regime !== "monarchy") return;

  const coupRisk = calculateCoupRisk(country);
  country.coupRisk = coupRisk;

  if (coupRisk > 70 && randomChance(0.0035)) {
    triggerCoupAttempt(country);
  }

  const revolutionRisk = calculateRevolutionRisk(country);
  country.revolutionRisk = revolutionRisk;

  if (revolutionRisk > 78 && randomChance(0.0028)) {
    triggerRevolution(country);
  }
}

function calculateCoupRisk(country) {
  const militaryWeight = calculateDefenseReadiness(country);
  const legitimacy = country.legitimacy || 50;
  const stability = country.stability || 50;

  return clamp(
    (100 - legitimacy) * 0.30 +
    (100 - stability) * 0.22 +
    (country.polarization || 0) * 0.18 +
    (country.fiscalStress || 0) * 0.10 +
    militaryWeight * 0.07 -
    (country.internalSecurity || 50) * 0.18,
    0,
    100
  );
}

function calculateRevolutionRisk(country) {
  return clamp(
    (country.socialPressure || 0) * 0.38 +
    (100 - (country.happiness || 50)) * 0.25 +
    (100 - (country.legitimacy || 50)) * 0.20 +
    (country.polarization || 0) * 0.12 +
    (country.sanctions || 0) * 0.7 -
    (country.internalSecurity || 50) * 0.14,
    0,
    100
  );
}

function triggerCoupAttempt(country) {
  addEvent("🪖", `${country.name}: intento de golpe de Estado.`);

  const successChance = clamp(
    0.22 +
    (100 - (country.legitimacy || 50)) * 0.004 +
    (country.military / Math.max(country.population, 1)) * 12 -
    (country.internalSecurity || 50) * 0.004,
    0.08,
    0.78
  );

  if (randomChance(successChance)) {
    country.regime = "authoritarian";
    country.ideology = "nationalism";
    country.stability = boundedDelta(country.stability, -4.5, 0, 100);
    country.happiness = boundedDelta(country.happiness, -5.5, 0, 100);
    country.legitimacy = 38;
    country.internalSecurity = boundedDelta(country.internalSecurity || 50, 12, 0, 100);
    country.reputation = boundedDelta(country.reputation || 60, -12, 0, 100);

    addEvent("🚨", `${country.name}: golpe exitoso; se instaura un régimen autoritario.`);
  } else {
    country.stability = boundedDelta(country.stability, -3.0, 0, 100);
    country.internalSecurity = boundedDelta(country.internalSecurity || 50, -4, 0, 100);
    country.military = Math.max(0, country.military * 0.985);

    addEvent("✅", `${country.name}: el golpe fracasa, pero la estabilidad queda dañada.`);
  }
}

function triggerRevolution(country) {
  addEvent("🔥", `${country.name}: estalla una revolución popular.`);

  const successChance = clamp(
    0.18 +
    (country.socialPressure || 0) * 0.005 +
    (100 - (country.legitimacy || 50)) * 0.004 -
    (country.internalSecurity || 50) * 0.004,
    0.08,
    0.82
  );

  if (randomChance(successChance)) {
    country.regime = "democracy";
    country.ideology = "social_democracy";
    country.nextElectionYear = getSimulationYear() + 1;
    country.stability = 42;
    country.legitimacy = 52;
    country.approval = 55;
    country.polarization = boundedDelta(country.polarization || 50, -8, 0, 100);
    country.reputation = boundedDelta(country.reputation || 60, 8, 0, 100);

    addEvent("🗳️", `${country.name}: revolución exitosa; transición hacia democracia.`);
  } else {
    country.stability = boundedDelta(country.stability, -5, 0, 100);
    country.happiness = boundedDelta(country.happiness, -4, 0, 100);
    country.internalSecurity = boundedDelta(country.internalSecurity || 50, 6, 0, 100);

    addEvent("🧱", `${country.name}: la revolución fracasa tras una fuerte represión.`);
  }
}

function checkRegimeTransitionPressure(country) {
  if (country.regime === "democracy") {
    const authoritarianPressure =
      (country.warRisk || 0) * 0.22 +
      (country.socialPressure || 0) * 0.16 +
      (country.polarization || 0) * 0.18 -
      (country.legitimacy || 50) * 0.15;

    if (authoritarianPressure > 38 && randomChance(0.0018)) {
      addEvent("⚠️", `${country.name}: crece la demanda de orden y poder ejecutivo fuerte.`);
      country.polarization = boundedDelta(country.polarization || 40, 1.2, 0, 100);
    }
  }

  if (country.regime === "authoritarian") {
    const democraticPressure =
      (country.happiness || 50) * 0.16 +
      (country.educationQuality || 50) * 0.14 +
      (country.socialPressure || 0) * 0.10 +
      (100 - (country.internalSecurity || 50)) * 0.18 -
      (country.legitimacy || 50) * 0.08;

    if (democraticPressure > 42 && randomChance(0.0018)) {
      addEvent("📢", `${country.name}: aumenta la presión por apertura política.`);
      country.legitimacy = boundedDelta(country.legitimacy || 50, -0.7, 0, 100);
    }
  }
}

function changeRegime(regimeId) {
  const country = getSelectedCountry();
  if (!country || !REGIMES[regimeId]) return;

  const oldRegime = getRegime(country).name;
  const newRegime = REGIMES[regimeId].name;

  country.regime = regimeId;
  country.government = newRegime;

  country.stability = boundedDelta(country.stability, regimeId === "authoritarian" ? 2 : -1, 0, 100);
  country.happiness = boundedDelta(country.happiness, regimeId === "authoritarian" ? -4 : 2, 0, 100);
  country.reputation = boundedDelta(country.reputation || 60, regimeId === "democracy" ? 4 : -6, 0, 100);
  country.legitimacy = boundedDelta(country.legitimacy || 50, -2, 0, 100);

  addEvent("🏛️", `${country.name}: cambio de régimen de ${oldRegime} a ${newRegime}.`);
  renderAll();
}

function changeIdeology(ideologyId) {
  const country = getSelectedCountry();
  if (!country || !IDEOLOGIES[ideologyId]) return;

  const oldIdeology = getIdeology(country).name;
  const newIdeology = IDEOLOGIES[ideologyId].name;

  country.ideology = ideologyId;
  country.happiness = boundedDelta(country.happiness, IDEOLOGIES[ideologyId].happinessModifier || 0, 0, 100);
  country.businessConfidence = boundedDelta(
    country.businessConfidence || 50,
    IDEOLOGIES[ideologyId].businessConfidence || 0,
    0,
    100
  );

  addEvent("🧭", `${country.name}: orientación ideológica cambia de ${oldIdeology} a ${newIdeology}.`);
  renderAll();
}

function callReferendum(country, topic = "regime") {
  const legitimacy = country.legitimacy || 50;
  const approval = country.approval || 50;
  const polarization = country.polarization || 40;

  const yesChance = clamp(
    0.42 +
    (approval - 50) * 0.004 +
    (legitimacy - 50) * 0.003 -
    polarization * 0.0015,
    0.18,
    0.82
  );

  const yes = randomChance(yesChance);

  addEvent(
    yes ? "✅" : "❌",
    `${country.name}: referéndum sobre ${topic}; resultado ${yes ? "aprobado" : "rechazado"}.`
  );

  return yes;
}

function getPoliticalCrisisBreakdown(country) {
  return {
    politicalCrisisRisk: country.politicalCrisisRisk || 0,
    coupRisk: country.coupRisk || 0,
    revolutionRisk: country.revolutionRisk || 0,
    regime: country.regime,
    ideology: country.ideology,
    legitimacy: country.legitimacy || 0,
    approval: country.approval || 0,
    polarization: country.polarization || 0,
    internalSecurity: country.internalSecurity || 0
  };
}

/* =========================================================
   EXPORT GLOBAL — PARTE 3.3.2.2
========================================================= */

window.simulatePoliticalCrisis = simulatePoliticalCrisis;
window.calculatePoliticalCrisisRisk = calculatePoliticalCrisisRisk;
window.triggerPoliticalCrisis = triggerPoliticalCrisis;
window.checkNoConfidenceMotion = checkNoConfidenceMotion;
window.checkAuthoritarianInstability = checkAuthoritarianInstability;
window.calculateCoupRisk = calculateCoupRisk;
window.calculateRevolutionRisk = calculateRevolutionRisk;
window.triggerCoupAttempt = triggerCoupAttempt;
window.triggerRevolution = triggerRevolution;
window.checkRegimeTransitionPressure = checkRegimeTransitionPressure;
window.changeRegime = changeRegime;
window.changeIdeology = changeIdeology;
window.callReferendum = callReferendum;
window.getPoliticalCrisisBreakdown = getPoliticalCrisisBreakdown;


/* =========================================================
   SIMULATION.JS v3
   Parte 3.4/12
   Integración política diaria, elecciones, crisis y reformas.
   ========================================================= */

const OLD_SIMULATE_POLITICAL_PRESSURE = window.simulatePoliticalPressure;

function simulatePoliticalPressure(country) {
  updatePoliticalApproval(country);
  updatePolarization(country);
  updateRegimeLegitimacy(country);
  updateGovernmentEfficiency(country);
  updateInternalSecurity(country);

  simulateElectionSystem(country);
  simulatePoliticalCrisis(country);
  updateReformPressure(country);
}

function updateReformPressure(country) {
  country.reformPressure = clamp(
    (country.socialPressure || 0) * 0.30 +
    (country.fiscalStress || 0) * 0.22 +
    (100 - (country.governmentEfficiency || 50)) * 0.18 +
    (country.polarization || 0) * 0.12 +
    Math.max(0, 55 - (country.approval || 50)) * 0.25,
    0,
    100
  );

  if (country.reformPressure > 78 && randomChance(0.003)) {
    addEvent("📜", `${country.name}: presión creciente para aprobar reformas estructurales.`);
  }
}

function applyAdministrativeReform(country) {
  const cost = country.gdp * 0.0025;

  if (country.treasury < cost) {
    addEvent("⛔", `${country.name}: tesorería insuficiente para reforma administrativa.`);
    return false;
  }

  country.treasury -= cost;
  country.governmentEfficiency = boundedDelta(country.governmentEfficiency || 50, 5, 0, 100);
  country.stability = boundedDelta(country.stability, 1.2, 0, 100);
  country.reformPressure = boundedDelta(country.reformPressure || 0, -8, 0, 100);

  addEvent("📜", `${country.name}: reforma administrativa aprobada.`);
  return true;
}

function applyLaborReform(country, direction = "flexible") {
  const cost = country.gdp * 0.0015;

  if (country.treasury < cost) {
    addEvent("⛔", `${country.name}: no puede financiar la reforma laboral.`);
    return false;
  }

  country.treasury -= cost;

  if (direction === "flexible") {
    country.businessConfidence = boundedDelta(country.businessConfidence || 50, 5, 0, 100);
    country.happiness = boundedDelta(country.happiness, -1.8, 0, 100);
    country.unemploymentRate = Math.max(0, (country.unemploymentRate || 0.08) - 0.004);
  } else {
    country.happiness = boundedDelta(country.happiness, 2.2, 0, 100);
    country.businessConfidence = boundedDelta(country.businessConfidence || 50, -2.8, 0, 100);
    country.socialPressure = boundedDelta(country.socialPressure || 0, -4, 0, 100);
  }

  addEvent("⚙️", `${country.name}: reforma laboral aplicada.`);
  return true;
}

function applyFiscalReform(country, type = "efficiency") {
  const cost = country.gdp * 0.002;

  if (country.treasury < cost) {
    addEvent("⛔", `${country.name}: fondos insuficientes para reforma fiscal.`);
    return false;
  }

  country.treasury -= cost;

  if (type === "efficiency") {
    country.governmentEfficiency = boundedDelta(country.governmentEfficiency || 50, 4, 0, 100);
    country.fiscalStress = boundedDelta(country.fiscalStress || 0, -5, 0, 100);
  }

  if (type === "redistribution") {
    country.happiness = boundedDelta(country.happiness, 2.5, 0, 100);
    country.polarization = boundedDelta(country.polarization || 0, -3, 0, 100);
    country.businessConfidence = boundedDelta(country.businessConfidence || 50, -1.5, 0, 100);
  }

  addEvent("💶", `${country.name}: reforma fiscal completada.`);
  return true;
}

function applySecurityReform(country) {
  const cost = country.gdp * 0.0022;

  if (country.treasury < cost) {
    addEvent("⛔", `${country.name}: fondos insuficientes para reforma de seguridad.`);
    return false;
  }

  country.treasury -= cost;
  country.internalSecurity = boundedDelta(country.internalSecurity || 50, 6, 0, 100);
  country.cyber += 80;
  country.stability = boundedDelta(country.stability, 0.8, 0, 100);
  country.happiness = boundedDelta(country.happiness, -0.8, 0, 100);

  addEvent("🛡️", `${country.name}: reforma de seguridad interior aprobada.`);
  return true;
}

function applyConstitutionalReform(country) {
  const approved = callReferendum(country, "reforma constitucional");

  if (approved) {
    country.legitimacy = boundedDelta(country.legitimacy || 50, 6, 0, 100);
    country.stability = boundedDelta(country.stability, 2.5, 0, 100);
    country.polarization = boundedDelta(country.polarization || 0, -6, 0, 100);
  } else {
    country.legitimacy = boundedDelta(country.legitimacy || 50, -3, 0, 100);
    country.polarization = boundedDelta(country.polarization || 0, 4, 0, 100);
  }

  return approved;
}

function applyReform(type) {
  const country = getSelectedCountry();

  if (!country) return;

  if (type === "administrative") applyAdministrativeReform(country);
  if (type === "labor_flexible") applyLaborReform(country, "flexible");
  if (type === "labor_protective") applyLaborReform(country, "protective");
  if (type === "fiscal_efficiency") applyFiscalReform(country, "efficiency");
  if (type === "fiscal_redistribution") applyFiscalReform(country, "redistribution");
  if (type === "security") applySecurityReform(country);
  if (type === "constitutional") applyConstitutionalReform(country);

  renderAll();
}

function getReformOptions(country) {
  return [
    {
      id: "administrative",
      name: "Reforma administrativa",
      icon: "📜",
      cost: country.gdp * 0.0025,
      effect: "+eficiencia gubernamental · +estabilidad"
    },
    {
      id: "labor_flexible",
      name: "Reforma laboral flexible",
      icon: "⚙️",
      cost: country.gdp * 0.0015,
      effect: "+confianza empresarial · -paro · -felicidad"
    },
    {
      id: "labor_protective",
      name: "Reforma laboral protectora",
      icon: "🤝",
      cost: country.gdp * 0.0015,
      effect: "+felicidad · -presión social · -confianza empresarial"
    },
    {
      id: "fiscal_efficiency",
      name: "Reforma fiscal eficiente",
      icon: "💶",
      cost: country.gdp * 0.002,
      effect: "-estrés fiscal · +eficiencia"
    },
    {
      id: "fiscal_redistribution",
      name: "Reforma redistributiva",
      icon: "⚖️",
      cost: country.gdp * 0.002,
      effect: "+felicidad · -polarización"
    },
    {
      id: "security",
      name: "Reforma de seguridad",
      icon: "🛡️",
      cost: country.gdp * 0.0022,
      effect: "+seguridad interior · +cyber"
    },
    {
      id: "constitutional",
      name: "Reforma constitucional",
      icon: "🏛️",
      cost: 0,
      effect: "Referéndum nacional"
    }
  ];
}

function getPoliticalSystemStatus(country) {
  return {
    ...getPoliticalBreakdown(country),
    ...getPoliticalCrisisBreakdown(country),
    government: getGovernmentData(country),
    polling: getElectionPolling(country),
    reforms: getReformOptions(country),
    reformPressure: country.reformPressure || 0
  };
}

/* =========================================================
   EXPORT GLOBAL — PARTE 3.4
========================================================= */

window.simulatePoliticalPressure = simulatePoliticalPressure;
window.updateReformPressure = updateReformPressure;
window.applyAdministrativeReform = applyAdministrativeReform;
window.applyLaborReform = applyLaborReform;
window.applyFiscalReform = applyFiscalReform;
window.applySecurityReform = applySecurityReform;
window.applyConstitutionalReform = applyConstitutionalReform;
window.applyReform = applyReform;
window.getReformOptions = getReformOptions;
window.getPoliticalSystemStatus = getPoliticalSystemStatus;


/* =========================================================
   SIMULATION.JS v3
   Parte 3.5/12
   Construcción, mejora de ciudades, infraestructuras y
   aplicación automática de políticas estratégicas.
   ========================================================= */

function startConstruction(buildingId, regionId) {
  const country = getSelectedCountry();
  if (!country) return;

  const region = country.regions.find(r => r.id === regionId) || getSelectedRegion();
  const building = findBuildingById(buildingId);

  if (!building || !region) return;

  const existing = region.buildings?.find(item => item.buildingId === buildingId);
  const level = existing ? existing.level + 1 : 1;
  const cost = calculateConstructionCost(country, building, level);

  if (country.treasury < cost) {
    addEvent("⛔", `${country.name}: fondos insuficientes para ${building.name}.`);
    renderAll();
    return;
  }

  if (existing && existing.level >= SIMULATION_CONFIG.defaultConstructionLevelCap) {
    addEvent("⚠️", `${building.name} ya está al nivel máximo en ${region.name}.`);
    renderAll();
    return;
  }

  country.treasury -= cost;
  country.constructionQueue ??= [];

  country.constructionQueue.push({
    id: String(Date.now() + Math.random()),
    buildingId,
    regionId: region.id,
    name: building.name,
    icon: building.icon,
    targetLevel: level,
    remainingDays: Math.max(5, Math.round((building.days || 30) * (0.85 + level * 0.15))),
    totalDays: Math.max(5, Math.round((building.days || 30) * (0.85 + level * 0.15))),
    cost
  });

  addEvent("🏗️", `${country.name}: inicia ${existing ? "mejora" : "construcción"} de ${building.name} en ${region.name}.`);
  renderAll();
}

function simulateConstructionQueue(country) {
  country.constructionQueue ??= [];

  for (const project of country.constructionQueue) {
    project.remainingDays -= 1;
  }

  const completed = country.constructionQueue.filter(project => project.remainingDays <= 0);
  country.constructionQueue = country.constructionQueue.filter(project => project.remainingDays > 0);

  for (const project of completed) {
    completeConstructionProject(country, project);
  }
}

function completeConstructionProject(country, project) {
  const region = country.regions.find(r => r.id === project.regionId);
  const building = findBuildingById(project.buildingId);

  if (!region || !building) return;

  region.buildings ??= [];

  const existing = region.buildings.find(item => item.buildingId === project.buildingId);

  if (existing) {
    existing.level = Math.min(
      SIMULATION_CONFIG.defaultConstructionLevelCap,
      project.targetLevel || existing.level + 1
    );
  } else {
    region.buildings.push({
      buildingId: project.buildingId,
      level: project.targetLevel || 1
    });
  }

  region.buildingId = project.buildingId;
  region.level = project.targetLevel || 1;

  applyBuildingImmediateEffects(country, region, building, project.targetLevel || 1);

  addEvent("✅", `${country.name}: ${building.name} completado en ${region.name}.`);
}

function applyBuildingImmediateEffects(country, region, building, level = 1) {
  country.gdp += (building.gdp || 0) * level;
  country.population += (building.population || 0) * level;
  country.research += (building.research || 0) * level;
  country.military += (building.military || 0) * level;
  country.cyber += (building.cyber || 0) * level;

  country.energyProduction += Math.max(0, building.energy || 0) * level;
  country.energyDemand += Math.abs(Math.min(0, building.energy || 0)) * level;
  country.foodProduction += (building.foodProduction || 0) * level;
  country.waterDemand = (country.waterDemand || 0) + (building.waterDemand || 0) * level;

  country.co2 = Math.max(0, country.co2 + (building.co2 || 0) * level);
  country.happiness = boundedDelta(country.happiness, (building.happiness || 0) * level, 0, 100);

  if (building.renewableMW) {
    country.renewablesMW = (country.renewablesMW || 0) + building.renewableMW * level;
    country.installedPower = (country.installedPower || 0) + building.renewableMW * level;
  }

  if (building.exports) {
    country.exports += building.exports * level;
  }

  if (building.tourism) {
    country.tourism = (country.tourism || 0) + building.tourism * level;
  }

  region.gdp = (region.gdp || 0) + (building.gdp || 0) * level;
  region.population = (region.population || 0) + (building.population || 0) * level;
}

function calculateConstructionCost(country, building, level = 1) {
  const base = building.cost || 1_000_000;
  const levelMultiplier = 1 + Math.max(0, level - 1) * 0.65;
  const inflation = 1 + Math.max(0, (country.inflation || SIMULATION_CONFIG.baseInflation) - 0.02) * 2.8;
  const efficiency = 1 - (country.governmentEfficiency || 50) * 0.0012;
  const technologyDiscount = country.completedTechnologies?.includes("advanced_manufacturing") ? 0.96 : 1;

  return Math.round(base * levelMultiplier * inflation * efficiency * technologyDiscount);
}

function getConstructionProgress(project) {
  return clamp(
    100 * (1 - project.remainingDays / Math.max(project.totalDays, 1)),
    0,
    100
  );
}

function getRegionBuildings(region) {
  return (region.buildings || []).map(item => {
    const building = findBuildingById(item.buildingId);
    return {
      ...item,
      building,
      name: building?.name || item.buildingId,
      icon: building?.icon || "🏗️"
    };
  });
}

function getConstructionOptions(country, region) {
  return Object.entries(BUILDINGS).map(([category, buildings]) => ({
    category,
    categoryName: getBuildCategoryName(category),
    buildings: buildings.map(building => {
      const existing = region?.buildings?.find(item => item.buildingId === building.id);
      const nextLevel = existing ? existing.level + 1 : 1;

      return {
        ...building,
        existingLevel: existing?.level || 0,
        nextLevel,
        maxed: existing?.level >= SIMULATION_CONFIG.defaultConstructionLevelCap,
        calculatedCost: calculateConstructionCost(country, building, nextLevel)
      };
    })
  }));
}

/* =========================================================
   POLÍTICAS AUTOMÁTICAS
========================================================= */

function applyStrategicPolicy(policyId) {
  const country = getSelectedCountry();
  const policy = POLICY_PRESETS[policyId];

  if (!country || !policy) return;

  const intensityInput = document.getElementById(`policy-intensity-${policyId}`);
  const intensity = intensityInput ? Number(intensityInput.value) : SIMULATION_CONFIG.defaultPolicyIntensity;
  const multiplier = clamp(intensity / 50, 0.25, 2.5);

  const cost = Math.round(policy.baseCost * multiplier);

  if (country.treasury < cost) {
    addEvent("⛔", `${country.name}: tesorería insuficiente para ${policy.name}.`);
    renderAll();
    return;
  }

  country.treasury -= cost;

  applyPolicyDirectEffects(country, policy, multiplier);
  applyPolicyAutoConstruction(country, policy, multiplier);
  applyPolicyAutoUnits(country, policy, multiplier);

  addEvent(policy.icon, `${country.name}: política estratégica aplicada — ${policy.name} (${Math.round(intensity)}%).`);
  renderAll();
}

function applyPolicyDirectEffects(country, policy, multiplier = 1) {
  const e = policy.effects || {};

  if (e.defenseSpendingMultiplier) country.defenseSpending *= 1 + (e.defenseSpendingMultiplier - 1) * multiplier;
  if (e.socialSpendingMultiplier) country.socialSpending *= 1 + (e.socialSpendingMultiplier - 1) * multiplier;
  if (e.co2Multiplier) country.co2 *= 1 + (e.co2Multiplier - 1) * multiplier;
  if (e.gdpShortTerm) country.gdp *= 1 + e.gdpShortTerm * multiplier;
  if (e.co2Increase) country.co2 *= 1 + e.co2Increase * multiplier;
  if (e.employment) country.unemploymentRate = Math.max(0, (country.unemploymentRate || 0.08) - e.employment * 0.001 * multiplier);
  if (e.reputation) country.reputation = boundedDelta(country.reputation || 60, e.reputation * multiplier, 0, 100);
  if (e.happiness) country.happiness = boundedDelta(country.happiness, e.happiness * multiplier, 0, 100);
  if (e.stability) country.stability = boundedDelta(country.stability, e.stability * multiplier, 0, 100);
  if (e.warRisk) country.warRisk = boundedDelta(country.warRisk || 0, e.warRisk * multiplier, 0, 100);
  if (e.debtPressure) country.debt += country.gdp * e.debtPressure * multiplier;
}

function applyPolicyAutoConstruction(country, policy, multiplier = 1) {
  const items = policy.autoConstruction || [];
  const regions = getBestRegionsForPolicy(country, policy.id);

  if (!regions.length) return;

  let regionIndex = 0;

  for (const item of items) {
    const count = Math.max(1, Math.round(item.count * multiplier));

    for (let i = 0; i < count; i++) {
      const region = regions[regionIndex % regions.length];
      regionIndex++;

      const building = findBuildingById(item.buildingId);
      if (!building) continue;

      const existing = region.buildings?.find(b => b.buildingId === item.buildingId);
      const targetLevel = existing ? Math.min(5, existing.level + 1) : 1;

      country.constructionQueue.push({
        id: String(Date.now() + Math.random()),
        buildingId: item.buildingId,
        regionId: region.id,
        name: building.name,
        icon: building.icon,
        targetLevel,
        remainingDays: Math.max(3, Math.round((building.days || 30) * 0.65)),
        totalDays: Math.max(3, Math.round((building.days || 30) * 0.65)),
        cost: 0,
        automatic: true
      });
    }
  }
}

function applyPolicyAutoUnits(country, policy, multiplier = 1) {
  const items = policy.autoUnits || [];

  country.militaryQueue ??= [];

  for (const item of items) {
    const unit = findMilitaryUnitById(item.unitId);
    if (!unit) continue;

    const quantity = Math.max(1, Math.round(item.quantity * multiplier));

    country.militaryQueue.push({
      id: String(Date.now() + Math.random()),
      unitId: unit.id,
      name: unit.name,
      icon: unit.icon,
      quantity,
      remainingDays: Math.max(3, Math.round(unit.days * 0.75)),
      totalDays: Math.max(3, Math.round(unit.days * 0.75)),
      cost: 0,
      automatic: true
    });
  }
}

function getBestRegionsForPolicy(country, policyId) {
  const regions = [...(country.regions || [])];

  if (policyId === "rearmament") {
    return regions.sort((a, b) =>
      scoreRegionForMilitary(b) - scoreRegionForMilitary(a)
    );
  }

  if (policyId === "green_transition") {
    return regions.sort((a, b) =>
      scoreRegionForGreenPolicy(b) - scoreRegionForGreenPolicy(a)
    );
  }

  if (policyId === "industrialization") {
    return regions.sort((a, b) =>
      scoreRegionForIndustry(b) - scoreRegionForIndustry(a)
    );
  }

  return regions.sort((a, b) => (b.population || 0) - (a.population || 0));
}

function scoreRegionForMilitary(region) {
  let score = 0;
  if (region.type === "naval") score += 25;
  if (region.type === "port") score += 15;
  if (region.type === "capital") score += 10;
  if (region.type === "aerospace") score += 12;
  score += (region.gdp || 0) / 10_000_000_000;
  return score;
}

function scoreRegionForGreenPolicy(region) {
  let score = 0;
  if (region.type === "energy") score += 15;
  if (region.type === "tourism") score += 10;
  if (region.type === "agriculture") score += 8;
  score += Math.max(0, 2_000_000 - (region.population || 0)) / 200_000;
  return score;
}

function scoreRegionForIndustry(region) {
  let score = 0;
  if (region.type === "industry") score += 22;
  if (region.type === "automotive") score += 20;
  if (region.type === "port") score += 14;
  if (region.type === "logistics") score += 12;
  score += (region.gdp || 0) / 8_000_000_000;
  return score;
}

/* =========================================================
   EXPORT GLOBAL — PARTE 3.5
========================================================= */

window.startConstruction = startConstruction;
window.simulateConstructionQueue = simulateConstructionQueue;
window.completeConstructionProject = completeConstructionProject;
window.applyBuildingImmediateEffects = applyBuildingImmediateEffects;
window.calculateConstructionCost = calculateConstructionCost;
window.getConstructionProgress = getConstructionProgress;
window.getRegionBuildings = getRegionBuildings;
window.getConstructionOptions = getConstructionOptions;

window.applyStrategicPolicy = applyStrategicPolicy;
window.applyPolicyDirectEffects = applyPolicyDirectEffects;
window.applyPolicyAutoConstruction = applyPolicyAutoConstruction;
window.applyPolicyAutoUnits = applyPolicyAutoUnits;
window.getBestRegionsForPolicy = getBestRegionsForPolicy;
window.scoreRegionForMilitary = scoreRegionForMilitary;
window.scoreRegionForGreenPolicy = scoreRegionForGreenPolicy;
window.scoreRegionForIndustry = scoreRegionForIndustry;



/* =========================================================
   SIMULATION.JS v3
   Parte 3.6.1/12
   Producción militar: colas, costes, mantenimiento y poder.
   ========================================================= */

function startMilitaryProduction(unitId, quantity = 1, regionId = null) {
  const country = getSelectedCountry();
  if (!country) return;

  const unit = findMilitaryUnitById(unitId);
  if (!unit) {
    addEvent("⛔", `Unidad militar no encontrada: ${unitId}.`);
    renderAll();
    return;
  }

  quantity = Math.max(1, Math.round(Number(quantity) || 1));

  const region = regionId
    ? country.regions.find(r => r.id === regionId)
    : getSelectedRegion();

  const capacity = calculateMilitaryProductionCapacity(country, unit, region);

  if (capacity <= 0) {
    addEvent("⛔", `${country.name}: falta capacidad industrial/militar para producir ${unit.name}.`);
    renderAll();
    return;
  }

  const cost = calculateMilitaryProductionCost(country, unit, quantity);

  if (country.treasury < cost) {
    addEvent("⛔", `${country.name}: tesorería insuficiente para producir ${quantity}× ${unit.name}.`);
    renderAll();
    return;
  }

  country.treasury -= cost;
  country.militaryQueue ??= [];

  const totalDays = Math.max(
    3,
    Math.round((unit.days || 30) * quantity / capacity)
  );

  country.militaryQueue.push({
    id: String(Date.now() + Math.random()),
    unitId: unit.id,
    name: unit.name,
    icon: unit.icon,
    quantity,
    regionId: region?.id || null,
    remainingDays: totalDays,
    totalDays,
    cost,
    automatic: false
  });

  addEvent("🛠️", `${country.name}: producción militar iniciada — ${quantity}× ${unit.name}.`);
  renderAll();
}

function simulateMilitaryProductionQueue(country) {
  country.militaryQueue ??= [];

  updateMilitaryMaintenance(country);

  for (const project of country.militaryQueue) {
    project.remainingDays -= 1;
  }

  const completed = country.militaryQueue.filter(project => project.remainingDays <= 0);
  country.militaryQueue = country.militaryQueue.filter(project => project.remainingDays > 0);

  for (const project of completed) {
    completeMilitaryProduction(country, project);
  }

  updateMilitaryPowerFromUnits(country);
}

function completeMilitaryProduction(country, project) {
  const unit = findMilitaryUnitById(project.unitId);

  if (!unit) return;

  country.units ??= {};
  country.units[unit.id] = (country.units[unit.id] || 0) + project.quantity;

  country.military += (unit.power || 0) * project.quantity;

  addEvent("✅", `${country.name}: completada producción militar — ${project.quantity}× ${unit.name}.`);
}

function calculateMilitaryProductionCost(country, unit, quantity = 1) {
  const base = (unit.cost || 1_000_000) * quantity;
  const inflation = 1 + Math.max(0, (country.inflation || SIMULATION_CONFIG.baseInflation) - 0.02) * 2.2;
  const industryDiscount = 1 - clamp(getIndustrialLevel(country) * 0.025, 0, 0.14);
  const sanctionsPenalty = 1 + country.sanctions * 0.012;
  const technologyDiscount = country.completedTechnologies?.includes("advanced_manufacturing") ? 0.96 : 1;

  return Math.round(base * inflation * industryDiscount * sanctionsPenalty * technologyDiscount);
}

function calculateMilitaryProductionCapacity(country, unit, region = null) {
  const domain = unit.domain || "";

  let capacity = 0.5;

  const industrialLevel = getIndustrialLevel(country);
  capacity += industrialLevel * 0.22;

  const militaryIndustry = getMilitaryIndustryScore(country);
  capacity += militaryIndustry * 0.035;

  if (domain.includes("air")) {
    capacity += getBuildingLevelSum(country, "airbase") * 0.16;
    capacity += getBuildingLevelSum(country, "electronics") * 0.05;
  }

  if (domain.includes("sea")) {
    capacity += getBuildingLevelSum(country, "naval") * 0.18;
    capacity += getBuildingLevelSum(country, "shipyard") * 0.22;
    capacity += getBuildingLevelSum(country, "ports") * 0.05;
  }

  if (domain.includes("land")) {
    capacity += getBuildingLevelSum(country, "barracks") * 0.18;
    capacity += getBuildingLevelSum(country, "steel") * 0.08;
    capacity += getBuildingLevelSum(country, "cars") * 0.06;
  }

  if (domain.includes("cyber")) {
    capacity += getBuildingLevelSum(country, "cyber") * 0.22;
    capacity += country.cyber / 5000;
  }

  if (region) {
    capacity += scoreRegionForMilitary(region) * 0.015;
  }

  const sanctionsPenalty = 1 - clamp(country.sanctions * 0.015, 0, 0.55);
  const stabilityModifier = 0.75 + country.stability / 160;

  return Math.max(0, capacity * sanctionsPenalty * stabilityModifier);
}

function getMilitaryIndustryScore(country) {
  let score = 0;

  for (const region of country.regions || []) {
    for (const item of region.buildings || []) {
      const building = findBuildingById(item.buildingId);
      if (!building) continue;

      if (building.militaryIndustry) score += 8 * (item.level || 1);
      if (building.id === "steel") score += 2.5 * (item.level || 1);
      if (building.id === "electronics") score += 2 * (item.level || 1);
      if (building.id === "shipyard") score += 4 * (item.level || 1);
      if (building.id === "cars") score += 1.8 * (item.level || 1);
    }
  }

  return score;
}

function updateMilitaryMaintenance(country) {
  const maintenance = calculateDailyMilitaryMaintenance(country);

  country.dailyMilitaryMaintenance = maintenance;
  country.treasury -= maintenance;

  if (country.treasury < 0) {
    country.debt += Math.abs(country.treasury);
    country.treasury = 0;

    const readinessLoss = maintenance / Math.max(country.gdp, 1) * 100;
    country.militaryReadiness = boundedDelta(country.militaryReadiness || 70, -readinessLoss, 0, 100);
  } else {
    country.militaryReadiness = boundedDelta(country.militaryReadiness || 70, 0.012, 0, 100);
  }
}

function calculateDailyMilitaryMaintenance(country) {
  country.units ??= {};

  let annualCost = 0;

  for (const [unitId, count] of Object.entries(country.units)) {
    const unit = findMilitaryUnitById(unitId);
    if (!unit) continue;

    annualCost += (unit.upkeep || 0) * count * 365;
  }

  annualCost += (country.military || 0) * 120;

  const warMultiplier = 1 + (country.warRisk || 0) * 0.006;
  const inflationMultiplier = 1 + Math.max(0, (country.inflation || 0.027) - 0.02) * 1.8;

  return dailyFromAnnual(annualCost * warMultiplier * inflationMultiplier);
}

function updateMilitaryPowerFromUnits(country) {
  country.units ??= {};

  let power = 0;

  for (const [unitId, count] of Object.entries(country.units)) {
    const unit = findMilitaryUnitById(unitId);
    if (!unit) continue;

    power += (unit.power || 0) * count;
  }

  const basePersonnelPower = Math.sqrt(country.population || 1) * 8;
  const cyberPower = (country.cyber || 0) * 6;
  const readiness = (country.militaryReadiness || 70) / 100;
  const technologyMultiplier = getMilitaryTechnologyMultiplier(country);
  const ideologyMultiplier = getMilitaryModifier(country);

  country.military = Math.round(
    (power + basePersonnelPower + cyberPower) *
    readiness *
    technologyMultiplier *
    ideologyMultiplier
  );
}

function getMilitaryTechnologyMultiplier(country) {
  let multiplier = 1;

  if (country.completedTechnologies?.includes("network_centric_warfare")) {
    multiplier += 0.08;
  }

  if (country.completedTechnologies?.includes("drone_swarms")) {
    multiplier += 0.12;
  }

  if (country.completedTechnologies?.includes("integrated_air_defense")) {
    multiplier += 0.07;
  }

  if (country.completedTechnologies?.includes("earth_observation_satellites")) {
    multiplier += 0.04;
  }

  return multiplier;
}

function getMilitaryProductionProgress(project) {
  return clamp(
    100 * (1 - project.remainingDays / Math.max(project.totalDays, 1)),
    0,
    100
  );
}

function getMilitaryBreakdown(country) {
  const units = Object.entries(country.units || {}).map(([unitId, count]) => {
    const unit = findMilitaryUnitById(unitId);
    return {
      unitId,
      name: unit?.name || unitId,
      icon: unit?.icon || "🎖️",
      type: unit?.type || "Unidad",
      domain: unit?.domain || "unknown",
      count,
      power: (unit?.power || 0) * count,
      upkeepDaily: dailyFromAnnual((unit?.upkeep || 0) * count * 365)
    };
  });

  return {
    military: country.military || 0,
    readiness: country.militaryReadiness || 0,
    dailyMaintenance: country.dailyMilitaryMaintenance || 0,
    productionCapacity: calculateMilitaryProductionCapacity(country, { domain: "land" }, getSelectedRegion()),
    industryScore: getMilitaryIndustryScore(country),
    queue: country.militaryQueue || [],
    units
  };
}

/* =========================================================
   EXPORT GLOBAL — PARTE 3.6.1
========================================================= */

window.startMilitaryProduction = startMilitaryProduction;
window.simulateMilitaryProductionQueue = simulateMilitaryProductionQueue;
window.completeMilitaryProduction = completeMilitaryProduction;
window.calculateMilitaryProductionCost = calculateMilitaryProductionCost;
window.calculateMilitaryProductionCapacity = calculateMilitaryProductionCapacity;
window.getMilitaryIndustryScore = getMilitaryIndustryScore;
window.updateMilitaryMaintenance = updateMilitaryMaintenance;
window.calculateDailyMilitaryMaintenance = calculateDailyMilitaryMaintenance;
window.updateMilitaryPowerFromUnits = updateMilitaryPowerFromUnits;
window.getMilitaryTechnologyMultiplier = getMilitaryTechnologyMultiplier;
window.getMilitaryProductionProgress = getMilitaryProductionProgress;
window.getMilitaryBreakdown = getMilitaryBreakdown;


/* =========================================================
   SIMULATION.JS v3
   Parte 3.6.2/12
   Despliegue militar, logística, entrenamiento,
   experiencia, modernización y reservas.
========================================================= */

function simulateMilitaryLogistics(country){

    updateMilitaryFuel(country);
    updateMilitaryTraining(country);
    updateMilitaryExperience(country);
    updateMilitaryModernization(country);
    updateMilitaryReserves(country);
    updateMilitaryLogistics(country);

}

/* =========================================================
   COMBUSTIBLE MILITAR
========================================================= */

function updateMilitaryFuel(country){

    const units=country.units||{};

    let dailyFuel=0;

    Object.entries(units).forEach(([id,count])=>{

        const unit=findMilitaryUnitById(id);
        if(!unit) return;

        dailyFuel+=(unit.fuelPerDay||0)*count;

    });

    country.dailyFuelConsumption=dailyFuel;

    country.fuelStock=
        Math.max(
            0,
            (country.fuelStock||0)-dailyFuel
        );

    if(country.fuelStock<dailyFuel*20){

        country.militaryReadiness=
            boundedDelta(
                country.militaryReadiness||70,
                -0.08,
                0,
                100
            );

    }

}

/* =========================================================
   ENTRENAMIENTO
========================================================= */

function updateMilitaryTraining(country){

    country.trainingLevel ??=60;

    const budgetRatio=
        country.defenseSpending/
        Math.max(country.gdp,1);

    let delta=0;

    delta+=budgetRatio*35;

    delta+=getBuildingLevelSum(country,"barracks")*0.08;
    delta+=getBuildingLevelSum(country,"airbase")*0.05;
    delta+=getBuildingLevelSum(country,"naval")*0.05;

    delta-=country.warRisk*0.002;

    country.trainingLevel=
        clamp(
            country.trainingLevel+delta,
            20,
            100
        );

}

/* =========================================================
   EXPERIENCIA
========================================================= */

function updateMilitaryExperience(country){

    country.militaryExperience ??=15;

    let gain=0.01;

    gain+=country.trainingLevel*0.00015;

    if(country.atWar){

        gain+=0.08;

    }

    country.militaryExperience=
        clamp(
            country.militaryExperience+gain,
            0,
            100
        );

}

/* =========================================================
   MODERNIZACIÓN
========================================================= */

function updateMilitaryModernization(country){

    country.modernizationLevel ??=45;

    let gain=0;

    gain+=country.research*0.00025;

    gain+=country.cyber*0.0005;

    gain+=getBuildingLevelSum(country,"electronics")*0.05;

    gain+=getBuildingLevelSum(country,"industry")*0.04;

    if(country.completedTechnologies){

        gain+=country.completedTechnologies.length*0.04;

    }

    country.modernizationLevel=
        clamp(
            country.modernizationLevel+gain,
            0,
            100
        );

}

/* =========================================================
   RESERVAS
========================================================= */

function updateMilitaryReserves(country){

    const labour=
        country.laborForce||
        country.population*0.5;

    country.reservePersonnel=
        Math.round(
            labour*
            0.055*
            (
                0.75+
                country.trainingLevel/200
            )
        );

}

/* =========================================================
   LOGÍSTICA
========================================================= */

function updateMilitaryLogistics(country){

    let logistics=50;

    logistics+=getBuildingLevelSum(country,"roads")*0.8;

    logistics+=getBuildingLevelSum(country,"rail")*0.9;

    logistics+=getBuildingLevelSum(country,"ports")*0.6;

    logistics+=getBuildingLevelSum(country,"airports")*0.5;

    logistics+=country.governmentEfficiency*0.12;

    logistics-=country.sanctions*0.35;

    country.logistics=
        clamp(
            logistics,
            0,
            100
        );

}

/* =========================================================
   DESPLIEGUE
========================================================= */

function deployMilitaryUnit(unitId,quantity,regionId){

    const country=getSelectedCountry();

    if(!country) return;

    quantity=Math.max(
        1,
        Math.round(quantity)
    );

    if((country.units?.[unitId]||0)<quantity){

        addEvent(
            "⛔",
            "No existen suficientes unidades."
        );

        return;

    }

    country.deployments ??=[];

    country.deployments.push({

        id:String(Date.now()+Math.random()),

        unitId,

        quantity,

        regionId,

        readiness:
            country.trainingLevel,

        logistics:
            country.logistics,

        experience:
            country.militaryExperience

    });

    addEvent(
        "🚚",
        `${quantity} unidades desplegadas.`
    );

}

/* =========================================================
   POTENCIA EFECTIVA
========================================================= */

function calculateEffectiveMilitaryPower(country){

    const readiness=
        (country.militaryReadiness||70)/100;

    const training=
        (country.trainingLevel||60)/100;

    const logistics=
        (country.logistics||60)/100;

    const experience=
        (country.militaryExperience||20)/100;

    const modernization=
        (country.modernizationLevel||40)/100;

    return Math.round(

        country.military*

        (
            readiness*
            0.25+

            training*
            0.20+

            logistics*
            0.20+

            experience*
            0.15+

            modernization*
            0.20

        )

    );

}

/* =========================================================
   RESUMEN
========================================================= */

function getMilitaryOperationalStatus(country){

    return{

        fuel:country.fuelStock,

        dailyFuelConsumption:
            country.dailyFuelConsumption,

        readiness:
            country.militaryReadiness,

        training:
            country.trainingLevel,

        logistics:
            country.logistics,

        modernization:
            country.modernizationLevel,

        experience:
            country.militaryExperience,

        reservePersonnel:
            country.reservePersonnel,

        effectivePower:
            calculateEffectiveMilitaryPower(country),

        deployments:
            country.deployments||[]

    };

}

/* =========================================================
   EXPORT
========================================================= */

window.simulateMilitaryLogistics=
simulateMilitaryLogistics;

window.updateMilitaryFuel=
updateMilitaryFuel;

window.updateMilitaryTraining=
updateMilitaryTraining;

window.updateMilitaryExperience=
updateMilitaryExperience;

window.updateMilitaryModernization=
updateMilitaryModernization;

window.updateMilitaryReserves=
updateMilitaryReserves;

window.updateMilitaryLogistics=
updateMilitaryLogistics;

window.deployMilitaryUnit=
deployMilitaryUnit;

window.calculateEffectiveMilitaryPower=
calculateEffectiveMilitaryPower;

window.getMilitaryOperationalStatus=
getMilitaryOperationalStatus;


/* =========================================================
   SIMULATION.JS v3
   Parte 3.7/12
   Operaciones militares exteriores: espiar, sabotear,
   atacar, invadir y forzar rendición.
   ========================================================= */

function executeForeignOperation(operationId, targetCountryName) {
  const attacker = getSelectedCountry();
  const target = getCountryByName(NEXUS.state.countries, targetCountryName);
  const operation = FOREIGN_OPERATIONS.find(op => op.id === operationId);

  if (!attacker || !target || !operation) return;
  if (attacker.name === target.name) return;

  if (attacker.treasury < operation.cost) {
    addEvent("⛔", `${attacker.name}: fondos insuficientes para ${operation.name}.`);
    renderAll();
    return;
  }

  if (operation.cyberRequired && attacker.cyber < operation.cyberRequired) {
    addEvent("⛔", `${attacker.name}: capacidad cyber insuficiente para ${operation.name}.`);
    renderAll();
    return;
  }

  const militaryCheck = checkMilitaryOperationRequirement(attacker, target, operation);
  if (!militaryCheck.ok) {
    addEvent("⛔", militaryCheck.message);
    renderAll();
    return;
  }

  attacker.treasury -= operation.cost;

  const successChance = calculateOperationSuccessChance(attacker, target, operation);
  const success = randomChance(successChance);

  if (success) {
    applySuccessfulOperation(attacker, target, operation);
  } else {
    applyFailedOperation(attacker, target, operation);
  }

  updateAfterOperation(attacker, target, operation, success);
  renderAll();
}

function checkMilitaryOperationRequirement(attacker, target, operation) {
  if (!operation.militaryRequiredRatio) {
    return { ok: true, message: "" };
  }

  const attackerPower = calculateEffectiveMilitaryPower(attacker);
  const targetPower = calculateEffectiveMilitaryPower(target);
  const required = targetPower * operation.militaryRequiredRatio;

  if (attackerPower < required) {
    return {
      ok: false,
      message: `${attacker.name}: poder militar efectivo insuficiente. Necesario: ${formatNumber(required)}. Actual: ${formatNumber(attackerPower)}.`
    };
  }

  return { ok: true, message: "" };
}

function calculateOperationSuccessChance(attacker, target, operation) {
  const base = 0.55;
  const cyberRatio = attacker.cyber / Math.max(target.cyber, 1);
  const militaryRatio =
    calculateEffectiveMilitaryPower(attacker) /
    Math.max(calculateEffectiveMilitaryPower(target), 1);

  const stabilityFactor = (100 - target.stability) * 0.0025;
  const intelligenceFactor = (attacker.intelligence || 0) * 0.002;
  const riskPenalty = operation.risk || 0.2;

  let chance =
    base +
    Math.log(Math.max(0.2, cyberRatio)) * 0.08 +
    Math.log(Math.max(0.2, militaryRatio)) * 0.10 +
    stabilityFactor +
    intelligenceFactor -
    riskPenalty * 0.22;

  if (operation.id === "spy") {
    chance += cyberRatio * 0.03;
  }

  if (operation.id === "invade") {
    chance += militaryRatio > 1.5 ? 0.08 : -0.08;
    chance -= target.internalSecurity * 0.0015;
  }

  return clamp(chance, 0.08, 0.92);
}

function applySuccessfulOperation(attacker, target, operation) {
  switch (operation.id) {
    case "spy":
      attacker.intelligence = (attacker.intelligence || 0) + (operation.effects?.intelligence || 10);
      addEvent("🕵️", `${attacker.name}: operación de espionaje exitosa contra ${target.name}.`);
      break;

    case "sabotage":
      target.gdp *= 1 - (operation.effects?.targetGDPDamage || 0.004);
      target.stability = boundedDelta(target.stability, -(operation.effects?.targetStabilityDamage || 0.8), 0, 100);
      damageRandomTargetInfrastructure(target);
      addEvent("🧨", `${attacker.name}: sabotaje industrial exitoso contra ${target.name}.`);
      break;

    case "cyber_attack":
      target.treasury = Math.max(
        0,
        target.treasury - target.gdp * (operation.effects?.targetTreasuryDamage || 0.01)
      );
      target.stability = boundedDelta(target.stability, -(operation.effects?.targetStabilityDamage || 0.6), 0, 100);
      target.businessConfidence = boundedDelta(target.businessConfidence || 50, -3, 0, 100);
      addEvent("💻", `${attacker.name}: ciberataque financiero exitoso contra ${target.name}.`);
      break;

    case "attack":
      resolveLimitedAttack(attacker, target);
      break;

    case "invade":
      resolveInvasion(attacker, target);
      break;

    case "force_surrender":
      forceSurrender(attacker, target);
      break;

    case "diplomatic_pressure":
      target.relation = boundedDelta(target.relation || 50, -8, 0, 100);
      target.stability = boundedDelta(target.stability, -0.7, 0, 100);
      addEvent("📜", `${attacker.name}: presión diplomática efectiva sobre ${target.name}.`);
      break;
  }
}

function applyFailedOperation(attacker, target, operation) {
  const exposureChance = clamp(0.35 + operation.risk * 0.45, 0.1, 0.9);
  const exposed = randomChance(exposureChance);

  if (exposed) {
    attacker.reputation = boundedDelta(attacker.reputation || 60, -(operation.effects?.reputationPenalty || 4), 0, 100);
    target.relation = boundedDelta(target.relation || 50, operation.effects?.relationPenaltyOnFail || -8, 0, 100);
    attacker.sanctions = (attacker.sanctions || 0) + Math.ceil((operation.risk || 0.2) * 4);
    addEvent("🚨", `${attacker.name}: operación fallida y atribuida por ${target.name}.`);
  } else {
    addEvent("⚠️", `${attacker.name}: operación fallida contra ${target.name}, sin atribución pública.`);
  }

  attacker.intelligence = Math.max(0, (attacker.intelligence || 0) - 2);
}

function updateAfterOperation(attacker, target, operation, success) {
  attacker.warRisk = boundedDelta(
    attacker.warRisk || 0,
    success ? (operation.effects?.warRisk || 0) * 0.15 : (operation.effects?.warRisk || 0) * 0.3,
    0,
    100
  );

  target.warRisk = boundedDelta(
    target.warRisk || 0,
    success ? (operation.effects?.warRisk || 0) * 0.35 : (operation.effects?.warRisk || 0) * 0.2,
    0,
    100
  );

  NEXUS.state.world.tension = clamp(
    (NEXUS.state.world.tension || 0) +
    (operation.id === "invade" ? 8 : operation.id === "attack" ? 3 : 0.8),
    0,
    100
  );
}

function damageRandomTargetInfrastructure(country) {
  const regions = (country.regions || []).filter(r => r.buildings?.length);
  if (!regions.length) return;

  const region = regions[Math.floor(Math.random() * regions.length)];
  const building = region.buildings[Math.floor(Math.random() * region.buildings.length)];

  building.damaged = true;
  building.level = Math.max(1, (building.level || 1) - 1);

  addEvent("🔥", `${country.name}: infraestructura dañada en ${region.name}.`);
}

function resolveLimitedAttack(attacker, target) {
  const result = calculateCombatResult(attacker, target, 0.35);

  applyCombatLosses(attacker, result.attackerLossRatio);
  applyCombatLosses(target, result.defenderLossRatio);

  target.stability = boundedDelta(target.stability, -result.stabilityDamage, 0, 100);
  target.warRisk = boundedDelta(target.warRisk || 0, 18, 0, 100);
  attacker.reputation = boundedDelta(attacker.reputation || 60, -5, 0, 100);

  addEvent(
    result.attackerWins ? "⚔️" : "🛡️",
    `${attacker.name}: ataque limitado contra ${target.name} ${result.attackerWins ? "exitoso" : "contenido"}.`
  );
}

function resolveInvasion(attacker, target) {
  const result = calculateCombatResult(attacker, target, 1.0);

  applyCombatLosses(attacker, result.attackerLossRatio * 1.4);
  applyCombatLosses(target, result.defenderLossRatio * 1.8);

  target.stability = boundedDelta(target.stability, -result.stabilityDamage * 2.2, 0, 100);
  target.happiness = boundedDelta(target.happiness, -6, 0, 100);
  target.warRisk = 100;
  attacker.warRisk = boundedDelta(attacker.warRisk || 0, 35, 0, 100);
  attacker.reputation = boundedDelta(attacker.reputation || 60, -16, 0, 100);
  attacker.sanctions = (attacker.sanctions || 0) + 6;

  if (result.attackerWins) {
    target.occupiedBy = attacker.name;
    target.occupationLevel = clamp((target.occupationLevel || 0) + result.occupationGain, 0, 100);
    attacker.treasury += target.treasury * 0.08;
    target.treasury *= 0.92;

    addEvent("🚀", `${attacker.name}: invasión exitosa contra ${target.name}. Ocupación parcial establecida.`);
  } else {
    attacker.stability = boundedDelta(attacker.stability, -3, 0, 100);
    attacker.happiness = boundedDelta(attacker.happiness, -2.5, 0, 100);

    addEvent("🧱", `${target.name}: defensa exitosa ante invasión de ${attacker.name}.`);
  }
}

function forceSurrender(attacker, target) {
  const occupation = target.occupationLevel || 0;
  const powerRatio =
    calculateEffectiveMilitaryPower(attacker) /
    Math.max(calculateEffectiveMilitaryPower(target), 1);

  const surrenderChance = clamp(
    0.18 +
    occupation * 0.006 +
    (100 - target.stability) * 0.004 +
    Math.log(Math.max(0.5, powerRatio)) * 0.12,
    0.05,
    0.85
  );

  if (randomChance(surrenderChance)) {
    target.warRisk = boundedDelta(target.warRisk || 0, -45, 0, 100);
    target.stability = 35;
    target.relation = 0;
    target.sanctions = (target.sanctions || 0) + 4;
    target.surrenderedTo = attacker.name;

    attacker.reputation = boundedDelta(attacker.reputation || 60, -10, 0, 100);
    attacker.treasury += target.gdp * 0.00025;

    addEvent("🏳️", `${target.name}: acepta rendición forzada ante ${attacker.name}.`);
  } else {
    target.stability = boundedDelta(target.stability, -3, 0, 100);
    attacker.reputation = boundedDelta(attacker.reputation || 60, -4, 0, 100);

    addEvent("❌", `${target.name}: rechaza la rendición forzada exigida por ${attacker.name}.`);
  }
}

function calculateCombatResult(attacker, defender, intensity = 1) {
  const attackPower = calculateEffectiveMilitaryPower(attacker);
  const defensePower = calculateEffectiveMilitaryPower(defender);

  const attackLogistics = (attacker.logistics || 60) / 100;
  const defenseLogistics = (defender.logistics || 60) / 100;

  const attackScore =
    attackPower *
    (0.75 + attackLogistics * 0.35) *
    (0.85 + (attacker.trainingLevel || 60) / 300);

  const defenseScore =
    defensePower *
    (0.82 + defenseLogistics * 0.42) *
    (0.90 + (defender.trainingLevel || 60) / 280) *
    1.12;

  const ratio = attackScore / Math.max(defenseScore, 1);
  const attackerWins = ratio > randomBetween(0.75, 1.18);

  const attackerLossRatio = clamp((1 / Math.max(ratio, 0.2)) * 0.012 * intensity, 0.002, 0.11);
  const defenderLossRatio = clamp(ratio * 0.014 * intensity, 0.003, 0.16);

  return {
    attackerWins,
    ratio,
    attackerLossRatio,
    defenderLossRatio,
    stabilityDamage: clamp(4 + ratio * 3 * intensity, 2, 18),
    occupationGain: attackerWins ? clamp(8 + ratio * 10, 5, 35) : 0
  };
}

function applyCombatLosses(country, lossRatio) {
  country.units ??= {};

  for (const unitId of Object.keys(country.units)) {
    const losses = Math.floor(country.units[unitId] * lossRatio * randomBetween(0.65, 1.35));
    country.units[unitId] = Math.max(0, country.units[unitId] - losses);
  }

  country.militaryReadiness = boundedDelta(country.militaryReadiness || 70, -lossRatio * 100, 0, 100);
  updateMilitaryPowerFromUnits(country);
}

function getForeignOperationBreakdown(attacker, target) {
  return FOREIGN_OPERATIONS.map(operation => {
    const militaryCheck = checkMilitaryOperationRequirement(attacker, target, operation);

    return {
      ...operation,
      affordable: attacker.treasury >= operation.cost,
      allowed: militaryCheck.ok && (!operation.cyberRequired || attacker.cyber >= operation.cyberRequired),
      requirementMessage: militaryCheck.message,
      successChance: calculateOperationSuccessChance(attacker, target, operation)
    };
  });
}

/* =========================================================
   EXPORT GLOBAL — PARTE 3.7
========================================================= */

window.executeForeignOperation = executeForeignOperation;
window.checkMilitaryOperationRequirement = checkMilitaryOperationRequirement;
window.calculateOperationSuccessChance = calculateOperationSuccessChance;
window.applySuccessfulOperation = applySuccessfulOperation;
window.applyFailedOperation = applyFailedOperation;
window.updateAfterOperation = updateAfterOperation;
window.damageRandomTargetInfrastructure = damageRandomTargetInfrastructure;
window.resolveLimitedAttack = resolveLimitedAttack;
window.resolveInvasion = resolveInvasion;
window.forceSurrender = forceSurrender;
window.calculateCombatResult = calculateCombatResult;
window.applyCombatLosses = applyCombatLosses;
window.getForeignOperationBreakdown = getForeignOperationBreakdown;


/* =========================================================
   SIMULATION.JS v3
   Parte 4.1/12
   Guerra persistente: frentes, guerras activas, desgaste,
   ocupación diaria y finalización de conflictos.
   ========================================================= */

function simulateWars() {
  const state = NEXUS.state;
  if (!state) return;

  state.activeWars ??= [];

  for (const war of state.activeWars) {
    simulateWarDay(war);
  }

  state.activeWars = state.activeWars.filter(war => !war.ended);
}

function declareWar(attackerName, defenderName, reason = "conflicto estratégico") {
  const attacker = getCountryByName(NEXUS.state.countries, attackerName);
  const defender = getCountryByName(NEXUS.state.countries, defenderName);

  if (!attacker || !defender || attacker.name === defender.name) return null;

  NEXUS.state.activeWars ??= [];

  const existing = NEXUS.state.activeWars.find(war =>
    !war.ended &&
    war.participants.attackers.includes(attacker.name) &&
    war.participants.defenders.includes(defender.name)
  );

  if (existing) return existing;

  const war = {
    id: String(Date.now() + Math.random()),
    name: `${attacker.name} vs ${defender.name}`,
    reason,
    startYear: getSimulationYear(),
    startDay: getDayOfYear(),
    durationDays: 0,
    participants: {
      attackers: [attacker.name],
      defenders: [defender.name]
    },
    fronts: createInitialFronts(attacker, defender),
    casualties: {},
    occupation: {},
    warScore: 0,
    intensity: 0.45,
    ended: false,
    winner: null
  };

  NEXUS.state.activeWars.push(war);

  attacker.atWar = true;
  defender.atWar = true;
  attacker.warRisk = 100;
  defender.warRisk = 100;

  NEXUS.state.world.tension = clamp((NEXUS.state.world.tension || 0) + 10, 0, 100);

  addEvent("⚔️", `${attacker.name} declara la guerra a ${defender.name}: ${reason}.`);
  renderAll?.();

  return war;
}

function createInitialFronts(attacker, defender) {
  const attackerRegion = pickStrategicRegion(attacker, "military");
  const defenderRegion = pickStrategicRegion(defender, "capital");

  return [
    {
      id: String(Date.now() + Math.random()),
      name: `${attackerRegion?.name || attacker.capital} → ${defenderRegion?.name || defender.capital}`,
      attacker: attacker.name,
      defender: defender.name,
      attackerRegionId: attackerRegion?.id || null,
      defenderRegionId: defenderRegion?.id || null,
      progress: 0,
      supply: 70,
      terrain: inferFrontTerrain(attackerRegion, defenderRegion),
      airSuperiority: 0,
      navalSupport: 0,
      active: true
    }
  ];
}

function pickStrategicRegion(country, preference = "capital") {
  const regions = country.regions || [];
  if (!regions.length) return null;

  if (preference === "capital") {
    return regions.find(r => r.type === "capital") || regions[0];
  }

  if (preference === "military") {
    return (
      regions.find(r => r.type === "naval") ||
      regions.find(r => r.type === "aerospace") ||
      regions.find(r => r.type === "port") ||
      regions.find(r => r.type === "capital") ||
      regions[0]
    );
  }

  if (preference === "industry") {
    return (
      regions.find(r => r.type === "industry") ||
      regions.find(r => r.type === "automotive") ||
      regions.find(r => r.type === "port") ||
      regions[0]
    );
  }

  return regions[0];
}

function inferFrontTerrain(attackerRegion, defenderRegion) {
  if (!attackerRegion || !defenderRegion) return "mixed";

  if (attackerRegion.type === "naval" || defenderRegion.type === "naval") return "coastal";
  if (attackerRegion.type === "port" || defenderRegion.type === "port") return "coastal";
  if (defenderRegion.type === "capital") return "urban";
  if (defenderRegion.type === "industry") return "industrial";
  if (defenderRegion.type === "energy") return "desert";

  return "mixed";
}

function simulateWarDay(war) {
  war.durationDays += 1;

  for (const front of war.fronts) {
    if (!front.active) continue;
    simulateFrontDay(war, front);
  }

  updateWarScore(war);
  applyWarExhaustion(war);
  checkWarTermination(war);
}

function simulateFrontDay(war, front) {
  const attacker = getCountryByName(NEXUS.state.countries, front.attacker);
  const defender = getCountryByName(NEXUS.state.countries, front.defender);

  if (!attacker || !defender) {
    front.active = false;
    return;
  }

  updateFrontSupply(front, attacker, defender);
  updateFrontAirAndNavalSupport(front, attacker, defender);

  const result = calculateFrontCombat(attacker, defender, front, war.intensity);

  front.progress = clamp(front.progress + result.progressDelta, -100, 100);
  front.lastResult = result;

  applyWarDailyLosses(war, attacker, defender, result);
  applyFrontEconomicDamage(defender, front, result);

  if (front.progress >= 100) {
    occupyFrontRegion(war, attacker, defender, front);
    front.progress = 35;
  }

  if (front.progress <= -100) {
    front.active = false;
    addEvent("🛡️", `${defender.name}: contraofensiva exitosa en ${front.name}.`);
  }
}

function updateFrontSupply(front, attacker, defender) {
  const attackerLogistics = attacker.logistics || 60;
  const defenderLogistics = defender.logistics || 60;

  const terrainPenalty = {
    urban: 4,
    industrial: 2,
    coastal: 1,
    desert: 5,
    mixed: 2
  }[front.terrain] || 2;

  const supplyTarget = clamp(
    45 +
    attackerLogistics * 0.45 -
    terrainPenalty -
    defenderLogistics * 0.12,
    10,
    100
  );

  front.supply = lerp(front.supply || 60, supplyTarget, 0.04);
}

function updateFrontAirAndNavalSupport(front, attacker, defender) {
  const attackerAir = getDomainPower(attacker, "air");
  const defenderAir = getDomainPower(defender, "air");

  front.airSuperiority = clamp(
    50 + (attackerAir - defenderAir) / Math.max(attackerAir + defenderAir, 1) * 50,
    0,
    100
  );

  const attackerSea = getDomainPower(attacker, "sea");
  const defenderSea = getDomainPower(defender, "sea");

  front.navalSupport = front.terrain === "coastal"
    ? clamp(50 + (attackerSea - defenderSea) / Math.max(attackerSea + defenderSea, 1) * 50, 0, 100)
    : 0;
}

function getDomainPower(country, domain) {
  let power = 0;

  for (const [unitId, count] of Object.entries(country.units || {})) {
    const unit = findMilitaryUnitById(unitId);
    if (!unit) continue;

    if ((unit.domain || "").includes(domain)) {
      power += (unit.power || 0) * count;
    }
  }

  if (domain === "cyber") {
    power += country.cyber || 0;
  }

  return power;
}

function calculateFrontCombat(attacker, defender, front, intensity = 0.45) {
  const attackerPower = calculateEffectiveMilitaryPower(attacker);
  const defenderPower = calculateEffectiveMilitaryPower(defender);

  const supplyFactor = (front.supply || 60) / 100;
  const airFactor = 0.85 + (front.airSuperiority || 50) / 250;
  const navalFactor = front.terrain === "coastal" ? 0.9 + (front.navalSupport || 0) / 300 : 1;
  const terrainDefense = getTerrainDefenseMultiplier(front.terrain);

  const attackScore =
    attackerPower *
    supplyFactor *
    airFactor *
    navalFactor *
    (0.9 + (attacker.trainingLevel || 60) / 300) *
    randomBetween(0.88, 1.12);

  const defenseScore =
    defenderPower *
    terrainDefense *
    (0.9 + (defender.trainingLevel || 60) / 280) *
    (0.9 + (defender.logistics || 60) / 300) *
    randomBetween(0.9, 1.15);

  const ratio = attackScore / Math.max(defenseScore, 1);

  const progressDelta = clamp(
    (ratio - 1) * 2.4 * intensity + randomBetween(-0.8, 0.8),
    -4.5,
    5.5
  );

  const attackerLossRatio = clamp((1 / Math.max(ratio, 0.25)) * 0.00075 * intensity, 0.00005, 0.006);
  const defenderLossRatio = clamp(ratio * 0.00085 * intensity, 0.00005, 0.008);

  return {
    ratio,
    progressDelta,
    attackerLossRatio,
    defenderLossRatio,
    infrastructureDamage: clamp(Math.abs(progressDelta) * 0.002, 0, 0.035)
  };
}

function getTerrainDefenseMultiplier(terrain) {
  const multipliers = {
    urban: 1.35,
    industrial: 1.18,
    coastal: 1.05,
    desert: 0.92,
    mixed: 1.0
  };

  return multipliers[terrain] || 1.0;
}

function applyWarDailyLosses(war, attacker, defender, result) {
  const attackerLosses = applyCombatLossesReturn(attacker, result.attackerLossRatio);
  const defenderLosses = applyCombatLossesReturn(defender, result.defenderLossRatio);

  war.casualties[attacker.name] = (war.casualties[attacker.name] || 0) + attackerLosses;
  war.casualties[defender.name] = (war.casualties[defender.name] || 0) + defenderLosses;
}

function applyCombatLossesReturn(country, lossRatio) {
  let totalLosses = 0;

  country.units ??= {};

  for (const unitId of Object.keys(country.units)) {
    const current = country.units[unitId] || 0;
    const losses = Math.floor(current * lossRatio * randomBetween(0.65, 1.35));

    country.units[unitId] = Math.max(0, current - losses);
    totalLosses += losses;
  }

  const personnelLosses = Math.round((country.military || 0) * lossRatio * 0.035);
  totalLosses += personnelLosses;

  country.militaryReadiness = boundedDelta(country.militaryReadiness || 70, -lossRatio * 85, 0, 100);
  updateMilitaryPowerFromUnits(country);

  return totalLosses;
}

function applyFrontEconomicDamage(defender, front, result) {
  const region = defender.regions?.find(r => r.id === front.defenderRegionId);
  if (!region) return;

  const damage = result.infrastructureDamage || 0;

  region.gdp = Math.max(0, (region.gdp || 0) * (1 - damage));
  defender.gdp = Math.max(1_000_000_000, defender.gdp * (1 - damage * 0.025));
  defender.happiness = boundedDelta(defender.happiness, -damage * 1.2, 0, 100);
  defender.stability = boundedDelta(defender.stability, -damage * 0.8, 0, 100);
}

function occupyFrontRegion(war, attacker, defender, front) {
  const region = defender.regions?.find(r => r.id === front.defenderRegionId);

  if (!region) return;

  war.occupation[region.id] = attacker.name;
  region.occupiedBy = attacker.name;

  defender.occupationLevel = clamp((defender.occupationLevel || 0) + 8, 0, 100);
  defender.stability = boundedDelta(defender.stability, -2.5, 0, 100);
  attacker.treasury += (region.gdp || 0) * 0.00005;

  addEvent("🚩", `${attacker.name} ocupa parcialmente ${region.name} en ${defender.name}.`);

  const nextRegion = pickNextDefenderRegion(defender, war);
  if (nextRegion) {
    front.defenderRegionId = nextRegion.id;
    front.name = `${attacker.name} → ${nextRegion.name}`;
  }
}

function pickNextDefenderRegion(defender, war) {
  return (defender.regions || [])
    .filter(region => !war.occupation[region.id])
    .sort((a, b) => {
      const scoreA = (a.type === "capital" ? 100 : 0) + (a.gdp || 0) / 1_000_000_000 + (a.population || 0) / 100000;
      const scoreB = (b.type === "capital" ? 100 : 0) + (b.gdp || 0) / 1_000_000_000 + (b.population || 0) / 100000;
      return scoreB - scoreA;
    })[0];
}

function updateWarScore(war) {
  let score = 0;

  for (const front of war.fronts) {
    score += front.progress || 0;
  }

  for (const defenderName of war.participants.defenders) {
    const defender = getCountryByName(NEXUS.state.countries, defenderName);
    if (!defender) continue;

    score += (defender.occupationLevel || 0) * 0.8;
    score += Math.max(0, 50 - defender.stability) * 0.35;
  }

  for (const attackerName of war.participants.attackers) {
    const attacker = getCountryByName(NEXUS.state.countries, attackerName);
    if (!attacker) continue;

    score -= Math.max(0, 40 - attacker.stability) * 0.25;
  }

  war.warScore = clamp(score, -100, 100);
}

function applyWarExhaustion(war) {
  const allParticipants = [
    ...war.participants.attackers,
    ...war.participants.defenders
  ];

  for (const name of allParticipants) {
    const country = getCountryByName(NEXUS.state.countries, name);
    if (!country) continue;

    const casualties = war.casualties[country.name] || 0;
    const casualtyPressure = casualties / Math.max(country.population, 1) * 1800;
    const durationPressure = war.durationDays * 0.002;

    country.warExhaustion = clamp(
      (country.warExhaustion || 0) + casualtyPressure + durationPressure,
      0,
      100
    );

    country.happiness = boundedDelta(country.happiness, -country.warExhaustion * 0.0008, 0, 100);
    country.stability = boundedDelta(country.stability, -country.warExhaustion * 0.0006, 0, 100);
  }
}

function checkWarTermination(war) {
  if (war.warScore >= 85) {
    endWar(war, "attackers");
    return;
  }

  if (war.warScore <= -65) {
    endWar(war, "defenders");
    return;
  }

  if (war.durationDays > 1200 && Math.abs(war.warScore) < 25) {
    endWar(war, "stalemate");
  }
}

function endWar(war, winner) {
  war.ended = true;
  war.winner = winner;

  const allParticipants = [
    ...war.participants.attackers,
    ...war.participants.defenders
  ];

  for (const name of allParticipants) {
    const country = getCountryByName(NEXUS.state.countries, name);
    if (!country) continue;

    country.atWar = false;
    country.warRisk = boundedDelta(country.warRisk || 0, -55, 0, 100);
    country.warExhaustion = boundedDelta(country.warExhaustion || 0, -18, 0, 100);
  }

  if (winner === "attackers") {
    for (const name of war.participants.attackers) {
      const country = getCountryByName(NEXUS.state.countries, name);
      if (!country) continue;
      country.reputation = boundedDelta(country.reputation || 60, -5, 0, 100);
      country.treasury += 150_000_000;
    }
    addEvent("🏁", `${war.name}: victoria atacante.`);
  } else if (winner === "defenders") {
    for (const name of war.participants.defenders) {
      const country = getCountryByName(NEXUS.state.countries, name);
      if (!country) continue;
      country.stability = boundedDelta(country.stability, 3, 0, 100);
      country.reputation = boundedDelta(country.reputation || 60, 3, 0, 100);
    }
    addEvent("🏁", `${war.name}: victoria defensiva.`);
  } else {
    addEvent("🤝", `${war.name}: alto el fuego por desgaste mutuo.`);
  }
}

/* =========================================================
   EXPORT GLOBAL — PARTE 4.1
========================================================= */

window.simulateWars = simulateWars;
window.declareWar = declareWar;
window.createInitialFronts = createInitialFronts;
window.pickStrategicRegion = pickStrategicRegion;
window.inferFrontTerrain = inferFrontTerrain;
window.simulateWarDay = simulateWarDay;
window.simulateFrontDay = simulateFrontDay;
window.updateFrontSupply = updateFrontSupply;
window.updateFrontAirAndNavalSupport = updateFrontAirAndNavalSupport;
window.getDomainPower = getDomainPower;
window.calculateFrontCombat = calculateFrontCombat;
window.getTerrainDefenseMultiplier = getTerrainDefenseMultiplier;
window.applyWarDailyLosses = applyWarDailyLosses;
window.applyCombatLossesReturn = applyCombatLossesReturn;
window.applyFrontEconomicDamage = applyFrontEconomicDamage;
window.occupyFrontRegion = occupyFrontRegion;
window.pickNextDefenderRegion = pickNextDefenderRegion;
window.updateWarScore = updateWarScore;
window.applyWarExhaustion = applyWarExhaustion;
window.checkWarTermination = checkWarTermination;
window.endWar = endWar;




/* =========================================================
   SIMULATION.JS v3
   Parte 4.2.1A/12
   Superioridad aérea: cálculo de poder aéreo, defensa aérea,
   guerra electrónica, atrición y efecto sobre frentes.
   ========================================================= */

function simulateAirWar(war) {
  if (!war || war.ended) return;

  war.airCampaign ??= {
    missions: [],
    dailySorties: {},
    airSuperiority: {}
  };

  for (const front of war.fronts || []) {
    if (!front.active) continue;

    const attacker = getCountryByName(NEXUS.state.countries, front.attacker);
    const defender = getCountryByName(NEXUS.state.countries, front.defender);

    if (!attacker || !defender) continue;

    const result = calculateAirSuperiority(attacker, defender, front);

    front.airSuperiority = result.attackerSuperiority;
    front.defenderAirSuperiority = result.defenderSuperiority;

    applyAirWarAttrition(attacker, defender, result, war);
    applyAirSuperiorityEffects(attacker, defender, front, result);
  }
}

function calculateAirSuperiority(attacker, defender, front = null) {
  const attackerAirPower = calculateAirPower(attacker);
  const defenderAirPower = calculateAirPower(defender);

  const attackerAA = calculateAirDefensePower(attacker);
  const defenderAA = calculateAirDefensePower(defender);

  const attackerElectronic = calculateElectronicWarfarePower(attacker);
  const defenderElectronic = calculateElectronicWarfarePower(defender);

  const attackerLogistics = (attacker.logistics || 60) / 100;
  const defenderLogistics = (defender.logistics || 60) / 100;

  const attackerScore =
    attackerAirPower *
    (0.75 + attackerLogistics * 0.35) *
    (0.9 + attackerElectronic / 10000) *
    randomBetween(0.92, 1.10);

  const defenderScore =
    defenderAirPower *
    (0.78 + defenderLogistics * 0.32) *
    (0.9 + defenderElectronic / 10000) *
    (1 + defenderAA / 50000) *
    randomBetween(0.92, 1.12);

  const total = Math.max(attackerScore + defenderScore, 1);

  return {
    attackerAirPower,
    defenderAirPower,
    attackerAA,
    defenderAA,
    attackerElectronic,
    defenderElectronic,
    attackerScore,
    defenderScore,
    attackerSuperiority: clamp(attackerScore / total * 100, 0, 100),
    defenderSuperiority: clamp(defenderScore / total * 100, 0, 100)
  };
}

function calculateAirPower(country) {
  let power = 0;

  for (const [unitId, count] of Object.entries(country.units || {})) {
    const unit = findMilitaryUnitById(unitId);
    if (!unit) continue;

    const domain = unit.domain || "";
    const type = (unit.type || "").toLowerCase();
    const name = (unit.name || "").toLowerCase();

    const isAir =
      domain.includes("air") ||
      type.includes("caza") ||
      type.includes("bombardero") ||
      type.includes("helicóptero") ||
      type.includes("helicoptero") ||
      name.includes("f-") ||
      name.includes("eurofighter") ||
      name.includes("rafale") ||
      name.includes("gripen") ||
      name.includes("su-") ||
      name.includes("mig") ||
      name.includes("b-");

    if (isAir) {
      power += (unit.power || 0) * count;
    }
  }

  const readiness = (country.militaryReadiness || 70) / 100;
  const training = (country.trainingLevel || 60) / 100;
  const modernization = (country.modernizationLevel || 45) / 100;

  return power * (0.35 + readiness * 0.25 + training * 0.20 + modernization * 0.20);
}

function calculateAirDefensePower(country) {
  let power = 0;

  for (const [unitId, count] of Object.entries(country.units || {})) {
    const unit = findMilitaryUnitById(unitId);
    if (!unit) continue;

    const type = (unit.type || "").toLowerCase();
    const name = (unit.name || "").toLowerCase();

    const isAirDefense =
      type.includes("antiaérea") ||
      type.includes("antiaerea") ||
      type.includes("air defense") ||
      type.includes("defensa aérea") ||
      name.includes("patriot") ||
      name.includes("thaad") ||
      name.includes("s-300") ||
      name.includes("s300") ||
      name.includes("s-400") ||
      name.includes("s400") ||
      name.includes("iron dome");

    if (isAirDefense) {
      power += (unit.power || 0) * count;
    }
  }

  power += getBuildingLevelSum(country, "airbase") * 600;
  power += getBuildingLevelSum(country, "cyber") * 250;

  if (country.completedTechnologies?.includes("integrated_air_defense")) {
    power *= 1.18;
  }

  return power;
}

function calculateElectronicWarfarePower(country) {
  let ew = 0;

  ew += (country.cyber || 0) * 0.35;
  ew += getBuildingLevelSum(country, "cyber") * 450;
  ew += getBuildingLevelSum(country, "electronics") * 220;

  if (country.completedTechnologies?.includes("network_centric_warfare")) {
    ew *= 1.12;
  }

  if (country.completedTechnologies?.includes("quantum_communications")) {
    ew *= 1.08;
  }

  return ew;
}

function applyAirWarAttrition(attacker, defender, result, war) {
  const totalScore = Math.max(result.attackerScore + result.defenderScore, 1);

  const attackerLossRate = clamp(
    result.defenderScore / totalScore * 0.00055,
    0.00002,
    0.0035
  );

  const defenderLossRate = clamp(
    result.attackerScore / totalScore * 0.0006,
    0.00002,
    0.004
  );

  const attackerLosses = applyAirUnitLosses(attacker, attackerLossRate);
  const defenderLosses = applyAirUnitLosses(defender, defenderLossRate);

  war.casualties[attacker.name] = (war.casualties[attacker.name] || 0) + attackerLosses;
  war.casualties[defender.name] = (war.casualties[defender.name] || 0) + defenderLosses;
}

function applyAirUnitLosses(country, lossRate) {
  let losses = 0;

  for (const [unitId, count] of Object.entries(country.units || {})) {
    const unit = findMilitaryUnitById(unitId);
    if (!unit) continue;

    const domain = unit.domain || "";
    const type = (unit.type || "").toLowerCase();

    const isAir =
      domain.includes("air") ||
      type.includes("caza") ||
      type.includes("bombardero") ||
      type.includes("helicóptero") ||
      type.includes("helicoptero");

    if (!isAir) continue;

    const unitLosses = Math.floor(count * lossRate * randomBetween(0.3, 1.6));

    country.units[unitId] = Math.max(0, count - unitLosses);
    losses += unitLosses;
  }

  if (losses > 0) {
    country.militaryReadiness = boundedDelta(
      country.militaryReadiness || 70,
      -losses * 0.015,
      0,
      100
    );

    updateMilitaryPowerFromUnits(country);
  }

  return losses;
}

function applyAirSuperiorityEffects(attacker, defender, front, result) {
  const attackerSup = result.attackerSuperiority;
  const defenderSup = result.defenderSuperiority;

  if (attackerSup > 65) {
    front.progress = boundedDelta(front.progress || 0, 0.12, -100, 100);
    defender.logistics = boundedDelta(defender.logistics || 60, -0.018, 0, 100);
    defender.militaryReadiness = boundedDelta(defender.militaryReadiness || 70, -0.012, 0, 100);
  }

  if (defenderSup > 65) {
    front.progress = boundedDelta(front.progress || 0, -0.10, -100, 100);
    attacker.logistics = boundedDelta(attacker.logistics || 60, -0.014, 0, 100);
    attacker.militaryReadiness = boundedDelta(attacker.militaryReadiness || 70, -0.010, 0, 100);
  }

  front.airModifier = clamp((attackerSup - defenderSup) / 100, -0.45, 0.45);
}

function getAirWarBreakdown(country) {
  return {
    airPower: calculateAirPower(country),
    airDefense: calculateAirDefensePower(country),
    electronicWarfare: calculateElectronicWarfarePower(country)
  };
}

/* =========================================================
   EXPORT GLOBAL — PARTE 4.2.1A
========================================================= */

window.simulateAirWar = simulateAirWar;
window.calculateAirSuperiority = calculateAirSuperiority;
window.calculateAirPower = calculateAirPower;
window.calculateAirDefensePower = calculateAirDefensePower;
window.calculateElectronicWarfarePower = calculateElectronicWarfarePower;
window.applyAirWarAttrition = applyAirWarAttrition;
window.applyAirUnitLosses = applyAirUnitLosses;
window.applyAirSuperiorityEffects = applyAirSuperiorityEffects;
window.getAirWarBreakdown = getAirWarBreakdown;




/* =========================================================
   SIMULATION.JS v3
   Parte 4.2.1B.1/12
   Misiones aéreas: lanzamiento, costes y resolución.
   ========================================================= */

function launchAirMission(missionType, targetCountryName, targetRegionId = null) {

    const attacker = getSelectedCountry();
    const target = getCountryByName(
        NEXUS.state.countries,
        targetCountryName
    );

    if (!attacker || !target) return;
    if (attacker.name === target.name) return;

    const cost = getAirMissionCost(attacker, missionType);

    if (attacker.treasury < cost) {

        addEvent(
            "⛔",
            `${attacker.name}: fondos insuficientes para misión aérea.`
        );

        renderAll();
        return;
    }

    const airPower = calculateAirPower(attacker);

    if (airPower < 5000) {

        addEvent(
            "⛔",
            `${attacker.name}: fuerza aérea insuficiente.`
        );

        renderAll();
        return;
    }

    attacker.treasury -= cost;

    const region =
        targetRegionId ?
        target.regions.find(r => r.id === targetRegionId) :
        pickStrategicRegion(target, "industry");

    const result = resolveAirMission(
        attacker,
        target,
        missionType,
        region
    );

    addEvent(
        result.icon,
        result.message
    );

    renderAll();

}

/* ========================================================= */

function getAirMissionCost(country, missionType) {

    const baseCosts = {

        air_superiority: 45000000,

        strike: 85000000,

        interdiction: 70000000,

        strategic_bombing: 150000000,

        close_air_support: 60000000,

        reconnaissance: 30000000

    };

    const inflation =
        1 +
        (country.inflation || 0.02);

    return Math.round(
        (baseCosts[missionType] || 50000000) *
        inflation
    );

}

/* ========================================================= */

function resolveAirMission(
    attacker,
    target,
    missionType,
    targetRegion
){

    const superiority =
        calculateAirSuperiority(
            attacker,
            target
        );

    const attackerSup =
        superiority.attackerSuperiority;

    const aaFactor =
        superiority.defenderAA /
        Math.max(
            superiority.attackerAirPower,
            1
        );

    let probability =
        0.25 +
        attackerSup * 0.006 -
        aaFactor * 0.12 +
        (attacker.trainingLevel || 60) * 0.002 +
        (attacker.modernizationLevel || 40) * 0.002;

    probability =
        clamp(
            probability,
            0.08,
            0.92
        );

    const success =
        randomChance(probability);

    const ownLosses =
        applyAirUnitLosses(
            attacker,
            success ? 0.0008 : 0.0025
        );

    if (!success) {

        attacker.reputation =
            boundedDelta(
                attacker.reputation || 60,
                -0.5,
                0,
                100
            );

        return {

            success:false,

            icon:"🛡️",

            message:
                `${target.name} repele la misión aérea de ${attacker.name}. ` +
                `Pérdidas aéreas: ${ownLosses}.`

        };

    }

    switch(missionType){

        case "air_superiority":

            target.militaryReadiness =
                boundedDelta(
                    target.militaryReadiness || 70,
                    -0.4,
                    0,
                    100
                );

            break;

        case "strike":

            damageRandomTargetInfrastructure(target);

            target.militaryReadiness =
                boundedDelta(
                    target.militaryReadiness || 70,
                    -1.2,
                    0,
                    100
                );

            break;

        case "interdiction":

            target.logistics =
                boundedDelta(
                    target.logistics || 60,
                    -4,
                    0,
                    100
                );

            break;

        case "close_air_support":

            attacker.militaryReadiness =
                boundedDelta(
                    attacker.militaryReadiness || 70,
                    0.6,
                    0,
                    100
                );

            target.militaryReadiness =
                boundedDelta(
                    target.militaryReadiness || 70,
                    -0.8,
                    0,
                    100
                );

            break;

    }

    return {

        success:true,

        icon:"✈️",

        message:
            `${attacker.name}: misión ` +
            `${getAirMissionName(missionType)} ` +
            `ejecutada con éxito sobre ${target.name}. ` +
            `Pérdidas propias: ${ownLosses}.`

    };

}

/* ========================================================= */

function getAirMissionName(type){

    const names={

        air_superiority:"Superioridad aérea",

        strike:"Ataque de precisión",

        interdiction:"Interdicción logística",

        strategic_bombing:"Bombardeo estratégico",

        close_air_support:"Apoyo aéreo cercano",

        reconnaissance:"Reconocimiento"

    };

    return names[type] || type;

}

/* =========================================================
   EXPORT
========================================================= */

window.launchAirMission =
launchAirMission;

window.getAirMissionCost =
getAirMissionCost;

window.resolveAirMission =
resolveAirMission;

window.getAirMissionName =
getAirMissionName;



/* =========================================================
   SIMULATION.JS v3
   Parte 4.2.1B.2/12
   Efectos avanzados de misiones aéreas e integración con guerra.
   ========================================================= */

function applyStrategicBombingEffects(attacker, target, targetRegion = null) {
  const damage = target.gdp * 0.0012;

  target.gdp = Math.max(1_000_000_000, target.gdp - damage);
  target.stability = boundedDelta(target.stability, -1.5, 0, 100);
  target.happiness = boundedDelta(target.happiness, -1.8, 0, 100);
  target.businessConfidence = boundedDelta(target.businessConfidence || 50, -2.2, 0, 100);

  if (targetRegion) {
    targetRegion.gdp = Math.max(0, (targetRegion.gdp || 0) * 0.982);
    markRegionDamaged(targetRegion, 2);
  }

  target.energyProduction *= 0.995;
  target.industrialDisruption = boundedDelta(target.industrialDisruption || 0, 4, 0, 100);

  NEXUS.state.world.tension = clamp((NEXUS.state.world.tension || 0) + 1.6, 0, 100);

  return Math.round(damage);
}

function applyReconnaissanceEffects(attacker, target, targetRegion = null) {
  const gain =
    8 +
    Math.round((attacker.cyber || 0) / 900) +
    Math.round(calculateElectronicWarfarePower(attacker) / 1600);

  attacker.intelligence = clamp((attacker.intelligence || 0) + gain, 0, 100);

  if (targetRegion) {
    targetRegion.revealed = true;
    targetRegion.intelligenceLevel = clamp((targetRegion.intelligenceLevel || 0) + 20, 0, 100);
  }

  return gain;
}

function applySEADEffects(attacker, target, targetRegion = null) {
  const airDefense = calculateAirDefensePower(target);
  const ew = calculateElectronicWarfarePower(attacker);
  const suppression = clamp(0.04 + ew / Math.max(airDefense + ew, 1) * 0.12, 0.03, 0.20);

  target.airDefenseSuppression = clamp((target.airDefenseSuppression || 0) + suppression * 100, 0, 80);
  target.militaryReadiness = boundedDelta(target.militaryReadiness || 70, -1.1, 0, 100);

  degradeAirDefenseUnits(target, suppression);

  if (targetRegion) {
    markRegionDamaged(targetRegion, 1);
  }

  return suppression;
}

function degradeAirDefenseUnits(country, suppressionRatio) {
  for (const [unitId, count] of Object.entries(country.units || {})) {
    const unit = findMilitaryUnitById(unitId);
    if (!unit) continue;

    const type = (unit.type || "").toLowerCase();
    const name = (unit.name || "").toLowerCase();

    const isAirDefense =
      type.includes("antiaérea") ||
      type.includes("antiaerea") ||
      type.includes("defensa aérea") ||
      name.includes("patriot") ||
      name.includes("thaad") ||
      name.includes("s-300") ||
      name.includes("s300") ||
      name.includes("s-400") ||
      name.includes("s400") ||
      name.includes("iron dome");

    if (!isAirDefense) continue;

    const losses = Math.floor(count * suppressionRatio * randomBetween(0.15, 0.55));
    country.units[unitId] = Math.max(0, count - losses);
  }
}

function markRegionDamaged(region, severity = 1) {
  region.damageLevel = clamp((region.damageLevel || 0) + severity, 0, 10);

  for (const item of region.buildings || []) {
    if (randomChance(0.08 * severity)) {
      item.damaged = true;
      item.level = Math.max(1, (item.level || 1) - 1);
    }
  }
}

function resolveAdvancedAirMissionEffects(attacker, target, missionType, targetRegion = null) {
  let detail = "";

  if (missionType === "strategic_bombing") {
    const damage = applyStrategicBombingEffects(attacker, target, targetRegion);
    detail = `Daño económico estimado: ${formatMoney(damage)}.`;
  }

  if (missionType === "reconnaissance") {
    const intel = applyReconnaissanceEffects(attacker, target, targetRegion);
    detail = `Inteligencia obtenida: +${intel}.`;
  }

  if (missionType === "sead") {
    const suppression = applySEADEffects(attacker, target, targetRegion);
    detail = `Supresión de defensa aérea: ${(suppression * 100).toFixed(1)}%.`;
  }

  return detail;
}

/* =========================================================
   OVERRIDE SEGURO DE resolveAirMission
   Amplía la función de 4.2.1B.1 sin romperla.
========================================================= */

const OLD_RESOLVE_AIR_MISSION_ADVANCED = window.resolveAirMission;

function resolveAirMission(attacker, target, missionType, targetRegion) {
  const superiority = calculateAirSuperiority(attacker, target);
  const attackerSup = superiority.attackerSuperiority;

  const aaFactor =
    superiority.defenderAA /
    Math.max(superiority.attackerAirPower, 1);

  let probability =
    0.25 +
    attackerSup * 0.006 -
    aaFactor * 0.12 +
    (attacker.trainingLevel || 60) * 0.002 +
    (attacker.modernizationLevel || 40) * 0.002;

  if (missionType === "reconnaissance") probability += 0.12;
  if (missionType === "sead") probability -= 0.03;
  if (missionType === "strategic_bombing") probability -= 0.06;

  probability = clamp(probability, 0.08, 0.92);

  const success = randomChance(probability);

  const ownLosses = applyAirUnitLosses(
    attacker,
    success ? 0.0008 : 0.0025
  );

  if (!success) {
    attacker.reputation = boundedDelta(attacker.reputation || 60, -0.5, 0, 100);

    return {
      success: false,
      icon: "🛡️",
      message:
        `${target.name} repele la misión aérea de ${attacker.name}. ` +
        `Pérdidas aéreas: ${ownLosses}.`
    };
  }

  let detail = "";

  switch (missionType) {
    case "air_superiority":
      target.militaryReadiness = boundedDelta(target.militaryReadiness || 70, -0.4, 0, 100);
      break;

    case "strike":
      damageRandomTargetInfrastructure(target);
      target.militaryReadiness = boundedDelta(target.militaryReadiness || 70, -1.2, 0, 100);
      break;

    case "interdiction":
      target.logistics = boundedDelta(target.logistics || 60, -4, 0, 100);
      break;

    case "close_air_support":
      attacker.militaryReadiness = boundedDelta(attacker.militaryReadiness || 70, 0.6, 0, 100);
      target.militaryReadiness = boundedDelta(target.militaryReadiness || 70, -0.8, 0, 100);
      break;

    case "strategic_bombing":
    case "reconnaissance":
    case "sead":
      detail = resolveAdvancedAirMissionEffects(attacker, target, missionType, targetRegion);
      break;
  }

  NEXUS.state.world.tension = clamp((NEXUS.state.world.tension || 0) + 0.8, 0, 100);

  return {
    success: true,
    icon: "✈️",
    message:
      `${attacker.name}: misión ${getAirMissionName(missionType)} ejecutada con éxito sobre ${target.name}. ` +
      `Pérdidas propias: ${ownLosses}. ${detail}`
  };
}

/* =========================================================
   EXTENSIÓN DE NOMBRES Y COSTES DE MISIÓN
========================================================= */

const OLD_GET_AIR_MISSION_NAME_ADVANCED = window.getAirMissionName;
function getAirMissionName(type) {
  const names = {
    air_superiority: "Superioridad aérea",
    strike: "Ataque de precisión",
    interdiction: "Interdicción logística",
    strategic_bombing: "Bombardeo estratégico",
    close_air_support: "Apoyo aéreo cercano",
    reconnaissance: "Reconocimiento",
    sead: "Supresión SEAD/DEAD"
  };

  return names[type] || type;
}

const OLD_GET_AIR_MISSION_COST_ADVANCED = window.getAirMissionCost;
function getAirMissionCost(country, missionType) {
  const baseCosts = {
    air_superiority: 45_000_000,
    strike: 85_000_000,
    interdiction: 70_000_000,
    strategic_bombing: 150_000_000,
    close_air_support: 60_000_000,
    reconnaissance: 30_000_000,
    sead: 110_000_000
  };

  const inflation = 1 + (country.inflation || 0.02);
  const techModifier = country.completedTechnologies?.includes("network_centric_warfare") ? 0.96 : 1;

  return Math.round((baseCosts[missionType] || 50_000_000) * inflation * techModifier);
}

/* =========================================================
   INTEGRACIÓN CON GUERRA DIARIA
========================================================= */

const OLD_SIMULATE_WAR_DAY_AIR_ADVANCED = window.simulateWarDay;

function simulateWarDay(war) {
  if (typeof OLD_SIMULATE_WAR_DAY_AIR_ADVANCED === "function") {
    OLD_SIMULATE_WAR_DAY_AIR_ADVANCED(war);
  }

  simulateAirWar(war);
}

/* =========================================================
   RESUMEN EXTENDIDO PARA UI
========================================================= */

function getAdvancedAirWarBreakdown(country) {
  return {
    ...getAirWarBreakdown(country),
    airDefenseSuppression: country.airDefenseSuppression || 0,
    availableMissions: [
      { id: "air_superiority", name: getAirMissionName("air_superiority"), icon: "🛩️", cost: getAirMissionCost(country, "air_superiority") },
      { id: "strike", name: getAirMissionName("strike"), icon: "🎯", cost: getAirMissionCost(country, "strike") },
      { id: "interdiction", name: getAirMissionName("interdiction"), icon: "🚚", cost: getAirMissionCost(country, "interdiction") },
      { id: "strategic_bombing", name: getAirMissionName("strategic_bombing"), icon: "💥", cost: getAirMissionCost(country, "strategic_bombing") },
      { id: "close_air_support", name: getAirMissionName("close_air_support"), icon: "🚁", cost: getAirMissionCost(country, "close_air_support") },
      { id: "reconnaissance", name: getAirMissionName("reconnaissance"), icon: "🛰️", cost: getAirMissionCost(country, "reconnaissance") },
      { id: "sead", name: getAirMissionName("sead"), icon: "📡", cost: getAirMissionCost(country, "sead") }
    ]
  };
}

/* =========================================================
   EXPORT GLOBAL — PARTE 4.2.1B.2
========================================================= */

window.applyStrategicBombingEffects = applyStrategicBombingEffects;
window.applyReconnaissanceEffects = applyReconnaissanceEffects;
window.applySEADEffects = applySEADEffects;
window.degradeAirDefenseUnits = degradeAirDefenseUnits;
window.markRegionDamaged = markRegionDamaged;
window.resolveAdvancedAirMissionEffects = resolveAdvancedAirMissionEffects;

window.resolveAirMission = resolveAirMission;
window.getAirMissionName = getAirMissionName;
window.getAirMissionCost = getAirMissionCost;
window.simulateWarDay = simulateWarDay;
window.getAdvancedAirWarBreakdown = getAdvancedAirWarBreakdown;


/* =========================================================
   SIMULATION.JS v3
   Parte 4.2.2/12
   Guerra naval, control marítimo, bloqueos y convoyes.
   ========================================================= */

function simulateNavalWar(war) {
  if (!war || war.ended) return;

  war.navalCampaign ??= {
    seaControl: {},
    blockades: [],
    convoyLosses: {}
  };

  for (const front of war.fronts || []) {
    if (!front.active || front.terrain !== "coastal") continue;

    const attacker = getCountryByName(NEXUS.state.countries, front.attacker);
    const defender = getCountryByName(NEXUS.state.countries, front.defender);

    if (!attacker || !defender) continue;

    const result = calculateSeaControl(attacker, defender);

    front.navalSupport = result.attackerSeaControl;
    front.defenderSeaControl = result.defenderSeaControl;

    applyNavalAttrition(attacker, defender, result, war);
    applySeaControlEffects(attacker, defender, front, result);
  }

  processActiveBlockades(war);
}

function calculateSeaControl(attacker, defender) {
  const attackerSurface = calculateNavalPower(attacker, "surface");
  const defenderSurface = calculateNavalPower(defender, "surface");

  const attackerSub = calculateNavalPower(attacker, "submarine");
  const defenderSub = calculateNavalPower(defender, "submarine");

  const attackerAir = calculateAirPower(attacker) * 0.18;
  const defenderAir = calculateAirPower(defender) * 0.18;

  const attackerScore =
    attackerSurface +
    attackerSub * 0.75 +
    attackerAir +
    (attacker.logistics || 60) * 120;

  const defenderScore =
    defenderSurface +
    defenderSub * 0.85 +
    defenderAir +
    (defender.logistics || 60) * 130;

  const total = Math.max(attackerScore + defenderScore, 1);

  return {
    attackerSurface,
    defenderSurface,
    attackerSub,
    defenderSub,
    attackerScore,
    defenderScore,
    attackerSeaControl: clamp(attackerScore / total * 100, 0, 100),
    defenderSeaControl: clamp(defenderScore / total * 100, 0, 100)
  };
}

function calculateNavalPower(country, mode = "all") {
  let power = 0;

  for (const [unitId, count] of Object.entries(country.units || {})) {
    const unit = findMilitaryUnitById(unitId);
    if (!unit) continue;

    const domain = unit.domain || "";
    const type = (unit.type || "").toLowerCase();
    const name = (unit.name || "").toLowerCase();

    const isSea =
      domain.includes("sea") ||
      type.includes("fragata") ||
      type.includes("destructor") ||
      type.includes("submarino") ||
      type.includes("portaaviones") ||
      type.includes("corbeta") ||
      name.includes("frigate") ||
      name.includes("destroyer") ||
      name.includes("submarine") ||
      name.includes("carrier");

    if (!isSea) continue;

    const isSub =
      type.includes("submarino") ||
      name.includes("submarine");

    const isCarrier =
      type.includes("portaaviones") ||
      name.includes("carrier");

    if (mode === "submarine" && !isSub) continue;
    if (mode === "surface" && isSub) continue;
    if (mode === "carrier" && !isCarrier) continue;

    power += (unit.power || 0) * count;
  }

  const readiness = (country.militaryReadiness || 70) / 100;
  const logistics = (country.logistics || 60) / 100;
  const modernization = (country.modernizationLevel || 45) / 100;

  return power * (0.30 + readiness * 0.25 + logistics * 0.25 + modernization * 0.20);
}

function applyNavalAttrition(attacker, defender, result, war) {
  const totalScore = Math.max(result.attackerScore + result.defenderScore, 1);

  const attackerLossRate = clamp(
    result.defenderScore / totalScore * 0.00032,
    0.00001,
    0.0022
  );

  const defenderLossRate = clamp(
    result.attackerScore / totalScore * 0.00036,
    0.00001,
    0.0026
  );

  const attackerLosses = applyNavalUnitLosses(attacker, attackerLossRate);
  const defenderLosses = applyNavalUnitLosses(defender, defenderLossRate);

  war.casualties[attacker.name] = (war.casualties[attacker.name] || 0) + attackerLosses;
  war.casualties[defender.name] = (war.casualties[defender.name] || 0) + defenderLosses;
}

function applyNavalUnitLosses(country, lossRate) {
  let losses = 0;

  for (const [unitId, count] of Object.entries(country.units || {})) {
    const unit = findMilitaryUnitById(unitId);
    if (!unit) continue;

    const domain = unit.domain || "";
    const type = (unit.type || "").toLowerCase();
    const name = (unit.name || "").toLowerCase();

    const isSea =
      domain.includes("sea") ||
      type.includes("fragata") ||
      type.includes("destructor") ||
      type.includes("submarino") ||
      type.includes("portaaviones") ||
      type.includes("corbeta") ||
      name.includes("frigate") ||
      name.includes("destroyer") ||
      name.includes("submarine") ||
      name.includes("carrier");

    if (!isSea) continue;

    const unitLosses = Math.floor(count * lossRate * randomBetween(0.2, 1.4));

    country.units[unitId] = Math.max(0, count - unitLosses);
    losses += unitLosses;
  }

  if (losses > 0) {
    country.militaryReadiness = boundedDelta(country.militaryReadiness || 70, -losses * 0.05, 0, 100);
    updateMilitaryPowerFromUnits(country);
  }

  return losses;
}

function applySeaControlEffects(attacker, defender, front, result) {
  if (result.attackerSeaControl > 65) {
    front.progress = boundedDelta(front.progress || 0, 0.10, -100, 100);
    defender.imports *= 0.9997;
    defender.logistics = boundedDelta(defender.logistics || 60, -0.014, 0, 100);
  }

  if (result.defenderSeaControl > 65) {
    front.progress = boundedDelta(front.progress || 0, -0.10, -100, 100);
    attacker.imports *= 0.9997;
    attacker.logistics = boundedDelta(attacker.logistics || 60, -0.012, 0, 100);
  }

  front.navalModifier = clamp((result.attackerSeaControl - result.defenderSeaControl) / 100, -0.4, 0.4);
}

/* =========================================================
   BLOQUEOS NAVALES
========================================================= */

function startNavalBlockade(targetCountryName) {
  const attacker = getSelectedCountry();
  const target = getCountryByName(NEXUS.state.countries, targetCountryName);

  if (!attacker || !target || attacker.name === target.name) return;

  const seaControl = calculateSeaControl(attacker, target);
  const cost = calculateBlockadeCost(attacker, target);

  if (attacker.treasury < cost) {
    addEvent("⛔", `${attacker.name}: fondos insuficientes para bloqueo naval.`);
    renderAll();
    return;
  }

  if (seaControl.attackerSeaControl < 55) {
    addEvent("⛔", `${attacker.name}: control marítimo insuficiente para bloquear ${target.name}.`);
    renderAll();
    return;
  }

  attacker.treasury -= cost;

  NEXUS.state.activeBlockades ??= [];

  const existing = NEXUS.state.activeBlockades.find(b =>
    b.attacker === attacker.name &&
    b.target === target.name &&
    !b.ended
  );

  if (existing) {
    addEvent("⚠️", `Ya existe un bloqueo activo contra ${target.name}.`);
    renderAll();
    return;
  }

  NEXUS.state.activeBlockades.push({
    id: String(Date.now() + Math.random()),
    attacker: attacker.name,
    target: target.name,
    startYear: getSimulationYear(),
    durationDays: 0,
    intensity: seaControl.attackerSeaControl,
    ended: false
  });

  NEXUS.state.world.tension = clamp((NEXUS.state.world.tension || 0) + 4, 0, 100);

  addEvent("🚢", `${attacker.name}: bloqueo naval iniciado contra ${target.name}.`);
  renderAll();
}

function calculateBlockadeCost(attacker, target) {
  const distanceModifier = Math.max(1, Math.abs((attacker.lon || 0) - (target.lon || 0)) / 35);
  return Math.round(120_000_000 * distanceModifier * (1 + (attacker.inflation || 0.02)));
}

function processActiveBlockades(war = null) {
  NEXUS.state.activeBlockades ??= [];

  for (const blockade of NEXUS.state.activeBlockades) {
    if (blockade.ended) continue;

    const attacker = getCountryByName(NEXUS.state.countries, blockade.attacker);
    const target = getCountryByName(NEXUS.state.countries, blockade.target);

    if (!attacker || !target) {
      blockade.ended = true;
      continue;
    }

    blockade.durationDays += 1;

    const seaControl = calculateSeaControl(attacker, target);
    blockade.intensity = lerp(blockade.intensity, seaControl.attackerSeaControl, 0.05);

    applyBlockadeEffects(attacker, target, blockade);

    if (seaControl.attackerSeaControl < 42 || attacker.treasury <= 0) {
      blockade.ended = true;
      addEvent("⚓", `El bloqueo naval de ${attacker.name} contra ${target.name} termina.`);
    }
  }

  NEXUS.state.activeBlockades = NEXUS.state.activeBlockades.filter(b => !b.ended);
}

function applyBlockadeEffects(attacker, target, blockade) {
  const intensity = clamp(blockade.intensity / 100, 0, 1);

  const tradeDamage = target.imports * 0.00045 * intensity;
  const exportDamage = target.exports * 0.00035 * intensity;
  const attackerCost = attacker.gdp * 0.000012 * intensity;

  target.imports = Math.max(0, target.imports - tradeDamage);
  target.exports = Math.max(0, target.exports - exportDamage);
  target.gdp = Math.max(1_000_000_000, target.gdp - target.gdp * 0.000018 * intensity);
  target.inflation = (target.inflation || SIMULATION_CONFIG.baseInflation) + 0.000025 * intensity;
  target.happiness = boundedDelta(target.happiness, -0.006 * intensity, 0, 100);
  target.stability = boundedDelta(target.stability, -0.004 * intensity, 0, 100);

  attacker.treasury = Math.max(0, attacker.treasury - attackerCost);

  if (randomChance(0.002 * intensity)) {
    addEvent("🚢", `${target.name}: pérdidas de convoyes por bloqueo naval.`);
  }
}

/* =========================================================
   CONVOYES Y COMERCIO MARÍTIMO
========================================================= */

function calculateConvoyRisk(country) {
  const navalPower = calculateNavalPower(country, "surface");
  const submarineThreat = getGlobalSubmarineThreatAgainst(country);
  const blocProtection = countryBelongsToBloc(country.name, "nato") ? 0.88 : 1;

  return clamp(
    15 +
    submarineThreat / 2500 -
    navalPower / 4000 +
    (country.warRisk || 0) * 0.18 +
    (NEXUS.state.world.tension || 0) * 0.08,
    0,
    100
  ) * blocProtection;
}

function getGlobalSubmarineThreatAgainst(country) {
  let threat = 0;

  for (const other of NEXUS.state.countries || []) {
    if (other.name === country.name) continue;

    const relation = other.relation ?? 50;
    if (relation > 35) continue;

    threat += calculateNavalPower(other, "submarine") * ((35 - relation) / 35);
  }

  return threat;
}

function simulateMaritimeTradeRisk(country) {
  const risk = calculateConvoyRisk(country);
  country.convoyRisk = risk;

  if (risk > 55) {
    const tradePenalty = (risk - 55) * 0.000004;
    country.imports *= 1 - tradePenalty;
    country.exports *= 1 - tradePenalty * 0.8;
    country.inflation = (country.inflation || SIMULATION_CONFIG.baseInflation) + tradePenalty * 0.08;
  }
}

function getNavalWarBreakdown(country) {
  return {
    surfacePower: calculateNavalPower(country, "surface"),
    submarinePower: calculateNavalPower(country, "submarine"),
    carrierPower: calculateNavalPower(country, "carrier"),
    totalNavalPower: calculateNavalPower(country, "all"),
    convoyRisk: calculateConvoyRisk(country),
    activeBlockades: (NEXUS.state.activeBlockades || []).filter(b =>
      b.attacker === country.name || b.target === country.name
    )
  };
}

/* =========================================================
   INTEGRACIÓN CON GUERRA DIARIA
========================================================= */

const OLD_SIMULATE_WAR_DAY_NAVAL = window.simulateWarDay;

function simulateWarDay(war) {
  if (typeof OLD_SIMULATE_WAR_DAY_NAVAL === "function") {
    OLD_SIMULATE_WAR_DAY_NAVAL(war);
  }

  simulateNavalWar(war);
}

/* =========================================================
   EXPORT GLOBAL — PARTE 4.2.2
========================================================= */

window.simulateNavalWar = simulateNavalWar;
window.calculateSeaControl = calculateSeaControl;
window.calculateNavalPower = calculateNavalPower;
window.applyNavalAttrition = applyNavalAttrition;
window.applyNavalUnitLosses = applyNavalUnitLosses;
window.applySeaControlEffects = applySeaControlEffects;

window.startNavalBlockade = startNavalBlockade;
window.calculateBlockadeCost = calculateBlockadeCost;
window.processActiveBlockades = processActiveBlockades;
window.applyBlockadeEffects = applyBlockadeEffects;

window.calculateConvoyRisk = calculateConvoyRisk;
window.getGlobalSubmarineThreatAgainst = getGlobalSubmarineThreatAgainst;
window.simulateMaritimeTradeRisk = simulateMaritimeTradeRisk;
window.getNavalWarBreakdown = getNavalWarBreakdown;

window.simulateWarDay = simulateWarDay;


/* =========================================================
   SIMULATION.JS v3
   Parte 4.2.3A/12
   Misiles de crucero y balísticos: lanzamiento, costes,
   precisión, daño e impacto estratégico.
   ========================================================= */

function launchMissileStrike(targetCountryName, strikeType = "cruise", targetRegionId = null) {
  const attacker = getSelectedCountry();
  const target = getCountryByName(NEXUS.state.countries, targetCountryName);

  if (!attacker || !target || attacker.name === target.name) return;

  const cost = getMissileStrikeCost(attacker, strikeType);

  if (attacker.treasury < cost) {
    addEvent("⛔", `${attacker.name}: fondos insuficientes para ataque con misiles.`);
    renderAll();
    return;
  }

  const capability = calculateMissileCapability(attacker, strikeType);

  if (capability < getRequiredMissileCapability(strikeType)) {
    addEvent("⛔", `${attacker.name}: capacidad insuficiente para ataque ${getMissileStrikeName(strikeType)}.`);
    renderAll();
    return;
  }

  attacker.treasury -= cost;

  const region = targetRegionId
    ? target.regions?.find(r => r.id === targetRegionId)
    : pickMissileTargetRegion(target, strikeType);

  const result = resolveMissileStrike(attacker, target, strikeType, region);

  addEvent(result.icon, result.message);
  renderAll();
}

function getMissileStrikeCost(country, strikeType) {
  const baseCosts = {
    cruise: 95_000_000,
    ballistic: 180_000_000,
    hypersonic: 420_000_000,
    saturation: 650_000_000
  };

  const inflation = 1 + (country.inflation || SIMULATION_CONFIG.baseInflation);
  const industryDiscount = 1 - clamp(getMilitaryIndustryScore(country) * 0.001, 0, 0.16);
  const sanctionsPenalty = 1 + (country.sanctions || 0) * 0.015;

  return Math.round(
    (baseCosts[strikeType] || baseCosts.cruise) *
    inflation *
    industryDiscount *
    sanctionsPenalty
  );
}

function calculateMissileCapability(country, strikeType = "cruise") {
  let capability = 0;

  capability += (country.research || 0) * 0.9;
  capability += (country.cyber || 0) * 0.55;
  capability += getBuildingLevelSum(country, "electronics") * 650;
  capability += getBuildingLevelSum(country, "airbase") * 420;
  capability += getBuildingLevelSum(country, "naval") * 380;
  capability += getBuildingLevelSum(country, "cyber") * 520;

  for (const [unitId, count] of Object.entries(country.units || {})) {
    const unit = findMilitaryUnitById(unitId);
    if (!unit) continue;

    const name = (unit.name || "").toLowerCase();
    const type = (unit.type || "").toLowerCase();

    if (
      name.includes("himars") ||
      name.includes("tomahawk") ||
      name.includes("fateh") ||
      name.includes("iskander") ||
      name.includes("missile") ||
      type.includes("misil") ||
      type.includes("artillería") ||
      type.includes("artilleria")
    ) {
      capability += (unit.power || 0) * count * 0.8;
    }

    if (
      name.includes("destroyer") ||
      name.includes("destructor") ||
      name.includes("frigate") ||
      name.includes("submarine") ||
      name.includes("submarino")
    ) {
      capability += (unit.power || 0) * count * 0.18;
    }
  }

  if (country.completedTechnologies?.includes("network_centric_warfare")) {
    capability *= 1.10;
  }

  if (country.completedTechnologies?.includes("earth_observation_satellites")) {
    capability *= 1.08;
  }

  if (strikeType === "hypersonic") {
    capability *= country.completedTechnologies?.includes("quantum_communications") ? 1.08 : 0.72;
  }

  if (strikeType === "saturation") {
    capability *= getMilitaryIndustryScore(country) > 60 ? 1.08 : 0.82;
  }

  return capability;
}

function getRequiredMissileCapability(strikeType) {
  const requirements = {
    cruise: 2500,
    ballistic: 4200,
    hypersonic: 7800,
    saturation: 6500
  };

  return requirements[strikeType] || 2500;
}

function pickMissileTargetRegion(target, strikeType = "cruise") {
  const regions = [...(target.regions || [])];

  if (!regions.length) return null;

  if (strikeType === "ballistic" || strikeType === "hypersonic") {
    return regions.sort((a, b) => scoreStrategicTarget(b) - scoreStrategicTarget(a))[0];
  }

  if (strikeType === "saturation") {
    return regions.sort((a, b) => scoreMilitaryTarget(b) - scoreMilitaryTarget(a))[0];
  }

  return regions.sort((a, b) => scoreIndustrialTarget(b) - scoreIndustrialTarget(a))[0];
}

function scoreStrategicTarget(region) {
  let score = 0;

  if (region.type === "capital") score += 120;
  if (region.type === "technology") score += 55;
  if (region.type === "finance") score += 50;
  if (region.type === "industry") score += 45;
  if (region.type === "energy") score += 42;
  if (region.type === "naval") score += 36;

  score += (region.gdp || 0) / 2_500_000_000;
  score += (region.population || 0) / 120_000;

  return score;
}

function scoreIndustrialTarget(region) {
  let score = 0;

  if (region.type === "industry") score += 80;
  if (region.type === "automotive") score += 65;
  if (region.type === "energy") score += 58;
  if (region.type === "port") score += 42;
  if (region.type === "logistics") score += 40;

  score += (region.gdp || 0) / 3_000_000_000;

  return score;
}

function scoreMilitaryTarget(region) {
  let score = 0;

  if (region.type === "naval") score += 90;
  if (region.type === "aerospace") score += 70;
  if (region.type === "capital") score += 50;
  if (region.type === "port") score += 45;
  if (region.type === "logistics") score += 35;

  for (const item of region.buildings || []) {
    if (["airbase", "naval", "barracks", "cyber", "shipyard"].includes(item.buildingId)) {
      score += 20 * (item.level || 1);
    }
  }

  return score;
}

function resolveMissileStrike(attacker, target, strikeType, targetRegion = null) {
  const missileCapability = calculateMissileCapability(attacker, strikeType);
  const defenseCapability = calculateMissileDefenseCapability(target);

  const interceptionChance = calculateMissileInterceptionChance(
    missileCapability,
    defenseCapability,
    strikeType
  );

  const intercepted = randomChance(interceptionChance);
  const partialIntercept = !intercepted && randomChance(interceptionChance * 0.55);

  const precision = calculateMissilePrecision(attacker, strikeType);
  const damageFactor = calculateMissileDamageFactor(strikeType, precision, partialIntercept);

  if (intercepted) {
    target.militaryReadiness = boundedDelta(target.militaryReadiness || 70, -0.15, 0, 100);
    attacker.reputation = boundedDelta(attacker.reputation || 60, -1.2, 0, 100);
    increaseMissileEscalation(attacker, target, strikeType, 0.7);

    return {
      success: false,
      icon: "🛡️",
      message: `${target.name}: defensa antimisiles intercepta ataque ${getMissileStrikeName(strikeType)} de ${attacker.name}.`
    };
  }

  const damage = applyMissileDamage(attacker, target, targetRegion, strikeType, damageFactor);
  increaseMissileEscalation(attacker, target, strikeType, 1.0);

  return {
    success: true,
    icon: "🚀",
    message:
      `${attacker.name}: ataque ${getMissileStrikeName(strikeType)} contra ${target.name}` +
      `${targetRegion ? ` en ${targetRegion.name}` : ""}. ` +
      `Daño estimado: ${formatMoney(damage)}${partialIntercept ? " tras intercepción parcial" : ""}.`
  };
}

function calculateMissileDefenseCapability(country) {
  let defense = 0;

  defense += calculateAirDefensePower(country) * 0.65;
  defense += calculateElectronicWarfarePower(country) * 0.40;
  defense += getBuildingLevelSum(country, "airbase") * 700;
  defense += getBuildingLevelSum(country, "cyber") * 650;

  for (const [unitId, count] of Object.entries(country.units || {})) {
    const unit = findMilitaryUnitById(unitId);
    if (!unit) continue;

    const name = (unit.name || "").toLowerCase();
    const type = (unit.type || "").toLowerCase();

    if (
      name.includes("patriot") ||
      name.includes("thaad") ||
      name.includes("s-300") ||
      name.includes("s300") ||
      name.includes("s-400") ||
      name.includes("s400") ||
      name.includes("iron dome") ||
      type.includes("defensa aérea") ||
      type.includes("defensa antimisil")
    ) {
      defense += (unit.power || 0) * count * 1.15;
    }
  }

  if (country.completedTechnologies?.includes("integrated_air_defense")) {
    defense *= 1.18;
  }

  if (country.completedTechnologies?.includes("quantum_communications")) {
    defense *= 1.06;
  }

  return defense;
}

function calculateMissileInterceptionChance(missileCapability, defenseCapability, strikeType) {
  const ratio = defenseCapability / Math.max(missileCapability, 1);

  let base = clamp(0.18 + Math.log(Math.max(0.2, ratio)) * 0.18, 0.03, 0.82);

  if (strikeType === "cruise") base += 0.08;
  if (strikeType === "ballistic") base -= 0.06;
  if (strikeType === "hypersonic") base -= 0.22;
  if (strikeType === "saturation") base -= 0.16;

  return clamp(base, 0.02, 0.88);
}

function calculateMissilePrecision(attacker, strikeType) {
  let precision = 0.55;

  precision += (attacker.cyber || 0) / 20000;
  precision += (attacker.research || 0) / 30000;
  precision += (attacker.intelligence || 0) * 0.0025;
  precision += getBuildingLevelSum(attacker, "cyber") * 0.012;

  if (attacker.completedTechnologies?.includes("earth_observation_satellites")) {
    precision += 0.09;
  }

  if (attacker.completedTechnologies?.includes("network_centric_warfare")) {
    precision += 0.06;
  }

  if (strikeType === "cruise") precision += 0.07;
  if (strikeType === "ballistic") precision -= 0.04;
  if (strikeType === "hypersonic") precision += 0.03;
  if (strikeType === "saturation") precision -= 0.08;

  return clamp(precision, 0.18, 0.96);
}

function calculateMissileDamageFactor(strikeType, precision, partialIntercept = false) {
  const base = {
    cruise: 0.65,
    ballistic: 0.95,
    hypersonic: 1.25,
    saturation: 1.55
  }[strikeType] || 0.65;

  const interceptPenalty = partialIntercept ? 0.45 : 1;

  return base * precision * interceptPenalty;
}

function applyMissileDamage(attacker, target, region, strikeType, damageFactor) {
  const baseDamage = {
    cruise: 85_000_000,
    ballistic: 180_000_000,
    hypersonic: 360_000_000,
    saturation: 520_000_000
  }[strikeType] || 85_000_000;

  const economicDamage = Math.round(baseDamage * damageFactor);

  target.gdp = Math.max(1_000_000_000, target.gdp - economicDamage);
  target.treasury = Math.max(0, target.treasury - economicDamage * 0.035);

  target.stability = boundedDelta(target.stability, -0.9 * damageFactor, 0, 100);
  target.happiness = boundedDelta(target.happiness, -1.1 * damageFactor, 0, 100);
  target.businessConfidence = boundedDelta(target.businessConfidence || 50, -1.5 * damageFactor, 0, 100);
  target.militaryReadiness = boundedDelta(target.militaryReadiness || 70, -0.9 * damageFactor, 0, 100);

  if (region) {
    region.gdp = Math.max(0, (region.gdp || 0) - economicDamage * 0.18);
    markRegionDamaged(region, Math.max(1, Math.round(damageFactor * 2)));

    for (const item of region.buildings || []) {
      if (randomChance(0.08 * damageFactor)) {
        item.damaged = true;
        item.level = Math.max(1, (item.level || 1) - 1);
      }
    }
  } else {
    damageRandomTargetInfrastructure(target);
  }

  if (strikeType === "saturation") {
    target.logistics = boundedDelta(target.logistics || 60, -4.0 * damageFactor, 0, 100);
  }

  if (strikeType === "hypersonic") {
    target.airDefenseSuppression = boundedDelta(target.airDefenseSuppression || 0, 7 * damageFactor, 0, 100);
  }

  attacker.reputation = boundedDelta(attacker.reputation || 60, -1.6 * damageFactor, 0, 100);

  return economicDamage;
}

function increaseMissileEscalation(attacker, target, strikeType, multiplier = 1) {
  const escalation = {
    cruise: 1.4,
    ballistic: 2.7,
    hypersonic: 4.2,
    saturation: 5.5
  }[strikeType] || 1.4;

  NEXUS.state.world.tension = clamp(
    (NEXUS.state.world.tension || 0) + escalation * multiplier,
    0,
    100
  );

  attacker.warRisk = boundedDelta(attacker.warRisk || 0, escalation * 0.7 * multiplier, 0, 100);
  target.warRisk = boundedDelta(target.warRisk || 0, escalation * 1.2 * multiplier, 0, 100);

  if (strikeType === "ballistic" || strikeType === "hypersonic" || strikeType === "saturation") {
    attacker.sanctions = (attacker.sanctions || 0) + Math.ceil(escalation * 0.35);
  }
}

function getMissileStrikeName(strikeType) {
  const names = {
    cruise: "con misiles de crucero",
    ballistic: "con misiles balísticos",
    hypersonic: "hipersónico",
    saturation: "de saturación"
  };

  return names[strikeType] || strikeType;
}

function getMissileWarfareBreakdown(country) {
  return {
    cruiseCapability: calculateMissileCapability(country, "cruise"),
    ballisticCapability: calculateMissileCapability(country, "ballistic"),
    hypersonicCapability: calculateMissileCapability(country, "hypersonic"),
    saturationCapability: calculateMissileCapability(country, "saturation"),
    missileDefense: calculateMissileDefenseCapability(country),
    availableStrikes: [
      { id: "cruise", name: getMissileStrikeName("cruise"), icon: "🚀", cost: getMissileStrikeCost(country, "cruise") },
      { id: "ballistic", name: getMissileStrikeName("ballistic"), icon: "🚀", cost: getMissileStrikeCost(country, "ballistic") },
      { id: "hypersonic", name: getMissileStrikeName("hypersonic"), icon: "⚡", cost: getMissileStrikeCost(country, "hypersonic") },
      { id: "saturation", name: getMissileStrikeName("saturation"), icon: "💥", cost: getMissileStrikeCost(country, "saturation") }
    ]
  };
}

/* =========================================================
   EXPORT GLOBAL — PARTE 4.2.3A
========================================================= */

window.launchMissileStrike = launchMissileStrike;
window.getMissileStrikeCost = getMissileStrikeCost;
window.calculateMissileCapability = calculateMissileCapability;
window.getRequiredMissileCapability = getRequiredMissileCapability;
window.pickMissileTargetRegion = pickMissileTargetRegion;
window.scoreStrategicTarget = scoreStrategicTarget;
window.scoreIndustrialTarget = scoreIndustrialTarget;
window.scoreMilitaryTarget = scoreMilitaryTarget;
window.resolveMissileStrike = resolveMissileStrike;
window.calculateMissileDefenseCapability = calculateMissileDefenseCapability;
window.calculateMissileInterceptionChance = calculateMissileInterceptionChance;
window.calculateMissilePrecision = calculateMissilePrecision;
window.calculateMissileDamageFactor = calculateMissileDamageFactor;
window.applyMissileDamage = applyMissileDamage;
window.increaseMissileEscalation = increaseMissileEscalation;
window.getMissileStrikeName = getMissileStrikeName;
window.getMissileWarfareBreakdown = getMissileWarfareBreakdown;


/* =========================================================
   SIMULATION.JS v3
   Parte 4.2.3B.1/12
   Defensa antimisiles: Patriot, SAMP/T, NASAMS, Iron Dome,
   Arrow, THAAD, S-300, S-400, S-500 y cálculo avanzado.
   ========================================================= */

const MISSILE_DEFENSE_SYSTEMS = {
  patriot: {
    name: "Patriot PAC-3",
    class: "medium_long_range",
    intercept: 0.62,
    ballisticBonus: 0.18,
    cruiseBonus: 0.10,
    hypersonicPenalty: -0.22,
    saturationPenalty: -0.18,
    radar: 0.72
  },
  samp_t: {
    name: "SAMP/T",
    class: "medium_long_range",
    intercept: 0.58,
    ballisticBonus: 0.14,
    cruiseBonus: 0.12,
    hypersonicPenalty: -0.20,
    saturationPenalty: -0.16,
    radar: 0.68
  },
  nasams: {
    name: "NASAMS",
    class: "medium_range",
    intercept: 0.48,
    ballisticBonus: -0.08,
    cruiseBonus: 0.20,
    hypersonicPenalty: -0.30,
    saturationPenalty: -0.12,
    radar: 0.55
  },
  iron_dome: {
    name: "Iron Dome",
    class: "short_medium_range",
    intercept: 0.55,
    ballisticBonus: -0.10,
    cruiseBonus: 0.16,
    hypersonicPenalty: -0.32,
    saturationPenalty: -0.08,
    radar: 0.50
  },
  arrow: {
    name: "Arrow",
    class: "exo_atmospheric",
    intercept: 0.68,
    ballisticBonus: 0.26,
    cruiseBonus: -0.06,
    hypersonicPenalty: -0.12,
    saturationPenalty: -0.18,
    radar: 0.82
  },
  thaad: {
    name: "THAAD",
    class: "exo_atmospheric",
    intercept: 0.72,
    ballisticBonus: 0.30,
    cruiseBonus: -0.10,
    hypersonicPenalty: -0.14,
    saturationPenalty: -0.20,
    radar: 0.86
  },
  s300: {
    name: "S-300",
    class: "long_range",
    intercept: 0.54,
    ballisticBonus: 0.10,
    cruiseBonus: 0.10,
    hypersonicPenalty: -0.25,
    saturationPenalty: -0.17,
    radar: 0.66
  },
  s400: {
    name: "S-400",
    class: "long_range",
    intercept: 0.66,
    ballisticBonus: 0.18,
    cruiseBonus: 0.16,
    hypersonicPenalty: -0.18,
    saturationPenalty: -0.15,
    radar: 0.78
  },
  s500: {
    name: "S-500",
    class: "strategic",
    intercept: 0.74,
    ballisticBonus: 0.28,
    cruiseBonus: 0.10,
    hypersonicPenalty: -0.08,
    saturationPenalty: -0.18,
    radar: 0.88
  },
  aegis: {
    name: "Aegis BMD",
    class: "naval_bmd",
    intercept: 0.70,
    ballisticBonus: 0.24,
    cruiseBonus: 0.14,
    hypersonicPenalty: -0.14,
    saturationPenalty: -0.16,
    radar: 0.84
  }
};

function identifyMissileDefenseSystem(unitId, unit = null) {
  const raw = `${unitId} ${unit?.name || ""} ${unit?.type || ""}`.toLowerCase();

  if (raw.includes("patriot")) return "patriot";
  if (raw.includes("samp")) return "samp_t";
  if (raw.includes("nasams")) return "nasams";
  if (raw.includes("iron dome")) return "iron_dome";
  if (raw.includes("arrow")) return "arrow";
  if (raw.includes("thaad")) return "thaad";
  if (raw.includes("s-300") || raw.includes("s300")) return "s300";
  if (raw.includes("s-400") || raw.includes("s400")) return "s400";
  if (raw.includes("s-500") || raw.includes("s500")) return "s500";
  if (raw.includes("aegis") || raw.includes("arleigh") || raw.includes("ticonderoga")) return "aegis";

  return null;
}

function getCountryMissileDefenseInventory(country) {
  const inventory = [];

  for (const [unitId, count] of Object.entries(country.units || {})) {
    const unit = findMilitaryUnitById(unitId);
    const systemId = identifyMissileDefenseSystem(unitId, unit);

    if (!systemId || count <= 0) continue;

    inventory.push({
      systemId,
      count,
      unitId,
      unitName: unit?.name || MISSILE_DEFENSE_SYSTEMS[systemId].name,
      definition: MISSILE_DEFENSE_SYSTEMS[systemId]
    });
  }

  return inventory;
}

function calculateLayeredMissileDefense(country, strikeType = "cruise") {
  const inventory = getCountryMissileDefenseInventory(country);

  let baseCoverage = 0;
  let radarQuality = 0;
  let systemCount = 0;

  for (const item of inventory) {
    const system = item.definition;
    const countFactor = Math.sqrt(item.count);

    let intercept = system.intercept;

    if (strikeType === "cruise") intercept += system.cruiseBonus || 0;
    if (strikeType === "ballistic") intercept += system.ballisticBonus || 0;
    if (strikeType === "hypersonic") intercept += system.hypersonicPenalty || 0;
    if (strikeType === "saturation") intercept += system.saturationPenalty || 0;

    baseCoverage += clamp(intercept, 0.02, 0.92) * countFactor;
    radarQuality += (system.radar || 0.5) * countFactor;
    systemCount += countFactor;
  }

  if (systemCount <= 0) {
    return {
      inventory,
      baseCoverage: 0,
      radarQuality: 0,
      networkBonus: 0,
      finalDefense: calculateMissileDefenseCapability(country) * 0.00002
    };
  }

  baseCoverage /= systemCount;
  radarQuality /= systemCount;

  const networkBonus = calculateAirDefenseNetworkBonus(country);
  const readiness = (country.militaryReadiness || 70) / 100;
  const cyberPenalty = calculateAirDefenseCyberVulnerability(country);
  const suppressionPenalty = clamp((country.airDefenseSuppression || 0) / 100, 0, 0.75);

  const finalDefense = clamp(
    baseCoverage *
      (0.72 + radarQuality * 0.28) *
      (0.75 + readiness * 0.35) *
      (1 + networkBonus) *
      (1 - cyberPenalty) *
      (1 - suppressionPenalty),
    0,
    0.94
  );

  return {
    inventory,
    baseCoverage,
    radarQuality,
    networkBonus,
    readiness,
    cyberPenalty,
    suppressionPenalty,
    finalDefense
  };
}

function calculateAirDefenseNetworkBonus(country) {
  let bonus = 0;

  bonus += getBuildingLevelSum(country, "airbase") * 0.012;
  bonus += getBuildingLevelSum(country, "cyber") * 0.015;
  bonus += getBuildingLevelSum(country, "electronics") * 0.010;

  if (country.completedTechnologies?.includes("integrated_air_defense")) {
    bonus += 0.16;
  }

  if (country.completedTechnologies?.includes("network_centric_warfare")) {
    bonus += 0.08;
  }

  if (country.completedTechnologies?.includes("earth_observation_satellites")) {
    bonus += 0.06;
  }

  return clamp(bonus, 0, 0.42);
}

function calculateAirDefenseCyberVulnerability(country) {
  const cyber = country.cyber || 0;
  const government = country.governmentEfficiency || 50;
  const networked = country.completedTechnologies?.includes("network_centric_warfare") ? 0.04 : 0;

  return clamp(
    0.18 -
      cyber / 40000 -
      government / 1200 +
      networked +
      (country.sanctions || 0) * 0.002,
    0.02,
    0.28
  );
}

function calculateAdvancedMissileInterceptionChance(attacker, defender, strikeType = "cruise") {
  const missileCapability = calculateMissileCapability(attacker, strikeType);
  const layeredDefense = calculateLayeredMissileDefense(defender, strikeType);
  const rawDefenseCapability = calculateMissileDefenseCapability(defender);

  const capabilityRatio =
    rawDefenseCapability / Math.max(missileCapability, 1);

  let chance =
    layeredDefense.finalDefense * 0.72 +
    clamp(Math.log(Math.max(0.2, capabilityRatio)) * 0.13, -0.22, 0.22);

  if (strikeType === "cruise") chance += 0.06;
  if (strikeType === "ballistic") chance -= 0.04;
  if (strikeType === "hypersonic") chance -= 0.18;
  if (strikeType === "saturation") chance -= 0.20;

  const attackerPrecision = calculateMissilePrecision(attacker, strikeType);
  chance -= Math.max(0, attackerPrecision - 0.65) * 0.10;

  return clamp(chance, 0.02, 0.90);
}

function consumeInterceptorInventory(defender, strikeType = "cruise", intensity = 1) {
  const inventory = getCountryMissileDefenseInventory(defender);
  if (!inventory.length) return 0;

  let consumed = 0;

  for (const item of inventory) {
    const probability = clamp(0.08 * intensity / Math.sqrt(item.count + 1), 0.01, 0.18);

    if (randomChance(probability)) {
      defender.units[item.unitId] = Math.max(0, defender.units[item.unitId] - 1);
      consumed += 1;
    }
  }

  if (consumed > 0) {
    defender.militaryReadiness = boundedDelta(defender.militaryReadiness || 70, -consumed * 0.05, 0, 100);
    updateMilitaryPowerFromUnits(defender);
  }

  return consumed;
}

/* =========================================================
   OVERRIDE DE INTERCEPTACIÓN USADO POR 4.2.3A
========================================================= */

const OLD_CALCULATE_MISSILE_INTERCEPTION_CHANCE_B1 = window.calculateMissileInterceptionChance;

function calculateMissileInterceptionChance(missileCapability, defenseCapability, strikeType) {
  const ratio = defenseCapability / Math.max(missileCapability, 1);

  let base = clamp(
    0.16 + Math.log(Math.max(0.2, ratio)) * 0.16,
    0.03,
    0.78
  );

  if (strikeType === "cruise") base += 0.08;
  if (strikeType === "ballistic") base -= 0.05;
  if (strikeType === "hypersonic") base -= 0.20;
  if (strikeType === "saturation") base -= 0.18;

  return clamp(base, 0.02, 0.86);
}

/* =========================================================
   RESUMEN UI
========================================================= */

function getMissileDefenseBreakdown(country) {
  const cruise = calculateLayeredMissileDefense(country, "cruise");
  const ballistic = calculateLayeredMissileDefense(country, "ballistic");
  const hypersonic = calculateLayeredMissileDefense(country, "hypersonic");
  const saturation = calculateLayeredMissileDefense(country, "saturation");

  return {
    inventory: getCountryMissileDefenseInventory(country).map(item => ({
      systemId: item.systemId,
      name: item.definition.name,
      count: item.count,
      class: item.definition.class
    })),
    cruiseDefense: cruise.finalDefense,
    ballisticDefense: ballistic.finalDefense,
    hypersonicDefense: hypersonic.finalDefense,
    saturationDefense: saturation.finalDefense,
    networkBonus: calculateAirDefenseNetworkBonus(country),
    cyberVulnerability: calculateAirDefenseCyberVulnerability(country),
    rawDefenseCapability: calculateMissileDefenseCapability(country)
  };
}

/* =========================================================
   EXPORT GLOBAL — PARTE 4.2.3B.1
========================================================= */

window.MISSILE_DEFENSE_SYSTEMS = MISSILE_DEFENSE_SYSTEMS;
window.identifyMissileDefenseSystem = identifyMissileDefenseSystem;
window.getCountryMissileDefenseInventory = getCountryMissileDefenseInventory;
window.calculateLayeredMissileDefense = calculateLayeredMissileDefense;
window.calculateAirDefenseNetworkBonus = calculateAirDefenseNetworkBonus;
window.calculateAirDefenseCyberVulnerability = calculateAirDefenseCyberVulnerability;
window.calculateAdvancedMissileInterceptionChance = calculateAdvancedMissileInterceptionChance;
window.consumeInterceptorInventory = consumeInterceptorInventory;
window.calculateMissileInterceptionChance = calculateMissileInterceptionChance;
window.getMissileDefenseBreakdown = getMissileDefenseBreakdown;

/* =========================================================
   SIMULATION.JS v3
   Parte 4.2.3B.2/12 COMPACTA
   Integración defensa antimisiles + override de ataque misil.
========================================================= */

function calculateAdvancedMissileInterceptionChance(attacker, defender, strikeType = "cruise") {
  const defense = calculateLayeredMissileDefense(defender, strikeType);
  const attack = calculateMissileCapability(attacker, strikeType);

  let chance = defense.finalDefense;

  if (strikeType === "cruise") chance += 0.06;
  if (strikeType === "ballistic") chance -= 0.04;
  if (strikeType === "hypersonic") chance -= 0.18;
  if (strikeType === "saturation") chance -= 0.16;

  chance -= Math.min(0.18, attack / 60000);

  return clamp(chance, 0.02, 0.90);
}

const OLD_RESOLVE_MISSILE_STRIKE_DEFENSE = window.resolveMissileStrike;

function resolveMissileStrike(attacker, target, strikeType, targetRegion = null) {
  const interceptChance = calculateAdvancedMissileInterceptionChance(attacker, target, strikeType);
  const intercepted = randomChance(interceptChance);
  const partial = !intercepted && randomChance(interceptChance * 0.45);

  const used = consumeInterceptorInventory(target, strikeType, strikeType === "saturation" ? 2 : 1);

  if (intercepted) {
    target.militaryReadiness = boundedDelta(target.militaryReadiness || 70, -0.15, 0, 100);
    attacker.reputation = boundedDelta(attacker.reputation || 60, -1.0, 0, 100);
    increaseMissileEscalation(attacker, target, strikeType, 0.55);

    return {
      success: false,
      icon: "🛡️",
      message: `${target.name}: ataque ${getMissileStrikeName(strikeType)} de ${attacker.name} interceptado. Interceptores usados: ${used}.`
    };
  }

  const precision = calculateMissilePrecision(attacker, strikeType);
  const damageFactor = calculateMissileDamageFactor(strikeType, precision, partial);
  const damage = applyMissileDamage(attacker, target, targetRegion, strikeType, damageFactor);

  if (partial) {
    target.militaryReadiness = boundedDelta(target.militaryReadiness || 70, -0.4, 0, 100);
  }

  increaseMissileEscalation(attacker, target, strikeType, partial ? 0.75 : 1.0);

  return {
    success: true,
    icon: "🚀",
    message:
      `${attacker.name}: ataque ${getMissileStrikeName(strikeType)} contra ${target.name}` +
      `${targetRegion ? ` en ${targetRegion.name}` : ""}. ` +
      `Daño: ${formatMoney(damage)}. ` +
      `${partial ? "Intercepción parcial redujo el impacto. " : ""}` +
      `Interceptores usados: ${used}.`
  };
}

function reinforceMissileDefense(country = getSelectedCountry()) {
  if (!country) return;

  const cost = Math.round(country.gdp * 0.0012);

  if (country.treasury < cost) {
    addEvent("⛔", `${country.name}: fondos insuficientes para reforzar defensa antimisiles.`);
    renderAll();
    return;
  }

  country.treasury -= cost;
  country.units ??= {};

  const nato = countryBelongsToBloc(country.name, "nato");

  if (nato) {
    country.units.patriot = (country.units.patriot || 0) + 1;
    country.units.nasams = (country.units.nasams || 0) + 1;
  } else if (country.name === "Israel") {
    country.units.iron_dome = (country.units.iron_dome || 0) + 1;
    country.units.arrow = (country.units.arrow || 0) + 1;
  } else {
    country.units.s300 = (country.units.s300 || 0) + 1;
  }

  country.militaryReadiness = boundedDelta(country.militaryReadiness || 70, 1.5, 0, 100);
  addEvent("🛡️", `${country.name}: defensa antimisiles reforzada.`);
  renderAll();
}

function getMissileDefenseStatus(country) {
  const b = getMissileDefenseBreakdown(country);
  return {
    ...b,
    summary:
      `Crucero ${(b.cruiseDefense * 100).toFixed(0)}% · ` +
      `Balístico ${(b.ballisticDefense * 100).toFixed(0)}% · ` +
      `Hipersónico ${(b.hypersonicDefense * 100).toFixed(0)}%`
  };
}

/* =========================================================
   EXPORT GLOBAL — PARTE 4.2.3B.2 COMPACTA
========================================================= */

window.calculateAdvancedMissileInterceptionChance = calculateAdvancedMissileInterceptionChance;
window.resolveMissileStrike = resolveMissileStrike;
window.reinforceMissileDefense = reinforceMissileDefense;
window.getMissileDefenseStatus = getMissileDefenseStatus;


/* =========================================================
   SIMULATION.JS v3
   Parte 4.2.3C/12 COMPACTA
   Guerra electrónica, jamming, GPS spoofing, SEAD/DEAD y EMP.
========================================================= */

function executeElectronicWarfare(operationType, targetCountryName) {
  const attacker = getSelectedCountry();
  const target = getCountryByName(NEXUS.state.countries, targetCountryName);
  if (!attacker || !target || attacker.name === target.name) return;

  const cost = getEWOperationCost(attacker, operationType);
  if (attacker.treasury < cost) {
    addEvent("⛔", `${attacker.name}: fondos insuficientes para guerra electrónica.`);
    renderAll();
    return;
  }

  attacker.treasury -= cost;

  const success = randomChance(calculateEWSuccessChance(attacker, target, operationType));

  if (success) applyEWSuccess(attacker, target, operationType);
  else applyEWFailure(attacker, target, operationType);

  renderAll();
}

function getEWOperationCost(country, type) {
  const base = {
    radar_jamming: 45_000_000,
    gps_spoofing: 60_000_000,
    comms_disruption: 55_000_000,
    sead_dead: 120_000_000,
    emp_attack: 280_000_000
  }[type] || 50_000_000;

  return Math.round(base * (1 + (country.inflation || 0.02)));
}

function calculateEWSuccessChance(attacker, target, type) {
  const atk = calculateElectronicWarfarePower(attacker) + (attacker.cyber || 0);
  const def = calculateElectronicWarfarePower(target) + (target.cyber || 0) + calculateAirDefensePower(target) * 0.12;

  let chance = 0.42 + Math.log(Math.max(0.25, atk / Math.max(def, 1))) * 0.18;

  if (type === "radar_jamming") chance += 0.08;
  if (type === "gps_spoofing") chance += 0.04;
  if (type === "sead_dead") chance -= 0.06;
  if (type === "emp_attack") chance -= 0.18;

  chance += ((attacker.intelligence || 0) - 30) * 0.002;
  chance -= (target.internalSecurity || 50) * 0.001;

  return clamp(chance, 0.08, 0.88);
}

function applyEWSuccess(attacker, target, type) {
  if (type === "radar_jamming") {
    target.airDefenseSuppression = boundedDelta(target.airDefenseSuppression || 0, 12, 0, 90);
    target.militaryReadiness = boundedDelta(target.militaryReadiness || 70, -1.0, 0, 100);
    addEvent("📡", `${attacker.name}: jamming radar exitoso contra ${target.name}.`);
  }

  if (type === "gps_spoofing") {
    target.logistics = boundedDelta(target.logistics || 60, -3.5, 0, 100);
    target.militaryReadiness = boundedDelta(target.militaryReadiness || 70, -0.8, 0, 100);
    target.businessConfidence = boundedDelta(target.businessConfidence || 50, -1.0, 0, 100);
    addEvent("🛰️", `${attacker.name}: GPS spoofing degrada logística de ${target.name}.`);
  }

  if (type === "comms_disruption") {
    target.governmentEfficiency = boundedDelta(target.governmentEfficiency || 50, -3, 0, 100);
    target.internalSecurity = boundedDelta(target.internalSecurity || 50, -2, 0, 100);
    target.stability = boundedDelta(target.stability || 60, -0.7, 0, 100);
    addEvent("📶", `${attacker.name}: comunicaciones de ${target.name} interrumpidas.`);
  }

  if (type === "sead_dead") {
    target.airDefenseSuppression = boundedDelta(target.airDefenseSuppression || 0, 22, 0, 95);
    degradeAirDefenseUnits(target, 0.10);
    target.militaryReadiness = boundedDelta(target.militaryReadiness || 70, -2.0, 0, 100);
    addEvent("🎯", `${attacker.name}: operación SEAD/DEAD reduce defensa aérea de ${target.name}.`);
  }

  if (type === "emp_attack") {
    target.energyProduction *= 0.985;
    target.cyber = Math.max(0, target.cyber - 120);
    target.governmentEfficiency = boundedDelta(target.governmentEfficiency || 50, -4, 0, 100);
    target.stability = boundedDelta(target.stability || 60, -1.6, 0, 100);
    target.reputation = boundedDelta(target.reputation || 60, -1.5, 0, 100);
    attacker.reputation = boundedDelta(attacker.reputation || 60, -5, 0, 100);
    NEXUS.state.world.tension = clamp((NEXUS.state.world.tension || 0) + 4.5, 0, 100);
    addEvent("⚡", `${attacker.name}: ataque EMP limitado contra ${target.name}.`);
  }

  attacker.intelligence = boundedDelta(attacker.intelligence || 0, 2, 0, 100);
}

function applyEWFailure(attacker, target, type) {
  const exposed = randomChance(type === "emp_attack" ? 0.65 : 0.38);

  if (exposed) {
    attacker.reputation = boundedDelta(attacker.reputation || 60, -4, 0, 100);
    attacker.sanctions = (attacker.sanctions || 0) + 1;
    target.relation = boundedDelta(target.relation || 50, -7, 0, 100);
    addEvent("🚨", `${attacker.name}: operación EW fallida y atribuida por ${target.name}.`);
  } else {
    addEvent("⚠️", `${attacker.name}: operación EW fallida contra ${target.name}.`);
  }
}

function reduceAirDefenseSuppression(country) {
  country.airDefenseSuppression = Math.max(0, (country.airDefenseSuppression || 0) - 0.18);
}

function simulateElectronicRecovery() {
  for (const country of NEXUS.state.countries || []) {
    reduceAirDefenseSuppression(country);
  }
}

function getElectronicWarfareBreakdown(country) {
  return {
    ewPower: calculateElectronicWarfarePower(country),
    cyber: country.cyber || 0,
    airDefenseSuppression: country.airDefenseSuppression || 0,
    operations: [
      { id: "radar_jamming", name: "Jamming radar", icon: "📡", cost: getEWOperationCost(country, "radar_jamming") },
      { id: "gps_spoofing", name: "GPS spoofing", icon: "🛰️", cost: getEWOperationCost(country, "gps_spoofing") },
      { id: "comms_disruption", name: "Interrumpir comunicaciones", icon: "📶", cost: getEWOperationCost(country, "comms_disruption") },
      { id: "sead_dead", name: "SEAD/DEAD", icon: "🎯", cost: getEWOperationCost(country, "sead_dead") },
      { id: "emp_attack", name: "EMP limitado", icon: "⚡", cost: getEWOperationCost(country, "emp_attack") }
    ]
  };
}

/* =========================================================
   EXPORT GLOBAL — PARTE 4.2.3C COMPACTA
========================================================= */

window.executeElectronicWarfare = executeElectronicWarfare;
window.getEWOperationCost = getEWOperationCost;
window.calculateEWSuccessChance = calculateEWSuccessChance;
window.applyEWSuccess = applyEWSuccess;
window.applyEWFailure = applyEWFailure;
window.reduceAirDefenseSuppression = reduceAirDefenseSuppression;
window.simulateElectronicRecovery = simulateElectronicRecovery;
window.getElectronicWarfareBreakdown = getElectronicWarfareBreakdown;




/* =========================================================
   SIMULATION.JS v3
   Parte 4.2.3D/12 COMPACTA
   Disuasión nuclear, escalada estratégica y crisis nuclear.
========================================================= */

function hasNuclearCapability(country) {
  const nuclearStates = [
    "Estados Unidos", "Rusia", "China", "Francia", "Reino Unido",
    "India", "Pakistán", "Israel", "Corea del Norte"
  ];

  return nuclearStates.includes(country.name) || (country.nuclearWarheads || 0) > 0;
}

function getNuclearWarheads(country) {
  if (country.nuclearWarheads !== undefined) return country.nuclearWarheads;

  const defaults = {
    "Estados Unidos": 3700,
    "Rusia": 4300,
    "China": 500,
    "Francia": 290,
    "Reino Unido": 225,
    "India": 170,
    "Pakistán": 170,
    "Israel": 90,
    "Corea del Norte": 40
  };

  return defaults[country.name] || 0;
}

function calculateNuclearDeterrence(country) {
  const warheads = getNuclearWarheads(country);
  if (warheads <= 0) return 0;

  const delivery =
    calculateAirPower(country) * 0.12 +
    calculateNavalPower(country, "submarine") * 0.35 +
    calculateMissileCapability(country, "ballistic") * 0.40;

  const command =
    (country.cyber || 0) * 0.12 +
    (country.governmentEfficiency || 50) * 18 +
    (country.stability || 60) * 12;

  return Math.round(
    Math.sqrt(warheads) * 900 +
    delivery * 0.08 +
    command
  );
}

function calculateNuclearEscalationRisk(attacker, target, trigger = "crisis") {
  let risk = 0;

  risk += (NEXUS.state.world.tension || 0) * 0.28;
  risk += (attacker.warRisk || 0) * 0.18;
  risk += (target.warRisk || 0) * 0.22;
  risk += Math.max(0, 45 - (target.stability || 60)) * 0.30;
  risk += Math.max(0, 35 - (target.legitimacy || 55)) * 0.20;

  if (hasNuclearCapability(attacker)) risk += 6;
  if (hasNuclearCapability(target)) risk += 10;

  if (trigger === "missile") risk += 8;
  if (trigger === "invasion") risk += 14;
  if (trigger === "capital_threat") risk += 22;
  if (trigger === "nuclear_strike") risk += 65;

  return clamp(risk, 0, 100);
}

function raiseNuclearAlert(country, level = 1) {
  if (!country || !hasNuclearCapability(country)) {
    addEvent("⛔", `${country?.name || "País"} no dispone de disuasión nuclear.`);
    renderAll?.();
    return;
  }

  country.nuclearAlert = clamp((country.nuclearAlert || 0) + level, 0, 5);
  country.militaryReadiness = boundedDelta(country.militaryReadiness || 70, level * 1.5, 0, 100);
  country.stability = boundedDelta(country.stability || 60, -level * 0.5, 0, 100);

  NEXUS.state.world.tension = clamp((NEXUS.state.world.tension || 0) + level * 3.5, 0, 100);

  addEvent("☢️", `${country.name}: eleva alerta nuclear a DEFCON ${6 - country.nuclearAlert}.`);
  renderAll?.();
}

function lowerNuclearAlert(country = getSelectedCountry()) {
  if (!country) return;

  country.nuclearAlert = Math.max(0, (country.nuclearAlert || 0) - 1);
  country.stability = boundedDelta(country.stability || 60, 0.4, 0, 100);
  NEXUS.state.world.tension = clamp((NEXUS.state.world.tension || 0) - 1.8, 0, 100);

  addEvent("🕊️", `${country.name}: reduce alerta nuclear.`);
  renderAll?.();
}

function executeNuclearDeterrence(targetCountryName) {
  const actor = getSelectedCountry();
  const target = getCountryByName(NEXUS.state.countries, targetCountryName);

  if (!actor || !target || actor.name === target.name) return;

  if (!hasNuclearCapability(actor)) {
    addEvent("⛔", `${actor.name}: no dispone de capacidad nuclear.`);
    renderAll();
    return;
  }

  const cost = Math.round(actor.gdp * 0.00035);

  if (actor.treasury < cost) {
    addEvent("⛔", `${actor.name}: fondos insuficientes para demostración estratégica.`);
    renderAll();
    return;
  }

  actor.treasury -= cost;

  const deterrence = calculateNuclearDeterrence(actor);
  const targetDeterrence = calculateNuclearDeterrence(target);
  const effect = clamp((deterrence - targetDeterrence * 0.65) / 5000, -8, 18);

  target.warRisk = boundedDelta(target.warRisk || 0, -effect, 0, 100);
  target.relation = boundedDelta(target.relation || 50, -6, 0, 100);
  actor.reputation = boundedDelta(actor.reputation || 60, -3, 0, 100);

  NEXUS.state.world.tension = clamp((NEXUS.state.world.tension || 0) + 4, 0, 100);

  addEvent("☢️", `${actor.name}: demostración de disuasión nuclear frente a ${target.name}.`);
  renderAll();
}

function executeNuclearStrike(targetCountryName, targetRegionId = null) {
  const attacker = getSelectedCountry();
  const target = getCountryByName(NEXUS.state.countries, targetCountryName);

  if (!attacker || !target || attacker.name === target.name) return;

  if (!hasNuclearCapability(attacker)) {
    addEvent("⛔", `${attacker.name}: no tiene capacidad nuclear.`);
    renderAll();
    return;
  }

  if ((attacker.nuclearAlert || 0) < 4) {
    addEvent("⛔", `${attacker.name}: alerta nuclear insuficiente. Eleva alerta antes.`);
    renderAll();
    return;
  }

  const region = targetRegionId
    ? target.regions?.find(r => r.id === targetRegionId)
    : pickStrategicRegion(target, "capital");

  const retaliationRisk = hasNuclearCapability(target)
    ? clamp(calculateNuclearDeterrence(target) / Math.max(calculateNuclearDeterrence(attacker), 1) * 0.55, 0.15, 0.85)
    : 0.04;

  applyNuclearDamage(attacker, target, region);

  attacker.nuclearWarheads = Math.max(0, getNuclearWarheads(attacker) - 1);
  attacker.reputation = 0;
  attacker.sanctions = (attacker.sanctions || 0) + 50;
  attacker.stability = boundedDelta(attacker.stability || 60, -10, 0, 100);

  NEXUS.state.world.tension = 100;
  NEXUS.state.world.nuclearTabooBroken = true;

  addEvent("☢️", `${attacker.name}: ATAQUE NUCLEAR contra ${target.name}${region ? ` (${region.name})` : ""}.`);

  if (randomChance(retaliationRisk)) {
    applyNuclearRetaliation(target, attacker);
  }

  renderAll();
}

function applyNuclearDamage(attacker, target, region = null) {
  const damage = Math.round(target.gdp * 0.08);

  target.gdp = Math.max(1_000_000_000, target.gdp - damage);
  target.population = Math.max(100000, Math.round(target.population * 0.985));
  target.happiness = boundedDelta(target.happiness || 60, -28, 0, 100);
  target.stability = boundedDelta(target.stability || 60, -35, 0, 100);
  target.militaryReadiness = boundedDelta(target.militaryReadiness || 70, -18, 0, 100);
  target.energyProduction *= 0.92;
  target.foodProduction *= 0.90;
  target.co2 += 250_000_000;
  target.climateRisk = boundedDelta(target.climateRisk || 20, 8, 0, 100);
  target.warRisk = 100;

  if (region) {
    region.gdp = Math.max(0, (region.gdp || 0) * 0.45);
    region.population = Math.max(0, Math.round((region.population || 0) * 0.75));
    region.damageLevel = 10;
    region.contaminated = true;

    for (const item of region.buildings || []) {
      item.damaged = true;
      item.level = Math.max(1, Math.floor((item.level || 1) / 2));
    }
  }

  return damage;
}

function applyNuclearRetaliation(retaliator, target) {
  if (!hasNuclearCapability(retaliator)) return;

  const region = pickStrategicRegion(target, "capital");

  applyNuclearDamage(retaliator, target, region);

  retaliator.nuclearWarheads = Math.max(0, getNuclearWarheads(retaliator) - 1);
  retaliator.reputation = 0;
  retaliator.sanctions = (retaliator.sanctions || 0) + 40;

  addEvent("☢️", `${retaliator.name}: represalia nuclear contra ${target.name}.`);
}

function simulateNuclearCrisis() {
  for (const country of NEXUS.state.countries || []) {
    if (!hasNuclearCapability(country)) continue;

    if ((country.nuclearAlert || 0) > 0) {
      country.nuclearAlert = Math.max(0, (country.nuclearAlert || 0) - 0.002);
      country.fiscalStress = boundedDelta(country.fiscalStress || 0, 0.002, 0, 100);
    }

    if ((NEXUS.state.world.tension || 0) > 85 && (country.warRisk || 0) > 70) {
      if (randomChance(0.00015 * (country.nuclearAlert || 1))) {
        addEvent("☢️", `${country.name}: crisis nuclear al borde de escalada estratégica.`);
        country.stability = boundedDelta(country.stability || 60, -1, 0, 100);
      }
    }
  }
}

function getNuclearBreakdown(country) {
  return {
    hasCapability: hasNuclearCapability(country),
    warheads: getNuclearWarheads(country),
    deterrence: calculateNuclearDeterrence(country),
    alert: country.nuclearAlert || 0,
    defcon: hasNuclearCapability(country) ? 6 - Math.round(country.nuclearAlert || 0) : null,
    tabooBroken: NEXUS.state.world.nuclearTabooBroken || false
  };
}

/* =========================================================
   EXPORT GLOBAL — PARTE 4.2.3D COMPACTA
========================================================= */

window.hasNuclearCapability = hasNuclearCapability;
window.getNuclearWarheads = getNuclearWarheads;
window.calculateNuclearDeterrence = calculateNuclearDeterrence;
window.calculateNuclearEscalationRisk = calculateNuclearEscalationRisk;
window.raiseNuclearAlert = raiseNuclearAlert;
window.lowerNuclearAlert = lowerNuclearAlert;
window.executeNuclearDeterrence = executeNuclearDeterrence;
window.executeNuclearStrike = executeNuclearStrike;
window.applyNuclearDamage = applyNuclearDamage;
window.applyNuclearRetaliation = applyNuclearRetaliation;
window.simulateNuclearCrisis = simulateNuclearCrisis;
window.getNuclearBreakdown = getNuclearBreakdown;



/* =========================================================
   SIMULATION.JS v3
   Parte 4.3/12 COMPACTA
   IA estratégica militar: producción, defensa, ataques,
   escalada, paz y gestión básica de guerra.
========================================================= */

function simulateStrategicMilitaryAI() {
  for (const country of NEXUS.state.countries || []) {
    if (country.name === NEXUS.state.selectedCountry) continue;

    evaluateAIMilitaryPosture(country);
    aiBuildMilitaryCapacity(country);
    aiMilitaryProduction(country);
    aiForeignOperations(country);
    aiWarDecisions(country);
  }
}

function evaluateAIMilitaryPosture(country) {
  const tension = NEXUS.state.world.tension || 0;
  const threat = calculateAIThreatLevel(country);

  country.aiThreat = threat;
  country.aiPosture =
    threat > 75 ? "war" :
    threat > 55 ? "deterrence" :
    tension > 60 ? "alert" :
    "normal";

  if (country.aiPosture === "war") {
    country.defenseSpending *= 1.0008;
    country.militaryReadiness = boundedDelta(country.militaryReadiness || 70, 0.05, 0, 100);
  }
}

function calculateAIThreatLevel(country) {
  const player = getSelectedCountry();
  const playerPower = calculateEffectiveMilitaryPower(player);
  const ownPower = calculateEffectiveMilitaryPower(country);

  const powerGap = clamp((playerPower - ownPower) / Math.max(ownPower, 1) * 35, -20, 45);
  const relationThreat = Math.max(0, 55 - (country.relation || 50)) * 0.65;
  const worldThreat = (NEXUS.state.world.tension || 0) * 0.25;
  const warThreat = (country.warRisk || 0) * 0.35;
  const sanctionThreat = (country.sanctions || 0) * 0.45;

  return clamp(30 + powerGap + relationThreat + worldThreat + warThreat + sanctionThreat, 0, 100);
}

function aiBuildMilitaryCapacity(country) {
  if (!isMonthlyTick()) return;
  if (country.treasury < country.gdp * 0.00025) return;

  const threat = country.aiThreat || 0;
  if (threat < 45 && randomChance(0.75)) return;

  const region = pickStrategicRegion(country, "military");
  if (!region) return;

  const options =
    threat > 70
      ? ["barracks", "airbase", "cyber", "naval"]
      : ["barracks", "cyber", "airbase"];

  const buildingId = options[Math.floor(Math.random() * options.length)];
  const building = findBuildingById(buildingId);
  if (!building) return;

  const existing = region.buildings?.find(b => b.buildingId === buildingId);
  if (existing && existing.level >= 5) return;

  const level = existing ? existing.level + 1 : 1;
  const cost = calculateConstructionCost(country, building, level);

  if (country.treasury < cost) return;

  country.treasury -= cost;
  country.constructionQueue ??= [];

  country.constructionQueue.push({
    id: String(Date.now() + Math.random()),
    buildingId,
    regionId: region.id,
    name: building.name,
    icon: building.icon,
    targetLevel: level,
    remainingDays: Math.max(8, Math.round((building.days || 30) * 0.75)),
    totalDays: Math.max(8, Math.round((building.days || 30) * 0.75)),
    cost,
    ai: true
  });
}

function aiMilitaryProduction(country) {
  if (!isMonthlyTick()) return;

  const threat = country.aiThreat || 0;
  if (threat < 35 && randomChance(0.7)) return;

  const budget = country.treasury * (threat > 70 ? 0.22 : 0.10);
  if (budget < 40_000_000) return;

  const unit = pickAIUnitToProduce(country);
  if (!unit) return;

  const quantity =
    unit.cost > 200_000_000 ? 1 :
    unit.cost > 80_000_000 ? 2 :
    Math.max(2, Math.floor(budget / Math.max(unit.cost, 1)));

  const cost = calculateMilitaryProductionCost(country, unit, quantity);
  if (country.treasury < cost) return;

  country.treasury -= cost;
  country.militaryQueue ??= [];

  country.militaryQueue.push({
    id: String(Date.now() + Math.random()),
    unitId: unit.id,
    name: unit.name,
    icon: unit.icon,
    quantity,
    remainingDays: Math.max(5, Math.round((unit.days || 30) * quantity / Math.max(1, getIndustrialLevel(country)))),
    totalDays: Math.max(5, Math.round((unit.days || 30) * quantity / Math.max(1, getIndustrialLevel(country)))),
    cost,
    ai: true
  });
}

function pickAIUnitToProduce(country) {
  const units = getAvailableMilitaryUnitsForCountry(country);
  if (!units.length) return null;

  const posture = country.aiPosture || "normal";
  const navalNeed = calculateNavalPower(country, "all") < calculateAirPower(country) * 0.5;
  const airNeed = calculateAirPower(country) < country.military * 0.18;
  const missileNeed = calculateMissileDefenseCapability(country) < country.military * 0.05;

  let preferred = units;

  if (posture === "war") {
    preferred = units.filter(u =>
      (u.domain || "").includes("land") ||
      (u.type || "").toLowerCase().includes("tanque") ||
      (u.type || "").toLowerCase().includes("caza")
    );
  }

  if (airNeed) {
    preferred = units.filter(u => (u.domain || "").includes("air"));
  }

  if (navalNeed && randomChance(0.35)) {
    preferred = units.filter(u => (u.domain || "").includes("sea"));
  }

  if (missileNeed && randomChance(0.25)) {
    preferred = units.filter(u =>
      (u.name || "").toLowerCase().includes("patriot") ||
      (u.name || "").toLowerCase().includes("samp") ||
      (u.type || "").toLowerCase().includes("defensa")
    );
  }

  if (!preferred.length) preferred = units;

  return preferred[Math.floor(Math.random() * preferred.length)];
}

function aiForeignOperations(country) {
  if (!isMonthlyTick()) return;
  if ((country.aiThreat || 0) < 60) return;
  if (country.treasury < 120_000_000) return;

  const player = getSelectedCountry();
  if (!player || country.relation > 45) return;

  const choice =
    country.cyber > player.cyber * 0.85 ? "cyber_attack" :
    country.cyber > 900 ? "sabotage" :
    "diplomatic_pressure";

  executeAIOperation(country, player, choice);
}

function executeAIOperation(attacker, target, operationId) {
  const operation = FOREIGN_OPERATIONS.find(op => op.id === operationId);
  if (!operation) return;

  if (attacker.treasury < operation.cost) return;
  attacker.treasury -= operation.cost;

  const success = randomChance(calculateOperationSuccessChance(attacker, target, operation));

  if (success) applySuccessfulOperation(attacker, target, operation);
  else applyFailedOperation(attacker, target, operation);
}

function aiWarDecisions(country) {
  if (!isMonthlyTick()) return;

  const player = getSelectedCountry();
  if (!player || country.name === player.name) return;

  const ownPower = calculateEffectiveMilitaryPower(country);
  const playerPower = calculateEffectiveMilitaryPower(player);
  const ratio = ownPower / Math.max(playerPower, 1);

  const hostility =
    Math.max(0, 45 - (country.relation || 50)) +
    (country.aiThreat || 0) * 0.25 +
    (country.warRisk || 0) * 0.20;

  if (hostility > 65 && ratio > 1.15 && randomChance(0.08)) {
    declareWar(country.name, player.name, "escalada estratégica de la IA");
    return;
  }

  if (hostility > 50 && ratio > 0.85 && randomChance(0.06)) {
    const op = randomChance(0.5) ? "strike" : "interdiction";
    const region = pickStrategicRegion(player, "industry");
    if (calculateAirPower(country) > 6000) {
      const oldSelected = NEXUS.state.selectedCountry;
      NEXUS.state.selectedCountry = country.name;
      launchAirMission(op, player.name, region?.id || null);
      NEXUS.state.selectedCountry = oldSelected;
    }
  }

  aiSeekPeace(country);
}

function aiSeekPeace(country) {
  for (const war of NEXUS.state.activeWars || []) {
    if (war.ended) continue;

    const involved =
      war.participants.attackers.includes(country.name) ||
      war.participants.defenders.includes(country.name);

    if (!involved) continue;

    const exhaustion = country.warExhaustion || 0;
    const lowStability = (country.stability || 60) < 35;
    const badScore =
      war.participants.attackers.includes(country.name)
        ? war.warScore < -35
        : war.warScore > 55;

    if ((exhaustion > 65 || lowStability || badScore) && randomChance(0.12)) {
      endWar(war, "stalemate");
      addEvent("🤝", `${country.name}: acepta alto el fuego por desgaste.`);
    }
  }
}

/* =========================================================
   INTEGRACIÓN EN BUCLE DIARIO
========================================================= */

const OLD_SIMULATE_ONE_DAY_AI_MILITARY = window.simulateOneDay;

function simulateOneDay() {
  if (typeof OLD_SIMULATE_ONE_DAY_AI_MILITARY === "function") {
    OLD_SIMULATE_ONE_DAY_AI_MILITARY();
  }

  simulateWars();
  simulateElectronicRecovery();
  simulateNuclearCrisis();
  simulateStrategicMilitaryAI();
}

/* =========================================================
   EXPORT GLOBAL — PARTE 4.3
========================================================= */

window.simulateStrategicMilitaryAI = simulateStrategicMilitaryAI;
window.evaluateAIMilitaryPosture = evaluateAIMilitaryPosture;
window.calculateAIThreatLevel = calculateAIThreatLevel;
window.aiBuildMilitaryCapacity = aiBuildMilitaryCapacity;
window.aiMilitaryProduction = aiMilitaryProduction;
window.pickAIUnitToProduce = pickAIUnitToProduce;
window.aiForeignOperations = aiForeignOperations;
window.executeAIOperation = executeAIOperation;
window.aiWarDecisions = aiWarDecisions;
window.aiSeekPeace = aiSeekPeace;
window.simulateOneDay = simulateOneDay;

/* =========================================================
   SIMULATION.JS v3
   Parte 4.4/12 COMPACTA
   Bolsa mundial: acciones, compra/venta, control y OPAs.
========================================================= */

function simulateStockMarket() {
  for (const country of NEXUS.state.countries || []) {
    country.companies ??= [];

    for (const company of country.companies) {
      updateCompanyStockPrice(country, company);
    }
  }
}

function updateCompanyStockPrice(country, company) {
  normalizeCompanyHistory(company);

  const stability = (country.stability || 60) / 100;
  const gdpGrowth = ((country.gdp || 1) - (country.previousGDP || country.gdp || 1)) / Math.max(country.previousGDP || country.gdp || 1, 1);
  const confidence = (country.businessConfidence || 50) / 100;
  const sanctions = country.sanctions || 0;
  const war = country.warRisk || 0;

  const sector = (company.sector || "").toLowerCase();

  let sectorBoost = 0;

  if (sector.includes("defensa") && war > 45) sectorBoost += 0.018;
  if (sector.includes("energ") && NEXUS.state.world.energyStress > 45) sectorBoost += 0.010;
  if (sector.includes("tecnolog") || sector.includes("software") || sector.includes("semiconductor")) sectorBoost += country.research / 900000;
  if (sector.includes("automoción") && country.energyBalance < 0) sectorBoost -= 0.006;

  const noise = randomBetween(-0.018, 0.018);

  const dailyReturn =
    gdpGrowth * 18 +
    (stability - 0.60) * 0.012 +
    (confidence - 0.50) * 0.010 +
    sectorBoost -
    sanctions * 0.0008 -
    war * 0.00015 +
    noise;

  company.price = Math.max(0.25, company.price * (1 + dailyReturn));
  company.history.push(Number(company.price.toFixed(2)));
  company.history = company.history.slice(-90);

  company.marketCap = company.price * (company.shares || 100_000_000);
}

function buyShares(companyId, quantity = 100) {
  const buyer = getSelectedCountry();
  const located = findCompanyLocation(companyId);

  if (!buyer || !located) return;

  const { company } = located;
  quantity = Math.max(1, Math.round(Number(quantity) || 1));

  const cost = company.price * quantity;

  if (buyer.treasury < cost) {
    addEvent("⛔", `${buyer.name}: tesorería insuficiente para comprar ${company.name}.`);
    renderAll();
    return;
  }

  buyer.treasury -= cost;
  buyer.portfolio ??= {};

  const position = buyer.portfolio[company.id] || {
    companyId: company.id,
    shares: 0,
    avgPrice: 0
  };

  const newShares = position.shares + quantity;

  position.avgPrice =
    ((position.avgPrice * position.shares) + cost) /
    Math.max(newShares, 1);

  position.shares = newShares;
  buyer.portfolio[company.id] = position;

  updateCompanyOwnership(company);

  addEvent("📈", `${buyer.name}: compra ${quantity} acciones de ${company.name}.`);
  renderAll();
}

function sellShares(companyId, quantity = 100) {
  const seller = getSelectedCountry();
  const located = findCompanyLocation(companyId);

  if (!seller || !located) return;

  const { company } = located;
  const position = seller.portfolio?.[company.id];

  if (!position || position.shares <= 0) {
    addEvent("⚠️", `${seller.name}: no posee acciones de ${company.name}.`);
    renderAll();
    return;
  }

  quantity = Math.min(position.shares, Math.max(1, Math.round(Number(quantity) || 1)));

  const revenue = company.price * quantity;

  seller.treasury += revenue;
  position.shares -= quantity;

  if (position.shares <= 0) {
    delete seller.portfolio[company.id];
  }

  updateCompanyOwnership(company);

  addEvent("📉", `${seller.name}: vende ${quantity} acciones de ${company.name}.`);
  renderAll();
}

function launchTakeover(companyId, premiumPercent = 25) {
  const buyer = getSelectedCountry();
  const located = findCompanyLocation(companyId);

  if (!buyer || !located) return;

  const { country: targetCountry, company } = located;

  if (targetCountry.name === buyer.name) {
    addEvent("⚠️", "OPA innecesaria: la empresa ya pertenece a tu país.");
    renderAll();
    return;
  }

  premiumPercent = clamp(Number(premiumPercent) || 25, 5, 120);

  const freeFloat = 0.60;
  const neededShares = Math.ceil((company.shares || 100_000_000) * 0.51);
  const offerPrice = company.price * (1 + premiumPercent / 100);
  const cost = neededShares * offerPrice * freeFloat;

  if (buyer.treasury < cost) {
    addEvent("⛔", `${buyer.name}: fondos insuficientes para OPA sobre ${company.name}. Coste: ${formatMoney(cost)}.`);
    renderAll();
    return;
  }

  const successChance = calculateTakeoverSuccessChance(buyer, targetCountry, company, premiumPercent);
  const success = randomChance(successChance);

  buyer.treasury -= cost;

  if (success) {
    buyer.portfolio ??= {};
    buyer.portfolio[company.id] = {
      companyId: company.id,
      shares: neededShares,
      avgPrice: offerPrice,
      controlled: true
    };

    company.controlled = true;
    company.controller = buyer.name;
    company.hostileTakeover = true;

    targetCountry.relation = boundedDelta(targetCountry.relation || 50, -12, 0, 100);
    buyer.reputation = boundedDelta(buyer.reputation || 60, -2, 0, 100);

    addEvent("🏦", `${buyer.name}: OPA exitosa sobre ${company.name} (${targetCountry.name}). Control adquirido.`);
  } else {
    buyer.reputation = boundedDelta(buyer.reputation || 60, -1, 0, 100);
    targetCountry.relation = boundedDelta(targetCountry.relation || 50, -5, 0, 100);
    company.price *= 1.08;

    addEvent("❌", `${buyer.name}: OPA fallida sobre ${company.name}. El mercado encarece la acción.`);
  }

  renderAll();
}

function calculateTakeoverSuccessChance(buyer, targetCountry, company, premiumPercent) {
  const premium = premiumPercent / 100;
  const relationPenalty = Math.max(0, 55 - (targetCountry.relation || 50)) * 0.004;
  const targetStabilityPenalty = (targetCountry.stability || 60) > 70 ? 0.08 : 0;
  const sanctionsBonus = (targetCountry.sanctions || 0) * 0.008;
  const buyerReputation = (buyer.reputation || 60) * 0.002;

  let chance =
    0.28 +
    premium * 0.85 +
    sanctionsBonus +
    buyerReputation -
    relationPenalty -
    targetStabilityPenalty;

  if (company.controlled) chance -= 0.22;
  if ((company.sector || "").toLowerCase().includes("defensa")) chance -= 0.18;
  if ((company.sector || "").toLowerCase().includes("energ")) chance -= 0.10;

  return clamp(chance, 0.05, 0.88);
}

function updateCompanyOwnership(company) {
  const countries = NEXUS.state.countries || [];

  let controller = null;
  let maxPct = 0;

  for (const country of countries) {
    const pos = country.portfolio?.[company.id];
    if (!pos) continue;

    const pct = pos.shares / Math.max(company.shares || 100_000_000, 1);

    if (pct > maxPct) {
      maxPct = pct;
      controller = country;
    }
  }

  if (controller && maxPct >= 0.51) {
    company.controlled = true;
    company.controller = controller.name;
  } else {
    company.controlled = false;
    company.controller = null;
  }
}

function findCompanyLocation(companyId) {
  for (const country of NEXUS.state.countries || []) {
    for (const company of country.companies || []) {
      if (company.id === companyId) {
        return { country, company };
      }
    }
  }

  return null;
}

function getAllTradableCompanies() {
  return getAllCompanies(NEXUS.state.countries || [])
    .map(company => {
      const located = findCompanyLocation(company.id);
      return {
        ...company,
        country: located?.country?.name || company.country,
        marketCap: company.price * (company.shares || 100_000_000),
        controlledBy: company.controller || null
      };
    })
    .sort((a, b) => b.marketCap - a.marketCap);
}

function getPortfolioValue(country = getSelectedCountry()) {
  if (!country) return 0;

  let value = 0;

  for (const [companyId, position] of Object.entries(country.portfolio || {})) {
    const located = findCompanyLocation(companyId);
    if (!located) continue;

    value += located.company.price * position.shares;
  }

  return value;
}

function getPortfolioBreakdown(country = getSelectedCountry()) {
  if (!country) return [];

  return Object.entries(country.portfolio || {}).map(([companyId, position]) => {
    const located = findCompanyLocation(companyId);
    if (!located) return null;

    const value = located.company.price * position.shares;
    const pnl = value - position.avgPrice * position.shares;

    return {
      companyId,
      name: located.company.name,
      country: located.country.name,
      sector: located.company.sector,
      shares: position.shares,
      price: located.company.price,
      value,
      pnl,
      controlled: located.company.controller === country.name
    };
  }).filter(Boolean);
}

function createNationalCompany(name, sector, initialPrice = 25) {
  const country = getSelectedCountry();
  if (!country || !name) return;

  const cost = Math.round(country.gdp * 0.0006);

  if (country.treasury < cost) {
    addEvent("⛔", `${country.name}: fondos insuficientes para crear empresa.`);
    renderAll();
    return;
  }

  country.treasury -= cost;

  const company = createCompanyTemplate(name, country.name, sector || "Industria", initialPrice);
  company.stateOwned = false;
  company.shares = 100_000_000;
  company.price = Number(initialPrice) || 25;
  company.history = [company.price];

  country.companies.push(company);

  addEvent("🏢", `${country.name}: nueva empresa creada — ${company.name} (${company.sector}).`);
  renderAll();
}

function getStockMarketBreakdown(country = getSelectedCountry()) {
  return {
    portfolioValue: getPortfolioValue(country),
    portfolio: getPortfolioBreakdown(country),
    companies: getAllTradableCompanies(),
    nationalCompanies: country?.companies || []
  };
}

/* =========================================================
   INTEGRACIÓN EN BUCLE DIARIO
========================================================= */

const OLD_SIMULATE_ONE_DAY_STOCKS = window.simulateOneDay;

function simulateOneDay() {
  if (typeof OLD_SIMULATE_ONE_DAY_STOCKS === "function") {
    OLD_SIMULATE_ONE_DAY_STOCKS();
  }

  simulateStockMarket();
}

/* =========================================================
   EXPORT GLOBAL — PARTE 4.4
========================================================= */

window.simulateStockMarket = simulateStockMarket;
window.updateCompanyStockPrice = updateCompanyStockPrice;
window.buyShares = buyShares;
window.sellShares = sellShares;
window.launchTakeover = launchTakeover;
window.calculateTakeoverSuccessChance = calculateTakeoverSuccessChance;
window.updateCompanyOwnership = updateCompanyOwnership;
window.findCompanyLocation = findCompanyLocation;
window.getAllTradableCompanies = getAllTradableCompanies;
window.getPortfolioValue = getPortfolioValue;
window.getPortfolioBreakdown = getPortfolioBreakdown;
window.createNationalCompany = createNationalCompany;
window.getStockMarketBreakdown = getStockMarketBreakdown;
window.simulateOneDay = simulateOneDay;



/* =========================================================
   SIMULATION.JS v3
   Parte 4.5/12 COMPACTA
   Diplomacia: relaciones, tratados, sanciones, alianzas y ayudas.
========================================================= */

function simulateDiplomacy() {
  for (const country of NEXUS.state.countries || []) {
    updateDiplomaticRelations(country);
    updateSanctionsEffects(country);
    aiDiplomaticActions(country);
  }
}

function updateDiplomaticRelations(country) {
  if (country.name === NEXUS.state.selectedCountry) return;

  const player = getSelectedCountry();
  if (!player) return;

  let delta = 0;

  delta += ((player.reputation || 60) - 60) * 0.0008;
  delta -= (player.sanctions || 0) * 0.002;
  delta -= (NEXUS.state.world.tension || 0) * 0.0005;

  if (countryBelongsToBloc(country.name, "eu") && countryBelongsToBloc(player.name, "eu")) delta += 0.015;
  if (countryBelongsToBloc(country.name, "nato") && countryBelongsToBloc(player.name, "nato")) delta += 0.012;
  if (country.regime !== player.regime) delta -= 0.006;
  if (country.ideology !== player.ideology) delta -= 0.004;

  country.relation = boundedDelta(country.relation || 50, delta, 0, 100);
}

function updateSanctionsEffects(country) {
  const sanctions = country.sanctions || 0;
  if (sanctions <= 0) return;

  country.gdp *= 1 - sanctions * 0.000002;
  country.imports *= 1 - sanctions * 0.000006;
  country.exports *= 1 - sanctions * 0.000006;
  country.businessConfidence = boundedDelta(country.businessConfidence || 50, -sanctions * 0.002, 0, 100);
  country.stability = boundedDelta(country.stability || 60, -sanctions * 0.0012, 0, 100);
}

function imposeSanctions(targetCountryName, intensity = 1) {
  const actor = getSelectedCountry();
  const target = getCountryByName(NEXUS.state.countries, targetCountryName);

  if (!actor || !target || actor.name === target.name) return;

  intensity = clamp(Number(intensity) || 1, 1, 10);

  const diplomaticCost = intensity * 1.2;

  actor.reputation = boundedDelta(actor.reputation || 60, -diplomaticCost * 0.25, 0, 100);
  target.sanctions = (target.sanctions || 0) + intensity;
  target.relation = boundedDelta(target.relation || 50, -intensity * 3, 0, 100);
  target.businessConfidence = boundedDelta(target.businessConfidence || 50, -intensity * 0.8, 0, 100);

  NEXUS.state.world.tension = clamp((NEXUS.state.world.tension || 0) + intensity * 0.5, 0, 100);

  addEvent("⛔", `${actor.name}: impone sanciones a ${target.name} intensidad ${intensity}.`);
  renderAll();
}

function liftSanctions(targetCountryName, amount = 1) {
  const actor = getSelectedCountry();
  const target = getCountryByName(NEXUS.state.countries, targetCountryName);

  if (!actor || !target) return;

  amount = clamp(Number(amount) || 1, 1, 10);

  target.sanctions = Math.max(0, (target.sanctions || 0) - amount);
  target.relation = boundedDelta(target.relation || 50, amount * 2, 0, 100);
  actor.reputation = boundedDelta(actor.reputation || 60, 0.5, 0, 100);

  addEvent("🕊️", `${actor.name}: reduce sanciones sobre ${target.name}.`);
  renderAll();
}

function signTreaty(targetCountryName, treatyType = "trade") {
  const actor = getSelectedCountry();
  const target = getCountryByName(NEXUS.state.countries, targetCountryName);

  if (!actor || !target || actor.name === target.name) return;

  const cost = getTreatyCost(actor, target, treatyType);

  if (actor.treasury < cost) {
    addEvent("⛔", `${actor.name}: fondos insuficientes para firmar tratado.`);
    renderAll();
    return;
  }

  const chance = calculateTreatyAcceptance(actor, target, treatyType);

  actor.treasury -= cost;

  if (!randomChance(chance)) {
    target.relation = boundedDelta(target.relation || 50, -1.5, 0, 100);
    addEvent("❌", `${target.name}: rechaza tratado ${getTreatyName(treatyType)} con ${actor.name}.`);
    renderAll();
    return;
  }

  actor.treaties ??= [];
  target.treaties ??= [];

  const treaty = {
    id: String(Date.now() + Math.random()),
    type: treatyType,
    partner: target.name,
    startYear: getSimulationYear()
  };

  actor.treaties.push(treaty);
  target.treaties.push({
    ...treaty,
    partner: actor.name
  });

  applyTreatyEffects(actor, target, treatyType);

  addEvent("📜", `${actor.name} y ${target.name}: tratado ${getTreatyName(treatyType)} firmado.`);
  renderAll();
}

function getTreatyCost(actor, target, treatyType) {
  const base = {
    trade: 40_000_000,
    defense: 110_000_000,
    climate: 65_000_000,
    research: 90_000_000,
    migration: 35_000_000
  }[treatyType] || 50_000_000;

  return Math.round(base * (1 + (actor.inflation || 0.02)));
}

function calculateTreatyAcceptance(actor, target, treatyType) {
  let chance = 0.35 + ((target.relation || 50) - 50) * 0.006;

  if (treatyType === "trade") chance += 0.12;
  if (treatyType === "defense" && countryBelongsToBloc(actor.name, "nato") === countryBelongsToBloc(target.name, "nato")) chance += 0.18;
  if (treatyType === "climate" && target.ideology === "green") chance += 0.18;
  if (treatyType === "research" && (target.research || 0) > 1000) chance += 0.10;
  if (actor.regime !== target.regime) chance -= 0.08;
  if ((target.sanctions || 0) > 10) chance -= 0.16;

  return clamp(chance, 0.05, 0.90);
}

function applyTreatyEffects(actor, target, treatyType) {
  if (treatyType === "trade") {
    actor.exports *= 1.012;
    target.exports *= 1.012;
    actor.relation = boundedDelta(actor.relation || 50, 2, 0, 100);
    target.relation = boundedDelta(target.relation || 50, 2, 0, 100);
  }

  if (treatyType === "defense") {
    actor.warRisk = boundedDelta(actor.warRisk || 0, -3, 0, 100);
    target.warRisk = boundedDelta(target.warRisk || 0, -3, 0, 100);
    actor.militaryReadiness = boundedDelta(actor.militaryReadiness || 70, 1, 0, 100);
    target.militaryReadiness = boundedDelta(target.militaryReadiness || 70, 1, 0, 100);
  }

  if (treatyType === "climate") {
    actor.co2 *= 0.998;
    target.co2 *= 0.998;
    actor.reputation = boundedDelta(actor.reputation || 60, 2, 0, 100);
    target.reputation = boundedDelta(target.reputation || 60, 2, 0, 100);
  }

  if (treatyType === "research") {
    actor.research += 60;
    target.research += 60;
  }

  if (treatyType === "migration") {
    actor.happiness = boundedDelta(actor.happiness || 60, 0.8, 0, 100);
    target.happiness = boundedDelta(target.happiness || 60, 0.8, 0, 100);
  }
}

function breakTreaty(targetCountryName, treatyType = null) {
  const actor = getSelectedCountry();
  const target = getCountryByName(NEXUS.state.countries, targetCountryName);

  if (!actor || !target) return;

  actor.treaties = (actor.treaties || []).filter(t =>
    !(t.partner === target.name && (!treatyType || t.type === treatyType))
  );

  target.treaties = (target.treaties || []).filter(t =>
    !(t.partner === actor.name && (!treatyType || t.type === treatyType))
  );

  actor.reputation = boundedDelta(actor.reputation || 60, -4, 0, 100);
  target.relation = boundedDelta(target.relation || 50, -10, 0, 100);

  NEXUS.state.world.tension = clamp((NEXUS.state.world.tension || 0) + 2, 0, 100);

  addEvent("🚪", `${actor.name}: rompe tratado con ${target.name}.`);
  renderAll();
}

function sendForeignAid(targetCountryName, amount = 100_000_000) {
  const actor = getSelectedCountry();
  const target = getCountryByName(NEXUS.state.countries, targetCountryName);

  if (!actor || !target || actor.name === target.name) return;

  amount = Math.max(1_000_000, Number(amount) || 100_000_000);

  if (actor.treasury < amount) {
    addEvent("⛔", `${actor.name}: fondos insuficientes para ayuda exterior.`);
    renderAll();
    return;
  }

  actor.treasury -= amount;
  target.treasury += amount;

  target.relation = boundedDelta(target.relation || 50, 6, 0, 100);
  actor.reputation = boundedDelta(actor.reputation || 60, 1.5, 0, 100);
  target.stability = boundedDelta(target.stability || 60, 0.8, 0, 100);

  addEvent("💶", `${actor.name}: envía ayuda de ${formatMoney(amount)} a ${target.name}.`);
  renderAll();
}

function aiDiplomaticActions(country) {
  if (country.name === NEXUS.state.selectedCountry) return;
  if (!isMonthlyTick()) return;

  const player = getSelectedCountry();
  if (!player) return;

  if ((country.relation || 50) < 28 && randomChance(0.08)) {
    player.sanctions = (player.sanctions || 0) + 1;
    addEvent("⛔", `${country.name}: impulsa sanciones contra ${player.name}.`);
  }

  if ((country.relation || 50) > 72 && randomChance(0.04)) {
    country.exports *= 1.003;
    player.exports *= 1.003;
    addEvent("🤝", `${country.name}: mejora comercio con ${player.name}.`);
  }

  if ((country.warRisk || 0) > 65 && randomChance(0.05)) {
    country.relation = boundedDelta(country.relation || 50, -3, 0, 100);
  }
}

function getTreatyName(type) {
  return {
    trade: "comercial",
    defense: "de defensa",
    climate: "climático",
    research: "de investigación",
    migration: "migratorio"
  }[type] || type;
}

function getDiplomacyBreakdown(country = getSelectedCountry()) {
  return {
    relation: country?.relation || 0,
    reputation: country?.reputation || 0,
    sanctions: country?.sanctions || 0,
    treaties: country?.treaties || [],
    blocs: country ? getCountryBlocNames(country.name) : [],
    worldTension: NEXUS.state.world.tension || 0
  };
}

/* =========================================================
   INTEGRACIÓN EN BUCLE DIARIO
========================================================= */

const OLD_SIMULATE_ONE_DAY_DIPLOMACY = window.simulateOneDay;

function simulateOneDay() {
  if (typeof OLD_SIMULATE_ONE_DAY_DIPLOMACY === "function") {
    OLD_SIMULATE_ONE_DAY_DIPLOMACY();
  }

  simulateDiplomacy();
}

/* =========================================================
   EXPORT GLOBAL — PARTE 4.5
========================================================= */

window.simulateDiplomacy = simulateDiplomacy;
window.updateDiplomaticRelations = updateDiplomaticRelations;
window.updateSanctionsEffects = updateSanctionsEffects;
window.imposeSanctions = imposeSanctions;
window.liftSanctions = liftSanctions;
window.signTreaty = signTreaty;
window.getTreatyCost = getTreatyCost;
window.calculateTreatyAcceptance = calculateTreatyAcceptance;
window.applyTreatyEffects = applyTreatyEffects;
window.breakTreaty = breakTreaty;
window.sendForeignAid = sendForeignAid;
window.aiDiplomaticActions = aiDiplomaticActions;
window.getTreatyName = getTreatyName;
window.getDiplomacyBreakdown = getDiplomacyBreakdown;
window.simulateOneDay = simulateOneDay;



/* =========================================================
   SIMULATION.JS v3
   Parte 4.6/12 COMPACTA
   Espionaje e Inteligencia
========================================================= */

function executeSpyMission(targetCountryName, missionType) {

    const attacker = getSelectedCountry();
    const target = getCountryByName(
        NEXUS.state.countries,
        targetCountryName
    );

    if (!attacker || !target) return;
    if (attacker.name === target.name) return;

    const cost = getSpyMissionCost(missionType);

    if (attacker.treasury < cost) {

        addEvent(
            "⛔",
            `${attacker.name}: fondos insuficientes para operación de inteligencia.`
        );

        renderAll();
        return;

    }

    attacker.treasury -= cost;

    const success =
        randomChance(
            calculateSpySuccess(attacker, target, missionType)
        );

    if (success)
        applySpySuccess(attacker, target, missionType);
    else
        applySpyFailure(attacker, target, missionType);

    renderAll();

}

/* ========================================================= */

function getSpyMissionCost(type){

    return{

        steal_money:40000000,

        steal_technology:90000000,

        sabotage:80000000,

        military_intelligence:30000000,

        industrial_spy:60000000,

        election_interference:120000000,

        coup:250000000

    }[type] || 50000000;

}

/* ========================================================= */

function calculateSpySuccess(attacker,target,type){

    const atk =
        (attacker.cyber||0)+
        (attacker.intelligence||0)*12+
        (attacker.research||0)*0.25;

    const def =
        (target.cyber||0)+
        (target.internalSecurity||50)*18;

    let chance =
        0.45+
        Math.log(
            Math.max(0.25,atk/Math.max(def,1))
        )*0.18;

    if(type==="military_intelligence") chance+=0.12;
    if(type==="steal_money") chance+=0.05;
    if(type==="coup") chance-=0.20;

    chance-=
        Math.max(
            0,
            target.stability-70
        )*0.003;

    return clamp(chance,0.05,0.90);

}

/* ========================================================= */

function applySpySuccess(attacker,target,type){

    switch(type){

        case"steal_money":

            const money=
                Math.min(
                    target.treasury*0.005,
                    200000000
                );

            target.treasury-=money;
            attacker.treasury+=money;

            addEvent(
                "💰",
                `${attacker.name} roba ${formatMoney(money)} a ${target.name}.`
            );

            break;

        case"steal_technology":

            stealRandomTechnology(
                attacker,
                target
            );

            addEvent(
                "🧬",
                `${attacker.name} roba tecnología a ${target.name}.`
            );

            break;

        case"sabotage":

            damageRandomTargetInfrastructure(target);

            target.gdp*=0.998;

            addEvent(
                "🏭",
                `${attacker.name} sabotea infraestructuras de ${target.name}.`
            );

            break;

        case"military_intelligence":

            attacker.intelligence=
                boundedDelta(
                    attacker.intelligence||0,
                    10,
                    0,
                    100
                );

            target.revealedMilitary=true;

            addEvent(
                "🛰️",
                `${attacker.name} obtiene información militar de ${target.name}.`
            );

            break;

        case"industrial_spy":

            target.businessConfidence=
                boundedDelta(
                    target.businessConfidence||50,
                    -2,
                    0,
                    100
                );

            attacker.research+=30;

            addEvent(
                "🏢",
                `${attacker.name} roba secretos industriales de ${target.name}.`
            );

            break;

        case"election_interference":

            target.stability=
                boundedDelta(
                    target.stability||60,
                    -4,
                    0,
                    100
                );

            target.legitimacy=
                boundedDelta(
                    target.legitimacy||60,
                    -6,
                    0,
                    100
                );

            addEvent(
                "🗳️",
                `${attacker.name} interfiere en las elecciones de ${target.name}.`
            );

            break;

        case"coup":

            if((target.stability||60)<35){

                target.regime=
                    randomChoice([
                        "Democracia",
                        "Autoritario",
                        "Militar"
                    ]);

                target.stability=55;

                addEvent(
                    "⚔️",
                    `Golpe de Estado exitoso en ${target.name}.`
                );

            }else{

                addEvent(
                    "⚠️",
                    `${target.name} resiste el intento de golpe.`
                );

            }

            break;

    }

}

/* ========================================================= */

function applySpyFailure(attacker,target,type){

    attacker.reputation=
        boundedDelta(
            attacker.reputation||60,
            -2,
            0,
            100
        );

    target.relation=
        boundedDelta(
            target.relation||50,
            -8,
            0,
            100
        );

    if(randomChance(0.45)){

        attacker.sanctions=
            (attacker.sanctions||0)+1;

        addEvent(
            "🚨",
            `${attacker.name} es descubierto espiando a ${target.name}.`
        );

    }else{

        addEvent(
            "👤",
            `Operación de espionaje fallida en ${target.name}.`
        );

    }

}

/* ========================================================= */

function stealRandomTechnology(attacker,target){

    const techs=
        target.completedTechnologies||[];

    if(!techs.length) return;

    const tech=
        techs[
            Math.floor(
                Math.random()*techs.length
            )
        ];

    attacker.completedTechnologies ??=[];

    if(!attacker.completedTechnologies.includes(tech))
        attacker.completedTechnologies.push(tech);

}

/* ========================================================= */

function revealMilitary(country){

    return{

        militaryPower:
            calculateEffectiveMilitaryPower(country),

        airPower:
            calculateAirPower(country),

        navalPower:
            calculateNavalPower(country),

        missileCapability:
            calculateMissileCapability(country),

        nuclear:
            hasNuclearCapability(country),

        readiness:
            country.militaryReadiness,

        units:
            structuredClone(country.units)

    };

}

/* ========================================================= */

function getSpyBreakdown(country=getSelectedCountry()){

    return{

        intelligence:
            country.intelligence||0,

        cyber:
            country.cyber||0,

        operations:[

            "steal_money",

            "steal_technology",

            "sabotage",

            "military_intelligence",

            "industrial_spy",

            "election_interference",

            "coup"

        ]

    };

}

/* =========================================================
   INTEGRACIÓN DIARIA
========================================================= */

const OLD_SIMULATE_ONE_DAY_SPY =
window.simulateOneDay;

function simulateOneDay(){

    if(typeof OLD_SIMULATE_ONE_DAY_SPY==="function")
        OLD_SIMULATE_ONE_DAY_SPY();

    for(const c of NEXUS.state.countries){

        if(randomChance(0.0006))
            c.internalSecurity=
                boundedDelta(
                    c.internalSecurity||50,
                    0.08,
                    0,
                    100
                );

    }

}

/* =========================================================
   EXPORT GLOBAL
========================================================= */

window.executeSpyMission=executeSpyMission;
window.calculateSpySuccess=calculateSpySuccess;
window.getSpyMissionCost=getSpyMissionCost;
window.applySpySuccess=applySpySuccess;
window.applySpyFailure=applySpyFailure;
window.stealRandomTechnology=stealRandomTechnology;
window.revealMilitary=revealMilitary;
window.getSpyBreakdown=getSpyBreakdown;
window.simulateOneDay=simulateOneDay;



/* =========================================================
   SIMULATION.JS v3
   Parte 4.7/12 COMPACTA
   Eventos globales, crisis, clima, materias primas y shocks.
========================================================= */

function simulateGlobalEvents() {
  updateGlobalResourcePrices();
  updateGlobalStressIndexes();
  rollGlobalRandomEvents();
  applyClimateDamage();
}

function updateGlobalResourcePrices() {
  if (!NEXUS.state.resources) return;

  for (const resource of NEXUS.state.resources) {
    const def = STRATEGIC_RESOURCES.find(r => r.id === resource.id);
    if (!def) continue;

    resource.lastPrice = resource.price;

    const tension = (NEXUS.state.world.tension || 0) / 100;
    const inflation = (NEXUS.state.world.inflation || 2.7) / 100;
    const shock = resource.shock || 0;
    const noise = randomBetween(-def.volatility, def.volatility);

    resource.price = Math.max(
      def.basePrice * 0.35,
      resource.price * (1 + noise + tension * 0.004 + inflation * 0.002 + shock)
    );

    resource.shock *= 0.92;
    resource.trend = resource.price - resource.lastPrice;
  }
}

function updateGlobalStressIndexes() {
  const countries = NEXUS.state.countries || [];
  const totals = getWorldTotals(countries);

  const foodDeficit = Math.max(0, totals.foodConsumption - totals.foodProduction);
  const energyDeficit = Math.max(0, totals.energyDemand - totals.energyProduction);

  NEXUS.state.world.foodStress = clamp(
    foodDeficit / Math.max(totals.foodConsumption, 1) * 100 +
    (NEXUS.state.world.temperatureDelta || 1.28) * 3,
    0,
    100
  );

  NEXUS.state.world.energyStress = clamp(
    energyDeficit / Math.max(totals.energyDemand, 1) * 100 +
    (NEXUS.state.world.tension || 0) * 0.12,
    0,
    100
  );

  NEXUS.state.world.inflation = clamp(
    2.0 +
    NEXUS.state.world.energyStress * 0.035 +
    NEXUS.state.world.foodStress * 0.025 +
    NEXUS.state.world.tension * 0.012,
    0,
    25
  );

  NEXUS.state.world.tension = clamp(
    (NEXUS.state.world.tension || 0) - SIMULATION_CONFIG.worldTensionDecayDaily,
    0,
    100
  );
}

function rollGlobalRandomEvents() {
  for (const event of GLOBAL_EVENTS || []) {
    if (getSimulationYear() < event.minYear) continue;

    const probability =
      event.probability *
      (1 + (NEXUS.state.world.tension || 0) / 120) *
      (1 + (NEXUS.state.world.foodStress || 0) / 180);

    if (randomChance(probability)) {
      triggerGlobalEvent(event);
    }
  }
}

function triggerGlobalEvent(event) {
  NEXUS.state.events ??= [];

  NEXUS.state.events.push({
    id: event.id,
    name: event.name,
    icon: event.icon,
    year: getSimulationYear(),
    day: getDayOfYear(),
    message: event.message
  });

  if (NEXUS.state.events.length > 120) {
    NEXUS.state.events.shift();
  }

  applyGlobalEventEffects(event);

  addEvent(event.icon || "🌐", event.message || event.name);
}

function applyGlobalEventEffects(event) {
  const effects = event.effects || {};

  if (effects.resource && effects.priceShock) {
    const resource = NEXUS.state.resources.find(r => r.id === effects.resource);
    if (resource) resource.shock += effects.priceShock;
  }

  if (effects.globalStability) {
    for (const country of NEXUS.state.countries || []) {
      country.stability = boundedDelta(country.stability || 60, effects.globalStability, 0, 100);
    }
  }

  if (effects.inflation) {
    NEXUS.state.world.inflation = clamp(
      (NEXUS.state.world.inflation || 2.7) + effects.inflation,
      0,
      25
    );
  }

  if (effects.energyCostMultiplier) {
    for (const country of NEXUS.state.countries || []) {
      country.imports *= effects.energyCostMultiplier;
      country.inflation = (country.inflation || SIMULATION_CONFIG.baseInflation) + 0.002;
    }
  }

  if (effects.happiness) {
    for (const country of NEXUS.state.countries || []) {
      country.happiness = boundedDelta(country.happiness || 60, effects.happiness, 0, 100);
    }
  }

  if (effects.climateRisk) {
    for (const country of NEXUS.state.countries || []) {
      country.climateRisk = boundedDelta(country.climateRisk || 20, effects.climateRisk, 0, 100);
    }
  }

  if (effects.financialShock) {
    for (const country of NEXUS.state.countries || []) {
      for (const company of country.companies || []) {
        company.price = Math.max(0.25, company.price * (1 + effects.financialShock));
        normalizeCompanyHistory(company);
        company.history.push(Number(company.price.toFixed(2)));
      }
    }
  }

  if (effects.gdp) {
    for (const country of NEXUS.state.countries || []) {
      country.gdp *= 1 + effects.gdp;
    }
  }

  if (effects.research) {
    for (const country of NEXUS.state.countries || []) {
      country.research *= 1 + effects.research;
    }
  }

  NEXUS.state.world.tension = clamp(
    (NEXUS.state.world.tension || 0) + 1.2,
    0,
    100
  );
}

function simulateGlobalClimate() {
  const totalCO2 = (NEXUS.state.countries || []).reduce((s, c) => s + (c.co2 || 0), 0);

  NEXUS.state.world.co2ppm += totalCO2 * SIMULATION_CONFIG.co2PpmSensitivity;
  NEXUS.state.world.temperatureDelta += totalCO2 * SIMULATION_CONFIG.climateTemperatureSensitivity;

  NEXUS.state.world.temperatureDelta = clamp(
    NEXUS.state.world.temperatureDelta,
    1.0,
    6.5
  );

  for (const country of NEXUS.state.countries || []) {
    country.climateRisk = clamp(
      (country.climateRisk || 20) +
      (NEXUS.state.world.temperatureDelta - 1.2) * 0.002 +
      (country.co2 / Math.max(country.population, 1)) * 0.000002,
      0,
      100
    );
  }
}

function applyClimateDamage() {
  for (const country of NEXUS.state.countries || []) {
    const risk = country.climateRisk || 0;

    if (randomChance(risk * 0.000035)) {
      triggerClimateDisaster(country);
    }
  }
}

function triggerClimateDisaster(country) {
  const region = pickClimateDisasterRegion(country);
  if (!region) return;

  const types = ["sequía", "inundación", "ola de calor", "tormenta extrema", "incendios"];
  const type = types[Math.floor(Math.random() * types.length)];

  const severity = clamp(
    randomBetween(0.5, 2.2) * ((country.climateRisk || 20) / 40),
    0.4,
    4.5
  );

  const gdpDamage = country.gdp * severity * 0.00025;

  country.gdp = Math.max(1_000_000_000, country.gdp - gdpDamage);
  country.treasury = Math.max(0, country.treasury - gdpDamage * 0.12);
  country.foodProduction *= 1 - severity * 0.004;
  country.energyProduction *= 1 - severity * 0.002;
  country.happiness = boundedDelta(country.happiness || 60, -severity * 0.8, 0, 100);
  country.stability = boundedDelta(country.stability || 60, -severity * 0.35, 0, 100);

  region.damageLevel = clamp((region.damageLevel || 0) + severity, 0, 10);
  region.gdp = Math.max(0, (region.gdp || 0) - gdpDamage * 0.18);

  addEvent("🌪️", `${country.name}: ${type} en ${region.name}. Daños: ${formatMoney(gdpDamage)}.`);
}

function pickClimateDisasterRegion(country) {
  const regions = country.regions || [];
  if (!regions.length) return null;

  return [...regions].sort((a, b) => {
    const scoreA = scoreClimateExposure(a);
    const scoreB = scoreClimateExposure(b);
    return scoreB - scoreA;
  })[0];
}

function scoreClimateExposure(region) {
  let score = 10;

  if (region.type === "port") score += 25;
  if (region.type === "naval") score += 18;
  if (region.type === "agriculture") score += 22;
  if (region.type === "energy") score += 12;
  if (region.type === "capital") score += 8;

  score += (region.population || 0) / 500000;
  score += (region.damageLevel || 0) * 3;

  return score;
}

function getResourceMarketBreakdown() {
  return (NEXUS.state.resources || []).map(r => {
    const def = STRATEGIC_RESOURCES.find(d => d.id === r.id);

    return {
      id: r.id,
      name: def?.name || r.id,
      icon: def?.icon || "📦",
      price: r.price,
      lastPrice: r.lastPrice,
      trend: r.trend || 0,
      unit: def?.unit || ""
    };
  });
}

function getGlobalEventsBreakdown() {
  return {
    world: NEXUS.state.world,
    resources: getResourceMarketBreakdown(),
    recentEvents: [...(NEXUS.state.events || [])].slice(-20).reverse()
  };
}

/* =========================================================
   INTEGRACIÓN EN BUCLE DIARIO
========================================================= */

const OLD_SIMULATE_ONE_DAY_EVENTS = window.simulateOneDay;

function simulateOneDay() {
  if (typeof OLD_SIMULATE_ONE_DAY_EVENTS === "function") {
    OLD_SIMULATE_ONE_DAY_EVENTS();
  }

  simulateGlobalEvents();
}

/* =========================================================
   EXPORT GLOBAL — PARTE 4.7
========================================================= */

window.simulateGlobalEvents = simulateGlobalEvents;
window.updateGlobalResourcePrices = updateGlobalResourcePrices;
window.updateGlobalStressIndexes = updateGlobalStressIndexes;
window.rollGlobalRandomEvents = rollGlobalRandomEvents;
window.triggerGlobalEvent = triggerGlobalEvent;
window.applyGlobalEventEffects = applyGlobalEventEffects;
window.simulateGlobalClimate = simulateGlobalClimate;
window.applyClimateDamage = applyClimateDamage;
window.triggerClimateDisaster = triggerClimateDisaster;
window.pickClimateDisasterRegion = pickClimateDisasterRegion;
window.scoreClimateExposure = scoreClimateExposure;
window.getResourceMarketBreakdown = getResourceMarketBreakdown;
window.getGlobalEventsBreakdown = getGlobalEventsBreakdown;
window.simulateOneDay = simulateOneDay;


/* =========================================================
   SIMULATION.JS v3
   Parte 4.8/12 COMPACTA
   Cadenas logísticas: rutas, suministros, cuellos de botella
   y resiliencia nacional.
========================================================= */

function simulateLogisticsNetwork() {
  for (const country of NEXUS.state.countries || []) {
    updateNationalLogistics(country);
    updateSupplyChainRisk(country);
    applySupplyChainEffects(country);
  }
}

function updateNationalLogistics(country) {
  const roads = getBuildingLevelSum(country, "roads");
  const rail = getBuildingLevelSum(country, "rail");
  const ports = getBuildingLevelSum(country, "ports");
  const airports = getBuildingLevelSum(country, "airports");

  const base =
    35 +
    roads * 2.2 +
    rail * 2.8 +
    ports * 2.0 +
    airports * 1.5 +
    (country.governmentEfficiency || 50) * 0.18;

  const penalties =
    (country.sanctions || 0) * 0.35 +
    (country.warRisk || 0) * 0.18 +
    (country.climateRisk || 0) * 0.08 +
    (country.convoyRisk || 0) * 0.12;

  country.logistics = clamp(base - penalties, 0, 100);
}

function updateSupplyChainRisk(country) {
  const importDependency = (country.imports || 0) / Math.max(country.gdp || 1, 1);
  const energyDeficit = Math.max(0, (country.energyDemand || 0) - (country.energyProduction || 0));
  const foodDeficit = Math.max(0, (country.foodConsumption || 0) - (country.foodProduction || 0));

  country.supplyChainRisk = clamp(
    importDependency * 85 +
    energyDeficit / Math.max(country.energyDemand || 1, 1) * 35 +
    foodDeficit / Math.max(country.foodConsumption || 1, 1) * 28 +
    (country.sanctions || 0) * 1.2 +
    (country.convoyRisk || 0) * 0.35 +
    (100 - (country.logistics || 50)) * 0.32,
    0,
    100
  );
}

function applySupplyChainEffects(country) {
  const risk = country.supplyChainRisk || 0;

  if (risk < 35) {
    country.businessConfidence = boundedDelta(country.businessConfidence || 50, 0.01, 0, 100);
    return;
  }

  const penalty = (risk - 35) / 65;

  country.gdp *= 1 - penalty * 0.000045;
  country.businessConfidence = boundedDelta(country.businessConfidence || 50, -penalty * 0.035, 0, 100);
  country.inflation = (country.inflation || SIMULATION_CONFIG.baseInflation) + penalty * 0.000018;
  country.militaryReadiness = boundedDelta(country.militaryReadiness || 70, -penalty * 0.012, 0, 100);

  if (risk > 80 && randomChance(0.002)) {
    addEvent("🚚", `${country.name}: cuello de botella logístico crítico afecta industria y defensa.`);
  }
}

function buildEmergencyLogistics(country = getSelectedCountry()) {
  if (!country) return;

  const cost = Math.round(country.gdp * 0.001);

  if (country.treasury < cost) {
    addEvent("⛔", `${country.name}: fondos insuficientes para plan logístico de emergencia.`);
    renderAll();
    return;
  }

  country.treasury -= cost;

  const region = pickStrategicRegion(country, "industry") || country.regions?.[0];
  if (region) {
    region.buildings ??= [];
    region.buildings.push({ buildingId: "roads", level: 1 });
    if (randomChance(0.45)) region.buildings.push({ buildingId: "rail", level: 1 });
  }

  country.logistics = boundedDelta(country.logistics || 50, 8, 0, 100);
  country.supplyChainRisk = boundedDelta(country.supplyChainRisk || 50, -10, 0, 100);

  addEvent("🚚", `${country.name}: plan logístico de emergencia ejecutado.`);
  renderAll();
}

function getLogisticsBreakdown(country = getSelectedCountry()) {
  return {
    logistics: country?.logistics || 0,
    supplyChainRisk: country?.supplyChainRisk || 0,
    convoyRisk: country?.convoyRisk || 0,
    imports: country?.imports || 0,
    exports: country?.exports || 0,
    energyBalance: country ? getEnergyBalance(country) : 0,
    foodBalance: country ? getFoodBalance(country) : 0
  };
}

/* =========================================================
   INTEGRACIÓN EN BUCLE DIARIO
========================================================= */

const OLD_SIMULATE_ONE_DAY_LOGISTICS = window.simulateOneDay;

function simulateOneDay() {
  if (typeof OLD_SIMULATE_ONE_DAY_LOGISTICS === "function") {
    OLD_SIMULATE_ONE_DAY_LOGISTICS();
  }

  for (const country of NEXUS.state.countries || []) {
    simulateMaritimeTradeRisk(country);
  }

  simulateLogisticsNetwork();
}

/* =========================================================
   EXPORT GLOBAL — PARTE 4.8
========================================================= */

window.simulateLogisticsNetwork = simulateLogisticsNetwork;
window.updateNationalLogistics = updateNationalLogistics;
window.updateSupplyChainRisk = updateSupplyChainRisk;
window.applySupplyChainEffects = applySupplyChainEffects;
window.buildEmergencyLogistics = buildEmergencyLogistics;
window.getLogisticsBreakdown = getLogisticsBreakdown;
window.simulateOneDay = simulateOneDay;


/* =========================================================
   SIMULATION.JS v3
   Parte 4.9/12 COMPACTA
   Política interior y opinión pública.
========================================================= */

function simulateDomesticPolitics() {

    for (const country of NEXUS.state.countries || []) {

        updateGovernmentPopularity(country);
        updatePoliticalStability(country);
        simulateCivilUnrest(country);
        simulateElectionCycle(country);

    }

}

function updateGovernmentPopularity(country){

    let popularity =
        country.popularity ??
        55;

    popularity +=
        ((country.gdpGrowth||0)*12);

    popularity -=
        (country.inflation||0.02)*25;

    popularity -=
        (country.unemployment||6)*0.15;

    popularity +=
        ((country.happiness||60)-60)*0.04;

    popularity -=
        (country.sanctions||0)*0.25;

    popularity -=
        (country.warExhaustion||0)*0.12;

    country.popularity =
        clamp(popularity,0,100);

}

function updatePoliticalStability(country){

    let delta=0;

    delta +=
        ((country.popularity||50)-50)*0.02;

    delta +=
        ((country.governmentEfficiency||50)-50)*0.015;

    delta -=
        (country.corruption||15)*0.01;

    delta -=
        (country.protests||0)*0.04;

    delta -=
        (country.strikes||0)*0.05;

    country.stability =
        boundedDelta(
            country.stability||60,
            delta,
            0,
            100
        );

}

function simulateCivilUnrest(country){

    const dissatisfaction =
        100-
        (
            (country.popularity||50)*0.45+
            (country.happiness||60)*0.35+
            (country.stability||60)*0.20
        );

    if(
        dissatisfaction>55 &&
        randomChance(0.003)
    ){

        country.protests=
            (country.protests||0)+1;

        addEvent(
            "📢",
            `${country.name}: manifestaciones multitudinarias.`
        );

    }

    if(
        dissatisfaction>72 &&
        randomChance(0.0015)
    ){

        country.strikes=
            (country.strikes||0)+1;

        country.gdp*=0.9995;

        addEvent(
            "🚜",
            `${country.name}: huelga nacional.`
        );

    }

    if(
        dissatisfaction>88 &&
        randomChance(0.0006)
    ){

        country.riots=
            (country.riots||0)+1;

        country.stability=
            boundedDelta(
                country.stability,
                -4,
                0,
                100
            );

        addEvent(
            "🔥",
            `${country.name}: disturbios urbanos.`
        );

    }

}

function simulateElectionCycle(country){

    country.daysToElection ??= 365*4;

    country.daysToElection--;

    if(country.daysToElection>0)
        return;

    country.daysToElection=365*4;

    holdElection(country);

}

function holdElection(country){

    const score =
        (country.popularity||50)+
        randomBetween(-8,8);

    if(score>=50){

        addEvent(
            "🗳️",
            `${country.name}: el gobierno es reelegido.`
        );

        country.stability=
            boundedDelta(
                country.stability,
                2,
                0,
                100
            );

        return;

    }

    const governments=[
        "Centro",
        "Liberal",
        "Conservador",
        "Socialdemócrata",
        "Verde",
        "Nacionalista"
    ];

    country.government=
        governments[
            Math.floor(
                Math.random()*governments.length
            )
        ];

    country.popularity=55;

    country.stability=
        boundedDelta(
            country.stability,
            4,
            0,
            100
        );

    addEvent(
        "🏛️",
        `${country.name}: cambio de gobierno (${country.government}).`
    );

}

function launchPropagandaCampaign(){

    const country=
        getSelectedCountry();

    if(!country)return;

    const cost=120000000;

    if(country.treasury<cost){

        addEvent(
            "⛔",
            "Fondos insuficientes."
        );

        renderAll();
        return;

    }

    country.treasury-=cost;

    country.popularity=
        boundedDelta(
            country.popularity||50,
            6,
            0,
            100
        );

    country.reputation=
        boundedDelta(
            country.reputation||60,
            -0.5,
            0,
            100
        );

    addEvent(
        "📺",
        `${country.name}: campaña nacional de propaganda.`
    );

    renderAll();

}

function getPoliticsBreakdown(country=getSelectedCountry()){

    return{

        popularity:
            country?.popularity||0,

        stability:
            country?.stability||0,

        protests:
            country?.protests||0,

        strikes:
            country?.strikes||0,

        riots:
            country?.riots||0,

        government:
            country?.government,

        daysToElection:
            country?.daysToElection

    };

}

/* =========================================================
   INTEGRACIÓN
========================================================= */

const OLD_SIMULATE_ONE_DAY_POLITICS =
window.simulateOneDay;

function simulateOneDay(){

    if(typeof OLD_SIMULATE_ONE_DAY_POLITICS==="function")
        OLD_SIMULATE_ONE_DAY_POLITICS();

    simulateDomesticPolitics();

}

/* =========================================================
   EXPORT
========================================================= */

window.simulateDomesticPolitics=simulateDomesticPolitics;
window.updateGovernmentPopularity=updateGovernmentPopularity;
window.updatePoliticalStability=updatePoliticalStability;
window.simulateCivilUnrest=simulateCivilUnrest;
window.simulateElectionCycle=simulateElectionCycle;
window.holdElection=holdElection;
window.launchPropagandaCampaign=launchPropagandaCampaign;
window.getPoliticsBreakdown=getPoliticsBreakdown;
window.simulateOneDay=simulateOneDay;



/* =========================================================
   SIMULATION.JS v3
   Parte 4.10/12 COMPACTA
   IA económica: impuestos, presupuestos, construcción,
   energía, comida, industria, bolsa y deuda.
========================================================= */

function simulateEconomicAI() {
  for (const country of NEXUS.state.countries || []) {
    if (country.name === NEXUS.state.selectedCountry) continue;

    aiAdjustTaxes(country);
    aiAdjustBudget(country);
    aiBuildEconomy(country);
    aiManageEnergyFood(country);
    aiInvestInStockMarket(country);
    aiDebtManagement(country);
  }
}

function aiAdjustTaxes(country) {
  if (!isMonthlyTick()) return;

  const stress = country.fiscalStress || 0;
  const happiness = country.happiness || 60;

  if (stress > 70 && happiness > 42) {
    country.taxRate = clamp((country.taxRate || 0.2) + 0.005, 0.05, 0.55);
  } else if (stress < 35 && happiness < 50) {
    country.taxRate = clamp((country.taxRate || 0.2) - 0.004, 0.05, 0.55);
  }
}

function aiAdjustBudget(country) {
  if (!isMonthlyTick()) return;

  const gdp = Math.max(country.gdp || 1, 1);

  if ((country.warRisk || 0) > 55 || (country.aiThreat || 0) > 65) {
    country.defenseSpending *= 1.01;
  }

  if ((country.happiness || 60) < 48) {
    country.socialSpending *= 1.006;
    country.healthSpending *= 1.004;
  }

  if ((country.research || 0) < 1000 && (country.fiscalStress || 0) < 65) {
    country.educationSpending *= 1.005;
  }

  const totalSpend =
    (country.socialSpending || 0) +
    (country.pensions || 0) +
    (country.healthSpending || 0) +
    (country.educationSpending || 0) +
    (country.defenseSpending || 0);

  if (totalSpend / gdp > 0.55 || (country.fiscalStress || 0) > 85) {
    country.socialSpending *= 0.998;
    country.educationSpending *= 0.998;
    country.defenseSpending *= 0.997;
  }
}

function aiBuildEconomy(country) {
  if (!isMonthlyTick()) return;
  if (country.treasury < country.gdp * 0.00018) return;

  const region = pickAIEconomicRegion(country);
  if (!region) return;

  const buildingId = pickAIEconomicBuilding(country);
  const building = findBuildingById(buildingId);
  if (!building) return;

  const existing = region.buildings?.find(b => b.buildingId === buildingId);
  const nextLevel = existing ? existing.level + 1 : 1;
  if (existing && existing.level >= 5) return;

  const cost = calculateConstructionCost(country, building, nextLevel);
  if (country.treasury < cost) return;

  country.treasury -= cost;
  country.constructionQueue ??= [];

  country.constructionQueue.push({
    id: String(Date.now() + Math.random()),
    buildingId,
    regionId: region.id,
    name: building.name,
    icon: building.icon,
    targetLevel: nextLevel,
    remainingDays: Math.max(6, Math.round((building.days || 30) * 0.70)),
    totalDays: Math.max(6, Math.round((building.days || 30) * 0.70)),
    cost,
    ai: true
  });
}

function pickAIEconomicRegion(country) {
  const regions = country.regions || [];
  if (!regions.length) return null;

  return [...regions].sort((a, b) => {
    const scoreA = (a.gdp || 0) / 2_000_000_000 + (a.population || 0) / 250_000;
    const scoreB = (b.gdp || 0) / 2_000_000_000 + (b.population || 0) / 250_000;
    return scoreB - scoreA;
  })[0];
}

function pickAIEconomicBuilding(country) {
  const energyDeficit = getEnergyBalance(country) < 0;
  const foodDeficit = getFoodBalance(country) < 0;
  const logisticsLow = (country.logistics || 50) < 55;
  const researchLow = (country.research || 0) < 1300;
  const pollutionHigh = (country.co2 / Math.max(country.population, 1)) > 6;

  if (energyDeficit) return randomChoice(["solar", "wind", "grid"]);
  if (foodDeficit) return randomChoice(["farms", "irrigated_farms", "greenhouses"]);
  if (logisticsLow) return randomChoice(["roads", "rail", "ports"]);
  if (researchLow && randomChance(0.45)) return randomChoice(["university", "electronics"]);
  if (pollutionHigh && randomChance(0.35)) return randomChoice(["park", "solar", "wind"]);

  return randomChoice(["steel", "cars", "electronics", "roads", "housing"]);
}

function aiManageEnergyFood(country) {
  if (!isMonthlyTick()) return;

  if (getEnergyBalance(country) < 0) {
    country.imports += Math.abs(getEnergyBalance(country)) * 90000;
    country.inflation = (country.inflation || 0.027) + 0.0008;
  }

  if (getFoodBalance(country) < 0) {
    country.imports += Math.abs(getFoodBalance(country)) * 210;
    country.happiness = boundedDelta(country.happiness || 60, -0.3, 0, 100);
  }

  if ((country.climateRisk || 0) > 65 && country.treasury > country.gdp * 0.0002) {
    country.co2 *= 0.9996;
    country.reputation = boundedDelta(country.reputation || 60, 0.04, 0, 100);
  }
}

function aiInvestInStockMarket(country) {
  if (!isMonthlyTick()) return;
  if (country.treasury < country.gdp * 0.00025) return;
  if (randomChance(0.65)) return;

  const companies = getAllTradableCompanies()
    .filter(c => c.country !== country.name)
    .filter(c => !c.controlledBy)
    .slice(0, 30);

  if (!companies.length) return;

  const target = companies[Math.floor(Math.random() * companies.length)];
  const located = findCompanyLocation(target.id);
  if (!located) return;

  const qty = Math.max(10, Math.floor((country.treasury * 0.015) / Math.max(target.price, 1)));
  const cost = qty * target.price;

  if (country.treasury < cost) return;

  country.treasury -= cost;
  country.portfolio ??= {};

  const pos = country.portfolio[target.id] || { companyId: target.id, shares: 0, avgPrice: 0 };
  const newShares = pos.shares + qty;
  pos.avgPrice = ((pos.avgPrice * pos.shares) + cost) / Math.max(newShares, 1);
  pos.shares = newShares;

  country.portfolio[target.id] = pos;
  updateCompanyOwnership(located.company);
}

function aiDebtManagement(country) {
  if (!isMonthlyTick()) return;

  const debtRatio = getDebtRatio(country);

  if (debtRatio > 1.2) {
    country.taxRate = clamp((country.taxRate || 0.2) + 0.003, 0.05, 0.55);
    country.socialSpending *= 0.999;
    country.defenseSpending *= 0.999;
    country.stability = boundedDelta(country.stability || 60, -0.05, 0, 100);
  }

  if (debtRatio < 0.55 && country.treasury > country.gdp * 0.00045) {
    const repayment = Math.min(country.treasury * 0.05, country.debt * 0.002);
    country.treasury -= repayment;
    country.debt = Math.max(0, country.debt - repayment);
  }
}

/* =========================================================
   INTEGRACIÓN
========================================================= */

const OLD_SIMULATE_ONE_DAY_ECON_AI = window.simulateOneDay;

function simulateOneDay() {
  if (typeof OLD_SIMULATE_ONE_DAY_ECON_AI === "function") {
    OLD_SIMULATE_ONE_DAY_ECON_AI();
  }

  simulateEconomicAI();
}

/* =========================================================
   EXPORT GLOBAL — PARTE 4.10
========================================================= */

window.simulateEconomicAI = simulateEconomicAI;
window.aiAdjustTaxes = aiAdjustTaxes;
window.aiAdjustBudget = aiAdjustBudget;
window.aiBuildEconomy = aiBuildEconomy;
window.pickAIEconomicRegion = pickAIEconomicRegion;
window.pickAIEconomicBuilding = pickAIEconomicBuilding;
window.aiManageEnergyFood = aiManageEnergyFood;
window.aiInvestInStockMarket = aiInvestInStockMarket;
window.aiDebtManagement = aiDebtManagement;
window.simulateOneDay = simulateOneDay;



/* =========================================================
   SIMULATION.JS v3
   Parte 4.11/12 COMPACTA
   Guardado, carga, autoguardado, saneamiento y rendimiento.
========================================================= */

function saveGame(slot = "autosave") {
  try {
    const payload = {
      savedAt: new Date().toISOString(),
      state: NEXUS.state,
      simDate: NEXUS.simDate?.toISOString?.() || null
    };

    localStorage.setItem(`nexus_save_${slot}`, JSON.stringify(payload));
    addEvent("💾", `Partida guardada en slot: ${slot}.`);
  } catch (error) {
    console.error(error);
    addEvent("⛔", "Error guardando partida.");
  }

  renderAll?.();
}

function loadGame(slot = "autosave") {
  try {
    const raw = localStorage.getItem(`nexus_save_${slot}`);
    if (!raw) {
      addEvent("⚠️", `No existe guardado en slot: ${slot}.`);
      renderAll?.();
      return false;
    }

    const payload = JSON.parse(raw);

    NEXUS.state = payload.state;
    NEXUS.simDate = payload.simDate ? new Date(payload.simDate) : new Date(2026, 0, 1);

    sanitizeGameState();
    addEvent("📂", `Partida cargada desde slot: ${slot}.`);
    renderAll?.();

    return true;
  } catch (error) {
    console.error(error);
    addEvent("⛔", "Error cargando partida.");
    renderAll?.();
    return false;
  }
}

function exportGameToClipboard() {
  try {
    const payload = JSON.stringify({
      savedAt: new Date().toISOString(),
      state: NEXUS.state,
      simDate: NEXUS.simDate?.toISOString?.() || null
    }, null, 2);

    navigator.clipboard?.writeText(payload);
    addEvent("📤", "JSON de partida copiado al portapapeles.");
  } catch (error) {
    console.error(error);
    addEvent("⛔", "No se pudo copiar el guardado.");
  }

  renderAll?.();
}

function importGameFromText(raw) {
  try {
    const payload = JSON.parse(raw);

    NEXUS.state = payload.state || payload;
    NEXUS.simDate = payload.simDate ? new Date(payload.simDate) : (NEXUS.simDate || new Date(2026, 0, 1));

    sanitizeGameState();
    addEvent("📥", "Partida importada correctamente.");
    renderAll?.();

    return true;
  } catch (error) {
    console.error(error);
    addEvent("⛔", "JSON de partida inválido.");
    renderAll?.();
    return false;
  }
}

function autoSaveGame() {
  if (!NEXUS?.state) return;
  if (!isMonthlyTick()) return;

  saveGame("autosave");
}

function sanitizeGameState() {
  if (!NEXUS.state) {
    NEXUS.state = createInitialGameState();
  }

  NEXUS.state.countries ??= getCountriesDataset();
  NEXUS.state.resources ??= getInitialResourceState();
  NEXUS.state.marketIndexes ??= getInitialMarketIndexes();
  NEXUS.state.internationalBlocs ??= getInitialInternationalBlocs();
  NEXUS.state.technologies ??= getInitialTechnologies();
  NEXUS.state.events ??= [];
  NEXUS.state.activeWars ??= [];
  NEXUS.state.activeBlockades ??= [];

  NEXUS.state.world ??= {
    co2ppm: 424.2,
    temperatureDelta: 1.28,
    tension: 32,
    inflation: 2.7,
    foodStress: 18,
    energyStress: 22
  };

  for (const country of NEXUS.state.countries) {
    normalizeCountry(country);
    ensureCountryRuntimeFields(country);
    sanitizeCountryNumbers(country);
  }
}

function ensureCountryRuntimeFields(country) {
  country.portfolio ??= {};
  country.units ??= {};
  country.regions ??= [];
  country.companies ??= [];
  country.constructionQueue ??= [];
  country.militaryQueue ??= [];
  country.technologyQueue ??= [];
  country.completedTechnologies ??= [];
  country.treaties ??= [];
  country.deployments ??= [];

  country.inflation ??= SIMULATION_CONFIG.baseInflation;
  country.businessConfidence ??= 55;
  country.militaryReadiness ??= 70;
  country.trainingLevel ??= 60;
  country.logistics ??= 55;
  country.intelligence ??= 0;
  country.popularity ??= 55;
  country.daysToElection ??= 365 * 4;
  country.fuelStock ??= Math.max(100000, (country.energyProduction || 0) * 50);
}

function sanitizeCountryNumbers(country) {
  const numericKeys = [
    "population", "gdp", "treasury", "debt", "taxRate", "happiness",
    "stability", "energyProduction", "energyDemand", "foodProduction",
    "foodConsumption", "waterProduction", "co2", "research", "military",
    "cyber", "imports", "exports", "socialSpending", "pensions",
    "healthSpending", "educationSpending", "defenseSpending", "sanctions",
    "warRisk", "climateRisk", "reputation", "relation", "businessConfidence",
    "militaryReadiness", "trainingLevel", "logistics"
  ];

  for (const key of numericKeys) {
    country[key] = safeNumber(country[key], 0);
  }

  country.population = Math.max(100000, country.population);
  country.gdp = Math.max(1_000_000_000, country.gdp);
  country.treasury = Math.max(0, country.treasury);
  country.debt = Math.max(0, country.debt);
  country.taxRate = clamp(country.taxRate, 0.05, 0.55);
  country.happiness = clamp(country.happiness, 0, 100);
  country.stability = clamp(country.stability, 0, 100);
}

function pruneOldData() {
  NEXUS.state.events = (NEXUS.state.events || []).slice(-150);

  for (const country of NEXUS.state.countries || []) {
    for (const company of country.companies || []) {
      company.history = (company.history || []).slice(-120);
    }

    country.constructionQueue = (country.constructionQueue || []).filter(p => p.remainingDays > -10);
    country.militaryQueue = (country.militaryQueue || []).filter(p => p.remainingDays > -10);
    country.technologyQueue = (country.technologyQueue || []).filter(p => p.remainingDays > -10);
  }
}

function updateWorldAggregates() {
  const totals = getWorldTotals(NEXUS.state.countries || []);

  NEXUS.state.worldTotals = totals;
  NEXUS.state.world.gdp = totals.gdp;
  NEXUS.state.world.population = totals.population;
  NEXUS.state.world.co2 = totals.co2;
  NEXUS.state.world.military = totals.military;
}

function rankCountriesByMilitaryPower() {
  const ranked = [...(NEXUS.state.countries || [])]
    .sort((a, b) => calculateEffectiveMilitaryPower(b) - calculateEffectiveMilitaryPower(a));

  ranked.forEach((country, index) => {
    country.rankMilitary = index + 1;
  });

  const byGDP = [...(NEXUS.state.countries || [])].sort((a, b) => b.gdp - a.gdp);
  byGDP.forEach((country, index) => {
    country.rankGDP = index + 1;
  });

  const byPopulation = [...(NEXUS.state.countries || [])].sort((a, b) => b.population - a.population);
  byPopulation.forEach((country, index) => {
    country.rankPopulation = index + 1;
  });

  const byTech = [...(NEXUS.state.countries || [])].sort((a, b) => b.research - a.research);
  byTech.forEach((country, index) => {
    country.rankResearch = index + 1;
  });
}

function simulationHealthCheck() {
  const errors = [];

  if (!NEXUS.state) errors.push("NEXUS.state no existe.");
  if (!Array.isArray(NEXUS.state?.countries)) errors.push("countries no es array.");
  if (!NEXUS.simDate) errors.push("NEXUS.simDate no existe.");

  for (const country of NEXUS.state?.countries || []) {
    if (!country.name) errors.push("País sin nombre.");
    if (!Number.isFinite(country.gdp)) errors.push(`${country.name}: PIB inválido.`);
    if (!Number.isFinite(country.population)) errors.push(`${country.name}: población inválida.`);
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

function getSimulationPerformanceSummary() {
  return {
    countries: NEXUS.state?.countries?.length || 0,
    companies: getAllTradableCompanies().length,
    wars: NEXUS.state?.activeWars?.length || 0,
    blockades: NEXUS.state?.activeBlockades?.length || 0,
    events: NEXUS.state?.events?.length || 0,
    health: simulationHealthCheck()
  };
}

/* =========================================================
   INTEGRACIÓN
========================================================= */

const OLD_SIMULATE_ONE_DAY_SAVE = window.simulateOneDay;

function simulateOneDay() {
  if (typeof OLD_SIMULATE_ONE_DAY_SAVE === "function") {
    OLD_SIMULATE_ONE_DAY_SAVE();
  }

  pruneOldData();
  updateWorldAggregates();
  rankCountriesByMilitaryPower();
  autoSaveGame();
}

/* =========================================================
   EXPORT GLOBAL — PARTE 4.11
========================================================= */

window.saveGame = saveGame;
window.loadGame = loadGame;
window.exportGameToClipboard = exportGameToClipboard;
window.importGameFromText = importGameFromText;
window.autoSaveGame = autoSaveGame;
window.sanitizeGameState = sanitizeGameState;
window.ensureCountryRuntimeFields = ensureCountryRuntimeFields;
window.sanitizeCountryNumbers = sanitizeCountryNumbers;
window.pruneOldData = pruneOldData;
window.updateWorldAggregates = updateWorldAggregates;
window.rankCountriesByMilitaryPower = rankCountriesByMilitaryPower;
window.simulationHealthCheck = simulationHealthCheck;
window.getSimulationPerformanceSummary = getSimulationPerformanceSummary;
window.simulateOneDay = simulateOneDay;



/* =========================================================
   SIMULATION.JS v3
   BLOQUE 5/12
   Motor principal de simulación
========================================================= */

const SIM_SPEEDS = {
    0.5: 20000,
    1: 10000,
    2: 5000,
    5: 2000,
    10: 1000
};

NEXUS.simulation = NEXUS.simulation || {};

NEXUS.simulation.running = false;
NEXUS.simulation.speed = 1;
NEXUS.simulation.timer = null;

/* ========================================================= */

function startSimulation(){

    if(NEXUS.simulation.running) return;

    NEXUS.simulation.running=true;

    scheduleSimulationTick();

}

/* ========================================================= */

function pauseSimulation(){

    NEXUS.simulation.running=false;

    clearTimeout(
        NEXUS.simulation.timer
    );

}

/* ========================================================= */

function scheduleSimulationTick(){

    clearTimeout(
        NEXUS.simulation.timer
    );

    if(!NEXUS.simulation.running)
        return;

    NEXUS.simulation.timer=
        setTimeout(()=>{

            simulationTick();

            scheduleSimulationTick();

        },
        SIM_SPEEDS[
            NEXUS.simulation.speed
        ]);

}

/* ========================================================= */

function setSimulationSpeed(speed){

    if(!(speed in SIM_SPEEDS))
        return;

    NEXUS.simulation.speed=speed;

    if(NEXUS.simulation.running)
        scheduleSimulationTick();

}

/* ========================================================= */

function simulationTick(){

    advanceSimulationDate();

    simulateEconomy();

    simulateConstruction();

    simulateTechnology();

    simulatePopulation();

    simulateEnergy();

    simulateFood();

    simulateLogisticsNetwork();

    simulateStockMarket();

    simulateDiplomacy();

    simulateDomesticPolitics();

    simulateStrategicMilitaryAI();

    simulateWars();

    simulateElectronicRecovery();

    simulateNuclearCrisis();

    simulateGlobalEvents();

    simulateEconomicAI();

    updateWorldAggregates();

    rankCountriesByMilitaryPower();

    autoSaveGame();

    renderSimulation();

}

/* ========================================================= */

function advanceSimulationDate(){

    NEXUS.simDate=
        new Date(
            NEXUS.simDate.getTime()+
            86400000
        );

}

/* ========================================================= */

function renderSimulation(){

    renderTopBar?.();

    renderDashboard?.();

    renderMap?.();

    renderCities?.();

    renderEconomy?.();

    renderMilitary?.();

    renderDiplomacy?.();

    renderStockMarket?.();

    renderEvents?.();

}

/* ========================================================= */

function stepSimulation(days=1){

    for(let i=0;i<days;i++)
        simulationTick();

}

/* ========================================================= */

function getSimulationStatus(){

    return{

        running:
            NEXUS.simulation.running,

        speed:
            NEXUS.simulation.speed,

        currentDate:
            NEXUS.simDate,

        fpsEquivalent:
            1000/
            SIM_SPEEDS[
                NEXUS.simulation.speed
            ]

    };

}

/* ========================================================= */

window.startSimulation=startSimulation;
window.pauseSimulation=pauseSimulation;
window.setSimulationSpeed=setSimulationSpeed;
window.stepSimulation=stepSimulation;
window.getSimulationStatus=getSimulationStatus;
window.simulationTick=simulationTick;



/* =========================================================
   SIMULATION.JS v3
   BLOQUE 6/12
   Wrappers de compatibilidad + optimización básica.
   Hace que el motor 5/12 pueda llamar a sistemas existentes.
========================================================= */

NEXUS.cache = NEXUS.cache || {
  day: -1,
  countryByName: new Map(),
  companyById: new Map()
};

function refreshSimulationCache() {
  NEXUS.cache.countryByName.clear();
  NEXUS.cache.companyById.clear();

  for (const country of NEXUS.state.countries || []) {
    NEXUS.cache.countryByName.set(country.name, country);

    for (const company of country.companies || []) {
      NEXUS.cache.companyById.set(company.id, { country, company });
    }
  }

  NEXUS.cache.day = getDayOfYear();
}

function getCachedCountry(name) {
  if (NEXUS.cache.day !== getDayOfYear()) refreshSimulationCache();
  return NEXUS.cache.countryByName.get(name) || null;
}

function getCachedCompany(companyId) {
  if (NEXUS.cache.day !== getDayOfYear()) refreshSimulationCache();
  return NEXUS.cache.companyById.get(companyId) || null;
}

/* =========================================================
   WRAPPERS QUE NECESITA EL BLOQUE 5
========================================================= */

function simulateEconomy() {
  for (const country of NEXUS.state.countries || []) {
    ensureCountryRuntimeFields(country);
    simulateCountryDailyEconomy(country);
    simulateCountryBudget(country);
  }
}

function simulateConstruction() {
  for (const country of NEXUS.state.countries || []) {
    simulateConstructionQueue(country);
    simulateMilitaryProductionQueue(country);
  }
}

function simulateTechnology() {
  for (const country of NEXUS.state.countries || []) {
    simulateTechnologyQueue(country);
  }
}

function simulatePopulation() {
  for (const country of NEXUS.state.countries || []) {
    simulateDemography(country);
    simulatePoliticalPressure(country);
  }
}

function simulateEnergy() {
  for (const country of NEXUS.state.countries || []) {
    updateEnergySystem(country);
    updateWaterSystem(country);
  }
}

function simulateFood() {
  for (const country of NEXUS.state.countries || []) {
    updateFoodSystem(country);
    updateIndustrialResourcePressure(country);
    updateTradeFromResourceBalances(country);
  }
}

/* =========================================================
   OPTIMIZACIÓN LIGERA
========================================================= */

function fastDailyMaintenance() {
  for (const country of NEXUS.state.countries || []) {
    country.gdp = Math.max(1_000_000_000, country.gdp || 1_000_000_000);
    country.population = Math.max(100_000, country.population || 100_000);
    country.treasury = Math.max(0, country.treasury || 0);
    country.happiness = clamp(country.happiness || 50, 0, 100);
    country.stability = clamp(country.stability || 50, 0, 100);
    country.reputation = clamp(country.reputation || 50, 0, 100);
    country.relation = clamp(country.relation || 50, 0, 100);
    country.warRisk = clamp(country.warRisk || 0, 0, 100);
    country.sanctions = Math.max(0, country.sanctions || 0);
  }
}

const OLD_SIMULATION_TICK_OPTIMIZED = window.simulationTick;

function simulationTick() {
  fastDailyMaintenance();
  refreshSimulationCache();

  if (typeof OLD_SIMULATION_TICK_OPTIMIZED === "function") {
    OLD_SIMULATION_TICK_OPTIMIZED();
  }

  pruneOldData();
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 6
========================================================= */

window.refreshSimulationCache = refreshSimulationCache;
window.getCachedCountry = getCachedCountry;
window.getCachedCompany = getCachedCompany;

window.simulateEconomy = simulateEconomy;
window.simulateConstruction = simulateConstruction;
window.simulateTechnology = simulateTechnology;
window.simulatePopulation = simulatePopulation;
window.simulateEnergy = simulateEnergy;
window.simulateFood = simulateFood;

window.fastDailyMaintenance = fastDailyMaintenance;
window.simulationTick = simulationTick;



/* =========================================================
   SIMULATION.JS v3
   BLOQUE 7/12
   Objetivos nacionales, misiones y condiciones de victoria.
========================================================= */

const NATIONAL_OBJECTIVES = [
  {
    id: "gdp_power",
    icon: "💶",
    name: "Potencia económica",
    description: "Alcanza el top 5 mundial por PIB.",
    check: c => (c.rankGDP || 999) <= 5,
    reward: c => {
      c.reputation = boundedDelta(c.reputation || 60, 4, 0, 100);
      c.businessConfidence = boundedDelta(c.businessConfidence || 50, 5, 0, 100);
    }
  },
  {
    id: "military_power",
    icon: "🛡️",
    name: "Potencia militar",
    description: "Alcanza el top 5 mundial por poder militar.",
    check: c => (c.rankMilitary || 999) <= 5,
    reward: c => {
      c.warRisk = boundedDelta(c.warRisk || 0, -4, 0, 100);
      c.reputation = boundedDelta(c.reputation || 60, 2, 0, 100);
    }
  },
  {
    id: "green_transition",
    icon: "🌱",
    name: "Transición verde",
    description: "Reduce CO₂ per cápita por debajo de 4 toneladas.",
    check: c => (c.co2 / Math.max(c.population, 1)) < 4,
    reward: c => {
      c.reputation = boundedDelta(c.reputation || 60, 6, 0, 100);
      c.happiness = boundedDelta(c.happiness || 60, 3, 0, 100);
    }
  },
  {
    id: "energy_independence",
    icon: "⚡",
    name: "Independencia energética",
    description: "Produce más energía de la que consumes.",
    check: c => getEnergyBalance(c) > 0,
    reward: c => {
      c.businessConfidence = boundedDelta(c.businessConfidence || 50, 4, 0, 100);
      c.treasury += 250_000_000;
    }
  },
  {
    id: "food_security",
    icon: "🌾",
    name: "Seguridad alimentaria",
    description: "Produce más alimentos de los que consumes.",
    check: c => getFoodBalance(c) > 0,
    reward: c => {
      c.happiness = boundedDelta(c.happiness || 60, 3, 0, 100);
      c.stability = boundedDelta(c.stability || 60, 2, 0, 100);
    }
  },
  {
    id: "tech_power",
    icon: "🔬",
    name: "Potencia tecnológica",
    description: "Alcanza el top 5 mundial por investigación.",
    check: c => (c.rankResearch || 999) <= 5,
    reward: c => {
      c.research += 500;
      c.cyber += 250;
    }
  },
  {
    id: "market_control",
    icon: "📈",
    name: "Capitalismo estratégico",
    description: "Controla al menos 3 empresas extranjeras.",
    check: c => getControlledForeignCompanies(c).length >= 3,
    reward: c => {
      c.treasury += 500_000_000;
      c.businessConfidence = boundedDelta(c.businessConfidence || 50, 4, 0, 100);
    }
  },
  {
    id: "diplomatic_network",
    icon: "🤝",
    name: "Red diplomática",
    description: "Mantén al menos 5 tratados activos.",
    check: c => (c.treaties || []).length >= 5,
    reward: c => {
      c.reputation = boundedDelta(c.reputation || 60, 5, 0, 100);
      c.sanctions = Math.max(0, (c.sanctions || 0) - 2);
    }
  }
];

function initializeObjectives() {
  NEXUS.state.objectives ??= {};

  for (const country of NEXUS.state.countries || []) {
    NEXUS.state.objectives[country.name] ??= {};
  }
}

function simulateObjectives() {
  initializeObjectives();

  for (const country of NEXUS.state.countries || []) {
    checkCountryObjectives(country);
  }

  checkVictoryConditions();
}

function checkCountryObjectives(country) {
  const completed = NEXUS.state.objectives[country.name] || {};

  for (const objective of NATIONAL_OBJECTIVES) {
    if (completed[objective.id]) continue;

    if (objective.check(country)) {
      completed[objective.id] = {
        completed: true,
        year: getSimulationYear(),
        day: getDayOfYear()
      };

      objective.reward(country);

      addEvent(
        objective.icon,
        `${country.name}: objetivo completado — ${objective.name}.`
      );
    }
  }

  NEXUS.state.objectives[country.name] = completed;
}

function getControlledForeignCompanies(country) {
  const controlled = [];

  for (const other of NEXUS.state.countries || []) {
    if (other.name === country.name) continue;

    for (const company of other.companies || []) {
      if (company.controller === country.name) {
        controlled.push({
          country: other.name,
          company
        });
      }
    }
  }

  return controlled;
}

function getObjectiveProgress(country = getSelectedCountry()) {
  const completed = NEXUS.state.objectives?.[country.name] || {};

  return NATIONAL_OBJECTIVES.map(objective => ({
    id: objective.id,
    icon: objective.icon,
    name: objective.name,
    description: objective.description,
    completed: Boolean(completed[objective.id]),
    status: completed[objective.id] || null
  }));
}

function checkVictoryConditions() {
  const player = getSelectedCountry();
  if (!player) return;

  NEXUS.state.victory ??= {
    achieved: false,
    type: null
  };

  if (NEXUS.state.victory.achieved) return;

  const completed = Object.values(NEXUS.state.objectives?.[player.name] || {})
    .filter(o => o.completed).length;

  if (completed >= 6) {
    NEXUS.state.victory = {
      achieved: true,
      type: "strategic",
      year: getSimulationYear()
    };

    addEvent("🏆", `${player.name}: victoria estratégica alcanzada.`);
  }

  if (
    (player.rankGDP || 999) <= 3 &&
    (player.rankMilitary || 999) <= 3 &&
    (player.rankResearch || 999) <= 3
  ) {
    NEXUS.state.victory = {
      achieved: true,
      type: "superpower",
      year: getSimulationYear()
    };

    addEvent("👑", `${player.name}: hegemonía global alcanzada.`);
  }
}

function getVictoryStatus() {
  return NEXUS.state.victory || {
    achieved: false,
    type: null
  };
}

/* =========================================================
   INTEGRACIÓN
========================================================= */

const OLD_SIMULATION_TICK_OBJECTIVES = window.simulationTick;

function simulationTick() {
  if (typeof OLD_SIMULATION_TICK_OBJECTIVES === "function") {
    OLD_SIMULATION_TICK_OBJECTIVES();
  }

  simulateObjectives();
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 7
========================================================= */

window.NATIONAL_OBJECTIVES = NATIONAL_OBJECTIVES;
window.initializeObjectives = initializeObjectives;
window.simulateObjectives = simulateObjectives;
window.checkCountryObjectives = checkCountryObjectives;
window.getControlledForeignCompanies = getControlledForeignCompanies;
window.getObjectiveProgress = getObjectiveProgress;
window.checkVictoryConditions = checkVictoryConditions;
window.getVictoryStatus = getVictoryStatus;
window.simulationTick = simulationTick;


/* =========================================================
   SIMULATION.JS v3
   BLOQUE 8/12
   IA Geopolítica Global
========================================================= */

function simulateGeopolitics() {

    for (const country of NEXUS.state.countries || []) {

        if (country.name === NEXUS.state.selectedCountry)
            continue;

        evaluateNationalInterests(country);
        evaluateInternationalRelations(country);
        evaluateRegionalConflicts(country);
        evaluateExpansionStrategy(country);
        evaluateAlliancePolicy(country);

    }

}

/* ========================================================= */

function evaluateNationalInterests(country){

    country.aiGoals ??={};

    country.aiGoals.economy =
        country.rankGDP>10;

    country.aiGoals.military =
        country.rankMilitary>10;

    country.aiGoals.energy =
        getEnergyBalance(country)<0;

    country.aiGoals.food =
        getFoodBalance(country)<0;

    country.aiGoals.technology =
        country.rankResearch>10;

}

/* ========================================================= */

function evaluateInternationalRelations(country){

    const player=getSelectedCountry();

    if(!player) return;

    if(country.relation<20){

        if(randomChance(0.03))
            imposeSanctions(player.name,1);

    }

    if(country.relation>80){

        if(randomChance(0.02))
            signTreaty(player.name,"trade");

    }

}

/* ========================================================= */

function evaluateRegionalConflicts(country){

    if(
        (country.warRisk||0)<55
    )
        return;

    const neighbours=
        getNeighbourCountries(country);

    if(!neighbours.length)
        return;

    const target=
        neighbours[
            Math.floor(
                Math.random()*neighbours.length
            )
        ];

    if(
        calculateEffectiveMilitaryPower(country)>
        calculateEffectiveMilitaryPower(target)*1.20 &&
        randomChance(0.015)
    ){

        declareWar(
            country.name,
            target.name,
            "conflicto regional"
        );

    }

}

/* ========================================================= */

function evaluateExpansionStrategy(country){

    if(
        country.rankGDP<=8 &&
        country.rankMilitary<=8
    )
        return;

    if(randomChance(0.01)){

        const companies=
            getAllTradableCompanies()
            .filter(c=>c.country!==country.name);

        if(companies.length){

            const target=
                companies[
                    Math.floor(
                        Math.random()*companies.length
                    )
                ];

            const old=
                NEXUS.state.selectedCountry;

            NEXUS.state.selectedCountry=
                country.name;

            launchTakeover(
                target.id,
                25
            );

            NEXUS.state.selectedCountry=old;

        }

    }

}

/* ========================================================= */

function evaluateAlliancePolicy(country){

    const blocs=[
        "eu",
        "nato",
        "brics"
    ];

    const player=
        getSelectedCountry();

    if(!player)
        return;

    for(const bloc of blocs){

        const sameBloc=
            countryBelongsToBloc(country.name,bloc) &&
            countryBelongsToBloc(player.name,bloc);

        if(
            sameBloc &&
            randomChance(0.02)
        ){

            country.relation=
                boundedDelta(
                    country.relation||50,
                    2,
                    0,
                    100
                );

        }

    }

}

/* ========================================================= */

function getNeighbourCountries(country){

    if(!country.neighbours)
        return [];

    return country.neighbours
        .map(name=>
            getCountryByName(
                NEXUS.state.countries,
                name
            )
        )
        .filter(Boolean);

}

/* ========================================================= */

function calculateGlobalPowerRanking(){

    return [...NEXUS.state.countries]

    .map(country=>{

        const score=

            country.gdp/1e11+

            calculateEffectiveMilitaryPower(country)/4000+

            (country.research||0)/250+

            (country.reputation||50)/12+

            (country.businessConfidence||50)/15;

        return{

            country,
            score

        };

    })

    .sort(
        (a,b)=>
            b.score-a.score
    );

}

/* ========================================================= */

function updateGlobalInfluence(){

    const ranking=
        calculateGlobalPowerRanking();

    ranking.forEach((item,index)=>{

        item.country.globalInfluence=
            ranking.length-index;

    });

}

/* ========================================================= */

function getGlobalPowerBreakdown(){

    return calculateGlobalPowerRanking()

    .slice(0,20)

    .map((item,index)=>({

        rank:index+1,

        name:item.country.name,

        score:Number(
            item.score.toFixed(2)
        ),

        gdp:item.country.rankGDP,

        military:item.country.rankMilitary,

        research:item.country.rankResearch,

        influence:item.country.globalInfluence

    }));

}

/* =========================================================
   INTEGRACIÓN
========================================================= */

const OLD_SIMULATION_TICK_GEO =
window.simulationTick;

function simulationTick(){

    if(typeof OLD_SIMULATION_TICK_GEO==="function")
        OLD_SIMULATION_TICK_GEO();

    simulateGeopolitics();
    updateGlobalInfluence();

}

/* =========================================================
   EXPORT
========================================================= */

window.simulateGeopolitics=simulateGeopolitics;
window.evaluateNationalInterests=evaluateNationalInterests;
window.evaluateInternationalRelations=evaluateInternationalRelations;
window.evaluateRegionalConflicts=evaluateRegionalConflicts;
window.evaluateExpansionStrategy=evaluateExpansionStrategy;
window.evaluateAlliancePolicy=evaluateAlliancePolicy;
window.getNeighbourCountries=getNeighbourCountries;
window.calculateGlobalPowerRanking=calculateGlobalPowerRanking;
window.updateGlobalInfluence=updateGlobalInfluence;
window.getGlobalPowerBreakdown=getGlobalPowerBreakdown;
window.simulationTick=simulationTick;



/* =========================================================
   SIMULATION.JS v3
   BLOQUE 9/12
   Campañas militares: ocupación, anexión, paz, guerrillas
   y tratados postguerra simplificados.
========================================================= */

function simulateMilitaryCampaigns() {
  for (const war of NEXUS.state.activeWars || []) {
    if (war.ended) continue;

    updateOccupationPressure(war);
    simulateResistanceAndGuerrillas(war);
    evaluatePeaceTerms(war);
  }
}

function updateOccupationPressure(war) {
  for (const defenderName of war.participants.defenders || []) {
    const defender = getCountryByName(NEXUS.state.countries, defenderName);
    if (!defender) continue;

    const occupiedRegions = (defender.regions || []).filter(r => r.occupiedBy);
    const occupiedGDP = occupiedRegions.reduce((s, r) => s + (r.gdp || 0), 0);
    const occupiedPop = occupiedRegions.reduce((s, r) => s + (r.population || 0), 0);

    defender.occupationLevel = clamp(
      occupiedRegions.length * 8 +
      occupiedGDP / Math.max(defender.gdp, 1) * 40 +
      occupiedPop / Math.max(defender.population, 1) * 35,
      0,
      100
    );

    if (defender.occupationLevel > 40) {
      defender.stability = boundedDelta(defender.stability || 60, -0.018, 0, 100);
      defender.happiness = boundedDelta(defender.happiness || 60, -0.014, 0, 100);
    }
  }
}

function simulateResistanceAndGuerrillas(war) {
  for (const defenderName of war.participants.defenders || []) {
    const defender = getCountryByName(NEXUS.state.countries, defenderName);
    if (!defender) continue;

    const occupiedRegions = (defender.regions || []).filter(r => r.occupiedBy);
    if (!occupiedRegions.length) continue;

    for (const region of occupiedRegions) {
      const occupier = getCountryByName(NEXUS.state.countries, region.occupiedBy);
      if (!occupier) continue;

      const resistance = calculateResistanceLevel(defender, occupier, region);
      region.resistance = resistance;

      if (randomChance(resistance * 0.00045)) {
        applyGuerrillaAttack(defender, occupier, region);
      }
    }
  }
}

function calculateResistanceLevel(defender, occupier, region) {
  return clamp(
    25 +
    (defender.legitimacy || 50) * 0.18 +
    (defender.happiness || 50) * 0.10 +
    (100 - (occupier.reputation || 50)) * 0.18 +
    (region.population || 0) / Math.max(defender.population || 1, 1) * 50 +
    (region.type === "capital" ? 18 : 0) -
    (occupier.internalSecurity || 50) * 0.22 -
    (occupier.logistics || 50) * 0.12,
    0,
    100
  );
}

function applyGuerrillaAttack(defender, occupier, region) {
  const damage = Math.round((region.gdp || 0) * randomBetween(0.0008, 0.0035));

  occupier.treasury = Math.max(0, occupier.treasury - damage);
  occupier.militaryReadiness = boundedDelta(occupier.militaryReadiness || 70, -0.6, 0, 100);
  occupier.stability = boundedDelta(occupier.stability || 60, -0.25, 0, 100);

  region.damageLevel = clamp((region.damageLevel || 0) + 0.5, 0, 10);

  addEvent("🌲", `${defender.name}: guerrilla en ${region.name} causa daños a ${occupier.name}.`);
}

function evaluatePeaceTerms(war) {
  if (war.ended) return;

  const attackerScore = war.warScore || 0;

  if (attackerScore > 70) {
    proposePeace(war, "attacker_victory");
  } else if (attackerScore < -55) {
    proposePeace(war, "defender_victory");
  } else if (war.durationDays > 720 && Math.abs(attackerScore) < 20) {
    proposePeace(war, "white_peace");
  }
}

function proposePeace(war, type = "white_peace") {
  if (war.peaceProposed) return;

  war.peaceProposed = {
    type,
    day: getDayOfYear(),
    year: getSimulationYear()
  };

  if (type === "attacker_victory") {
    applyPeaceTreaty(war, "attacker_victory");
  }

  if (type === "defender_victory") {
    applyPeaceTreaty(war, "defender_victory");
  }

  if (type === "white_peace") {
    applyPeaceTreaty(war, "white_peace");
  }
}

function applyPeaceTreaty(war, type) {
  if (type === "attacker_victory") {
    applyAttackerVictoryPeace(war);
  }

  if (type === "defender_victory") {
    applyDefenderVictoryPeace(war);
  }

  if (type === "white_peace") {
    applyWhitePeace(war);
  }

  endWar(war, type);
}

function applyAttackerVictoryPeace(war) {
  const attacker = getCountryByName(NEXUS.state.countries, war.participants.attackers[0]);
  const defender = getCountryByName(NEXUS.state.countries, war.participants.defenders[0]);

  if (!attacker || !defender) return;

  const occupiedRegions = (defender.regions || []).filter(r => r.occupiedBy === attacker.name);

  for (const region of occupiedRegions.slice(0, 2)) {
    transferRegion(defender, attacker, region);
  }

  const reparations = Math.min(defender.treasury * 0.35, defender.gdp * 0.01);

  defender.treasury = Math.max(0, defender.treasury - reparations);
  attacker.treasury += reparations;

  defender.stability = boundedDelta(defender.stability || 60, -8, 0, 100);
  defender.reputation = boundedDelta(defender.reputation || 60, -4, 0, 100);

  attacker.reputation = boundedDelta(attacker.reputation || 60, -6, 0, 100);
  attacker.sanctions = (attacker.sanctions || 0) + 3;

  addEvent("📜", `${attacker.name}: impone tratado de paz a ${defender.name}.`);
}

function applyDefenderVictoryPeace(war) {
  const attacker = getCountryByName(NEXUS.state.countries, war.participants.attackers[0]);
  const defender = getCountryByName(NEXUS.state.countries, war.participants.defenders[0]);

  if (!attacker || !defender) return;

  clearOccupation(defender);

  attacker.reputation = boundedDelta(attacker.reputation || 60, -5, 0, 100);
  attacker.stability = boundedDelta(attacker.stability || 60, -4, 0, 100);
  attacker.sanctions = (attacker.sanctions || 0) + 2;

  defender.reputation = boundedDelta(defender.reputation || 60, 5, 0, 100);
  defender.stability = boundedDelta(defender.stability || 60, 4, 0, 100);

  addEvent("🛡️", `${defender.name}: victoria defensiva y restauración territorial.`);
}

function applyWhitePeace(war) {
  for (const name of [...war.participants.attackers, ...war.participants.defenders]) {
    const country = getCountryByName(NEXUS.state.countries, name);
    if (!country) continue;

    clearOccupation(country);
    country.stability = boundedDelta(country.stability || 60, 1, 0, 100);
    country.warExhaustion = boundedDelta(country.warExhaustion || 0, -20, 0, 100);
  }

  addEvent("🕊️", `${war.name}: paz blanca firmada.`);
}

function transferRegion(fromCountry, toCountry, region) {
  fromCountry.regions = (fromCountry.regions || []).filter(r => r.id !== region.id);

  region.occupiedBy = null;
  region.resistance = 25;
  region.id = `${toCountry.iso || toCountry.name}_${region.name}_${Date.now()}`;

  toCountry.regions ??= [];
  toCountry.regions.push(region);

  const pop = region.population || 0;
  const gdp = region.gdp || 0;

  fromCountry.population = Math.max(100000, fromCountry.population - pop);
  fromCountry.gdp = Math.max(1_000_000_000, fromCountry.gdp - gdp);

  toCountry.population += pop;
  toCountry.gdp += gdp;

  addEvent("🚩", `${toCountry.name}: anexiona ${region.name} de ${fromCountry.name}.`);
}

function clearOccupation(country) {
  for (const region of country.regions || []) {
    region.occupiedBy = null;
    region.resistance = 0;
  }

  country.occupationLevel = 0;
}

function annexCountry(targetCountryName) {
  const actor = getSelectedCountry();
  const target = getCountryByName(NEXUS.state.countries, targetCountryName);

  if (!actor || !target || actor.name === target.name) return;

  if ((target.occupationLevel || 0) < 85) {
    addEvent("⛔", `${actor.name}: ocupación insuficiente para anexar ${target.name}.`);
    renderAll();
    return;
  }

  const regions = [...(target.regions || [])];

  for (const region of regions) {
    transferRegion(target, actor, region);
  }

  target.gdp = 1_000_000_000;
  target.population = 100000;
  target.stability = 10;
  target.happiness = 10;
  target.surrenderedTo = actor.name;

  actor.reputation = boundedDelta(actor.reputation || 60, -20, 0, 100);
  actor.sanctions = (actor.sanctions || 0) + 20;

  NEXUS.state.world.tension = clamp((NEXUS.state.world.tension || 0) + 12, 0, 100);

  addEvent("👑", `${actor.name}: anexa completamente ${target.name}.`);
  renderAll();
}

function releaseOccupiedRegions(countryName) {
  const actor = getSelectedCountry();
  const country = getCountryByName(NEXUS.state.countries, countryName);

  if (!actor || !country) return;

  clearOccupation(country);

  actor.reputation = boundedDelta(actor.reputation || 60, 4, 0, 100);
  country.relation = boundedDelta(country.relation || 50, 8, 0, 100);

  addEvent("🕊️", `${actor.name}: libera territorios ocupados de ${country.name}.`);
  renderAll();
}

function getCampaignBreakdown(country = getSelectedCountry()) {
  const wars = (NEXUS.state.activeWars || []).filter(w =>
    w.participants.attackers.includes(country.name) ||
    w.participants.defenders.includes(country.name)
  );

  return {
    wars,
    occupiedRegions: (country.regions || []).filter(r => r.occupiedBy),
    occupationLevel: country.occupationLevel || 0,
    warExhaustion: country.warExhaustion || 0
  };
}

/* =========================================================
   INTEGRACIÓN
========================================================= */

const OLD_SIMULATION_TICK_CAMPAIGNS = window.simulationTick;

function simulationTick() {
  if (typeof OLD_SIMULATION_TICK_CAMPAIGNS === "function") {
    OLD_SIMULATION_TICK_CAMPAIGNS();
  }

  simulateMilitaryCampaigns();
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 9
========================================================= */

window.simulateMilitaryCampaigns = simulateMilitaryCampaigns;
window.updateOccupationPressure = updateOccupationPressure;
window.simulateResistanceAndGuerrillas = simulateResistanceAndGuerrillas;
window.calculateResistanceLevel = calculateResistanceLevel;
window.applyGuerrillaAttack = applyGuerrillaAttack;
window.evaluatePeaceTerms = evaluatePeaceTerms;
window.proposePeace = proposePeace;
window.applyPeaceTreaty = applyPeaceTreaty;
window.applyAttackerVictoryPeace = applyAttackerVictoryPeace;
window.applyDefenderVictoryPeace = applyDefenderVictoryPeace;
window.applyWhitePeace = applyWhitePeace;
window.transferRegion = transferRegion;
window.clearOccupation = clearOccupation;
window.annexCountry = annexCountry;
window.releaseOccupiedRegions = releaseOccupiedRegions;
window.getCampaignBreakdown = getCampaignBreakdown;
window.simulationTick = simulationTick;



/* =========================================================
   SIMULATION.JS v3
   BLOQUE 10/12
   Comercio internacional y recursos estratégicos
========================================================= */

function simulateInternationalTrade() {
    for (const country of NEXUS.state.countries || []) {
        updateTradeBalance(country);
        updateStrategicImports(country);
        updateStrategicExports(country);
        updateTradeRevenue(country);
    }

    simulateTradeRoutes();
}

/* ========================================================= */

function updateTradeBalance(country){

    country.tradeBalance =
        (country.exports||0)-
        (country.imports||0);

    country.currentAccount =
        country.tradeBalance+
        (country.servicesBalance||0);

}

/* ========================================================= */

function updateStrategicImports(country){

    const energy=getEnergyBalance(country);
    const food=getFoodBalance(country);

    if(energy<0){

        country.imports+=Math.abs(energy)*85000;

    }

    if(food<0){

        country.imports+=Math.abs(food)*180;

    }

}

/* ========================================================= */

function updateStrategicExports(country){

    if(getEnergyBalance(country)>0){

        country.exports+=
            getEnergyBalance(country)*65000;

    }

    if(getFoodBalance(country)>0){

        country.exports+=
            getFoodBalance(country)*150;

    }

}

/* ========================================================= */

function updateTradeRevenue(country){

    const profit=

        (country.exports||0)*0.0015-

        (country.imports||0)*0.0011;

    country.treasury+=profit;

    country.gdp+=profit*0.6;

}

/* ========================================================= */

function simulateTradeRoutes(){

    for(const route of
        NEXUS.state.tradeRoutes||[]){

        simulateSingleTradeRoute(route);

    }

}

/* ========================================================= */

function simulateSingleTradeRoute(route){

    const exporter=
        getCachedCountry(route.exporter);

    const importer=
        getCachedCountry(route.importer);

    if(!exporter||!importer)
        return;

    let efficiency=1;

    efficiency-=
        (route.risk||0)*0.01;

    efficiency-=
        (exporter.sanctions||0)*0.01;

    efficiency-=
        (importer.sanctions||0)*0.01;

    efficiency-=
        (NEXUS.state.world.tension||0)*0.0015;

    efficiency=
        clamp(
            efficiency,
            0.2,
            1
        );

    const value=
        route.value*
        efficiency;

    exporter.treasury+=
        value*0.65;

    importer.gdp+=
        value*0.45;

}

/* ========================================================= */

function createTradeRoute(
    exporter,
    importer,
    value=500000000
){

    NEXUS.state.tradeRoutes ??=[];

    NEXUS.state.tradeRoutes.push({

        id:
            crypto.randomUUID(),

        exporter,

        importer,

        value,

        risk:5

    });

}

/* ========================================================= */

function removeTradeRoute(id){

    NEXUS.state.tradeRoutes=

        (NEXUS.state.tradeRoutes||[])

        .filter(r=>r.id!==id);

}

/* ========================================================= */

function blockadeTradeRoute(id){

    const route=
        (NEXUS.state.tradeRoutes||[])
        .find(r=>r.id===id);

    if(!route)return;

    route.risk=
        clamp(
            route.risk+35,
            0,
            100
        );

}

/* ========================================================= */

function restoreTradeRoute(id){

    const route=
        (NEXUS.state.tradeRoutes||[])
        .find(r=>r.id===id);

    if(!route)return;

    route.risk=
        Math.max(
            0,
            route.risk-20
        );

}

/* ========================================================= */

function getTradeBreakdown(
    country=getSelectedCountry()
){

    const routes=

        (NEXUS.state.tradeRoutes||[])

        .filter(r=>

            r.exporter===country.name ||

            r.importer===country.name

        );

    return{

        exports:
            country.exports,

        imports:
            country.imports,

        tradeBalance:
            country.tradeBalance,

        currentAccount:
            country.currentAccount,

        routes

    };

}

/* =========================================================
   INTEGRACIÓN
========================================================= */

const OLD_SIMULATION_TICK_TRADE=
window.simulationTick;

function simulationTick(){

    if(typeof OLD_SIMULATION_TICK_TRADE==="function")
        OLD_SIMULATION_TICK_TRADE();

    simulateInternationalTrade();

}

/* =========================================================
   EXPORT
========================================================= */

window.simulateInternationalTrade=
simulateInternationalTrade;

window.updateTradeBalance=
updateTradeBalance;

window.updateStrategicImports=
updateStrategicImports;

window.updateStrategicExports=
updateStrategicExports;

window.updateTradeRevenue=
updateTradeRevenue;

window.simulateTradeRoutes=
simulateTradeRoutes;

window.simulateSingleTradeRoute=
simulateSingleTradeRoute;

window.createTradeRoute=
createTradeRoute;

window.removeTradeRoute=
removeTradeRoute;

window.blockadeTradeRoute=
blockadeTradeRoute;

window.restoreTradeRoute=
restoreTradeRoute;

window.getTradeBreakdown=
getTradeBreakdown;

window.simulationTick=
simulationTick;



/* =========================================================
   SIMULATION.JS v3
   BLOQUE 11/12
   Debug, integridad, errores seguros y herramientas dev.
========================================================= */

NEXUS.debug = NEXUS.debug || {
  enabled: false,
  lastErrors: [],
  tickCount: 0,
  lastTickMs: 0
};

function safeCall(label, fn) {
  const start = performance.now();

  try {
    const result = fn();
    NEXUS.debug.lastTickMs += performance.now() - start;
    return result;
  } catch (error) {
    console.error(`[NEXUS ERROR] ${label}`, error);

    NEXUS.debug.lastErrors.push({
      label,
      message: error.message,
      time: new Date().toISOString()
    });

    NEXUS.debug.lastErrors = NEXUS.debug.lastErrors.slice(-30);

    addEvent?.("⚠️", `Error controlado en ${label}: ${error.message}`);
    return null;
  }
}

const OLD_SIMULATION_TICK_SAFE = window.simulationTick;

function simulationTick() {
  NEXUS.debug.tickCount++;
  NEXUS.debug.lastTickMs = 0;

  safeCall("simulationTick anterior", () => {
    if (typeof OLD_SIMULATION_TICK_SAFE === "function") {
      OLD_SIMULATION_TICK_SAFE();
    }
  });

  safeCall("sanitizeGameState", sanitizeGameState);
  safeCall("simulationHealthCheck", simulationHealthCheck);

  if (NEXUS.debug.enabled && NEXUS.debug.tickCount % 30 === 0) {
    console.table(getSimulationPerformanceSummary());
  }
}

function toggleDebugMode() {
  NEXUS.debug.enabled = !NEXUS.debug.enabled;
  addEvent("🧪", `Modo debug: ${NEXUS.debug.enabled ? "ON" : "OFF"}.`);
  renderAll?.();
}

function repairSimulationState() {
  sanitizeGameState();

  for (const country of NEXUS.state.countries || []) {
    country.regions = (country.regions || []).filter(Boolean);
    country.companies = (country.companies || []).filter(Boolean);

    for (const company of country.companies) {
      company.price = Math.max(0.25, safeNumber(company.price, 25));
      company.shares = Math.max(1_000_000, safeNumber(company.shares, 100_000_000));
      normalizeCompanyHistory(company);
    }

    for (const region of country.regions) {
      region.name ||= "Región";
      region.population = Math.max(0, safeNumber(region.population, 0));
      region.gdp = Math.max(0, safeNumber(region.gdp, 0));
      region.buildings ??= [];
    }
  }

  refreshSimulationCache();
  updateWorldAggregates();
  rankCountriesByMilitaryPower();

  addEvent("🛠️", "Estado de simulación reparado.");
  renderAll?.();
}

function resetSimulation() {
  if (!confirm?.("¿Reiniciar NEXUS? Se perderá la partida actual.")) return;

  NEXUS.state = createInitialGameState();
  NEXUS.simDate = new Date(2026, 0, 1);

  sanitizeGameState();
  refreshSimulationCache();

  addEvent("♻️", "Simulación reiniciada.");
  renderAll?.();
}

function quickBalancePass() {
  for (const country of NEXUS.state.countries || []) {
    country.treasury = Math.max(country.treasury, country.gdp * 0.00015);
    country.foodProduction = Math.max(country.foodProduction, country.foodConsumption * 0.75);
    country.energyProduction = Math.max(country.energyProduction, country.energyDemand * 0.65);
    country.stability = clamp(country.stability, 15, 95);
    country.happiness = clamp(country.happiness, 10, 95);
    country.warRisk = clamp(country.warRisk, 0, 100);
    country.sanctions = clamp(country.sanctions, 0, 80);
  }

  addEvent("⚖️", "Balance rápido aplicado.");
  renderAll?.();
}

function grantPlayerFunds(amount = 1_000_000_000) {
  const country = getSelectedCountry();
  if (!country) return;

  country.treasury += Number(amount) || 1_000_000_000;

  addEvent("💶", `${country.name}: fondos añadidos ${formatMoney(amount)}.`);
  renderAll?.();
}

function grantPlayerResearch(amount = 1000) {
  const country = getSelectedCountry();
  if (!country) return;

  country.research += Number(amount) || 1000;
  country.cyber += Math.round((Number(amount) || 1000) * 0.25);

  addEvent("🔬", `${country.name}: investigación añadida +${amount}.`);
  renderAll?.();
}

function grantPlayerMilitary() {
  const country = getSelectedCountry();
  if (!country) return;

  country.units ??= {};

  const units = getAvailableMilitaryUnitsForCountry(country).slice(0, 6);

  for (const unit of units) {
    country.units[unit.id] = (country.units[unit.id] || 0) + 2;
  }

  updateMilitaryPowerFromUnits(country);

  addEvent("🛡️", `${country.name}: refuerzos militares de prueba añadidos.`);
  renderAll?.();
}

function getDebugState() {
  return {
    debug: NEXUS.debug,
    health: simulationHealthCheck(),
    performance: getSimulationPerformanceSummary(),
    date: NEXUS.simDate,
    selectedCountry: NEXUS.state.selectedCountry,
    world: NEXUS.state.world
  };
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 11
========================================================= */

window.safeCall = safeCall;
window.toggleDebugMode = toggleDebugMode;
window.repairSimulationState = repairSimulationState;
window.resetSimulation = resetSimulation;
window.quickBalancePass = quickBalancePass;
window.grantPlayerFunds = grantPlayerFunds;
window.grantPlayerResearch = grantPlayerResearch;
window.grantPlayerMilitary = grantPlayerMilitary;
window.getDebugState = getDebugState;
window.simulationTick = simulationTick;


/* =========================================================
   SIMULATION.JS v3
   BLOQUE 12/12
   Inicialización final, arranque seguro y API pública.
========================================================= */

function initializeSimulationEngine() {
  window.NEXUS = window.NEXUS || {};

  NEXUS.state ??= createInitialGameState();
  NEXUS.simDate ??= new Date(2026, 0, 1);

  sanitizeGameState();
  refreshSimulationCache();
  updateWorldAggregates();
  rankCountriesByMilitaryPower();
  initializeObjectives();

  NEXUS.simulation ??= {
    running: false,
    speed: 1,
    timer: null
  };

  addEvent("🚀", "Motor NEXUS inicializado correctamente.");
  renderAll?.();
}

function hardStartSimulation() {
  initializeSimulationEngine();
  startSimulation();
}

function hardPauseSimulation() {
  pauseSimulation();
  saveGame("autosave");
}

function hardStepDay() {
  initializeSimulationEngine();
  stepSimulation(1);
  renderAll?.();
}

function hardStepMonth() {
  initializeSimulationEngine();
  stepSimulation(30);
  renderAll?.();
}

function hardStepYear() {
  initializeSimulationEngine();
  stepSimulation(365);
  renderAll?.();
}

function setPlayableCountry(countryName) {
  const country = getCountryByName(NEXUS.state.countries, countryName);

  if (!country) {
    addEvent("⛔", `País no encontrado: ${countryName}.`);
    renderAll?.();
    return;
  }

  NEXUS.state.selectedCountry = country.name;
  refreshSimulationCache();

  addEvent("🎮", `País jugable seleccionado: ${country.name}.`);
  renderAll?.();
}

function getSelectedCountry() {
  return getCountryByName(
    NEXUS.state.countries || [],
    NEXUS.state.selectedCountry || "España"
  );
}

function getSelectedRegion() {
  const country = getSelectedCountry();
  if (!country) return null;

  const selectedId = NEXUS.state.selectedRegionId;

  return (
    country.regions?.find(region => region.id === selectedId) ||
    country.regions?.find(region => region.type === "capital") ||
    country.regions?.[0] ||
    null
  );
}

function setSelectedRegion(regionId) {
  const country = getSelectedCountry();
  if (!country) return;

  const region = country.regions?.find(r => r.id === regionId);
  if (!region) return;

  NEXUS.state.selectedRegionId = region.id;
  renderAll?.();
}

function getSimulationYear() {
  return NEXUS.simDate?.getFullYear?.() || 2026;
}

function getDayOfYear() {
  const date = NEXUS.simDate || new Date(2026, 0, 1);
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function getSimulationDateText() {
  return (NEXUS.simDate || new Date()).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function addEvent(icon, message) {
  if (!NEXUS?.state) return;

  NEXUS.state.events ??= [];

  NEXUS.state.events.push({
    icon,
    message,
    year: getSimulationYear(),
    day: getDayOfYear(),
    date: getSimulationDateText(),
    timestamp: Date.now()
  });

  NEXUS.state.events = NEXUS.state.events.slice(-180);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomChoice(array) {
  if (!array || !array.length) return null;
  return array[Math.floor(Math.random() * array.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-ES", {
    notation: "compact",
    maximumFractionDigits: 2
  }).format(Number(value) || 0) + "€";
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function renderAll() {
  renderSimulation?.();
}

/* =========================================================
   API PÚBLICA FINAL
========================================================= */

window.NEXUS_API = {
  initialize: initializeSimulationEngine,
  start: hardStartSimulation,
  pause: hardPauseSimulation,
  stepDay: hardStepDay,
  stepMonth: hardStepMonth,
  stepYear: hardStepYear,
  setSpeed: setSimulationSpeed,
  save: saveGame,
  load: loadGame,
  reset: resetSimulation,
  repair: repairSimulationState,
  debug: getDebugState
};

/* =========================================================
   EXPORT GLOBAL — BLOQUE 12
========================================================= */

window.initializeSimulationEngine = initializeSimulationEngine;
window.hardStartSimulation = hardStartSimulation;
window.hardPauseSimulation = hardPauseSimulation;
window.hardStepDay = hardStepDay;
window.hardStepMonth = hardStepMonth;
window.hardStepYear = hardStepYear;

window.setPlayableCountry = setPlayableCountry;
window.getSelectedCountry = getSelectedCountry;
window.getSelectedRegion = getSelectedRegion;
window.setSelectedRegion = setSelectedRegion;

window.getSimulationYear = getSimulationYear;
window.getDayOfYear = getDayOfYear;
window.getSimulationDateText = getSimulationDateText;

window.addEvent = addEvent;
window.randomBetween = randomBetween;
window.randomChoice = randomChoice;
window.clamp = clamp;
window.formatMoney = formatMoney;
window.formatNumber = formatNumber;
window.renderAll = renderAll;

/* =========================================================
   AUTOARRANQUE SEGURO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  try {
    initializeSimulationEngine();
  } catch (error) {
    console.error("Error inicializando NEXUS:", error);
  }
});





