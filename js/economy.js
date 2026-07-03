/* =========================================================
   NEXUS RTS — ECONOMY.JS
   Sistema económico avanzado:
   PIB, tesorería, deuda, comercio, energía, inflación,
   bolsa, sectores productivos e indicadores absolutos.
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURACIÓN ECONÓMICA
========================================================= */

const ECONOMY_CONFIG = {
  baseInterestRate: 0.035,
  inflationTarget: 0.02,
  maxDebtStressRatio: 1.2,
  minimumStockPrice: 2,
  defaultMarketSentiment: 62
};

/* =========================================================
   ACTUALIZACIÓN ECONÓMICA DIARIA
========================================================= */

function updateEconomyDaily(country) {
  if (!country) return;

  ensureEconomicFields(country);

  country.previousGDP = country.gdp;

  updateSectorOutput(country);
  updateTradeBalance(country);
  updateInflation(country);
  updateDebtService(country);
  updateTreasury(country);
  updateGDPPerCapita(country);
  updateEconomicStress(country);
}

function ensureEconomicFields(country) {
  country.inflation ??= 0.025;
  country.interestRate ??= ECONOMY_CONFIG.baseInterestRate;
  country.debtService ??= 0;
  country.economicStress ??= 0;
  country.privateInvestment ??= country.gdp * 0.18;
  country.publicSpending ??= country.gdp * 0.21;
  country.consumerDemand ??= country.gdp * 0.48;
  country.industrialOutput ??= country.gdp * 0.28;
  country.servicesOutput ??= country.gdp * 0.56;
  country.agricultureOutput ??= country.gdp * 0.04;
  country.energyCostIndex ??= 100;
  country.productivityIndex ??= 100;
}

/* =========================================================
   SECTORES PRODUCTIVOS
========================================================= */

function updateSectorOutput(country) {
  const energyBalance = country.energyProduction - country.energyDemand;
  const energyEffect = clamp(energyBalance / Math.max(country.energyDemand, 1), -0.2, 0.12);
  const stabilityEffect = (country.stability - 60) / 100;
  const researchEffect = country.research / 20_000;
  const sanctionsEffect = -country.sanctions * 0.002;
  const climateEffect = -country.climateRisk * 0.0008;

  const productivityGrowth =
    0.00004 +
    researchEffect +
    stabilityEffect * 0.0008 +
    energyEffect * 0.0012 +
    sanctionsEffect +
    climateEffect;

  country.productivityIndex = Math.max(
    40,
    country.productivityIndex * (1 + productivityGrowth)
  );

  country.industrialOutput = Math.max(
    0,
    country.industrialOutput * (1 + productivityGrowth + energyEffect * 0.002)
  );

  country.servicesOutput = Math.max(
    0,
    country.servicesOutput * (1 + productivityGrowth + country.happiness * 0.000002)
  );

  country.agricultureOutput = Math.max(
    0,
    country.agricultureOutput * (1 + productivityGrowth - country.climateRisk * 0.00001)
  );

  country.gdp =
    country.industrialOutput +
    country.servicesOutput +
    country.agricultureOutput +
    country.privateInvestment +
    country.publicSpending;
}

/* =========================================================
   COMERCIO EXTERIOR
========================================================= */

function updateTradeBalance(country) {
  const competitiveness =
    country.productivityIndex / 100 *
    (country.stability / 70) *
    (1 - country.sanctions * 0.01);

  const energyImportPressure = Math.max(0, country.energyDemand - country.energyProduction) * 20_000;
  const industrialExportGrowth = country.industrialOutput * 0.000015 * competitiveness;
  const servicesExportGrowth = country.servicesOutput * 0.000006 * (country.relation / 70);

  country.exports = Math.max(
    0,
    country.exports + industrialExportGrowth + servicesExportGrowth
  );

  country.imports = Math.max(
    0,
    country.imports + energyImportPressure + country.consumerDemand * 0.000004
  );

  country.balance = country.exports - country.imports;
}

/* =========================================================
   INFLACIÓN / TIPOS / DEUDA
========================================================= */

function updateInflation(country) {
  const energyDeficit = Math.max(0, country.energyDemand - country.energyProduction);
  const energyPressure = energyDeficit / Math.max(country.energyDemand, 1) * 0.12;
  const fiscalPressure = country.publicSpending / Math.max(country.gdp, 1) * 0.03;
  const demandPressure = country.consumerDemand / Math.max(country.gdp, 1) * 0.02;
  const sanctionsPressure = country.sanctions * 0.003;

  country.inflation = clamp(
    country.inflation * 0.96 +
      ECONOMY_CONFIG.inflationTarget * 0.04 +
      energyPressure +
      fiscalPressure +
      demandPressure +
      sanctionsPressure,
    -0.02,
    0.35
  );

  country.interestRate = clamp(
    ECONOMY_CONFIG.baseInterestRate +
      Math.max(0, country.inflation - ECONOMY_CONFIG.inflationTarget) * 0.8 +
      country.economicStress * 0.001,
    0.005,
    0.25
  );
}

function updateDebtService(country) {
  country.debtService = country.debt * country.interestRate / 365;
}

function updateTreasury(country) {
  const taxIncome = country.gdp / 365 * country.taxRate;
  const tradeIncome = Math.max(0, country.balance) / 365 * 0.05;
  const militaryCost = country.military * 55;
  const energySubsidy = Math.max(0, country.energyDemand - country.energyProduction) * 180;
  const publicCost = country.publicSpending / 365;
  const sanctionsCost = country.sanctions * 2_500_000;

  const dailyBalance =
    taxIncome +
    tradeIncome -
    militaryCost -
    energySubsidy -
    publicCost -
    country.debtService -
    sanctionsCost;

  country.lastDailyBalance = Math.round(dailyBalance);
  country.treasury += country.lastDailyBalance;

  if (country.treasury < 0) {
    const deficit = Math.abs(country.treasury);
    country.debt += deficit;
    country.treasury = 0;
  }
}

function updateGDPPerCapita(country) {
  country.gdpPerCapita = country.gdp / Math.max(country.population, 1);
}

function updateEconomicStress(country) {
  const debtRatio = country.debt / Math.max(country.gdp, 1);
  const inflationStress = Math.max(0, country.inflation - 0.04) * 100;
  const debtStress = Math.max(0, debtRatio - 0.8) * 60;
  const energyStress = Math.max(0, country.energyDemand - country.energyProduction) / Math.max(country.energyDemand, 1) * 40;
  const sanctionsStress = country.sanctions * 1.8;

  country.economicStress = clamp(
    inflationStress + debtStress + energyStress + sanctionsStress,
    0,
    100
  );
}

/* =========================================================
   BALANCE ECONÓMICO CONSULTIVO
   Compatible con simulation.js / ui.js.
========================================================= */

function calculateAdvancedDailyBalance(country) {
  ensureEconomicFields(country);

  const taxIncome = country.gdp / 365 * country.taxRate;
  const tradeIncome = Math.max(0, country.balance) / 365 * 0.05;
  const militaryCost = country.military * 55;
  const energyCost = Math.max(0, country.energyDemand - country.energyProduction) * 180;
  const debtCost = country.debt * country.interestRate / 365;
  const sanctionsCost = country.sanctions * 2_500_000;
  const publicCost = country.publicSpending / 365;

  return Math.round(
    taxIncome +
    tradeIncome -
    militaryCost -
    energyCost -
    debtCost -
    sanctionsCost -
    publicCost
  );
}

/* =========================================================
   MERCADO / BOLSA
========================================================= */

function updateFinancialMarkets() {
  if (!NEXUS?.state?.market) return;

  const country = getSelectedCountry();
  const sentiment = calculateMarketSentiment(country);

  NEXUS.state.market.forEach(asset => {
    updateAssetPrice(asset, country, sentiment);
  });

  NEXUS.state.global.marketSentiment = sentiment;
}

function calculateMarketSentiment(country) {
  const stability = country.stability;
  const happiness = country.happiness;
  const stress = country.economicStress || 0;
  const inflation = (country.inflation || 0.02) * 100;
  const sanctions = country.sanctions;
  const climate = country.climateRisk;

  return clamp(
    50 +
      (stability - 60) * 0.35 +
      (happiness - 60) * 0.15 -
      stress * 0.45 -
      Math.max(0, inflation - 4) * 0.8 -
      sanctions * 1.2 -
      climate * 0.08,
    0,
    100
  );
}

function updateAssetPrice(asset, country, sentiment) {
  const sectorBeta = getSectorBeta(asset.sector);
  const macroReturn =
    (sentiment - 50) * 0.002 *
    sectorBeta;

  const gdpEffect =
    (country.gdp - country.previousGDP) /
    Math.max(country.previousGDP || country.gdp, 1) *
    18 *
    sectorBeta;

  const energyEffect =
    asset.sector === "Energía"
      ? Math.max(0, country.energyDemand - country.energyProduction) / Math.max(country.energyDemand, 1) * 1.1
      : -Math.max(0, country.energyDemand - country.energyProduction) / Math.max(country.energyDemand, 1) * 0.5;

  const randomShock = randomBetween(-0.018, 0.021);

  const dailyReturn =
    macroReturn +
    gdpEffect +
    energyEffect +
    randomShock -
    country.sanctions * 0.0008;

  asset.delta = dailyReturn * 100;
  asset.price = Math.max(
    ECONOMY_CONFIG.minimumStockPrice,
    asset.price * (1 + dailyReturn)
  );
}

function getSectorBeta(sector) {
  const betas = {
    "Industria pesada": 1.25,
    "Tecnología": 1.55,
    "Alimentación": 0.72,
    "Energía": 1.15,
    "Defensa": 1.35,
    "Finanzas": 1.2
  };

  return betas[sector] || 1.0;
}

/* =========================================================
   POLÍTICAS ECONÓMICAS AVANZADAS
========================================================= */

function executeEconomicPolicy(policyId) {
  const country = getSelectedCountry();

  const policies = {
    austerity: {
      cost: 0,
      execute: () => {
        country.publicSpending *= 0.96;
        country.happiness = clamp(country.happiness - 0.8, 0, 100);
        country.economicStress = clamp(country.economicStress - 1.5, 0, 100);
        addEvent("📉", "Plan de austeridad aprobado: baja el gasto público, cae la felicidad.");
      }
    },

    industrial_subsidy: {
      cost: 180_000_000,
      execute: () => {
        country.industrialOutput += 120_000_000;
        country.privateInvestment += 40_000_000;
        country.co2 += 1_100_000;
        addEvent("🏭", "Subsidio industrial aprobado: aumenta output industrial y CO₂.");
      }
    },

    innovation_credit: {
      cost: 150_000_000,
      execute: () => {
        country.research += 180;
        country.productivityIndex += 2.2;
        country.privateInvestment += 35_000_000;
        addEvent("⚗️", "Crédito fiscal a innovación aprobado: sube productividad e I+D.");
      }
    },

    energy_subsidy: {
      cost: 120_000_000,
      execute: () => {
        country.energyCostIndex = Math.max(60, country.energyCostIndex - 8);
        country.happiness = clamp(country.happiness + 0.5, 0, 100);
        addEvent("⚡", "Subsidio energético aplicado: baja la presión energética.");
      }
    }
  };

  const policy = policies[policyId];

  if (!policy) {
    console.warn("Política económica no reconocida:", policyId);
    return;
  }

  if (country.treasury < policy.cost) {
    addEvent("⛔", `Tesorería insuficiente. Faltan ${formatEuro(policy.cost - country.treasury)}.`);
    renderAll();
    return;
  }

  country.treasury -= policy.cost;
  policy.execute();

  renderAll();
}

/* =========================================================
   SNAPSHOT ECONÓMICO
========================================================= */

function getEconomicSnapshot(country) {
  ensureEconomicFields(country);

  return {
    gdp: country.gdp,
    gdpPerCapita: country.gdpPerCapita,
    treasury: country.treasury,
    debt: country.debt,
    debtToGDP: country.debt / Math.max(country.gdp, 1),
    dailyBalance: country.lastDailyBalance || calculateAdvancedDailyBalance(country),
    inflation: country.inflation,
    interestRate: country.interestRate,
    debtService: country.debtService,
    industrialOutput: country.industrialOutput,
    servicesOutput: country.servicesOutput,
    agricultureOutput: country.agricultureOutput,
    imports: country.imports,
    exports: country.exports,
    balance: country.balance,
    economicStress: country.economicStress,
    marketSentiment: calculateMarketSentiment(country)
  };
}

/* =========================================================
   INTEGRACIÓN OPCIONAL CON EL MOTOR EXISTENTE
   simulation.js ya tiene simulateMarkets().
   Este archivo añade updateEconomyDaily() y updateFinancialMarkets().
   Para activarlo, se puede llamar desde simulateOneDay().
========================================================= */

function runAdvancedEconomyTick() {
  const country = getSelectedCountry();

  updateEconomyDaily(country);
  updateFinancialMarkets();
}

/* =========================================================
   EXPORT GLOBAL
========================================================= */

window.ECONOMY_CONFIG = ECONOMY_CONFIG;

window.updateEconomyDaily = updateEconomyDaily;
window.ensureEconomicFields = ensureEconomicFields;
window.updateSectorOutput = updateSectorOutput;
window.updateTradeBalance = updateTradeBalance;
window.updateInflation = updateInflation;
window.updateDebtService = updateDebtService;
window.updateTreasury = updateTreasury;
window.updateGDPPerCapita = updateGDPPerCapita;
window.updateEconomicStress = updateEconomicStress;

window.calculateAdvancedDailyBalance = calculateAdvancedDailyBalance;

window.updateFinancialMarkets = updateFinancialMarkets;
window.calculateMarketSentiment = calculateMarketSentiment;
window.updateAssetPrice = updateAssetPrice;
window.getSectorBeta = getSectorBeta;

window.executeEconomicPolicy = executeEconomicPolicy;
window.getEconomicSnapshot = getEconomicSnapshot;
window.runAdvancedEconomyTick = runAdvancedEconomyTick;
