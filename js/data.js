/* =========================================================
   NEXUS RTS — DATA.JS v3
   Parte 1/5
   Constantes globales, capas, edificios, ideologías,
   regímenes, unidades militares y empresas base.
   ========================================================= */

"use strict";

/* =========================================================
   CAPAS DEL MAPA
========================================================= */

const MAP_LAYERS = {
  political: "Político",
  economy: "Economía",
  population: "Población",
  happiness: "Felicidad",
  stability: "Estabilidad",
  military: "Militar",
  pollution: "Contaminación",
  climate: "Riesgo climático",
  resources: "Recursos",
  diplomacy: "Diplomacia",
  food: "Alimentación",
  energy: "Energía"
};

/* =========================================================
   REGÍMENES POLÍTICOS
========================================================= */

const REGIMES = {
  democracy: {
    id: "democracy",
    name: "Democracia",
    stability: 4,
    happiness: 5,
    taxEfficiency: 0.98,
    repression: 0.15,
    electionCycleYears: 4,
    marketFreedom: 0.8
  },
  authoritarian: {
    id: "authoritarian",
    name: "Régimen autoritario",
    stability: 8,
    happiness: -8,
    taxEfficiency: 1.08,
    repression: 0.72,
    electionCycleYears: 0,
    marketFreedom: 0.38
  },
  technocracy: {
    id: "technocracy",
    name: "Tecnocracia",
    stability: 7,
    happiness: 1,
    taxEfficiency: 1.05,
    repression: 0.28,
    electionCycleYears: 6,
    marketFreedom: 0.68
  },
  monarchy: {
    id: "monarchy",
    name: "Monarquía ejecutiva",
    stability: 5,
    happiness: -1,
    taxEfficiency: 1.01,
    repression: 0.42,
    electionCycleYears: 0,
    marketFreedom: 0.55
  }
};

/* =========================================================
   IDEOLOGÍAS
========================================================= */

const IDEOLOGIES = {
  socialism: {
    id: "socialism",
    name: "Socialismo",
    taxModifier: 1.16,
    socialSpendingModifier: 1.28,
    privateInvestmentModifier: 0.86,
    publicSpendingModifier: 1.2,
    happinessModifier: 5,
    businessConfidence: -8
  },
  liberalism: {
    id: "liberalism",
    name: "Liberalismo",
    taxModifier: 0.95,
    socialSpendingModifier: 0.98,
    privateInvestmentModifier: 1.12,
    publicSpendingModifier: 0.96,
    happinessModifier: 1,
    businessConfidence: 6
  },
  capitalist_liberalism: {
    id: "capitalist_liberalism",
    name: "Liberalismo capitalista",
    taxModifier: 0.86,
    socialSpendingModifier: 0.82,
    privateInvestmentModifier: 1.26,
    publicSpendingModifier: 0.88,
    happinessModifier: -2,
    businessConfidence: 14
  },
  social_democracy: {
    id: "social_democracy",
    name: "Socialdemocracia",
    taxModifier: 1.06,
    socialSpendingModifier: 1.12,
    privateInvestmentModifier: 1.02,
    publicSpendingModifier: 1.08,
    happinessModifier: 4,
    businessConfidence: 2
  },
  nationalism: {
    id: "nationalism",
    name: "Nacionalismo",
    taxModifier: 1.02,
    socialSpendingModifier: 0.95,
    privateInvestmentModifier: 0.98,
    publicSpendingModifier: 1.04,
    happinessModifier: 0,
    businessConfidence: -2,
    militaryModifier: 1.16
  },
  green: {
    id: "green",
    name: "Ecologismo",
    taxModifier: 1.08,
    socialSpendingModifier: 1.05,
    privateInvestmentModifier: 0.95,
    publicSpendingModifier: 1.06,
    happinessModifier: 3,
    businessConfidence: -4,
    co2Modifier: 0.86
  }
};

/* =========================================================
   EDIFICIOS / CONSTRUCCIÓN
========================================================= */

const BUILDINGS = {
  residential: [
    {
      id: "housing",
      icon: "🏠",
      name: "Barrio residencial",
      category: "Residencial",
      cost: 8_500_000,
      days: 25,
      population: 18_000,
      jobs: 900,
      energy: -18,
      co2: 900,
      happiness: 0.6,
      foodDemand: 1_900,
      waterDemand: 6_800,
      effect: "+18.000 habitantes · +900 empleos · -18 MW"
    },
    {
      id: "hospital",
      icon: "🏥",
      name: "Hospital comarcal",
      category: "Residencial",
      cost: 18_000_000,
      days: 45,
      jobs: 1_600,
      energy: -12,
      co2: 650,
      happiness: 1.4,
      socialCost: 1_200_000,
      effect: "+1.600 empleos · +salud pública · -12 MW"
    },
    {
      id: "university",
      icon: "🎓",
      name: "Universidad técnica",
      category: "Residencial",
      cost: 42_000_000,
      days: 90,
      jobs: 2_400,
      energy: -20,
      research: 45,
      co2: 1_100,
      happiness: 0.8,
      effect: "+45 I+D · +2.400 empleos · -20 MW"
    }
  ],

  industries: [
    {
      id: "textile",
      icon: "🏭",
      name: "Fábrica textil",
      category: "Industrias",
      cost: 12_000_000,
      days: 30,
      gdp: 32_000_000,
      jobs: 320,
      energy: -18,
      co2: 9_000,
      effect: "+32 M€ PIB · +320 empleos · +9.000 t CO₂"
    },
    {
      id: "steel",
      icon: "🏗️",
      name: "Planta de acero",
      category: "Industrias",
      cost: 28_000_000,
      days: 60,
      gdp: 95_000_000,
      jobs: 1_200,
      energy: -75,
      co2: 52_000,
      effect: "+95 M€ PIB · +1.200 empleos · +52.000 t CO₂"
    },
    {
      id: "cars",
      icon: "🚘",
      name: "Planta de automóviles",
      category: "Industrias",
      cost: 45_000_000,
      days: 90,
      gdp: 140_000_000,
      jobs: 1_500,
      energy: -90,
      co2: 41_000,
      companyType: "automotive",
      effect: "+140 M€ PIB · +1.500 empleos · +41.000 t CO₂"
    },
    {
      id: "chemical",
      icon: "🧪",
      name: "Planta química",
      category: "Industrias",
      cost: 35_000_000,
      days: 60,
      gdp: 115_000_000,
      jobs: 850,
      energy: -65,
      co2: 67_000,
      effect: "+115 M€ PIB · +850 empleos · +67.000 t CO₂"
    },
    {
      id: "electronics",
      icon: "🔌",
      name: "Planta electrónica",
      category: "Industrias",
      cost: 26_000_000,
      days: 60,
      gdp: 100_000_000,
      jobs: 1_100,
      energy: -45,
      co2: 15_000,
      research: 8,
      companyType: "technology",
      effect: "+100 M€ PIB · +1.100 empleos · +8 I+D"
    },
    {
      id: "refinery",
      icon: "🛢️",
      name: "Refinería de petróleo",
      category: "Industrias",
      cost: 30_000_000,
      days: 75,
      gdp: 105_000_000,
      jobs: 2_000,
      energy: 120,
      co2: 98_000,
      effect: "+105 M€ PIB · +120 MW · +98.000 t CO₂"
    },
    {
      id: "shipyard",
      icon: "⚓",
      name: "Astillero militar/naval",
      category: "Industrias",
      cost: 72_000_000,
      days: 120,
      gdp: 160_000_000,
      jobs: 3_200,
      energy: -110,
      co2: 36_000,
      militaryIndustry: true,
      effect: "+160 M€ PIB · habilita producción naval avanzada"
    }
  ],

  infrastructure: [
    {
      id: "roads",
      icon: "🛣️",
      name: "Mejorar carreteras",
      category: "Infraestructura",
      cost: 8_000_000,
      days: 30,
      gdp: 18_000_000,
      jobs: 400,
      happiness: 0.4,
      co2: 2_200,
      effect: "+18 M€ PIB · +eficiencia logística"
    },
    {
      id: "ports",
      icon: "⚓",
      name: "Mejorar puertos",
      category: "Infraestructura",
      cost: 18_000_000,
      days: 45,
      gdp: 42_000_000,
      jobs: 650,
      exports: 12_000_000,
      co2: 3_400,
      effect: "+42 M€ PIB · +12 M€ exportaciones"
    },
    {
      id: "airports",
      icon: "✈️",
      name: "Mejorar aeropuertos",
      category: "Infraestructura",
      cost: 20_000_000,
      days: 45,
      gdp: 36_000_000,
      jobs: 520,
      tourism: 1_200_000,
      energy: -18,
      co2: 8_400,
      effect: "+36 M€ PIB · +turismo"
    },
    {
      id: "grid",
      icon: "⚡",
      name: "Mejorar red eléctrica",
      category: "Infraestructura",
      cost: 10_000_000,
      days: 30,
      energy: 80,
      gdp: 15_000_000,
      jobs: 280,
      co2: 500,
      effect: "+80 MW · +15 M€ PIB"
    },
    {
      id: "rail",
      icon: "🚄",
      name: "Corredor ferroviario",
      category: "Infraestructura",
      cost: 65_000_000,
      days: 140,
      gdp: 90_000_000,
      jobs: 1_900,
      happiness: 0.8,
      co2: -8_000,
      effect: "+90 M€ PIB · -8.000 t CO₂"
    }
  ],

  energy: [
    {
      id: "solar",
      icon: "☀️",
      name: "Parque solar",
      category: "Energía",
      cost: 15_000_000,
      days: 45,
      energy: 50,
      renewableMW: 50,
      jobs: 180,
      co2: -9_000,
      effect: "+50 MW · -9.000 t CO₂"
    },
    {
      id: "wind",
      icon: "🌬️",
      name: "Parque eólico",
      category: "Energía",
      cost: 22_000_000,
      days: 60,
      energy: 100,
      renewableMW: 100,
      jobs: 240,
      co2: -17_000,
      effect: "+100 MW · -17.000 t CO₂"
    },
    {
      id: "nuclear",
      icon: "☢️",
      name: "Central nuclear",
      category: "Energía",
      cost: 120_000_000,
      days: 180,
      energy: 500,
      jobs: 1_300,
      co2: -50_000,
      effect: "+500 MW · -50.000 t CO₂"
    },
    {
      id: "gas",
      icon: "🔥",
      name: "Ciclo combinado gas",
      category: "Energía",
      cost: 38_000_000,
      days: 75,
      energy: 250,
      jobs: 500,
      co2: 74_000,
      effect: "+250 MW · +74.000 t CO₂"
    }
  ],

  agriculture: [
    {
      id: "irrigated_farms",
      icon: "🌾",
      name: "Agricultura intensiva",
      category: "Agricultura",
      cost: 16_000_000,
      days: 45,
      foodProduction: 180_000,
      waterDemand: 90_000,
      jobs: 900,
      energy: -12,
      co2: 4_500,
      effect: "+180.000 t/año comida · +900 empleos"
    },
    {
      id: "greenhouses",
      icon: "🥬",
      name: "Invernaderos tecnificados",
      category: "Agricultura",
      cost: 22_000_000,
      days: 55,
      foodProduction: 260_000,
      waterDemand: 55_000,
      jobs: 1_100,
      energy: -28,
      co2: 3_600,
      effect: "+260.000 t/año comida · alta eficiencia hídrica"
    }
  ],

  parks: [
    {
      id: "park",
      icon: "🌳",
      name: "Parque urbano",
      category: "Parques",
      cost: 6_000_000,
      days: 20,
      happiness: 1.2,
      co2: -3_000,
      tourism: 350_000,
      effect: "+felicidad · -3.000 t CO₂"
    },
    {
      id: "reserve",
      icon: "🏞️",
      name: "Reserva natural",
      category: "Parques",
      cost: 14_000_000,
      days: 40,
      happiness: 1.6,
      co2: -9_000,
      tourism: 900_000,
      effect: "+turismo verde · -9.000 t CO₂"
    }
  ],

  military: [
    {
      id: "barracks",
      icon: "🎖️",
      name: "Base terrestre",
      category: "Militar",
      cost: 25_000_000,
      days: 60,
      military: 1_800,
      jobs: 650,
      energy: -22,
      co2: 3_600,
      effect: "+1.800 poder militar"
    },
    {
      id: "airbase",
      icon: "🛫",
      name: "Base aérea",
      category: "Militar",
      cost: 65_000_000,
      days: 100,
      military: 5_200,
      jobs: 1_100,
      energy: -80,
      co2: 18_000,
      effect: "+5.200 poder militar"
    },
    {
      id: "naval",
      icon: "⚓",
      name: "Base naval",
      category: "Militar",
      cost: 90_000_000,
      days: 120,
      military: 7_600,
      jobs: 1_800,
      energy: -120,
      co2: 23_000,
      effect: "+7.600 poder militar"
    },
    {
      id: "cyber",
      icon: "🛰️",
      name: "Centro ciberdefensa",
      category: "Militar",
      cost: 42_000_000,
      days: 75,
      cyber: 420,
      research: 25,
      jobs: 700,
      energy: -16,
      co2: 900,
      effect: "+420 cyber · +25 I+D"
    }
  ]
};

/* =========================================================
   UNIDADES MILITARES
========================================================= */

const MILITARY_UNITS = [
  {
    id: "leopard_2e",
    icon: "🛡️",
    name: "Leopard 2E",
    type: "Tanque de combate",
    domain: "land",
    cost: 15_000_000,
    days: 24,
    upkeep: 48_000,
    power: 520,
    company: "Santa Bárbara Sistemas"
  },
  {
    id: "pizarro",
    icon: "🚙",
    name: "VCI Pizarro",
    type: "Vehículo combate infantería",
    domain: "land",
    cost: 7_500_000,
    days: 18,
    upkeep: 24_000,
    power: 260,
    company: "GDELS-SBS"
  },
  {
    id: "dragon_8x8",
    icon: "🚙",
    name: "VCR Dragón 8x8",
    type: "Blindado 8x8",
    domain: "land",
    cost: 6_200_000,
    days: 16,
    upkeep: 20_000,
    power: 220,
    company: "Tess Defence"
  },
  {
    id: "eurofighter",
    icon: "🛩️",
    name: "Eurofighter Typhoon",
    type: "Caza polivalente",
    domain: "air",
    cost: 95_000_000,
    days: 60,
    upkeep: 220_000,
    power: 1_650,
    company: "Airbus Defence"
  },
  {
    id: "f35a",
    icon: "🛩️",
    name: "F-35A Lightning II",
    type: "Caza furtivo",
    domain: "air",
    cost: 115_000_000,
    days: 75,
    upkeep: 310_000,
    power: 2_150,
    company: "Lockheed Martin"
  },
  {
    id: "a400m",
    icon: "✈️",
    name: "A400M Atlas",
    type: "Transporte estratégico",
    domain: "air",
    cost: 165_000_000,
    days: 80,
    upkeep: 260_000,
    power: 800,
    company: "Airbus Defence"
  },
  {
    id: "tigre",
    icon: "🚁",
    name: "EC665 Tigre",
    type: "Helicóptero ataque",
    domain: "air-land",
    cost: 42_000_000,
    days: 35,
    upkeep: 95_000,
    power: 780,
    company: "Airbus Helicopters"
  },
  {
    id: "nh90",
    icon: "🚁",
    name: "NH90",
    type: "Helicóptero táctico",
    domain: "air-land",
    cost: 38_000_000,
    days: 32,
    upkeep: 82_000,
    power: 520,
    company: "Airbus Helicopters"
  },
  {
    id: "f110",
    icon: "🚢",
    name: "Fragata F-110",
    type: "Fragata",
    domain: "sea",
    cost: 860_000_000,
    days: 240,
    upkeep: 650_000,
    power: 5_800,
    company: "Navantia"
  },
  {
    id: "alvaro_bazan",
    icon: "🚢",
    name: "Fragata Álvaro de Bazán F-100",
    type: "Fragata AEGIS",
    domain: "sea",
    cost: 720_000_000,
    days: 220,
    upkeep: 590_000,
    power: 5_200,
    company: "Navantia"
  },
  {
    id: "s80",
    icon: "🌊",
    name: "Submarino S-80 Plus",
    type: "Submarino AIP",
    domain: "sea",
    cost: 950_000_000,
    days: 300,
    upkeep: 720_000,
    power: 6_200,
    company: "Navantia"
  },
  {
    id: "juan_carlos_i",
    icon: "🛳️",
    name: "LHD Juan Carlos I",
    type: "Buque anfibio portaeronaves",
    domain: "sea-air",
    cost: 1_100_000_000,
    days: 360,
    upkeep: 1_100_000,
    power: 8_500,
    company: "Navantia"
  },
  {
    id: "carrier_light",
    icon: "🛳️",
    name: "Portaviones ligero CATOBAR",
    type: "Portaviones",
    domain: "sea-air",
    cost: 4_800_000_000,
    days: 720,
    upkeep: 3_800_000,
    power: 24_000,
    company: "Programa nacional"
  },
  {
    id: "destroyer_aegis",
    icon: "🚢",
    name: "Destructor AEGIS",
    type: "Destructor",
    domain: "sea",
    cost: 1_750_000_000,
    days: 420,
    upkeep: 1_450_000,
    power: 11_000,
    company: "Programa aliado"
  },
  {
    id: "marine_brigade",
    icon: "⚓",
    name: "Brigada anfibia",
    type: "Unidad anfibia",
    domain: "sea-land",
    cost: 180_000_000,
    days: 100,
    upkeep: 280_000,
    power: 3_200,
    company: "Infantería de Marina"
  },
  {
    id: "reaper",
    icon: "🛰️",
    name: "MQ-9 Reaper",
    type: "UAV MALE",
    domain: "air-cyber",
    cost: 32_000_000,
    days: 28,
    upkeep: 70_000,
    power: 520,
    company: "General Atomics"
  }
];


/* =========================================================
   DATA.JS v3
   Parte 2/10
   España completa: país, regiones, ciudades y nodos estratégicos
   ========================================================= */

const SPAIN_REGIONS = [
  {
    id: "madrid",
    name: "Madrid",
    type: "capital",
    lat: 40.4168,
    lon: -3.7038,
    population: 6871000,
    gdp: 261000000000,
    buildingId: "roads",
    level: 2,
    buildings: [
      { buildingId: "roads", level: 2 },
      { buildingId: "university", level: 2 },
      { buildingId: "hospital", level: 2 },
      { buildingId: "airports", level: 2 }
    ]
  },
  {
    id: "barcelona",
    name: "Barcelona",
    type: "port",
    lat: 41.3874,
    lon: 2.1686,
    population: 5660000,
    gdp: 197000000000,
    buildingId: "ports",
    level: 2,
    buildings: [
      { buildingId: "ports", level: 2 },
      { buildingId: "cars", level: 2 },
      { buildingId: "electronics", level: 1 },
      { buildingId: "university", level: 2 }
    ]
  },
  {
    id: "valencia",
    name: "Valencia",
    type: "port",
    lat: 39.4699,
    lon: -0.3763,
    population: 2600000,
    gdp: 76000000000,
    buildingId: "ports",
    level: 2,
    buildings: [
      { buildingId: "ports", level: 2 },
      { buildingId: "solar", level: 1 },
      { buildingId: "irrigated_farms", level: 2 }
    ]
  },
  {
    id: "sevilla",
    name: "Sevilla",
    type: "industry",
    lat: 37.3891,
    lon: -5.9845,
    population: 1950000,
    gdp: 52000000000,
    buildingId: "airports",
    level: 1,
    buildings: [
      { buildingId: "airports", level: 1 },
      { buildingId: "textile", level: 1 },
      { buildingId: "solar", level: 1 }
    ]
  },
  {
    id: "bilbao",
    name: "Bilbao",
    type: "industry",
    lat: 43.263,
    lon: -2.935,
    population: 1130000,
    gdp: 46000000000,
    buildingId: "steel",
    level: 2,
    buildings: [
      { buildingId: "steel", level: 2 },
      { buildingId: "ports", level: 1 },
      { buildingId: "electronics", level: 1 }
    ]
  },
  {
    id: "san-sebastian",
    name: "San Sebastián",
    type: "technology",
    lat: 43.3183,
    lon: -1.9812,
    population: 188000,
    gdp: 11500000000,
    buildingId: "university",
    level: 1,
    buildings: [
      { buildingId: "university", level: 1 },
      { buildingId: "electronics", level: 1 },
      { buildingId: "park", level: 2 }
    ]
  },
  {
    id: "zaragoza",
    name: "Zaragoza",
    type: "logistics",
    lat: 41.6488,
    lon: -0.8891,
    population: 970000,
    gdp: 30000000000,
    buildingId: "roads",
    level: 2,
    buildings: [
      { buildingId: "roads", level: 2 },
      { buildingId: "rail", level: 1 },
      { buildingId: "wind", level: 1 }
    ]
  },
  {
    id: "malaga",
    name: "Málaga",
    type: "technology",
    lat: 36.7213,
    lon: -4.4214,
    population: 1750000,
    gdp: 47000000000,
    buildingId: "electronics",
    level: 1,
    buildings: [
      { buildingId: "electronics", level: 1 },
      { buildingId: "airports", level: 2 },
      { buildingId: "ports", level: 1 },
      { buildingId: "park", level: 1 }
    ]
  },
  {
    id: "murcia",
    name: "Murcia",
    type: "agriculture",
    lat: 37.9922,
    lon: -1.1307,
    population: 1550000,
    gdp: 38000000000,
    buildingId: "greenhouses",
    level: 2,
    buildings: [
      { buildingId: "greenhouses", level: 2 },
      { buildingId: "irrigated_farms", level: 2 },
      { buildingId: "solar", level: 1 }
    ]
  },
  {
    id: "valladolid",
    name: "Valladolid",
    type: "automotive",
    lat: 41.6523,
    lon: -4.7245,
    population: 520000,
    gdp: 18500000000,
    buildingId: "cars",
    level: 1,
    buildings: [
      { buildingId: "cars", level: 1 },
      { buildingId: "roads", level: 1 }
    ]
  },
  {
    id: "vigo",
    name: "Vigo",
    type: "port",
    lat: 42.2406,
    lon: -8.7207,
    population: 480000,
    gdp: 18000000000,
    buildingId: "ports",
    level: 1,
    buildings: [
      { buildingId: "ports", level: 1 },
      { buildingId: "cars", level: 1 },
      { buildingId: "shipyard", level: 1 }
    ]
  },
  {
    id: "gijon",
    name: "Gijón",
    type: "port",
    lat: 43.5322,
    lon: -5.6611,
    population: 270000,
    gdp: 12000000000,
    buildingId: "ports",
    level: 1,
    buildings: [
      { buildingId: "ports", level: 1 },
      { buildingId: "steel", level: 1 }
    ]
  },
  {
    id: "a-coruna",
    name: "A Coruña",
    type: "port",
    lat: 43.3623,
    lon: -8.4115,
    population: 420000,
    gdp: 16000000000,
    buildingId: "ports",
    level: 1,
    buildings: [
      { buildingId: "ports", level: 1 },
      { buildingId: "wind", level: 1 }
    ]
  },
  {
    id: "cadiz-rota",
    name: "Cádiz / Rota",
    type: "naval",
    lat: 36.5271,
    lon: -6.2886,
    population: 625000,
    gdp: 19000000000,
    buildingId: "naval",
    level: 2,
    buildings: [
      { buildingId: "naval", level: 2 },
      { buildingId: "ports", level: 2 },
      { buildingId: "shipyard", level: 1 }
    ]
  },
  {
    id: "cartagena",
    name: "Cartagena",
    type: "naval",
    lat: 37.6257,
    lon: -0.9966,
    population: 220000,
    gdp: 9000000000,
    buildingId: "naval",
    level: 2,
    buildings: [
      { buildingId: "naval", level: 2 },
      { buildingId: "ports", level: 1 },
      { buildingId: "refinery", level: 1 }
    ]
  },
  {
    id: "palma",
    name: "Palma de Mallorca",
    type: "tourism",
    lat: 39.5696,
    lon: 2.6502,
    population: 920000,
    gdp: 32000000000,
    buildingId: "airports",
    level: 2,
    buildings: [
      { buildingId: "airports", level: 2 },
      { buildingId: "ports", level: 1 },
      { buildingId: "park", level: 1 }
    ]
  },
  {
    id: "las-palmas",
    name: "Las Palmas",
    type: "port",
    lat: 28.1235,
    lon: -15.4363,
    population: 860000,
    gdp: 27000000000,
    buildingId: "ports",
    level: 2,
    buildings: [
      { buildingId: "ports", level: 2 },
      { buildingId: "solar", level: 2 },
      { buildingId: "airports", level: 1 }
    ]
  }
];

const SPAIN_COMPANIES = [
  {
    id: "iberdrola",
    name: "Iberdrola",
    country: "España",
    sector: "Energía",
    price: 12.4,
    shares: 6400000000,
    owned: 0,
    controlled: false,
    history: [11.8, 12.0, 12.2, 12.1, 12.4]
  },
  {
    id: "repsol",
    name: "Repsol",
    country: "España",
    sector: "Energía fósil",
    price: 14.2,
    shares: 1250000000,
    owned: 0,
    controlled: false,
    history: [13.9, 14.1, 13.8, 14.0, 14.2]
  },
  {
    id: "indra",
    name: "Indra",
    country: "España",
    sector: "Defensa y tecnología",
    price: 21.3,
    shares: 176000000,
    owned: 0,
    controlled: false,
    history: [19.8, 20.2, 20.9, 21.0, 21.3]
  },
  {
    id: "telefonica",
    name: "Telefónica",
    country: "España",
    sector: "Telecomunicaciones",
    price: 4.3,
    shares: 5600000000,
    owned: 0,
    controlled: false,
    history: [4.1, 4.2, 4.15, 4.25, 4.3]
  },
  {
    id: "santander",
    name: "Banco Santander",
    country: "España",
    sector: "Finanzas",
    price: 5.6,
    shares: 15000000000,
    owned: 0,
    controlled: false,
    history: [5.1, 5.25, 5.38, 5.5, 5.6]
  },
  {
    id: "bbva",
    name: "BBVA",
    country: "España",
    sector: "Finanzas",
    price: 10.8,
    shares: 5900000000,
    owned: 0,
    controlled: false,
    history: [10.1, 10.3, 10.5, 10.7, 10.8]
  },
  {
    id: "seat_cupra",
    name: "SEAT / CUPRA",
    country: "España",
    sector: "Automoción",
    price: 32.0,
    shares: 800000000,
    owned: 0,
    controlled: false,
    history: [29.5, 30.1, 31.0, 31.5, 32.0]
  },
  {
    id: "navantia",
    name: "Navantia",
    country: "España",
    sector: "Defensa naval",
    price: 18.5,
    shares: 420000000,
    owned: 0,
    controlled: false,
    history: [16.8, 17.4, 17.9, 18.2, 18.5]
  },
  {
    id: "talgo",
    name: "Talgo",
    country: "España",
    sector: "Ferroviario",
    price: 4.8,
    shares: 123000000,
    owned: 0,
    controlled: false,
    history: [4.2, 4.4, 4.55, 4.7, 4.8]
  },
  {
    id: "sener",
    name: "Sener",
    country: "España",
    sector: "Ingeniería",
    price: 22.0,
    shares: 90000000,
    owned: 0,
    controlled: false,
    history: [20.5, 21.0, 21.4, 21.8, 22.0]
  }
];

const SPAIN_BASE = {
  name: "España",
  iso: "ESP",
  iso2: "ES",
  flag: "🇪🇸",
  capital: "Madrid",
  lat: 40.4168,
  lon: -3.7038,
  zoom: 6,
  area: 505990,
  population: 47615034,
  gdp: 1582320000000,
  gdpPerCapita: 33327,
  government: "Democracia",
  regime: "democracy",
  ideology: "social_democracy",
  relation: 64.2,
  happiness: 78.6,
  stability: 82.3,
  energyProduction: 289450,
  installedPower: 352180,
  energyDemand: 315000,
  foodProduction: 56500000,
  foodConsumption: 49300000,
  waterProduction: 18400000000,
  co2: 128450000,
  research: 1245,
  military: 215000,
  cyber: 1820,
  reserves: 156230000000,
  balance: 48250000000,
  imports: 298450000000,
  exports: 346700000000,
  taxRate: 0.22,
  treasury: 1265000000,
  debt: 1740000000000,
  socialSpending: 285000000000,
  pensions: 192000000000,
  healthSpending: 118000000000,
  educationSpending: 73000000000,
  defenseSpending: 24500000000,
  nextElectionYear: 2027,
  regions: SPAIN_REGIONS,
  companies: SPAIN_COMPANIES,
  units: {
    leopard_2e: 219,
    pizarro: 261,
    dragon_8x8: 40,
    eurofighter: 70,
    a400m: 14,
    tigre: 18,
    nh90: 24,
    f110: 0,
    alvaro_bazan: 5,
    s80: 1,
    juan_carlos_i: 1,
    reaper: 4
  },
  constructionQueue: [],
  militaryQueue: [],
  portfolio: {},
  sanctions: 0,
  warRisk: 0,
  greenPolicy: false,
  renewablesMW: 78000
};




/* =========================================================
   DATA.JS v3
   Parte 3/10
   Europa occidental simplificada: Francia, Alemania, Italia,
   Portugal, Reino Unido, Países Bajos, Bélgica, Suiza,
   Austria, Irlanda y países nórdicos principales.
   ========================================================= */

function simpleRegions(countryName, capital, lat, lon, extras = []) {
  return [
    {
      id: "capital",
      name: capital,
      type: "capital",
      lat,
      lon,
      population: 0,
      gdp: 0,
      buildingId: "roads",
      level: 1,
      buildings: [
        { buildingId: "roads", level: 1 },
        { buildingId: "hospital", level: 1 },
        { buildingId: "university", level: 1 }
      ]
    },
    ...extras
  ];
}

function simpleCompany(id, name, country, sector, price) {
  return {
    id,
    name,
    country,
    sector,
    price,
    shares: 1_000_000_000,
    owned: 0,
    controlled: false,
    history: [
      price * 0.92,
      price * 0.96,
      price * 0.98,
      price * 1.01,
      price
    ]
  };
}

const WESTERN_EUROPE_COUNTRIES = [
  {
    name: "Francia",
    iso: "FRA",
    iso2: "FR",
    flag: "🇫🇷",
    capital: "París",
    lat: 48.8566,
    lon: 2.3522,
    zoom: 5,
    area: 643801,
    population: 68042591,
    gdp: 3052000000000,
    gdpPerCapita: 44850,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 68,
    happiness: 76,
    stability: 79,
    energyProduction: 445000,
    installedPower: 540000,
    energyDemand: 510000,
    foodProduction: 76000000,
    foodConsumption: 71000000,
    waterProduction: 22000000000,
    co2: 221000000,
    research: 1800,
    military: 302000,
    cyber: 2150,
    reserves: 120000000000,
    balance: 51300000000,
    imports: 640000000000,
    exports: 720000000000,
    taxRate: 0.24,
    treasury: 2100000000,
    debt: 3300000000000,
    socialSpending: 650000000000,
    pensions: 365000000000,
    healthSpending: 255000000000,
    educationSpending: 155000000000,
    defenseSpending: 56000000000,
    nextElectionYear: 2027,
    regions: simpleRegions("Francia", "París", 48.8566, 2.3522, [
      {
        id: "marseille",
        name: "Marsella",
        type: "port",
        lat: 43.2965,
        lon: 5.3698,
        population: 1600000,
        gdp: 65000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "refinery", level: 1 }
        ]
      },
      {
        id: "toulouse",
        name: "Toulouse",
        type: "aerospace",
        lat: 43.6047,
        lon: 1.4442,
        population: 1050000,
        gdp: 72000000000,
        buildingId: "electronics",
        level: 2,
        buildings: [
          { buildingId: "electronics", level: 2 },
          { buildingId: "university", level: 2 },
          { buildingId: "airports", level: 1 }
        ]
      },
      {
        id: "lyon",
        name: "Lyon",
        type: "industry",
        lat: 45.764,
        lon: 4.8357,
        population: 2300000,
        gdp: 115000000000,
        buildingId: "chemical",
        level: 1,
        buildings: [
          { buildingId: "chemical", level: 1 },
          { buildingId: "roads", level: 2 }
        ]
      }
    ]),
    companies: [
      simpleCompany("airbus_fr", "Airbus", "Francia", "Aeroespacial", 160),
      simpleCompany("totalenergies", "TotalEnergies", "Francia", "Energía", 62),
      simpleCompany("thales", "Thales", "Francia", "Defensa y tecnología", 145),
      simpleCompany("renault", "Renault", "Francia", "Automoción", 48),
      simpleCompany("edf", "EDF", "Francia", "Energía nuclear", 31)
    ],
    units: {
      rafale: 96,
      leclerc: 220,
      fremm: 8,
      mistral_lhd: 3,
      barracuda_submarine: 5
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 0,
    greenPolicy: false,
    renewablesMW: 92000
  },

  {
    name: "Alemania",
    iso: "DEU",
    iso2: "DE",
    flag: "🇩🇪",
    capital: "Berlín",
    lat: 52.52,
    lon: 13.405,
    zoom: 5,
    area: 357588,
    population: 84607016,
    gdp: 4525000000000,
    gdpPerCapita: 53490,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 72,
    happiness: 77,
    stability: 80,
    energyProduction: 610000,
    installedPower: 690000,
    energyDemand: 660000,
    foodProduction: 91000000,
    foodConsumption: 87500000,
    waterProduction: 26000000000,
    co2: 420000000,
    research: 2600,
    military: 340000,
    cyber: 2500,
    reserves: 210000000000,
    balance: 50900000000,
    imports: 1170000000000,
    exports: 1420000000000,
    taxRate: 0.23,
    treasury: 3400000000,
    debt: 2850000000000,
    socialSpending: 870000000000,
    pensions: 430000000000,
    healthSpending: 360000000000,
    educationSpending: 205000000000,
    defenseSpending: 72000000000,
    nextElectionYear: 2029,
    regions: simpleRegions("Alemania", "Berlín", 52.52, 13.405, [
      {
        id: "munich",
        name: "Múnich",
        type: "automotive",
        lat: 48.1351,
        lon: 11.582,
        population: 3000000,
        gdp: 190000000000,
        buildingId: "cars",
        level: 3,
        buildings: [
          { buildingId: "cars", level: 3 },
          { buildingId: "electronics", level: 2 },
          { buildingId: "university", level: 2 }
        ]
      },
      {
        id: "hamburg",
        name: "Hamburgo",
        type: "port",
        lat: 53.5511,
        lon: 9.9937,
        population: 5400000,
        gdp: 165000000000,
        buildingId: "ports",
        level: 3,
        buildings: [
          { buildingId: "ports", level: 3 },
          { buildingId: "shipyard", level: 1 }
        ]
      },
      {
        id: "stuttgart",
        name: "Stuttgart",
        type: "automotive",
        lat: 48.7758,
        lon: 9.1829,
        population: 2800000,
        gdp: 170000000000,
        buildingId: "cars",
        level: 3,
        buildings: [
          { buildingId: "cars", level: 3 },
          { buildingId: "electronics", level: 2 }
        ]
      }
    ]),
    companies: [
      simpleCompany("volkswagen", "Volkswagen Group", "Alemania", "Automoción", 128),
      simpleCompany("mercedes", "Mercedes-Benz Group", "Alemania", "Automoción", 72),
      simpleCompany("bmw", "BMW", "Alemania", "Automoción", 101),
      simpleCompany("rheinmetall", "Rheinmetall", "Alemania", "Defensa", 490),
      simpleCompany("siemens", "Siemens", "Alemania", "Industria y tecnología", 175),
      simpleCompany("sap", "SAP", "Alemania", "Software", 185)
    ],
    units: {
      leopard_2a7: 310,
      puma_ifv: 350,
      eurofighter: 140,
      tornado: 80,
      f125_frigate: 4,
      type212_submarine: 6
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 0,
    greenPolicy: false,
    renewablesMW: 145000
  },

  {
    name: "Italia",
    iso: "ITA",
    iso2: "IT",
    flag: "🇮🇹",
    capital: "Roma",
    lat: 41.9028,
    lon: 12.4964,
    zoom: 5,
    area: 301340,
    population: 58870762,
    gdp: 2301000000000,
    gdpPerCapita: 39090,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 59,
    happiness: 74,
    stability: 71,
    energyProduction: 370000,
    installedPower: 415000,
    energyDemand: 405000,
    foodProduction: 62000000,
    foodConsumption: 59000000,
    waterProduction: 15500000000,
    co2: 298000000,
    research: 1220,
    military: 185000,
    cyber: 1500,
    reserves: 88000000000,
    balance: 33100000000,
    imports: 550000000000,
    exports: 620000000000,
    taxRate: 0.23,
    treasury: 1450000000,
    debt: 2850000000000,
    socialSpending: 420000000000,
    pensions: 310000000000,
    healthSpending: 150000000000,
    educationSpending: 90000000000,
    defenseSpending: 32000000000,
    nextElectionYear: 2027,
    regions: simpleRegions("Italia", "Roma", 41.9028, 12.4964, [
      {
        id: "milan",
        name: "Milán",
        type: "finance",
        lat: 45.4642,
        lon: 9.19,
        population: 4300000,
        gdp: 245000000000,
        buildingId: "electronics",
        level: 2,
        buildings: [
          { buildingId: "electronics", level: 2 },
          { buildingId: "roads", level: 2 }
        ]
      },
      {
        id: "turin",
        name: "Turín",
        type: "automotive",
        lat: 45.0703,
        lon: 7.6869,
        population: 1700000,
        gdp: 78000000000,
        buildingId: "cars",
        level: 2,
        buildings: [
          { buildingId: "cars", level: 2 },
          { buildingId: "steel", level: 1 }
        ]
      },
      {
        id: "trieste",
        name: "Trieste",
        type: "port",
        lat: 45.6495,
        lon: 13.7768,
        population: 400000,
        gdp: 25000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "shipyard", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("stellantis_it", "Stellantis Italia", "Italia", "Automoción", 22),
      simpleCompany("leonardo", "Leonardo", "Italia", "Defensa y aeroespacial", 23),
      simpleCompany("eni", "ENI", "Italia", "Energía", 15),
      simpleCompany("fincantieri", "Fincantieri", "Italia", "Defensa naval", 0.8),
      simpleCompany("unicredit", "UniCredit", "Italia", "Finanzas", 36)
    ],
    units: {
      ariete: 200,
      centauro: 250,
      eurofighter: 95,
      fremm: 10,
      cavour_carrier: 1,
      u212_submarine: 4
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 0,
    greenPolicy: false,
    renewablesMW: 65000
  },

  {
    name: "Portugal",
    iso: "PRT",
    iso2: "PT",
    flag: "🇵🇹",
    capital: "Lisboa",
    lat: 38.7223,
    lon: -9.1393,
    zoom: 6,
    area: 92212,
    population: 10467366,
    gdp: 287000000000,
    gdpPerCapita: 27420,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 67,
    happiness: 78,
    stability: 75,
    energyProduction: 71000,
    installedPower: 88000,
    energyDemand: 84000,
    foodProduction: 9200000,
    foodConsumption: 10800000,
    waterProduction: 4100000000,
    co2: 43000000,
    research: 420,
    military: 65000,
    cyber: 900,
    reserves: 28000000000,
    balance: 18100000000,
    imports: 72000000000,
    exports: 94000000000,
    taxRate: 0.21,
    treasury: 420000000,
    debt: 290000000000,
    socialSpending: 56000000000,
    pensions: 33000000000,
    healthSpending: 22000000000,
    educationSpending: 12000000000,
    defenseSpending: 4200000000,
    nextElectionYear: 2028,
    regions: simpleRegions("Portugal", "Lisboa", 38.7223, -9.1393, [
      {
        id: "porto",
        name: "Oporto",
        type: "industry",
        lat: 41.1579,
        lon: -8.6291,
        population: 1700000,
        gdp: 52000000000,
        buildingId: "ports",
        level: 1,
        buildings: [
          { buildingId: "ports", level: 1 },
          { buildingId: "textile", level: 1 }
        ]
      },
      {
        id: "sines",
        name: "Sines",
        type: "port",
        lat: 37.9562,
        lon: -8.8698,
        population: 15000,
        gdp: 9000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "refinery", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("edp", "EDP", "Portugal", "Energía", 4.2),
      simpleCompany("galp", "Galp", "Portugal", "Energía", 19),
      simpleCompany("jeronimo_martins", "Jerónimo Martins", "Portugal", "Distribución", 19),
      simpleCompany("navigator", "The Navigator Company", "Portugal", "Industria papelera", 4.1)
    ],
    units: {
      leopard_2a6: 37,
      f16: 25,
      vasco_da_gama_frigate: 3,
      tridente_submarine: 2
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 0,
    greenPolicy: false,
    renewablesMW: 18000
  },

  {
    name: "Reino Unido",
    iso: "GBR",
    iso2: "GB",
    flag: "🇬🇧",
    capital: "Londres",
    lat: 51.5072,
    lon: -0.1276,
    zoom: 5,
    area: 243610,
    population: 67736802,
    gdp: 3340000000000,
    gdpPerCapita: 49300,
    government: "Democracia",
    regime: "democracy",
    ideology: "liberalism",
    relation: 66,
    happiness: 75,
    stability: 74,
    energyProduction: 390000,
    installedPower: 475000,
    energyDemand: 460000,
    foodProduction: 58000000,
    foodConsumption: 72000000,
    waterProduction: 21000000000,
    co2: 326000000,
    research: 2200,
    military: 420000,
    cyber: 2700,
    reserves: 170000000000,
    balance: 62000000000,
    imports: 720000000000,
    exports: 890000000000,
    taxRate: 0.23,
    treasury: 2450000000,
    debt: 3200000000000,
    socialSpending: 720000000000,
    pensions: 360000000000,
    healthSpending: 280000000000,
    educationSpending: 160000000000,
    defenseSpending: 69000000000,
    nextElectionYear: 2029,
    regions: simpleRegions("Reino Unido", "Londres", 51.5072, -0.1276, [
      {
        id: "manchester",
        name: "Manchester",
        type: "industry",
        lat: 53.4808,
        lon: -2.2426,
        population: 2800000,
        gdp: 125000000000,
        buildingId: "electronics",
        level: 2,
        buildings: [
          { buildingId: "electronics", level: 2 },
          { buildingId: "university", level: 2 }
        ]
      },
      {
        id: "glasgow",
        name: "Glasgow",
        type: "shipyard",
        lat: 55.8642,
        lon: -4.2518,
        population: 1700000,
        gdp: 72000000000,
        buildingId: "shipyard",
        level: 2,
        buildings: [
          { buildingId: "shipyard", level: 2 },
          { buildingId: "ports", level: 1 }
        ]
      },
      {
        id: "portsmouth",
        name: "Portsmouth",
        type: "naval",
        lat: 50.8198,
        lon: -1.088,
        population: 850000,
        gdp: 36000000000,
        buildingId: "naval",
        level: 3,
        buildings: [
          { buildingId: "naval", level: 3 },
          { buildingId: "ports", level: 2 }
        ]
      }
    ]),
    companies: [
      simpleCompany("bae_systems", "BAE Systems", "Reino Unido", "Defensa", 13),
      simpleCompany("rolls_royce", "Rolls-Royce", "Reino Unido", "Aeroespacial", 5.6),
      simpleCompany("bp", "BP", "Reino Unido", "Energía", 4.9),
      simpleCompany("shell", "Shell", "Reino Unido", "Energía", 29),
      simpleCompany("barclays", "Barclays", "Reino Unido", "Finanzas", 2.2)
    ],
    units: {
      challenger_2: 227,
      f35b: 35,
      typhoon: 135,
      type45_destroyer: 6,
      astute_submarine: 5,
      queen_elizabeth_carrier: 2
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 0,
    greenPolicy: false,
    renewablesMW: 70000
  },

  {
    name: "Países Bajos",
    iso: "NLD",
    iso2: "NL",
    flag: "🇳🇱",
    capital: "Ámsterdam",
    lat: 52.3676,
    lon: 4.9041,
    zoom: 6,
    area: 41543,
    population: 17900000,
    gdp: 1118000000000,
    gdpPerCapita: 62500,
    government: "Democracia",
    regime: "democracy",
    ideology: "liberalism",
    relation: 74,
    happiness: 81,
    stability: 84,
    energyProduction: 132000,
    installedPower: 160000,
    energyDemand: 152000,
    foodProduction: 78000000,
    foodConsumption: 18500000,
    waterProduction: 6400000000,
    co2: 141000000,
    research: 980,
    military: 72000,
    cyber: 1450,
    reserves: 62000000000,
    balance: 79000000000,
    imports: 690000000000,
    exports: 920000000000,
    taxRate: 0.22,
    treasury: 900000000,
    debt: 550000000000,
    socialSpending: 190000000000,
    pensions: 105000000000,
    healthSpending: 95000000000,
    educationSpending: 52000000000,
    defenseSpending: 21000000000,
    nextElectionYear: 2028,
    regions: simpleRegions("Países Bajos", "Ámsterdam", 52.3676, 4.9041, [
      {
        id: "rotterdam",
        name: "Róterdam",
        type: "port",
        lat: 51.9244,
        lon: 4.4777,
        population: 1200000,
        gdp: 110000000000,
        buildingId: "ports",
        level: 3,
        buildings: [
          { buildingId: "ports", level: 3 },
          { buildingId: "refinery", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("asml", "ASML", "Países Bajos", "Semiconductores", 930),
      simpleCompany("ing", "ING", "Países Bajos", "Finanzas", 16),
      simpleCompany("philips", "Philips", "Países Bajos", "Tecnología médica", 25),
      simpleCompany("ahold", "Ahold Delhaize", "Países Bajos", "Distribución", 30)
    ],
    units: {
      f35a: 40,
      boxer: 200,
      de_zeven_provincien_frigate: 4,
      walrus_submarine: 4
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 0,
    greenPolicy: false,
    renewablesMW: 33000
  },

  {
    name: "Bélgica",
    iso: "BEL",
    iso2: "BE",
    flag: "🇧🇪",
    capital: "Bruselas",
    lat: 50.8503,
    lon: 4.3517,
    zoom: 6,
    area: 30528,
    population: 11700000,
    gdp: 627000000000,
    gdpPerCapita: 53600,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 73,
    happiness: 78,
    stability: 76,
    energyProduction: 89000,
    installedPower: 108000,
    energyDemand: 103000,
    foodProduction: 16000000,
    foodConsumption: 12200000,
    waterProduction: 3100000000,
    co2: 94000000,
    research: 720,
    military: 41000,
    cyber: 970,
    reserves: 26000000000,
    balance: 18000000000,
    imports: 410000000000,
    exports: 470000000000,
    taxRate: 0.24,
    treasury: 520000000,
    debt: 650000000000,
    socialSpending: 130000000000,
    pensions: 76000000000,
    healthSpending: 56000000000,
    educationSpending: 32000000000,
    defenseSpending: 9000000000,
    nextElectionYear: 2029,
    regions: simpleRegions("Bélgica", "Bruselas", 50.8503, 4.3517, [
      {
        id: "antwerp",
        name: "Amberes",
        type: "port",
        lat: 51.2194,
        lon: 4.4025,
        population: 1050000,
        gdp: 75000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "chemical", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("solvay", "Solvay", "Bélgica", "Química", 31),
      simpleCompany("umicore", "Umicore", "Bélgica", "Materiales", 15),
      simpleCompany("kbc", "KBC Group", "Bélgica", "Finanzas", 67),
      simpleCompany("ab_inbev", "AB InBev", "Bélgica", "Consumo", 57)
    ],
    units: {
      f35a: 8,
      piranha: 240,
      frigate_m: 2
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 0,
    greenPolicy: false,
    renewablesMW: 18000
  },

  {
    name: "Suiza",
    iso: "CHE",
    iso2: "CH",
    flag: "🇨🇭",
    capital: "Berna",
    lat: 46.948,
    lon: 7.4474,
    zoom: 6,
    area: 41285,
    population: 8900000,
    gdp: 884000000000,
    gdpPerCapita: 99300,
    government: "Democracia",
    regime: "democracy",
    ideology: "liberalism",
    relation: 78,
    happiness: 84,
    stability: 90,
    energyProduction: 64000,
    installedPower: 78000,
    energyDemand: 72000,
    foodProduction: 7500000,
    foodConsumption: 9300000,
    waterProduction: 2900000000,
    co2: 35000000,
    research: 1150,
    military: 145000,
    cyber: 1600,
    reserves: 92000000000,
    balance: 62000000000,
    imports: 360000000000,
    exports: 420000000000,
    taxRate: 0.18,
    treasury: 1050000000,
    debt: 330000000000,
    socialSpending: 120000000000,
    pensions: 74000000000,
    healthSpending: 70000000000,
    educationSpending: 36000000000,
    defenseSpending: 6200000000,
    nextElectionYear: 2027,
    regions: simpleRegions("Suiza", "Berna", 46.948, 7.4474, [
      {
        id: "zurich",
        name: "Zúrich",
        type: "finance",
        lat: 47.3769,
        lon: 8.5417,
        population: 1500000,
        gdp: 170000000000,
        buildingId: "electronics",
        level: 2,
        buildings: [
          { buildingId: "electronics", level: 2 },
          { buildingId: "university", level: 2 }
        ]
      },
      {
        id: "basel",
        name: "Basilea",
        type: "pharma",
        lat: 47.5596,
        lon: 7.5886,
        population: 600000,
        gdp: 85000000000,
        buildingId: "chemical",
        level: 2,
        buildings: [
          { buildingId: "chemical", level: 2 },
          { buildingId: "university", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("nestle", "Nestlé", "Suiza", "Alimentación", 95),
      simpleCompany("novartis", "Novartis", "Suiza", "Farmacia", 93),
      simpleCompany("roche", "Roche", "Suiza", "Farmacia", 245),
      simpleCompany("ubs", "UBS", "Suiza", "Finanzas", 28)
    ],
    units: {
      leopard_2: 134,
      f35a: 0,
      f18: 25
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 0,
    greenPolicy: false,
    renewablesMW: 24000
  },

  {
    name: "Austria",
    iso: "AUT",
    iso2: "AT",
    flag: "🇦🇹",
    capital: "Viena",
    lat: 48.2082,
    lon: 16.3738,
    zoom: 6,
    area: 83879,
    population: 9100000,
    gdp: 526000000000,
    gdpPerCapita: 57800,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 71,
    happiness: 81,
    stability: 83,
    energyProduction: 78000,
    installedPower: 89000,
    energyDemand: 84000,
    foodProduction: 9700000,
    foodConsumption: 9500000,
    waterProduction: 3600000000,
    co2: 61000000,
    research: 640,
    military: 24000,
    cyber: 760,
    reserves: 22000000000,
    balance: 17000000000,
    imports: 240000000000,
    exports: 265000000000,
    taxRate: 0.23,
    treasury: 420000000,
    debt: 410000000000,
    socialSpending: 105000000000,
    pensions: 62000000000,
    healthSpending: 43000000000,
    educationSpending: 26000000000,
    defenseSpending: 4200000000,
    nextElectionYear: 2029,
    regions: simpleRegions("Austria", "Viena", 48.2082, 16.3738, [
      {
        id: "graz",
        name: "Graz",
        type: "industry",
        lat: 47.0707,
        lon: 15.4395,
        population: 650000,
        gdp: 42000000000,
        buildingId: "cars",
        level: 1,
        buildings: [
          { buildingId: "cars", level: 1 },
          { buildingId: "university", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("omv", "OMV", "Austria", "Energía", 40),
      simpleCompany("erste", "Erste Group", "Austria", "Finanzas", 48),
      simpleCompany("voestalpine", "Voestalpine", "Austria", "Acero", 26),
      simpleCompany("ams_osram", "ams OSRAM", "Austria", "Semiconductores", 1.3)
    ],
    units: {
      leopard_2a4: 56,
      eurofighter: 15,
      pandur: 71
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 0,
    greenPolicy: false,
    renewablesMW: 27000
  },

  {
    name: "Irlanda",
    iso: "IRL",
    iso2: "IE",
    flag: "🇮🇪",
    capital: "Dublín",
    lat: 53.3498,
    lon: -6.2603,
    zoom: 6,
    area: 70273,
    population: 5300000,
    gdp: 545000000000,
    gdpPerCapita: 102800,
    government: "Democracia",
    regime: "democracy",
    ideology: "liberalism",
    relation: 76,
    happiness: 80,
    stability: 82,
    energyProduction: 42000,
    installedPower: 51000,
    energyDemand: 49000,
    foodProduction: 14500000,
    foodConsumption: 5500000,
    waterProduction: 2300000000,
    co2: 37000000,
    research: 620,
    military: 9000,
    cyber: 820,
    reserves: 18000000000,
    balance: 41000000000,
    imports: 170000000000,
    exports: 260000000000,
    taxRate: 0.19,
    treasury: 350000000,
    debt: 235000000000,
    socialSpending: 84000000000,
    pensions: 33000000000,
    healthSpending: 30000000000,
    educationSpending: 19000000000,
    defenseSpending: 1600000000,
    nextElectionYear: 2027,
    regions: simpleRegions("Irlanda", "Dublín", 53.3498, -6.2603, [
      {
        id: "cork",
        name: "Cork",
        type: "technology",
        lat: 51.8985,
        lon: -8.4756,
        population: 320000,
        gdp: 28000000000,
        buildingId: "electronics",
        level: 1,
        buildings: [
          { buildingId: "electronics", level: 1 },
          { buildingId: "ports", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("crh", "CRH", "Irlanda", "Materiales", 78),
      simpleCompany("kerry_group", "Kerry Group", "Irlanda", "Alimentación", 79),
      simpleCompany("ryanair", "Ryanair", "Irlanda", "Aerolíneas", 20),
      simpleCompany("aib", "AIB Group", "Irlanda", "Finanzas", 5)
    ],
    units: {
      mowag_piranha: 80,
      patrol_vessel: 6
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 0,
    greenPolicy: false,
    renewablesMW: 11000
  },

  {
    name: "Noruega",
    iso: "NOR",
    iso2: "NO",
    flag: "🇳🇴",
    capital: "Oslo",
    lat: 59.9139,
    lon: 10.7522,
    zoom: 5,
    area: 385207,
    population: 5519594,
    gdp: 579000000000,
    gdpPerCapita: 104900,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 82,
    happiness: 84,
    stability: 86,
    energyProduction: 158000,
    installedPower: 170000,
    energyDemand: 155000,
    foodProduction: 4500000,
    foodConsumption: 5800000,
    waterProduction: 3900000000,
    co2: 41000000,
    research: 530,
    military: 26000,
    cyber: 900,
    reserves: 65000000000,
    balance: 61000000000,
    imports: 110000000000,
    exports: 190000000000,
    taxRate: 0.25,
    treasury: 900000000,
    debt: 210000000000,
    socialSpending: 130000000000,
    pensions: 62000000000,
    healthSpending: 48000000000,
    educationSpending: 28000000000,
    defenseSpending: 9000000000,
    nextElectionYear: 2029,
    regions: simpleRegions("Noruega", "Oslo", 59.9139, 10.7522, [
      {
        id: "bergen",
        name: "Bergen",
        type: "port",
        lat: 60.3913,
        lon: 5.3221,
        population: 420000,
        gdp: 38000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "shipyard", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("equinor", "Equinor", "Noruega", "Energía", 28),
      simpleCompany("kongsberg", "Kongsberg Gruppen", "Noruega", "Defensa y tecnología", 120),
      simpleCompany("dnb", "DNB", "Noruega", "Finanzas", 19),
      simpleCompany("yara", "Yara", "Noruega", "Química agrícola", 32)
    ],
    units: {
      f35a: 40,
      leopard_2a4: 52,
      fridtjof_nansen_frigate: 4,
      skold_corvette: 6
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 0,
    greenPolicy: false,
    renewablesMW: 38000
  },

  {
    name: "Suecia",
    iso: "SWE",
    iso2: "SE",
    flag: "🇸🇪",
    capital: "Estocolmo",
    lat: 59.3293,
    lon: 18.0686,
    zoom: 5,
    area: 450295,
    population: 10612086,
    gdp: 593000000000,
    gdpPerCapita: 55880,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 80,
    happiness: 82,
    stability: 84,
    energyProduction: 145000,
    installedPower: 165000,
    energyDemand: 150000,
    foodProduction: 9800000,
    foodConsumption: 11000000,
    waterProduction: 4600000000,
    co2: 39000000,
    research: 620,
    military: 24000,
    cyber: 1050,
    reserves: 71000000000,
    balance: 59000000000,
    imports: 180000000000,
    exports: 210000000000,
    taxRate: 0.25,
    treasury: 820000000,
    debt: 290000000000,
    socialSpending: 145000000000,
    pensions: 68000000000,
    healthSpending: 52000000000,
    educationSpending: 33000000000,
    defenseSpending: 12000000000,
    nextElectionYear: 2028,
    regions: simpleRegions("Suecia", "Estocolmo", 59.3293, 18.0686, [
      {
        id: "goteborg",
        name: "Gotemburgo",
        type: "automotive",
        lat: 57.7089,
        lon: 11.9746,
        population: 1050000,
        gdp: 68000000000,
        buildingId: "cars",
        level: 2,
        buildings: [
          { buildingId: "cars", level: 2 },
          { buildingId: "ports", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("saab", "Saab AB", "Suecia", "Defensa y aeroespacial", 24),
      simpleCompany("volvo", "Volvo Group", "Suecia", "Automoción", 28),
      simpleCompany("ericsson", "Ericsson", "Suecia", "Telecomunicaciones", 6),
      simpleCompany("hm", "H&M", "Suecia", "Consumo", 15)
    ],
    units: {
      gripen: 90,
      strv122: 120,
      cv90: 500,
      gotland_submarine: 3,
      visby_corvette: 5
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 0,
    greenPolicy: false,
    renewablesMW: 42000
  },

  {
    name: "Dinamarca",
    iso: "DNK",
    iso2: "DK",
    flag: "🇩🇰",
    capital: "Copenhague",
    lat: 55.6761,
    lon: 12.5683,
    zoom: 6,
    area: 42952,
    population: 5940000,
    gdp: 420000000000,
    gdpPerCapita: 70700,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 79,
    happiness: 84,
    stability: 86,
    energyProduction: 63000,
    installedPower: 76000,
    energyDemand: 72000,
    foodProduction: 22000000,
    foodConsumption: 6200000,
    waterProduction: 2600000000,
    co2: 28000000,
    research: 520,
    military: 17000,
    cyber: 850,
    reserves: 24000000000,
    balance: 36000000000,
    imports: 125000000000,
    exports: 155000000000,
    taxRate: 0.25,
    treasury: 480000000,
    debt: 150000000000,
    socialSpending: 110000000000,
    pensions: 47000000000,
    healthSpending: 39000000000,
    educationSpending: 25000000000,
    defenseSpending: 7200000000,
    nextElectionYear: 2027,
    regions: simpleRegions("Dinamarca", "Copenhague", 55.6761, 12.5683, [
      {
        id: "aarhus",
        name: "Aarhus",
        type: "port",
        lat: 56.1629,
        lon: 10.2039,
        population: 360000,
        gdp: 27000000000,
        buildingId: "ports",
        level: 1,
        buildings: [
          { buildingId: "ports", level: 1 },
          { buildingId: "wind", level: 2 }
        ]
      }
    ]),
    companies: [
      simpleCompany("maersk", "Maersk", "Dinamarca", "Logística naval", 13000),
      simpleCompany("novo_nordisk", "Novo Nordisk", "Dinamarca", "Farmacia", 900),
      simpleCompany("orsted", "Ørsted", "Dinamarca", "Energía renovable", 55),
      simpleCompany("vestas", "Vestas", "Dinamarca", "Eólica", 21)
    ],
    units: {
      f35a: 10,
      leopard_2a7: 44,
      iver_huitfeldt_frigate: 3
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 0,
    greenPolicy: false,
    renewablesMW: 28000
  },

  {
    name: "Finlandia",
    iso: "FIN",
    iso2: "FI",
    flag: "🇫🇮",
    capital: "Helsinki",
    lat: 60.1699,
    lon: 24.9384,
    zoom: 5,
    area: 338455,
    population: 5560000,
    gdp: 305000000000,
    gdpPerCapita: 54800,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 78,
    happiness: 85,
    stability: 87,
    energyProduction: 82000,
    installedPower: 95000,
    energyDemand: 90000,
    foodProduction: 6200000,
    foodConsumption: 5800000,
    waterProduction: 3100000000,
    co2: 40000000,
    research: 500,
    military: 23800,
    cyber: 860,
    reserves: 18000000000,
    balance: 12000000000,
    imports: 97000000000,
    exports: 112000000000,
    taxRate: 0.24,
    treasury: 360000000,
    debt: 220000000000,
    socialSpending: 85000000000,
    pensions: 44000000000,
    healthSpending: 31000000000,
    educationSpending: 21000000000,
    defenseSpending: 6800000000,
    nextElectionYear: 2027,
    regions: simpleRegions("Finlandia", "Helsinki", 60.1699, 24.9384, [
      {
        id: "tampere",
        name: "Tampere",
        type: "industry",
        lat: 61.4978,
        lon: 23.761,
        population: 420000,
        gdp: 28000000000,
        buildingId: "electronics",
        level: 1,
        buildings: [
          { buildingId: "electronics", level: 1 },
          { buildingId: "university", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("nokia", "Nokia", "Finlandia", "Telecomunicaciones", 4),
      simpleCompany("kone", "KONE", "Finlandia", "Industria", 45),
      simpleCompany("wartsila", "Wärtsilä", "Finlandia", "Ingeniería naval", 18),
      simpleCompany("fortum", "Fortum", "Finlandia", "Energía", 13)
    ],
    units: {
      leopard_2a6: 100,
      f18: 55,
      f35a: 0,
      hamina_missile_boat: 4
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 0,
    greenPolicy: false,
    renewablesMW: 25000
  }
];

/* =========================================================
   DATA.JS v3
   Parte 4/10
   Europa oriental, Balcanes, Mediterráneo oriental y Rusia.
   Versión simplificada: países no jugables, pero interactivos.
   ========================================================= */

const EASTERN_EUROPE_COUNTRIES = [
  {
    name: "Polonia",
    iso: "POL",
    iso2: "PL",
    flag: "🇵🇱",
    capital: "Varsovia",
    lat: 52.2297,
    lon: 21.0122,
    zoom: 5,
    area: 312696,
    population: 37700000,
    gdp: 842000000000,
    gdpPerCapita: 22300,
    government: "Democracia",
    regime: "democracy",
    ideology: "nationalism",
    relation: 63,
    happiness: 70,
    stability: 72,
    energyProduction: 310000,
    installedPower: 360000,
    energyDemand: 345000,
    foodProduction: 52000000,
    foodConsumption: 39200000,
    waterProduction: 11800000000,
    co2: 305000000,
    research: 760,
    military: 216000,
    cyber: 1250,
    reserves: 82000000000,
    balance: 28000000000,
    imports: 390000000000,
    exports: 430000000000,
    taxRate: 0.19,
    treasury: 720000000,
    debt: 420000000000,
    socialSpending: 130000000000,
    pensions: 79000000000,
    healthSpending: 43000000000,
    educationSpending: 31000000000,
    defenseSpending: 33000000000,
    nextElectionYear: 2027,
    regions: simpleRegions("Polonia", "Varsovia", 52.2297, 21.0122, [
      {
        id: "gdansk",
        name: "Gdansk",
        type: "port",
        lat: 54.352,
        lon: 18.6466,
        population: 1050000,
        gdp: 42000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "shipyard", level: 1 }
        ]
      },
      {
        id: "katowice",
        name: "Katowice",
        type: "industry",
        lat: 50.2649,
        lon: 19.0238,
        population: 2100000,
        gdp: 72000000000,
        buildingId: "steel",
        level: 2,
        buildings: [
          { buildingId: "steel", level: 2 },
          { buildingId: "roads", level: 2 }
        ]
      }
    ]),
    companies: [
      simpleCompany("pkn_orlen", "PKN Orlen", "Polonia", "Energía", 16),
      simpleCompany("pge", "PGE", "Polonia", "Electricidad", 2),
      simpleCompany("pzu", "PZU", "Polonia", "Finanzas", 11),
      simpleCompany("cdprojekt", "CD Projekt", "Polonia", "Videojuegos", 28)
    ],
    units: {
      leopard_2a5: 240,
      k2_black_panther: 80,
      abrams_m1a2: 116,
      f16: 48,
      f35a: 0,
      krab_howitzer: 120
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 8,
    greenPolicy: false,
    renewablesMW: 28000
  },

  {
    name: "Chequia",
    iso: "CZE",
    iso2: "CZ",
    flag: "🇨🇿",
    capital: "Praga",
    lat: 50.0755,
    lon: 14.4378,
    zoom: 6,
    area: 78871,
    population: 10800000,
    gdp: 335000000000,
    gdpPerCapita: 31000,
    government: "Democracia",
    regime: "democracy",
    ideology: "liberalism",
    relation: 69,
    happiness: 76,
    stability: 79,
    energyProduction: 90000,
    installedPower: 106000,
    energyDemand: 99000,
    foodProduction: 10500000,
    foodConsumption: 11200000,
    waterProduction: 3300000000,
    co2: 92000000,
    research: 520,
    military: 27000,
    cyber: 720,
    reserves: 21000000000,
    balance: 15000000000,
    imports: 170000000000,
    exports: 205000000000,
    taxRate: 0.20,
    treasury: 290000000,
    debt: 150000000000,
    socialSpending: 64000000000,
    pensions: 36000000000,
    healthSpending: 22000000000,
    educationSpending: 15000000000,
    defenseSpending: 6200000000,
    nextElectionYear: 2029,
    regions: simpleRegions("Chequia", "Praga", 50.0755, 14.4378, [
      {
        id: "ostrava",
        name: "Ostrava",
        type: "industry",
        lat: 49.8209,
        lon: 18.2625,
        population: 700000,
        gdp: 26000000000,
        buildingId: "steel",
        level: 1,
        buildings: [
          { buildingId: "steel", level: 1 },
          { buildingId: "cars", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("skoda_auto", "Škoda Auto", "Chequia", "Automoción", 38),
      simpleCompany("cez", "ČEZ", "Chequia", "Energía", 36),
      simpleCompany("avast", "Avast", "Chequia", "Cyberseguridad", 15)
    ],
    units: {
      t72m4cz: 30,
      pandur_ii: 120,
      gripen: 14
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 3,
    greenPolicy: false,
    renewablesMW: 9000
  },

  {
    name: "Hungría",
    iso: "HUN",
    iso2: "HU",
    flag: "🇭🇺",
    capital: "Budapest",
    lat: 47.4979,
    lon: 19.0402,
    zoom: 6,
    area: 93030,
    population: 9600000,
    gdp: 212000000000,
    gdpPerCapita: 22100,
    government: "Democracia",
    regime: "democracy",
    ideology: "nationalism",
    relation: 48,
    happiness: 66,
    stability: 62,
    energyProduction: 52000,
    installedPower: 64000,
    energyDemand: 61000,
    foodProduction: 15500000,
    foodConsumption: 10000000,
    waterProduction: 2700000000,
    co2: 48000000,
    research: 360,
    military: 37000,
    cyber: 520,
    reserves: 13000000000,
    balance: 7000000000,
    imports: 115000000000,
    exports: 130000000000,
    taxRate: 0.18,
    treasury: 190000000,
    debt: 155000000000,
    socialSpending: 39000000000,
    pensions: 24000000000,
    healthSpending: 14000000000,
    educationSpending: 9000000000,
    defenseSpending: 4200000000,
    nextElectionYear: 2026,
    regions: simpleRegions("Hungría", "Budapest", 47.4979, 19.0402, [
      {
        id: "gyor",
        name: "Győr",
        type: "automotive",
        lat: 47.6875,
        lon: 17.6504,
        population: 250000,
        gdp: 17000000000,
        buildingId: "cars",
        level: 1,
        buildings: [
          { buildingId: "cars", level: 1 },
          { buildingId: "roads", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("mol", "MOL Group", "Hungría", "Energía", 8),
      simpleCompany("otp", "OTP Bank", "Hungría", "Finanzas", 46),
      simpleCompany("richter", "Gedeon Richter", "Hungría", "Farmacia", 24)
    ],
    units: {
      leopard_2a7: 44,
      gripen: 14,
      lynx_ifv: 46
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 4,
    greenPolicy: false,
    renewablesMW: 6000
  },

  {
    name: "Rumanía",
    iso: "ROU",
    iso2: "RO",
    flag: "🇷🇴",
    capital: "Bucarest",
    lat: 44.4268,
    lon: 26.1025,
    zoom: 6,
    area: 238397,
    population: 19000000,
    gdp: 350000000000,
    gdpPerCapita: 18400,
    government: "Democracia",
    regime: "democracy",
    ideology: "liberalism",
    relation: 61,
    happiness: 67,
    stability: 66,
    energyProduction: 108000,
    installedPower: 125000,
    energyDemand: 118000,
    foodProduction: 33000000,
    foodConsumption: 19800000,
    waterProduction: 6500000000,
    co2: 74000000,
    research: 430,
    military: 71000,
    cyber: 690,
    reserves: 27000000000,
    balance: 9000000000,
    imports: 150000000000,
    exports: 170000000000,
    taxRate: 0.17,
    treasury: 280000000,
    debt: 180000000000,
    socialSpending: 58000000000,
    pensions: 34000000000,
    healthSpending: 19000000000,
    educationSpending: 13000000000,
    defenseSpending: 9000000000,
    nextElectionYear: 2028,
    regions: simpleRegions("Rumanía", "Bucarest", 44.4268, 26.1025, [
      {
        id: "constanta",
        name: "Constanza",
        type: "port",
        lat: 44.1598,
        lon: 28.6348,
        population: 420000,
        gdp: 17000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "refinery", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("dacia", "Dacia", "Rumanía", "Automoción", 18),
      simpleCompany("omv_petrom", "OMV Petrom", "Rumanía", "Energía", 0.65),
      simpleCompany("banca_transilvania", "Banca Transilvania", "Rumanía", "Finanzas", 6)
    ],
    units: {
      f16: 20,
      piranha_v: 120,
      patriot: 4,
      type22_frigate: 2
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 10,
    greenPolicy: false,
    renewablesMW: 13000
  },

  {
    name: "Grecia",
    iso: "GRC",
    iso2: "GR",
    flag: "🇬🇷",
    capital: "Atenas",
    lat: 37.9838,
    lon: 23.7275,
    zoom: 6,
    area: 131957,
    population: 10400000,
    gdp: 252000000000,
    gdpPerCapita: 24200,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 57,
    happiness: 69,
    stability: 64,
    energyProduction: 76000,
    installedPower: 93000,
    energyDemand: 89000,
    foodProduction: 11500000,
    foodConsumption: 10800000,
    waterProduction: 3500000000,
    co2: 56000000,
    research: 360,
    military: 142000,
    cyber: 600,
    reserves: 19000000000,
    balance: 6000000000,
    imports: 93000000000,
    exports: 82000000000,
    taxRate: 0.21,
    treasury: 210000000,
    debt: 405000000000,
    socialSpending: 52000000000,
    pensions: 38000000000,
    healthSpending: 18000000000,
    educationSpending: 10000000000,
    defenseSpending: 8400000000,
    nextElectionYear: 2027,
    regions: simpleRegions("Grecia", "Atenas", 37.9838, 23.7275, [
      {
        id: "thessaloniki",
        name: "Tesalónica",
        type: "port",
        lat: 40.6401,
        lon: 22.9444,
        population: 1100000,
        gdp: 29000000000,
        buildingId: "ports",
        level: 1,
        buildings: [
          { buildingId: "ports", level: 1 },
          { buildingId: "solar", level: 1 }
        ]
      },
      {
        id: "crete",
        name: "Creta",
        type: "naval",
        lat: 35.2401,
        lon: 24.8093,
        population: 620000,
        gdp: 18000000000,
        buildingId: "naval",
        level: 1,
        buildings: [
          { buildingId: "naval", level: 1 },
          { buildingId: "airports", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("hellenic_petroleum", "Hellenic Petroleum", "Grecia", "Energía", 7),
      simpleCompany("alpha_bank", "Alpha Bank", "Grecia", "Finanzas", 1.6),
      simpleCompany("mytilineos", "Metlen Energy & Metals", "Grecia", "Industria", 36)
    ],
    units: {
      leopard_2hel: 170,
      f16: 150,
      rafale: 24,
      meko200_frigate: 4,
      type214_submarine: 4
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 14,
    greenPolicy: false,
    renewablesMW: 18000
  },

  {
    name: "Turquía",
    iso: "TUR",
    iso2: "TR",
    flag: "🇹🇷",
    capital: "Ankara",
    lat: 39.9334,
    lon: 32.8597,
    zoom: 5,
    area: 783562,
    population: 85326000,
    gdp: 1118000000000,
    gdpPerCapita: 13100,
    government: "Democracia",
    regime: "democracy",
    ideology: "nationalism",
    relation: 46,
    happiness: 63,
    stability: 57,
    energyProduction: 310000,
    installedPower: 365000,
    energyDemand: 350000,
    foodProduction: 85000000,
    foodConsumption: 89000000,
    waterProduction: 22000000000,
    co2: 430000000,
    research: 860,
    military: 355000,
    cyber: 1700,
    reserves: 54000000000,
    balance: 39000000000,
    imports: 230000000000,
    exports: 260000000000,
    taxRate: 0.17,
    treasury: 850000000,
    debt: 410000000000,
    socialSpending: 180000000000,
    pensions: 82000000000,
    healthSpending: 63000000000,
    educationSpending: 42000000000,
    defenseSpending: 21000000000,
    nextElectionYear: 2028,
    regions: simpleRegions("Turquía", "Ankara", 39.9334, 32.8597, [
      {
        id: "istanbul",
        name: "Estambul",
        type: "industry",
        lat: 41.0082,
        lon: 28.9784,
        population: 15600000,
        gdp: 340000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "electronics", level: 1 },
          { buildingId: "roads", level: 2 }
        ]
      },
      {
        id: "izmir",
        name: "Esmirna",
        type: "port",
        lat: 38.4237,
        lon: 27.1428,
        population: 4400000,
        gdp: 105000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "shipyard", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("aselsan", "Aselsan", "Turquía", "Defensa electrónica", 2.1),
      simpleCompany("roketsan", "Roketsan", "Turquía", "Defensa", 3.2),
      simpleCompany("tupras", "Tüpraş", "Turquía", "Energía", 5.1),
      simpleCompany("koc", "Koç Holding", "Turquía", "Conglomerado", 7.4)
    ],
    units: {
      altay: 20,
      leopard_2a4: 300,
      f16: 240,
      bayraktar_tb2: 160,
      ada_corvette: 4,
      reis_submarine: 2
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 18,
    greenPolicy: false,
    renewablesMW: 45000
  },

  {
    name: "Ucrania",
    iso: "UKR",
    iso2: "UA",
    flag: "🇺🇦",
    capital: "Kiev",
    lat: 50.4501,
    lon: 30.5234,
    zoom: 5,
    area: 603628,
    population: 37000000,
    gdp: 180000000000,
    gdpPerCapita: 4860,
    government: "Democracia",
    regime: "democracy",
    ideology: "nationalism",
    relation: 62,
    happiness: 45,
    stability: 38,
    energyProduction: 220000,
    installedPower: 260000,
    energyDemand: 245000,
    foodProduction: 92000000,
    foodConsumption: 39000000,
    waterProduction: 10500000000,
    co2: 150000000,
    research: 640,
    military: 850000,
    cyber: 2100,
    reserves: 9000000000,
    balance: -12000000000,
    imports: 90000000000,
    exports: 72000000000,
    taxRate: 0.16,
    treasury: 250000000,
    debt: 160000000000,
    socialSpending: 42000000000,
    pensions: 25000000000,
    healthSpending: 12000000000,
    educationSpending: 8000000000,
    defenseSpending: 52000000000,
    nextElectionYear: 2026,
    regions: simpleRegions("Ucrania", "Kiev", 50.4501, 30.5234, [
      {
        id: "lviv",
        name: "Leópolis",
        type: "logistics",
        lat: 49.8397,
        lon: 24.0297,
        population: 720000,
        gdp: 12000000000,
        buildingId: "roads",
        level: 2,
        buildings: [
          { buildingId: "roads", level: 2 },
          { buildingId: "hospital", level: 1 }
        ]
      },
      {
        id: "odesa",
        name: "Odesa",
        type: "port",
        lat: 46.4825,
        lon: 30.7233,
        population: 1000000,
        gdp: 18000000000,
        buildingId: "ports",
        level: 1,
        buildings: [
          { buildingId: "ports", level: 1 },
          { buildingId: "shipyard", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("antonov", "Antonov", "Ucrania", "Aeroespacial", 8),
      simpleCompany("naftogaz", "Naftogaz", "Ucrania", "Energía", 4),
      simpleCompany("motor_sich", "Motor Sich", "Ucrania", "Aeronáutica", 3)
    ],
    units: {
      t64: 500,
      t72: 400,
      leopard_2: 80,
      f16: 12,
      bayraktar_tb2: 50,
      himars: 40
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 82,
    greenPolicy: false,
    renewablesMW: 15000
  },

  {
    name: "Rusia",
    iso: "RUS",
    iso2: "RU",
    flag: "🇷🇺",
    capital: "Moscú",
    lat: 55.7558,
    lon: 37.6173,
    zoom: 4,
    area: 17098242,
    population: 143826130,
    gdp: 2240000000000,
    gdpPerCapita: 15570,
    government: "Autoritario",
    regime: "authoritarian",
    ideology: "nationalism",
    relation: 31,
    happiness: 58,
    stability: 55,
    energyProduction: 980000,
    installedPower: 1100000,
    energyDemand: 970000,
    foodProduction: 135000000,
    foodConsumption: 151000000,
    waterProduction: 46000000000,
    co2: 1750000000,
    research: 1900,
    military: 930000,
    cyber: 3600,
    reserves: 520000000000,
    balance: 39000000000,
    imports: 320000000000,
    exports: 520000000000,
    taxRate: 0.18,
    treasury: 1900000000,
    debt: 420000000000,
    socialSpending: 270000000000,
    pensions: 155000000000,
    healthSpending: 86000000000,
    educationSpending: 68000000000,
    defenseSpending: 105000000000,
    nextElectionYear: 2030,
    regions: simpleRegions("Rusia", "Moscú", 55.7558, 37.6173, [
      {
        id: "saint_petersburg",
        name: "San Petersburgo",
        type: "port",
        lat: 59.9311,
        lon: 30.3609,
        population: 5400000,
        gdp: 180000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "shipyard", level: 2 }
        ]
      },
      {
        id: "yekaterinburg",
        name: "Ekaterimburgo",
        type: "industry",
        lat: 56.8389,
        lon: 60.6057,
        population: 1500000,
        gdp: 85000000000,
        buildingId: "steel",
        level: 2,
        buildings: [
          { buildingId: "steel", level: 2 },
          { buildingId: "chemical", level: 1 }
        ]
      },
      {
        id: "vladivostok",
        name: "Vladivostok",
        type: "naval",
        lat: 43.1155,
        lon: 131.8855,
        population: 600000,
        gdp: 35000000000,
        buildingId: "naval",
        level: 2,
        buildings: [
          { buildingId: "naval", level: 2 },
          { buildingId: "ports", level: 2 }
        ]
      }
    ]),
    companies: [
      simpleCompany("gazprom", "Gazprom", "Rusia", "Gas", 2.2),
      simpleCompany("rosneft", "Rosneft", "Rusia", "Petróleo", 6.5),
      simpleCompany("rostec", "Rostec", "Rusia", "Defensa", 8),
      simpleCompany("sberbank", "Sberbank", "Rusia", "Finanzas", 2.8),
      simpleCompany("lukoil", "Lukoil", "Rusia", "Energía", 72)
    ],
    units: {
      t72b3: 1800,
      t90m: 450,
      su35: 110,
      su34: 140,
      s400: 55,
      borei_submarine: 6,
      frigate_admiral_gorshkov: 4
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 22,
    warRisk: 75,
    greenPolicy: false,
    renewablesMW: 32000
  },

  {
    name: "Serbia",
    iso: "SRB",
    iso2: "RS",
    flag: "🇷🇸",
    capital: "Belgrado",
    lat: 44.7866,
    lon: 20.4489,
    zoom: 6,
    area: 88361,
    population: 6600000,
    gdp: 75000000000,
    gdpPerCapita: 11300,
    government: "Democracia",
    regime: "democracy",
    ideology: "nationalism",
    relation: 40,
    happiness: 61,
    stability: 58,
    energyProduction: 42000,
    installedPower: 51000,
    energyDemand: 48000,
    foodProduction: 12000000,
    foodConsumption: 6900000,
    waterProduction: 2100000000,
    co2: 43000000,
    research: 220,
    military: 28000,
    cyber: 410,
    reserves: 9000000000,
    balance: 2000000000,
    imports: 38000000000,
    exports: 42000000000,
    taxRate: 0.17,
    treasury: 90000000,
    debt: 42000000000,
    socialSpending: 13000000000,
    pensions: 8000000000,
    healthSpending: 4300000000,
    educationSpending: 3000000000,
    defenseSpending: 1600000000,
    nextElectionYear: 2027,
    regions: simpleRegions("Serbia", "Belgrado", 44.7866, 20.4489),
    companies: [
      simpleCompany("nis_serbia", "NIS", "Serbia", "Energía", 7),
      simpleCompany("telekom_srbija", "Telekom Srbija", "Serbia", "Telecomunicaciones", 5)
    ],
    units: {
      m84: 200,
      mig29: 14,
      lazar_3: 50
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 16,
    greenPolicy: false,
    renewablesMW: 4000
  },

  {
    name: "Croacia",
    iso: "HRV",
    iso2: "HR",
    flag: "🇭🇷",
    capital: "Zagreb",
    lat: 45.815,
    lon: 15.9819,
    zoom: 6,
    area: 56594,
    population: 3850000,
    gdp: 82000000000,
    gdpPerCapita: 21300,
    government: "Democracia",
    regime: "democracy",
    ideology: "liberalism",
    relation: 64,
    happiness: 70,
    stability: 72,
    energyProduction: 27000,
    installedPower: 34000,
    energyDemand: 32000,
    foodProduction: 4800000,
    foodConsumption: 4000000,
    waterProduction: 1600000000,
    co2: 19000000,
    research: 230,
    military: 15000,
    cyber: 330,
    reserves: 7000000000,
    balance: 8000000000,
    imports: 38000000000,
    exports: 46000000000,
    taxRate: 0.20,
    treasury: 100000000,
    debt: 62000000000,
    socialSpending: 17000000000,
    pensions: 9000000000,
    healthSpending: 6000000000,
    educationSpending: 3400000000,
    defenseSpending: 1300000000,
    nextElectionYear: 2028,
    regions: simpleRegions("Croacia", "Zagreb", 45.815, 15.9819, [
      {
        id: "split",
        name: "Split",
        type: "port",
        lat: 43.5081,
        lon: 16.4402,
        population: 340000,
        gdp: 7000000000,
        buildingId: "ports",
        level: 1,
        buildings: [
          { buildingId: "ports", level: 1 },
          { buildingId: "park", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("koncar", "Končar", "Croacia", "Industria eléctrica", 15),
      simpleCompany("ina", "INA", "Croacia", "Energía", 4)
    ],
    units: {
      m84: 72,
      rafale: 12,
      patrol_vessel: 5
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 4,
    greenPolicy: false,
    renewablesMW: 6000
  },

  {
    name: "Bulgaria",
    iso: "BGR",
    iso2: "BG",
    flag: "🇧🇬",
    capital: "Sofía",
    lat: 42.6977,
    lon: 23.3219,
    zoom: 6,
    area: 110994,
    population: 6500000,
    gdp: 101000000000,
    gdpPerCapita: 15500,
    government: "Democracia",
    regime: "democracy",
    ideology: "liberalism",
    relation: 58,
    happiness: 62,
    stability: 60,
    energyProduction: 50000,
    installedPower: 62000,
    energyDemand: 58000,
    foodProduction: 11500000,
    foodConsumption: 6800000,
    waterProduction: 2400000000,
    co2: 46000000,
    research: 210,
    military: 32000,
    cyber: 380,
    reserves: 8000000000,
    balance: 3000000000,
    imports: 47000000000,
    exports: 53000000000,
    taxRate: 0.16,
    treasury: 85000000,
    debt: 42000000000,
    socialSpending: 18000000000,
    pensions: 11000000000,
    healthSpending: 6000000000,
    educationSpending: 3800000000,
    defenseSpending: 2200000000,
    nextElectionYear: 2027,
    regions: simpleRegions("Bulgaria", "Sofía", 42.6977, 23.3219, [
      {
        id: "varna",
        name: "Varna",
        type: "port",
        lat: 43.2141,
        lon: 27.9147,
        population: 470000,
        gdp: 9000000000,
        buildingId: "ports",
        level: 1,
        buildings: [
          { buildingId: "ports", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("bulgartabac", "Bulgartabac", "Bulgaria", "Consumo", 2),
      simpleCompany("chimimport", "Chimimport", "Bulgaria", "Industria", 1)
    ],
    units: {
      t72: 90,
      mig29: 12,
      f16: 0
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 7,
    greenPolicy: false,
    renewablesMW: 5000
  }
];


/* =========================================================
   DATA.JS v3
   Parte 5/11
   América sin Estados Unidos:
   Canadá, México, Brasil, Argentina, Chile, Colombia,
   Perú, Venezuela y Cuba.
   ========================================================= */

const AMERICAS_COUNTRIES = [
  {
    name: "Canadá",
    iso: "CAN",
    iso2: "CA",
    flag: "🇨🇦",
    capital: "Ottawa",
    lat: 45.4215,
    lon: -75.6972,
    zoom: 4,
    area: 9984670,
    population: 40000000,
    gdp: 2140000000000,
    gdpPerCapita: 53500,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 78,
    happiness: 80,
    stability: 82,
    energyProduction: 650000,
    installedPower: 730000,
    energyDemand: 690000,
    foodProduction: 97000000,
    foodConsumption: 42000000,
    waterProduction: 28000000000,
    co2: 545000000,
    research: 1500,
    military: 68000,
    cyber: 1800,
    reserves: 92000000000,
    balance: 21000000000,
    imports: 620000000000,
    exports: 680000000000,
    taxRate: 0.21,
    treasury: 1500000000,
    debt: 1600000000000,
    socialSpending: 410000000000,
    pensions: 190000000000,
    healthSpending: 185000000000,
    educationSpending: 93000000000,
    defenseSpending: 31000000000,
    nextElectionYear: 2029,
    regions: simpleRegions("Canadá", "Ottawa", 45.4215, -75.6972, [
      {
        id: "toronto",
        name: "Toronto",
        type: "finance",
        lat: 43.6532,
        lon: -79.3832,
        population: 6700000,
        gdp: 430000000000,
        buildingId: "electronics",
        level: 2,
        buildings: [
          { buildingId: "electronics", level: 2 },
          { buildingId: "university", level: 2 }
        ]
      },
      {
        id: "vancouver",
        name: "Vancouver",
        type: "port",
        lat: 49.2827,
        lon: -123.1207,
        population: 2700000,
        gdp: 170000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "park", level: 2 }
        ]
      },
      {
        id: "calgary",
        name: "Calgary",
        type: "energy",
        lat: 51.0447,
        lon: -114.0719,
        population: 1600000,
        gdp: 150000000000,
        buildingId: "refinery",
        level: 2,
        buildings: [
          { buildingId: "refinery", level: 2 },
          { buildingId: "gas", level: 2 }
        ]
      }
    ]),
    companies: [
      simpleCompany("shopify", "Shopify", "Canadá", "Software", 65),
      simpleCompany("bombardier", "Bombardier", "Canadá", "Aeroespacial", 80),
      simpleCompany("td_bank", "TD Bank", "Canadá", "Finanzas", 82),
      simpleCompany("suncor", "Suncor Energy", "Canadá", "Energía", 40),
      simpleCompany("magna", "Magna International", "Canadá", "Automoción", 49)
    ],
    units: {
      leopard_2a6m: 82,
      lav_6: 600,
      cf18: 75,
      halifax_frigate: 12,
      victoria_submarine: 4
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 4,
    greenPolicy: false,
    renewablesMW: 122000
  },

  {
    name: "México",
    iso: "MEX",
    iso2: "MX",
    flag: "🇲🇽",
    capital: "Ciudad de México",
    lat: 19.4326,
    lon: -99.1332,
    zoom: 5,
    area: 1964375,
    population: 128455567,
    gdp: 1790000000000,
    gdpPerCapita: 13940,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 54,
    happiness: 66,
    stability: 62,
    energyProduction: 335000,
    installedPower: 390000,
    energyDemand: 370000,
    foodProduction: 150000000,
    foodConsumption: 134000000,
    waterProduction: 32000000000,
    co2: 487000000,
    research: 980,
    military: 277000,
    cyber: 1450,
    reserves: 56000000000,
    balance: 23000000000,
    imports: 480000000000,
    exports: 530000000000,
    taxRate: 0.17,
    treasury: 900000000,
    debt: 900000000000,
    socialSpending: 230000000000,
    pensions: 98000000000,
    healthSpending: 65000000000,
    educationSpending: 52000000000,
    defenseSpending: 13000000000,
    nextElectionYear: 2030,
    regions: simpleRegions("México", "Ciudad de México", 19.4326, -99.1332, [
      {
        id: "monterrey",
        name: "Monterrey",
        type: "industry",
        lat: 25.6866,
        lon: -100.3161,
        population: 5300000,
        gdp: 210000000000,
        buildingId: "steel",
        level: 2,
        buildings: [
          { buildingId: "steel", level: 2 },
          { buildingId: "cars", level: 2 }
        ]
      },
      {
        id: "veracruz",
        name: "Veracruz",
        type: "port",
        lat: 19.1738,
        lon: -96.1342,
        population: 800000,
        gdp: 32000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "refinery", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("america_movil", "América Móvil", "México", "Telecomunicaciones", 17),
      simpleCompany("cemex", "Cemex", "México", "Materiales", 8),
      simpleCompany("femsa", "FEMSA", "México", "Consumo", 11),
      simpleCompany("grupo_bimbo", "Grupo Bimbo", "México", "Alimentación", 4),
      simpleCompany("banorte", "Banorte", "México", "Finanzas", 9)
    ],
    units: {
      humvee: 3000,
      sandcat: 500,
      pc7: 30,
      oaxaca_patrol: 7
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 9,
    greenPolicy: false,
    renewablesMW: 42000
  },

  {
    name: "Brasil",
    iso: "BRA",
    iso2: "BR",
    flag: "🇧🇷",
    capital: "Brasilia",
    lat: -15.7939,
    lon: -47.8828,
    zoom: 4,
    area: 8515767,
    population: 216422446,
    gdp: 2170000000000,
    gdpPerCapita: 10030,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 57,
    happiness: 67,
    stability: 61,
    energyProduction: 720000,
    installedPower: 790000,
    energyDemand: 760000,
    foodProduction: 310000000,
    foodConsumption: 226000000,
    waterProduction: 60000000000,
    co2: 486000000,
    research: 1120,
    military: 360000,
    cyber: 1850,
    reserves: 82000000000,
    balance: -10000000000,
    imports: 410000000000,
    exports: 468000000000,
    taxRate: 0.18,
    treasury: 1100000000,
    debt: 1700000000000,
    socialSpending: 370000000000,
    pensions: 185000000000,
    healthSpending: 125000000000,
    educationSpending: 85000000000,
    defenseSpending: 23000000000,
    nextElectionYear: 2026,
    regions: simpleRegions("Brasil", "Brasilia", -15.7939, -47.8828, [
      {
        id: "sao_paulo",
        name: "São Paulo",
        type: "industry",
        lat: -23.5505,
        lon: -46.6333,
        population: 22400000,
        gdp: 720000000000,
        buildingId: "cars",
        level: 2,
        buildings: [
          { buildingId: "cars", level: 2 },
          { buildingId: "electronics", level: 1 },
          { buildingId: "roads", level: 2 }
        ]
      },
      {
        id: "rio",
        name: "Río de Janeiro",
        type: "port",
        lat: -22.9068,
        lon: -43.1729,
        population: 13000000,
        gdp: 320000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "refinery", level: 1 },
          { buildingId: "park", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("petrobras", "Petrobras", "Brasil", "Energía", 15),
      simpleCompany("vale", "Vale", "Brasil", "Minería", 12),
      simpleCompany("embraer", "Embraer", "Brasil", "Aeroespacial", 36),
      simpleCompany("itau", "Itaú Unibanco", "Brasil", "Finanzas", 6),
      simpleCompany("weg", "WEG", "Brasil", "Industria eléctrica", 8)
    ],
    units: {
      leopard_1a5: 220,
      guarani_6x6: 500,
      gripen_e: 8,
      a4_skyhawk: 40,
      scorpene_submarine: 4,
      niteroi_frigate: 5
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 5,
    greenPolicy: false,
    renewablesMW: 185000
  },

  {
    name: "Argentina",
    iso: "ARG",
    iso2: "AR",
    flag: "🇦🇷",
    capital: "Buenos Aires",
    lat: -34.6037,
    lon: -58.3816,
    zoom: 5,
    area: 2780400,
    population: 46000000,
    gdp: 640000000000,
    gdpPerCapita: 13900,
    government: "Democracia",
    regime: "democracy",
    ideology: "liberalism",
    relation: 51,
    happiness: 61,
    stability: 49,
    energyProduction: 165000,
    installedPower: 195000,
    energyDemand: 185000,
    foodProduction: 160000000,
    foodConsumption: 48000000,
    waterProduction: 18000000000,
    co2: 186000000,
    research: 520,
    military: 83000,
    cyber: 720,
    reserves: 16000000000,
    balance: 12000000000,
    imports: 92000000000,
    exports: 105000000000,
    taxRate: 0.16,
    treasury: 240000000,
    debt: 420000000000,
    socialSpending: 120000000000,
    pensions: 69000000000,
    healthSpending: 28000000000,
    educationSpending: 24000000000,
    defenseSpending: 4200000000,
    nextElectionYear: 2027,
    regions: simpleRegions("Argentina", "Buenos Aires", -34.6037, -58.3816, [
      {
        id: "cordoba",
        name: "Córdoba",
        type: "automotive",
        lat: -31.4201,
        lon: -64.1888,
        population: 1900000,
        gdp: 52000000000,
        buildingId: "cars",
        level: 1,
        buildings: [
          { buildingId: "cars", level: 1 },
          { buildingId: "irrigated_farms", level: 1 }
        ]
      },
      {
        id: "bahia_blanca",
        name: "Bahía Blanca",
        type: "port",
        lat: -38.7183,
        lon: -62.2663,
        population: 310000,
        gdp: 13000000000,
        buildingId: "ports",
        level: 1,
        buildings: [
          { buildingId: "ports", level: 1 },
          { buildingId: "refinery", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("ypf", "YPF", "Argentina", "Energía", 22),
      simpleCompany("mercadolibre", "Mercado Libre", "Argentina", "Tecnología", 1700),
      simpleCompany("pampa_energia", "Pampa Energía", "Argentina", "Energía", 60),
      simpleCompany("tenaris", "Tenaris", "Argentina", "Acero", 16)
    ],
    units: {
      tam: 230,
      a4ar: 24,
      meko360_destroyer: 4,
      meko140_corvette: 6
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 6,
    greenPolicy: false,
    renewablesMW: 18000
  },

  {
    name: "Chile",
    iso: "CHL",
    iso2: "CL",
    flag: "🇨🇱",
    capital: "Santiago",
    lat: -33.4489,
    lon: -70.6693,
    zoom: 5,
    area: 756102,
    population: 19600000,
    gdp: 335000000000,
    gdpPerCapita: 17100,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 63,
    happiness: 70,
    stability: 69,
    energyProduction: 95000,
    installedPower: 120000,
    energyDemand: 108000,
    foodProduction: 24000000,
    foodConsumption: 20500000,
    waterProduction: 6500000000,
    co2: 92000000,
    research: 410,
    military: 78000,
    cyber: 700,
    reserves: 47000000000,
    balance: 18000000000,
    imports: 97000000000,
    exports: 125000000000,
    taxRate: 0.18,
    treasury: 310000000,
    debt: 135000000000,
    socialSpending: 67000000000,
    pensions: 28000000000,
    healthSpending: 21000000000,
    educationSpending: 17000000000,
    defenseSpending: 6200000000,
    nextElectionYear: 2029,
    regions: simpleRegions("Chile", "Santiago", -33.4489, -70.6693, [
      {
        id: "valparaiso",
        name: "Valparaíso",
        type: "port",
        lat: -33.0472,
        lon: -71.6127,
        population: 1000000,
        gdp: 30000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "naval", level: 1 }
        ]
      },
      {
        id: "antofagasta",
        name: "Antofagasta",
        type: "mining",
        lat: -23.6509,
        lon: -70.3975,
        population: 450000,
        gdp: 43000000000,
        buildingId: "solar",
        level: 2,
        buildings: [
          { buildingId: "solar", level: 2 },
          { buildingId: "roads", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("codelco", "Codelco", "Chile", "Minería", 40),
      simpleCompany("sqm", "SQM", "Chile", "Litio", 42),
      simpleCompany("latam_airlines", "LATAM Airlines", "Chile", "Aerolíneas", 12),
      simpleCompany("falabella", "Falabella", "Chile", "Distribución", 3)
    ],
    units: {
      leopard_2a4: 172,
      f16: 46,
      scorpene_submarine: 2,
      type23_frigate: 3
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 5,
    greenPolicy: false,
    renewablesMW: 36000
  },

  {
    name: "Colombia",
    iso: "COL",
    iso2: "CO",
    flag: "🇨🇴",
    capital: "Bogotá",
    lat: 4.711,
    lon: -74.0721,
    zoom: 5,
    area: 1141748,
    population: 52000000,
    gdp: 364000000000,
    gdpPerCapita: 7000,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 55,
    happiness: 65,
    stability: 56,
    energyProduction: 105000,
    installedPower: 125000,
    energyDemand: 118000,
    foodProduction: 58000000,
    foodConsumption: 54500000,
    waterProduction: 15000000000,
    co2: 105000000,
    research: 390,
    military: 293000,
    cyber: 830,
    reserves: 19000000000,
    balance: -6000000000,
    imports: 92000000000,
    exports: 84000000000,
    taxRate: 0.17,
    treasury: 260000000,
    debt: 220000000000,
    socialSpending: 76000000000,
    pensions: 31000000000,
    healthSpending: 26000000000,
    educationSpending: 21000000000,
    defenseSpending: 11500000000,
    nextElectionYear: 2026,
    regions: simpleRegions("Colombia", "Bogotá", 4.711, -74.0721, [
      {
        id: "cartagena_col",
        name: "Cartagena",
        type: "port",
        lat: 10.391,
        lon: -75.4794,
        population: 1100000,
        gdp: 28000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "refinery", level: 1 }
        ]
      },
      {
        id: "medellin",
        name: "Medellín",
        type: "industry",
        lat: 6.2442,
        lon: -75.5812,
        population: 4200000,
        gdp: 72000000000,
        buildingId: "electronics",
        level: 1,
        buildings: [
          { buildingId: "electronics", level: 1 },
          { buildingId: "roads", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("ecopetrol", "Ecopetrol", "Colombia", "Energía", 12),
      simpleCompany("bancolombia", "Bancolombia", "Colombia", "Finanzas", 34),
      simpleCompany("grupo_argos", "Grupo Argos", "Colombia", "Materiales", 2.5),
      simpleCompany("avianca", "Avianca", "Colombia", "Aerolíneas", 1.2)
    ],
    units: {
      kfir: 20,
      lav_iii: 120,
      river_patrol: 60,
      padilla_frigate: 4
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 10,
    greenPolicy: false,
    renewablesMW: 12000
  },

  {
    name: "Perú",
    iso: "PER",
    iso2: "PE",
    flag: "🇵🇪",
    capital: "Lima",
    lat: -12.0464,
    lon: -77.0428,
    zoom: 5,
    area: 1285216,
    population: 34000000,
    gdp: 267000000000,
    gdpPerCapita: 7850,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 50,
    happiness: 59,
    stability: 48,
    energyProduction: 72000,
    installedPower: 89000,
    energyDemand: 82000,
    foodProduction: 36000000,
    foodConsumption: 35500000,
    waterProduction: 8500000000,
    co2: 60000000,
    research: 260,
    military: 81000,
    cyber: 430,
    reserves: 18000000000,
    balance: 11000000000,
    imports: 61000000000,
    exports: 76000000000,
    taxRate: 0.16,
    treasury: 150000000,
    debt: 97000000000,
    socialSpending: 42000000000,
    pensions: 15000000000,
    healthSpending: 12500000000,
    educationSpending: 9800000000,
    defenseSpending: 2700000000,
    nextElectionYear: 2026,
    regions: simpleRegions("Perú", "Lima", -12.0464, -77.0428, [
      {
        id: "callao",
        name: "Callao",
        type: "port",
        lat: -12.0508,
        lon: -77.125,
        population: 1100000,
        gdp: 18000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 }
        ]
      }
    ]),
    companies: [
      simpleCompany("southern_copper_pe", "Southern Copper Perú", "Perú", "Minería", 95),
      simpleCompany("credicorp", "Credicorp", "Perú", "Finanzas", 180),
      simpleCompany("volcan", "Volcan", "Perú", "Minería", 0.5)
    ],
    units: {
      t55: 250,
      mig29: 19,
      su25: 18,
      lupo_frigate: 6
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 7,
    greenPolicy: false,
    renewablesMW: 8000
  },

  {
    name: "Venezuela",
    iso: "VEN",
    iso2: "VE",
    flag: "🇻🇪",
    capital: "Caracas",
    lat: 10.4806,
    lon: -66.9036,
    zoom: 5,
    area: 916445,
    population: 29000000,
    gdp: 105000000000,
    gdpPerCapita: 3620,
    government: "Autoritario",
    regime: "authoritarian",
    ideology: "socialism",
    relation: 34,
    happiness: 42,
    stability: 38,
    energyProduction: 98000,
    installedPower: 130000,
    energyDemand: 112000,
    foodProduction: 18000000,
    foodConsumption: 30300000,
    waterProduction: 7400000000,
    co2: 145000000,
    research: 210,
    military: 123000,
    cyber: 580,
    reserves: 9000000000,
    balance: 8000000000,
    imports: 36000000000,
    exports: 48000000000,
    taxRate: 0.14,
    treasury: 90000000,
    debt: 160000000000,
    socialSpending: 22000000000,
    pensions: 9000000000,
    healthSpending: 7000000000,
    educationSpending: 5000000000,
    defenseSpending: 4900000000,
    nextElectionYear: 2030,
    regions: simpleRegions("Venezuela", "Caracas", 10.4806, -66.9036, [
      {
        id: "maracaibo",
        name: "Maracaibo",
        type: "energy",
        lat: 10.6545,
        lon: -71.65,
        population: 2100000,
        gdp: 24000000000,
        buildingId: "refinery",
        level: 2,
        buildings: [
          { buildingId: "refinery", level: 2 },
          { buildingId: "ports", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("pdvsa", "PDVSA", "Venezuela", "Energía", 3),
      simpleCompany("cantv", "CANTV", "Venezuela", "Telecomunicaciones", 1)
    ],
    units: {
      t72b1: 90,
      su30mk2: 22,
      s300: 4,
      guaiqueri_patrol: 4
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 12,
    warRisk: 22,
    greenPolicy: false,
    renewablesMW: 5000
  },

  {
    name: "Cuba",
    iso: "CUB",
    iso2: "CU",
    flag: "🇨🇺",
    capital: "La Habana",
    lat: 23.1136,
    lon: -82.3666,
    zoom: 6,
    area: 109884,
    population: 11200000,
    gdp: 115000000000,
    gdpPerCapita: 10270,
    government: "Autoritario",
    regime: "authoritarian",
    ideology: "socialism",
    relation: 36,
    happiness: 54,
    stability: 55,
    energyProduction: 32000,
    installedPower: 43000,
    energyDemand: 40000,
    foodProduction: 6500000,
    foodConsumption: 11700000,
    waterProduction: 2500000000,
    co2: 23000000,
    research: 260,
    military: 49000,
    cyber: 500,
    reserves: 3000000000,
    balance: -2000000000,
    imports: 14000000000,
    exports: 9000000000,
    taxRate: 0.15,
    treasury: 60000000,
    debt: 32000000000,
    socialSpending: 24000000000,
    pensions: 9500000000,
    healthSpending: 8000000000,
    educationSpending: 6200000000,
    defenseSpending: 1200000000,
    nextElectionYear: 2030,
    regions: simpleRegions("Cuba", "La Habana", 23.1136, -82.3666, [
      {
        id: "santiago_cuba",
        name: "Santiago de Cuba",
        type: "port",
        lat: 20.0169,
        lon: -75.8302,
        population: 430000,
        gdp: 4500000000,
        buildingId: "ports",
        level: 1,
        buildings: [
          { buildingId: "ports", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("cupet", "CUPET", "Cuba", "Energía", 1),
      simpleCompany("etecsa", "ETECSA", "Cuba", "Telecomunicaciones", 1)
    ],
    units: {
      t55: 400,
      mig29: 3,
      mig21: 20,
      patrol_vessel: 8
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 14,
    warRisk: 18,
    greenPolicy: false,
    renewablesMW: 2000
  }
];

/* =========================================================
   DATA.JS v3
   Parte 6/11
   Estados Unidos detallado pero compacto.
   ========================================================= */

const USA_REGIONS = [
  {
    id: "washington_dc",
    name: "Washington D.C.",
    type: "capital",
    lat: 38.9072,
    lon: -77.0369,
    population: 6200000,
    gdp: 630000000000,
    buildingId: "roads",
    level: 3,
    buildings: [
      { buildingId: "roads", level: 3 },
      { buildingId: "airports", level: 2 },
      { buildingId: "university", level: 3 },
      { buildingId: "cyber", level: 3 }
    ]
  },
  {
    id: "new_york",
    name: "Nueva York",
    type: "finance",
    lat: 40.7128,
    lon: -74.006,
    population: 19000000,
    gdp: 2100000000000,
    buildingId: "electronics",
    level: 3,
    buildings: [
      { buildingId: "roads", level: 3 },
      { buildingId: "airports", level: 3 },
      { buildingId: "university", level: 3 },
      { buildingId: "electronics", level: 2 }
    ]
  },
  {
    id: "boston",
    name: "Boston",
    type: "technology",
    lat: 42.3601,
    lon: -71.0589,
    population: 4900000,
    gdp: 520000000000,
    buildingId: "university",
    level: 3,
    buildings: [
      { buildingId: "university", level: 3 },
      { buildingId: "electronics", level: 2 },
      { buildingId: "hospital", level: 2 }
    ]
  },
  {
    id: "los_angeles",
    name: "Los Ángeles",
    type: "port",
    lat: 34.0522,
    lon: -118.2437,
    population: 13200000,
    gdp: 1200000000000,
    buildingId: "ports",
    level: 3,
    buildings: [
      { buildingId: "ports", level: 3 },
      { buildingId: "airports", level: 3 },
      { buildingId: "electronics", level: 2 },
      { buildingId: "park", level: 1 }
    ]
  },
  {
    id: "san_francisco",
    name: "San Francisco / Silicon Valley",
    type: "technology",
    lat: 37.7749,
    lon: -122.4194,
    population: 7600000,
    gdp: 950000000000,
    buildingId: "electronics",
    level: 3,
    buildings: [
      { buildingId: "electronics", level: 3 },
      { buildingId: "university", level: 3 },
      { buildingId: "solar", level: 2 }
    ]
  },
  {
    id: "seattle",
    name: "Seattle",
    type: "aerospace",
    lat: 47.6062,
    lon: -122.3321,
    population: 4100000,
    gdp: 430000000000,
    buildingId: "electronics",
    level: 3,
    buildings: [
      { buildingId: "electronics", level: 3 },
      { buildingId: "airports", level: 2 },
      { buildingId: "ports", level: 1 }
    ]
  },
  {
    id: "houston",
    name: "Houston",
    type: "energy",
    lat: 29.7604,
    lon: -95.3698,
    population: 7200000,
    gdp: 620000000000,
    buildingId: "refinery",
    level: 3,
    buildings: [
      { buildingId: "refinery", level: 3 },
      { buildingId: "ports", level: 2 },
      { buildingId: "gas", level: 2 },
      { buildingId: "chemical", level: 2 }
    ]
  },
  {
    id: "dallas",
    name: "Dallas",
    type: "finance",
    lat: 32.7767,
    lon: -96.797,
    population: 7600000,
    gdp: 690000000000,
    buildingId: "roads",
    level: 3,
    buildings: [
      { buildingId: "roads", level: 3 },
      { buildingId: "airports", level: 3 },
      { buildingId: "electronics", level: 2 }
    ]
  },
  {
    id: "detroit",
    name: "Detroit",
    type: "automotive",
    lat: 42.3314,
    lon: -83.0458,
    population: 4300000,
    gdp: 260000000000,
    buildingId: "cars",
    level: 3,
    buildings: [
      { buildingId: "cars", level: 3 },
      { buildingId: "steel", level: 2 },
      { buildingId: "roads", level: 2 }
    ]
  },
  {
    id: "chicago",
    name: "Chicago",
    type: "logistics",
    lat: 41.8781,
    lon: -87.6298,
    population: 9500000,
    gdp: 830000000000,
    buildingId: "rail",
    level: 3,
    buildings: [
      { buildingId: "rail", level: 3 },
      { buildingId: "roads", level: 3 },
      { buildingId: "steel", level: 1 }
    ]
  },
  {
    id: "miami",
    name: "Miami",
    type: "port",
    lat: 25.7617,
    lon: -80.1918,
    population: 6200000,
    gdp: 480000000000,
    buildingId: "ports",
    level: 2,
    buildings: [
      { buildingId: "ports", level: 2 },
      { buildingId: "airports", level: 3 },
      { buildingId: "park", level: 1 }
    ]
  },
  {
    id: "atlanta",
    name: "Atlanta",
    type: "logistics",
    lat: 33.749,
    lon: -84.388,
    population: 6200000,
    gdp: 500000000000,
    buildingId: "airports",
    level: 3,
    buildings: [
      { buildingId: "airports", level: 3 },
      { buildingId: "roads", level: 2 },
      { buildingId: "electronics", level: 1 }
    ]
  },
  {
    id: "denver",
    name: "Denver",
    type: "aerospace",
    lat: 39.7392,
    lon: -104.9903,
    population: 3000000,
    gdp: 260000000000,
    buildingId: "electronics",
    level: 2,
    buildings: [
      { buildingId: "electronics", level: 2 },
      { buildingId: "airbase", level: 1 },
      { buildingId: "wind", level: 1 }
    ]
  },
  {
    id: "san_diego",
    name: "San Diego",
    type: "naval",
    lat: 32.7157,
    lon: -117.1611,
    population: 3300000,
    gdp: 300000000000,
    buildingId: "naval",
    level: 3,
    buildings: [
      { buildingId: "naval", level: 3 },
      { buildingId: "shipyard", level: 2 },
      { buildingId: "ports", level: 2 }
    ]
  },
  {
    id: "norfolk",
    name: "Norfolk",
    type: "naval",
    lat: 36.8508,
    lon: -76.2859,
    population: 1700000,
    gdp: 120000000000,
    buildingId: "naval",
    level: 3,
    buildings: [
      { buildingId: "naval", level: 3 },
      { buildingId: "ports", level: 2 },
      { buildingId: "shipyard", level: 2 }
    ]
  },
  {
    id: "colorado_springs",
    name: "Colorado Springs",
    type: "space",
    lat: 38.8339,
    lon: -104.8214,
    population: 760000,
    gdp: 65000000000,
    buildingId: "cyber",
    level: 3,
    buildings: [
      { buildingId: "cyber", level: 3 },
      { buildingId: "airbase", level: 2 },
      { buildingId: "university", level: 1 }
    ]
  }
];

const USA_COMPANIES = [
  simpleCompany("apple", "Apple", "Estados Unidos", "Tecnología", 213),
  simpleCompany("microsoft", "Microsoft", "Estados Unidos", "Software", 445),
  simpleCompany("nvidia", "NVIDIA", "Estados Unidos", "Semiconductores", 124),
  simpleCompany("alphabet", "Alphabet", "Estados Unidos", "Tecnología", 175),
  simpleCompany("amazon", "Amazon", "Estados Unidos", "Comercio y nube", 190),
  simpleCompany("meta", "Meta Platforms", "Estados Unidos", "Tecnología", 520),
  simpleCompany("tesla", "Tesla", "Estados Unidos", "Automoción", 185),
  simpleCompany("gm", "General Motors", "Estados Unidos", "Automoción", 45),
  simpleCompany("ford", "Ford", "Estados Unidos", "Automoción", 12),
  simpleCompany("lockheed", "Lockheed Martin", "Estados Unidos", "Defensa", 465),
  simpleCompany("northrop", "Northrop Grumman", "Estados Unidos", "Defensa", 435),
  simpleCompany("raytheon", "RTX", "Estados Unidos", "Defensa y aeroespacial", 105),
  simpleCompany("boeing", "Boeing", "Estados Unidos", "Aeroespacial", 180),
  simpleCompany("general_dynamics", "General Dynamics", "Estados Unidos", "Defensa naval", 290),
  simpleCompany("huntington_ingalls", "Huntington Ingalls", "Estados Unidos", "Astilleros militares", 250),
  simpleCompany("exxon", "ExxonMobil", "Estados Unidos", "Energía", 112),
  simpleCompany("chevron", "Chevron", "Estados Unidos", "Energía", 160),
  simpleCompany("jpmorgan", "JPMorgan Chase", "Estados Unidos", "Finanzas", 205),
  simpleCompany("goldman_sachs", "Goldman Sachs", "Estados Unidos", "Finanzas", 460),
  simpleCompany("caterpillar", "Caterpillar", "Estados Unidos", "Maquinaria pesada", 340)
];

const USA_BASE = {
  name: "Estados Unidos",
  iso: "USA",
  iso2: "US",
  flag: "🇺🇸",
  capital: "Washington D.C.",
  lat: 38.9072,
  lon: -77.0369,
  zoom: 4,
  area: 9833517,
  population: 334914895,
  gdp: 27360000000000,
  gdpPerCapita: 81600,
  government: "Democracia",
  regime: "democracy",
  ideology: "capitalist_liberalism",
  relation: 70,
  happiness: 74,
  stability: 76,
  energyProduction: 4290000,
  installedPower: 4650000,
  energyDemand: 4520000,
  foodProduction: 650000000,
  foodConsumption: 351000000,
  waterProduction: 142000000000,
  co2: 5007000000,
  research: 7500,
  military: 1370000,
  cyber: 8200,
  reserves: 680000000000,
  balance: -500000000000,
  imports: 3050000000000,
  exports: 2550000000000,
  taxRate: 0.20,
  treasury: 18500000000,
  debt: 34500000000000,
  socialSpending: 4300000000000,
  pensions: 1650000000000,
  healthSpending: 1900000000000,
  educationSpending: 910000000000,
  defenseSpending: 886000000000,
  nextElectionYear: 2028,
  regions: USA_REGIONS,
  companies: USA_COMPANIES,
  units: {
    abrams_m1a2: 2500,
    bradley: 4500,
    stryker: 4300,
    paladin: 850,
    himars: 540,
    apache: 800,
    blackhawk: 2100,
    f16: 900,
    f15: 430,
    f18: 540,
    f22: 180,
    f35a: 450,
    f35b: 120,
    f35c: 75,
    b1b: 45,
    b2: 19,
    b52: 72,
    kc46: 80,
    c17: 220,
    arleigh_burke_destroyer: 73,
    ticonderoga_cruiser: 13,
    virginia_submarine: 22,
    los_angeles_submarine: 24,
    ohio_submarine: 14,
    nimitz_carrier: 10,
    ford_carrier: 1,
    america_lha: 2,
    wasp_lhd: 7,
    littoral_combat_ship: 20,
    marine_expeditionary_unit: 7,
    mq9_reaper: 300,
    global_hawk: 35,
    patriot_battery: 60,
    thaad_battery: 7
  },
  constructionQueue: [],
  militaryQueue: [],
  portfolio: {},
  sanctions: 0,
  warRisk: 12,
  greenPolicy: false,
  renewablesMW: 420000
};

/* =========================================================
   DATA.JS v3
   Parte 7/11
   Asia y Oriente Medio: China, Japón, Corea del Sur, India,
   Australia, Arabia Saudí, Israel, Irán, Indonesia y Singapur.
   ========================================================= */

const ASIA_PACIFIC_COUNTRIES = [
  {
    name: "China",
    iso: "CHN",
    iso2: "CN",
    flag: "🇨🇳",
    capital: "Pekín",
    lat: 39.9042,
    lon: 116.4074,
    zoom: 4,
    area: 9596961,
    population: 1411750000,
    gdp: 17790000000000,
    gdpPerCapita: 12600,
    government: "Autoritario",
    regime: "authoritarian",
    ideology: "socialism",
    relation: 44,
    happiness: 71,
    stability: 76,
    energyProduction: 8800000,
    installedPower: 9450000,
    energyDemand: 9200000,
    foodProduction: 720000000,
    foodConsumption: 1480000000,
    waterProduction: 360000000000,
    co2: 11472000000,
    research: 6200,
    military: 2035000,
    cyber: 7100,
    reserves: 980000000000,
    balance: 35000000000,
    imports: 3110000000000,
    exports: 3340000000000,
    taxRate: 0.19,
    treasury: 12800000000,
    debt: 14500000000000,
    socialSpending: 2600000000000,
    pensions: 980000000000,
    healthSpending: 850000000000,
    educationSpending: 720000000000,
    defenseSpending: 296000000000,
    nextElectionYear: 2030,
    regions: simpleRegions("China", "Pekín", 39.9042, 116.4074, [
      {
        id: "shanghai",
        name: "Shanghái",
        type: "finance",
        lat: 31.2304,
        lon: 121.4737,
        population: 29000000,
        gdp: 680000000000,
        buildingId: "ports",
        level: 3,
        buildings: [
          { buildingId: "ports", level: 3 },
          { buildingId: "electronics", level: 3 },
          { buildingId: "roads", level: 3 }
        ]
      },
      {
        id: "shenzhen",
        name: "Shenzhen",
        type: "technology",
        lat: 22.5431,
        lon: 114.0579,
        population: 17600000,
        gdp: 520000000000,
        buildingId: "electronics",
        level: 3,
        buildings: [
          { buildingId: "electronics", level: 3 },
          { buildingId: "ports", level: 2 },
          { buildingId: "university", level: 2 }
        ]
      },
      {
        id: "guangzhou",
        name: "Cantón",
        type: "industry",
        lat: 23.1291,
        lon: 113.2644,
        population: 18800000,
        gdp: 470000000000,
        buildingId: "cars",
        level: 2,
        buildings: [
          { buildingId: "cars", level: 2 },
          { buildingId: "steel", level: 2 },
          { buildingId: "electronics", level: 2 }
        ]
      },
      {
        id: "wuhan",
        name: "Wuhan",
        type: "industry",
        lat: 30.5928,
        lon: 114.3055,
        population: 12300000,
        gdp: 290000000000,
        buildingId: "steel",
        level: 2,
        buildings: [
          { buildingId: "steel", level: 2 },
          { buildingId: "cars", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("byd", "BYD", "China", "Automoción eléctrica", 31),
      simpleCompany("catl", "CATL", "China", "Baterías", 27),
      simpleCompany("tencent", "Tencent", "China", "Tecnología", 46),
      simpleCompany("alibaba", "Alibaba", "China", "Comercio y nube", 78),
      simpleCompany("huawei", "Huawei", "China", "Telecomunicaciones", 38),
      simpleCompany("avic", "AVIC", "China", "Aeroespacial y defensa", 18)
    ],
    units: {
      ztz99a: 1200,
      ztz96: 2500,
      j10: 450,
      j16: 300,
      j20: 250,
      h6k: 170,
      type052d_destroyer: 25,
      type055_destroyer: 8,
      type075_lhd: 3,
      shandong_carrier: 1,
      liaoning_carrier: 1,
      jin_submarine: 6,
      yuan_submarine: 20
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 2,
    warRisk: 28,
    greenPolicy: false,
    renewablesMW: 1200000
  },

  {
    name: "Japón",
    iso: "JPN",
    iso2: "JP",
    flag: "🇯🇵",
    capital: "Tokio",
    lat: 35.6762,
    lon: 139.6503,
    zoom: 5,
    area: 377975,
    population: 124516650,
    gdp: 4212000000000,
    gdpPerCapita: 33830,
    government: "Democracia",
    regime: "democracy",
    ideology: "liberalism",
    relation: 73,
    happiness: 78,
    stability: 83,
    energyProduction: 920000,
    installedPower: 1030000,
    energyDemand: 1010000,
    foodProduction: 48000000,
    foodConsumption: 130000000,
    waterProduction: 28000000000,
    co2: 1067000000,
    research: 3900,
    military: 247000,
    cyber: 3600,
    reserves: 210000000000,
    balance: 36000000000,
    imports: 750000000000,
    exports: 790000000000,
    taxRate: 0.21,
    treasury: 2600000000,
    debt: 9200000000000,
    socialSpending: 950000000000,
    pensions: 510000000000,
    healthSpending: 410000000000,
    educationSpending: 190000000000,
    defenseSpending: 54000000000,
    nextElectionYear: 2028,
    regions: simpleRegions("Japón", "Tokio", 35.6762, 139.6503, [
      {
        id: "osaka",
        name: "Osaka",
        type: "industry",
        lat: 34.6937,
        lon: 135.5023,
        population: 19000000,
        gdp: 750000000000,
        buildingId: "electronics",
        level: 3,
        buildings: [
          { buildingId: "electronics", level: 3 },
          { buildingId: "ports", level: 2 },
          { buildingId: "roads", level: 3 }
        ]
      },
      {
        id: "nagoya",
        name: "Nagoya",
        type: "automotive",
        lat: 35.1815,
        lon: 136.9066,
        population: 10200000,
        gdp: 410000000000,
        buildingId: "cars",
        level: 3,
        buildings: [
          { buildingId: "cars", level: 3 },
          { buildingId: "steel", level: 1 }
        ]
      },
      {
        id: "yokosuka",
        name: "Yokosuka",
        type: "naval",
        lat: 35.2813,
        lon: 139.6722,
        population: 390000,
        gdp: 32000000000,
        buildingId: "naval",
        level: 2,
        buildings: [
          { buildingId: "naval", level: 2 },
          { buildingId: "ports", level: 2 }
        ]
      }
    ]),
    companies: [
      simpleCompany("toyota", "Toyota", "Japón", "Automoción", 2900),
      simpleCompany("sony", "Sony", "Japón", "Electrónica", 92),
      simpleCompany("mitsubishi_heavy", "Mitsubishi Heavy Industries", "Japón", "Industria y defensa", 13),
      simpleCompany("hitachi", "Hitachi", "Japón", "Industria tecnológica", 28),
      simpleCompany("softbank", "SoftBank", "Japón", "Telecomunicaciones", 12)
    ],
    units: {
      type10: 110,
      type90: 300,
      f15j: 155,
      f2: 90,
      f35a: 35,
      maya_destroyer: 2,
      kongo_destroyer: 4,
      izumo_carrier: 2,
      soryu_submarine: 12,
      taigei_submarine: 4
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 18,
    greenPolicy: false,
    renewablesMW: 155000
  },

  {
    name: "Corea del Sur",
    iso: "KOR",
    iso2: "KR",
    flag: "🇰🇷",
    capital: "Seúl",
    lat: 37.5665,
    lon: 126.978,
    zoom: 6,
    area: 100210,
    population: 51712619,
    gdp: 1713000000000,
    gdpPerCapita: 33120,
    government: "Democracia",
    regime: "democracy",
    ideology: "liberalism",
    relation: 69,
    happiness: 76,
    stability: 79,
    energyProduction: 620000,
    installedPower: 690000,
    energyDemand: 675000,
    foodProduction: 22000000,
    foodConsumption: 54000000,
    waterProduction: 15000000000,
    co2: 586000000,
    research: 2500,
    military: 555000,
    cyber: 3100,
    reserves: 140000000000,
    balance: 36000000000,
    imports: 680000000000,
    exports: 720000000000,
    taxRate: 0.20,
    treasury: 1500000000,
    debt: 850000000000,
    socialSpending: 310000000000,
    pensions: 120000000000,
    healthSpending: 115000000000,
    educationSpending: 82000000000,
    defenseSpending: 52000000000,
    nextElectionYear: 2027,
    regions: simpleRegions("Corea del Sur", "Seúl", 37.5665, 126.978, [
      {
        id: "busan",
        name: "Busan",
        type: "port",
        lat: 35.1796,
        lon: 129.0756,
        population: 7600000,
        gdp: 240000000000,
        buildingId: "ports",
        level: 3,
        buildings: [
          { buildingId: "ports", level: 3 },
          { buildingId: "shipyard", level: 2 }
        ]
      },
      {
        id: "ulsan",
        name: "Ulsan",
        type: "automotive",
        lat: 35.5384,
        lon: 129.3114,
        population: 1100000,
        gdp: 115000000000,
        buildingId: "cars",
        level: 3,
        buildings: [
          { buildingId: "cars", level: 3 },
          { buildingId: "shipyard", level: 2 },
          { buildingId: "chemical", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("samsung", "Samsung Electronics", "Corea del Sur", "Semiconductores", 55),
      simpleCompany("hyundai", "Hyundai Motor", "Corea del Sur", "Automoción", 74),
      simpleCompany("kia", "Kia", "Corea del Sur", "Automoción", 95),
      simpleCompany("hanwha", "Hanwha Aerospace", "Corea del Sur", "Defensa", 145),
      simpleCompany("hd_hyundai", "HD Hyundai", "Corea del Sur", "Astilleros", 80)
    ],
    units: {
      k2_black_panther: 260,
      k21_ifv: 450,
      k9_thunder: 1200,
      f15k: 59,
      f35a: 40,
      kdx3_destroyer: 3,
      dosan_submarine: 3,
      son_won_il_submarine: 9
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 26,
    greenPolicy: false,
    renewablesMW: 52000
  },

  {
    name: "India",
    iso: "IND",
    iso2: "IN",
    flag: "🇮🇳",
    capital: "Nueva Delhi",
    lat: 28.6139,
    lon: 77.209,
    zoom: 5,
    area: 3287263,
    population: 1428627663,
    gdp: 3730000000000,
    gdpPerCapita: 2610,
    government: "Democracia",
    regime: "democracy",
    ideology: "nationalism",
    relation: 52,
    happiness: 64,
    stability: 60,
    energyProduction: 1950000,
    installedPower: 2200000,
    energyDemand: 2120000,
    foodProduction: 820000000,
    foodConsumption: 1490000000,
    waterProduction: 330000000000,
    co2: 2709000000,
    research: 2400,
    military: 1450000,
    cyber: 3200,
    reserves: 350000000000,
    balance: 22000000000,
    imports: 680000000000,
    exports: 770000000000,
    taxRate: 0.16,
    treasury: 2900000000,
    debt: 3100000000000,
    socialSpending: 680000000000,
    pensions: 210000000000,
    healthSpending: 170000000000,
    educationSpending: 230000000000,
    defenseSpending: 81000000000,
    nextElectionYear: 2029,
    regions: simpleRegions("India", "Nueva Delhi", 28.6139, 77.209, [
      {
        id: "mumbai",
        name: "Bombay",
        type: "finance",
        lat: 19.076,
        lon: 72.8777,
        population: 22000000,
        gdp: 520000000000,
        buildingId: "ports",
        level: 3,
        buildings: [
          { buildingId: "ports", level: 3 },
          { buildingId: "electronics", level: 2 },
          { buildingId: "roads", level: 2 }
        ]
      },
      {
        id: "bangalore",
        name: "Bangalore",
        type: "technology",
        lat: 12.9716,
        lon: 77.5946,
        population: 14000000,
        gdp: 240000000000,
        buildingId: "electronics",
        level: 3,
        buildings: [
          { buildingId: "electronics", level: 3 },
          { buildingId: "university", level: 2 }
        ]
      },
      {
        id: "chennai",
        name: "Chennai",
        type: "automotive",
        lat: 13.0827,
        lon: 80.2707,
        population: 11500000,
        gdp: 190000000000,
        buildingId: "cars",
        level: 2,
        buildings: [
          { buildingId: "cars", level: 2 },
          { buildingId: "ports", level: 2 }
        ]
      }
    ]),
    companies: [
      simpleCompany("tata", "Tata Group", "India", "Conglomerado industrial", 110),
      simpleCompany("reliance", "Reliance Industries", "India", "Energía y telecom", 34),
      simpleCompany("infosys", "Infosys", "India", "Software", 18),
      simpleCompany("mahindra", "Mahindra & Mahindra", "India", "Automoción", 28),
      simpleCompany("hal_india", "HAL", "India", "Aeroespacial y defensa", 44)
    ],
    units: {
      arjun: 120,
      t90: 1200,
      t72: 2400,
      su30mki: 260,
      rafale: 36,
      tejas: 40,
      vikramaditya_carrier: 1,
      vikrant_carrier: 1,
      kolkata_destroyer: 3,
      scorpene_submarine: 6,
      arihant_submarine: 2
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 30,
    greenPolicy: false,
    renewablesMW: 310000
  },

  {
    name: "Australia",
    iso: "AUS",
    iso2: "AU",
    flag: "🇦🇺",
    capital: "Canberra",
    lat: -35.2809,
    lon: 149.13,
    zoom: 4,
    area: 7692024,
    population: 26439111,
    gdp: 1693000000000,
    gdpPerCapita: 64030,
    government: "Democracia",
    regime: "democracy",
    ideology: "liberalism",
    relation: 75,
    happiness: 79,
    stability: 82,
    energyProduction: 320000,
    installedPower: 360000,
    energyDemand: 345000,
    foodProduction: 88000000,
    foodConsumption: 27500000,
    waterProduction: 9500000000,
    co2: 392000000,
    research: 1500,
    military: 59000,
    cyber: 1550,
    reserves: 88000000000,
    balance: -25000000000,
    imports: 330000000000,
    exports: 410000000000,
    taxRate: 0.19,
    treasury: 980000000,
    debt: 920000000000,
    socialSpending: 315000000000,
    pensions: 135000000000,
    healthSpending: 105000000000,
    educationSpending: 69000000000,
    defenseSpending: 33000000000,
    nextElectionYear: 2028,
    regions: simpleRegions("Australia", "Canberra", -35.2809, 149.13, [
      {
        id: "sydney",
        name: "Sídney",
        type: "finance",
        lat: -33.8688,
        lon: 151.2093,
        population: 5400000,
        gdp: 470000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "airports", level: 2 },
          { buildingId: "electronics", level: 1 }
        ]
      },
      {
        id: "melbourne",
        name: "Melbourne",
        type: "industry",
        lat: -37.8136,
        lon: 144.9631,
        population: 5200000,
        gdp: 420000000000,
        buildingId: "roads",
        level: 2,
        buildings: [
          { buildingId: "roads", level: 2 },
          { buildingId: "university", level: 2 }
        ]
      },
      {
        id: "perth",
        name: "Perth",
        type: "mining",
        lat: -31.9523,
        lon: 115.8613,
        population: 2200000,
        gdp: 230000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "solar", level: 2 }
        ]
      }
    ]),
    companies: [
      simpleCompany("bhp", "BHP", "Australia", "Minería", 45),
      simpleCompany("rio_tinto", "Rio Tinto", "Australia", "Minería", 120),
      simpleCompany("csl", "CSL", "Australia", "Farmacia", 280),
      simpleCompany("commbank", "Commonwealth Bank", "Australia", "Finanzas", 110),
      simpleCompany("woodside", "Woodside Energy", "Australia", "Energía", 28)
    ],
    units: {
      abrams_m1a1: 59,
      boxer: 211,
      f35a: 63,
      fa18f: 24,
      hobart_destroyer: 3,
      anzac_frigate: 8,
      collins_submarine: 6,
      canberra_lhd: 2
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 10,
    greenPolicy: false,
    renewablesMW: 71000
  },

  {
    name: "Arabia Saudí",
    iso: "SAU",
    iso2: "SA",
    flag: "🇸🇦",
    capital: "Riad",
    lat: 24.7136,
    lon: 46.6753,
    zoom: 5,
    area: 2149690,
    population: 36900000,
    gdp: 1067000000000,
    gdpPerCapita: 28900,
    government: "Monarquía",
    regime: "monarchy",
    ideology: "nationalism",
    relation: 48,
    happiness: 66,
    stability: 70,
    energyProduction: 620000,
    installedPower: 690000,
    energyDemand: 650000,
    foodProduction: 7200000,
    foodConsumption: 38500000,
    waterProduction: 9000000000,
    co2: 672000000,
    research: 850,
    military: 257000,
    cyber: 1700,
    reserves: 470000000000,
    balance: 80000000000,
    imports: 230000000000,
    exports: 380000000000,
    taxRate: 0.12,
    treasury: 4500000000,
    debt: 310000000000,
    socialSpending: 230000000000,
    pensions: 75000000000,
    healthSpending: 68000000000,
    educationSpending: 72000000000,
    defenseSpending: 75000000000,
    nextElectionYear: 2030,
    regions: simpleRegions("Arabia Saudí", "Riad", 24.7136, 46.6753, [
      {
        id: "jeddah",
        name: "Yeda",
        type: "port",
        lat: 21.4858,
        lon: 39.1925,
        population: 4700000,
        gdp: 135000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "airports", level: 2 }
        ]
      },
      {
        id: "dhahran",
        name: "Dhahran",
        type: "energy",
        lat: 26.2361,
        lon: 50.0393,
        population: 240000,
        gdp: 115000000000,
        buildingId: "refinery",
        level: 3,
        buildings: [
          { buildingId: "refinery", level: 3 },
          { buildingId: "gas", level: 2 }
        ]
      }
    ]),
    companies: [
      simpleCompany("aramco", "Saudi Aramco", "Arabia Saudí", "Petróleo", 32),
      simpleCompany("sabic", "SABIC", "Arabia Saudí", "Química", 20),
      simpleCompany("stc", "Saudi Telecom", "Arabia Saudí", "Telecomunicaciones", 10)
    ],
    units: {
      abrams_m1a2: 370,
      bradley: 400,
      f15sa: 150,
      typhoon: 72,
      patriot: 18,
      al_riyadh_frigate: 3
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 22,
    greenPolicy: false,
    renewablesMW: 25000
  },

  {
    name: "Israel",
    iso: "ISR",
    iso2: "IL",
    flag: "🇮🇱",
    capital: "Jerusalén",
    lat: 31.7683,
    lon: 35.2137,
    zoom: 7,
    area: 22072,
    population: 9800000,
    gdp: 525000000000,
    gdpPerCapita: 53500,
    government: "Democracia",
    regime: "democracy",
    ideology: "nationalism",
    relation: 50,
    happiness: 72,
    stability: 64,
    energyProduction: 78000,
    installedPower: 92000,
    energyDemand: 88000,
    foodProduction: 7800000,
    foodConsumption: 10200000,
    waterProduction: 4300000000,
    co2: 62000000,
    research: 1600,
    military: 170000,
    cyber: 3200,
    reserves: 62000000000,
    balance: 18000000000,
    imports: 115000000000,
    exports: 155000000000,
    taxRate: 0.20,
    treasury: 720000000,
    debt: 330000000000,
    socialSpending: 98000000000,
    pensions: 42000000000,
    healthSpending: 38000000000,
    educationSpending: 32000000000,
    defenseSpending: 26000000000,
    nextElectionYear: 2027,
    regions: simpleRegions("Israel", "Jerusalén", 31.7683, 35.2137, [
      {
        id: "tel_aviv",
        name: "Tel Aviv",
        type: "technology",
        lat: 32.0853,
        lon: 34.7818,
        population: 4200000,
        gdp: 240000000000,
        buildingId: "electronics",
        level: 3,
        buildings: [
          { buildingId: "electronics", level: 3 },
          { buildingId: "cyber", level: 3 },
          { buildingId: "university", level: 2 }
        ]
      },
      {
        id: "haifa",
        name: "Haifa",
        type: "port",
        lat: 32.794,
        lon: 34.9896,
        population: 1100000,
        gdp: 65000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "refinery", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("elbit", "Elbit Systems", "Israel", "Defensa", 210),
      simpleCompany("iai", "Israel Aerospace Industries", "Israel", "Aeroespacial", 30),
      simpleCompany("check_point", "Check Point", "Israel", "Cyberseguridad", 160),
      simpleCompany("teva", "Teva", "Israel", "Farmacia", 17)
    ],
    units: {
      merkava_mk4: 400,
      namer: 300,
      f16i: 175,
      f35i: 39,
      iron_dome: 10,
      david_sling: 4,
      dolphin_submarine: 5,
      saar6_corvette: 4
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 2,
    warRisk: 45,
    greenPolicy: false,
    renewablesMW: 9000
  },

  {
    name: "Irán",
    iso: "IRN",
    iso2: "IR",
    flag: "🇮🇷",
    capital: "Teherán",
    lat: 35.6892,
    lon: 51.389,
    zoom: 5,
    area: 1648195,
    population: 89000000,
    gdp: 413000000000,
    gdpPerCapita: 4640,
    government: "Autoritario",
    regime: "authoritarian",
    ideology: "nationalism",
    relation: 28,
    happiness: 48,
    stability: 46,
    energyProduction: 430000,
    installedPower: 520000,
    energyDemand: 480000,
    foodProduction: 61000000,
    foodConsumption: 93000000,
    waterProduction: 19000000000,
    co2: 710000000,
    research: 820,
    military: 610000,
    cyber: 2300,
    reserves: 72000000000,
    balance: 12000000000,
    imports: 82000000000,
    exports: 105000000000,
    taxRate: 0.14,
    treasury: 460000000,
    debt: 180000000000,
    socialSpending: 72000000000,
    pensions: 31000000000,
    healthSpending: 24000000000,
    educationSpending: 19000000000,
    defenseSpending: 25000000000,
    nextElectionYear: 2030,
    regions: simpleRegions("Irán", "Teherán", 35.6892, 51.389, [
      {
        id: "bandar_abbas",
        name: "Bandar Abbas",
        type: "naval",
        lat: 27.1832,
        lon: 56.2666,
        population: 530000,
        gdp: 28000000000,
        buildingId: "naval",
        level: 2,
        buildings: [
          { buildingId: "naval", level: 2 },
          { buildingId: "ports", level: 2 }
        ]
      },
      {
        id: "isfahan",
        name: "Isfahán",
        type: "industry",
        lat: 32.6546,
        lon: 51.668,
        population: 2200000,
        gdp: 47000000000,
        buildingId: "steel",
        level: 2,
        buildings: [
          { buildingId: "steel", level: 2 },
          { buildingId: "chemical", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("nioc", "National Iranian Oil Company", "Irán", "Petróleo", 4),
      simpleCompany("khodro", "Iran Khodro", "Irán", "Automoción", 1.5),
      simpleCompany("melli_bank", "Bank Melli", "Irán", "Finanzas", 1)
    ],
    units: {
      t72s: 480,
      zulfiqar: 150,
      f14: 24,
      f4_phantom: 55,
      s300: 4,
      fateh_missile: 300,
      kilo_submarine: 3,
      fast_attack_craft: 80
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 18,
    warRisk: 48,
    greenPolicy: false,
    renewablesMW: 12000
  },

  {
    name: "Indonesia",
    iso: "IDN",
    iso2: "ID",
    flag: "🇮🇩",
    capital: "Yakarta",
    lat: -6.2088,
    lon: 106.8456,
    zoom: 5,
    area: 1904569,
    population: 277000000,
    gdp: 1370000000000,
    gdpPerCapita: 4950,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 58,
    happiness: 68,
    stability: 63,
    energyProduction: 420000,
    installedPower: 500000,
    energyDemand: 470000,
    foodProduction: 185000000,
    foodConsumption: 289000000,
    waterProduction: 72000000000,
    co2: 680000000,
    research: 760,
    military: 400000,
    cyber: 1200,
    reserves: 64000000000,
    balance: 18000000000,
    imports: 250000000000,
    exports: 305000000000,
    taxRate: 0.15,
    treasury: 850000000,
    debt: 560000000000,
    socialSpending: 210000000000,
    pensions: 65000000000,
    healthSpending: 52000000000,
    educationSpending: 59000000000,
    defenseSpending: 16000000000,
    nextElectionYear: 2029,
    regions: simpleRegions("Indonesia", "Yakarta", -6.2088, 106.8456, [
      {
        id: "surabaya",
        name: "Surabaya",
        type: "port",
        lat: -7.2575,
        lon: 112.7521,
        population: 10000000,
        gdp: 120000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "shipyard", level: 1 }
        ]
      },
      {
        id: "batam",
        name: "Batam",
        type: "industry",
        lat: 1.0456,
        lon: 104.0305,
        population: 1200000,
        gdp: 38000000000,
        buildingId: "electronics",
        level: 1,
        buildings: [
          { buildingId: "electronics", level: 1 },
          { buildingId: "ports", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("pertamina", "Pertamina", "Indonesia", "Energía", 5),
      simpleCompany("bank_mandiri", "Bank Mandiri", "Indonesia", "Finanzas", 0.45),
      simpleCompany("telkom_indonesia", "Telkom Indonesia", "Indonesia", "Telecomunicaciones", 0.25)
    ],
    units: {
      leopard_2ri: 60,
      harimau: 18,
      f16: 33,
      su30: 11,
      sigma_corvette: 4,
      nagapasa_submarine: 3
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 12,
    greenPolicy: false,
    renewablesMW: 35000
  },

  {
    name: "Singapur",
    iso: "SGP",
    iso2: "SG",
    flag: "🇸🇬",
    capital: "Singapur",
    lat: 1.3521,
    lon: 103.8198,
    zoom: 8,
    area: 734,
    population: 5920000,
    gdp: 501000000000,
    gdpPerCapita: 84600,
    government: "Democracia",
    regime: "technocracy",
    ideology: "capitalist_liberalism",
    relation: 82,
    happiness: 80,
    stability: 88,
    energyProduction: 57000,
    installedPower: 69000,
    energyDemand: 65000,
    foodProduction: 400000,
    foodConsumption: 6200000,
    waterProduction: 2200000000,
    co2: 47000000,
    research: 1150,
    military: 72000,
    cyber: 2600,
    reserves: 340000000000,
    balance: 78000000000,
    imports: 430000000000,
    exports: 520000000000,
    taxRate: 0.17,
    treasury: 1400000000,
    debt: 690000000000,
    socialSpending: 62000000000,
    pensions: 22000000000,
    healthSpending: 18000000000,
    educationSpending: 15000000000,
    defenseSpending: 12000000000,
    nextElectionYear: 2028,
    regions: simpleRegions("Singapur", "Singapur", 1.3521, 103.8198, [
      {
        id: "singapore_port",
        name: "Puerto de Singapur",
        type: "port",
        lat: 1.2644,
        lon: 103.8400,
        population: 0,
        gdp: 120000000000,
        buildingId: "ports",
        level: 3,
        buildings: [
          { buildingId: "ports", level: 3 },
          { buildingId: "electronics", level: 2 },
          { buildingId: "cyber", level: 2 }
        ]
      }
    ]),
    companies: [
      simpleCompany("dbs", "DBS Group", "Singapur", "Finanzas", 34),
      simpleCompany("singtel", "Singtel", "Singapur", "Telecomunicaciones", 2.4),
      simpleCompany("sembcorp", "Sembcorp", "Singapur", "Energía e infraestructuras", 5.5),
      simpleCompany("st_engineering", "ST Engineering", "Singapur", "Defensa y tecnología", 4.2)
    ],
    units: {
      leopard_2sg: 170,
      bionix: 500,
      f15sg: 40,
      f16: 60,
      formidable_frigate: 6,
      invincible_submarine: 2
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 8,
    greenPolicy: false,
    renewablesMW: 3500
  }
];

/* =========================================================
   DATA.JS v3
   Parte 8/11
   África y Mediterráneo sur: Marruecos, Argelia, Egipto,
   Sudáfrica, Nigeria, Etiopía, Kenia y bloque africano clave.
   ========================================================= */

const AFRICA_COUNTRIES = [
  {
    name: "Marruecos",
    iso: "MAR",
    iso2: "MA",
    flag: "🇲🇦",
    capital: "Rabat",
    lat: 34.0209,
    lon: -6.8416,
    zoom: 6,
    area: 446550,
    population: 37840044,
    gdp: 152000000000,
    gdpPerCapita: 4010,
    government: "Monarquía",
    regime: "monarchy",
    ideology: "liberalism",
    relation: 61,
    happiness: 65,
    stability: 62,
    energyProduction: 43000,
    installedPower: 58000,
    energyDemand: 55000,
    foodProduction: 28000000,
    foodConsumption: 39500000,
    waterProduction: 9200000000,
    co2: 72000000,
    research: 290,
    military: 195000,
    cyber: 820,
    reserves: 16000000000,
    balance: 31000000000,
    imports: 65000000000,
    exports: 47000000000,
    taxRate: 0.16,
    treasury: 170000000,
    debt: 105000000000,
    socialSpending: 26000000000,
    pensions: 9500000000,
    healthSpending: 8200000000,
    educationSpending: 7800000000,
    defenseSpending: 5200000000,
    nextElectionYear: 2026,
    regions: simpleRegions("Marruecos", "Rabat", 34.0209, -6.8416, [
      {
        id: "casablanca",
        name: "Casablanca",
        type: "finance",
        lat: 33.5731,
        lon: -7.5898,
        population: 4300000,
        gdp: 52000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "roads", level: 2 },
          { buildingId: "electronics", level: 1 }
        ]
      },
      {
        id: "tangier",
        name: "Tánger",
        type: "port",
        lat: 35.7595,
        lon: -5.834,
        population: 1300000,
        gdp: 28000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "cars", level: 1 },
          { buildingId: "wind", level: 1 }
        ]
      },
      {
        id: "ouarzazate",
        name: "Ouarzazate",
        type: "energy",
        lat: 30.9335,
        lon: -6.937,
        population: 80000,
        gdp: 2500000000,
        buildingId: "solar",
        level: 3,
        buildings: [
          { buildingId: "solar", level: 3 }
        ]
      }
    ]),
    companies: [
      simpleCompany("ocp", "OCP Group", "Marruecos", "Fosfatos", 16),
      simpleCompany("attijariwafa", "Attijariwafa Bank", "Marruecos", "Finanzas", 5),
      simpleCompany("maroc_telecom", "Maroc Telecom", "Marruecos", "Telecomunicaciones", 9),
      simpleCompany("renault_maroc", "Renault Maroc", "Marruecos", "Automoción", 4)
    ],
    units: {
      abrams_m1a2: 222,
      f16: 23,
      f5: 22,
      sigma_frigate: 3,
      fremm: 1,
      patriot: 2
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 12,
    greenPolicy: false,
    renewablesMW: 13500
  },

  {
    name: "Argelia",
    iso: "DZA",
    iso2: "DZ",
    flag: "🇩🇿",
    capital: "Argel",
    lat: 36.7538,
    lon: 3.0588,
    zoom: 5,
    area: 2381741,
    population: 45600000,
    gdp: 245000000000,
    gdpPerCapita: 5370,
    government: "Autoritario",
    regime: "authoritarian",
    ideology: "nationalism",
    relation: 37,
    happiness: 56,
    stability: 54,
    energyProduction: 210000,
    installedPower: 260000,
    energyDemand: 235000,
    foodProduction: 25000000,
    foodConsumption: 47500000,
    waterProduction: 11800000000,
    co2: 176000000,
    research: 330,
    military: 325000,
    cyber: 850,
    reserves: 52000000000,
    balance: 15000000000,
    imports: 58000000000,
    exports: 72000000000,
    taxRate: 0.15,
    treasury: 290000000,
    debt: 85000000000,
    socialSpending: 47000000000,
    pensions: 19000000000,
    healthSpending: 13000000000,
    educationSpending: 12000000000,
    defenseSpending: 10000000000,
    nextElectionYear: 2029,
    regions: simpleRegions("Argelia", "Argel", 36.7538, 3.0588, [
      {
        id: "oran",
        name: "Orán",
        type: "port",
        lat: 35.6971,
        lon: -0.6308,
        population: 1600000,
        gdp: 27000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "refinery", level: 1 }
        ]
      },
      {
        id: "hassi_messaoud",
        name: "Hassi Messaoud",
        type: "energy",
        lat: 31.6804,
        lon: 6.0729,
        population: 60000,
        gdp: 36000000000,
        buildingId: "refinery",
        level: 3,
        buildings: [
          { buildingId: "refinery", level: 3 },
          { buildingId: "gas", level: 2 }
        ]
      }
    ]),
    companies: [
      simpleCompany("sonatrach", "Sonatrach", "Argelia", "Energía", 7),
      simpleCompany("sonelgaz", "Sonelgaz", "Argelia", "Electricidad", 3),
      simpleCompany("mobilis", "Mobilis", "Argelia", "Telecomunicaciones", 2)
    ],
    units: {
      t90sa: 600,
      t72: 500,
      su30mka: 58,
      mig29: 30,
      s300: 8,
      meko_a200_frigate: 2,
      kilo_submarine: 6
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 18,
    greenPolicy: false,
    renewablesMW: 6500
  },

  {
    name: "Egipto",
    iso: "EGY",
    iso2: "EG",
    flag: "🇪🇬",
    capital: "El Cairo",
    lat: 30.0444,
    lon: 31.2357,
    zoom: 6,
    area: 1002450,
    population: 112700000,
    gdp: 395000000000,
    gdpPerCapita: 3500,
    government: "Autoritario",
    regime: "authoritarian",
    ideology: "nationalism",
    relation: 46,
    happiness: 55,
    stability: 52,
    energyProduction: 230000,
    installedPower: 285000,
    energyDemand: 270000,
    foodProduction: 62000000,
    foodConsumption: 118000000,
    waterProduction: 32000000000,
    co2: 250000000,
    research: 650,
    military: 438000,
    cyber: 1150,
    reserves: 40000000000,
    balance: -9000000000,
    imports: 105000000000,
    exports: 78000000000,
    taxRate: 0.15,
    treasury: 360000000,
    debt: 375000000000,
    socialSpending: 76000000000,
    pensions: 33000000000,
    healthSpending: 22000000000,
    educationSpending: 26000000000,
    defenseSpending: 11000000000,
    nextElectionYear: 2030,
    regions: simpleRegions("Egipto", "El Cairo", 30.0444, 31.2357, [
      {
        id: "alexandria",
        name: "Alejandría",
        type: "port",
        lat: 31.2001,
        lon: 29.9187,
        population: 5400000,
        gdp: 46000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "chemical", level: 1 }
        ]
      },
      {
        id: "suez",
        name: "Suez",
        type: "logistics",
        lat: 29.9668,
        lon: 32.5498,
        population: 780000,
        gdp: 56000000000,
        buildingId: "ports",
        level: 3,
        buildings: [
          { buildingId: "ports", level: 3 },
          { buildingId: "roads", level: 2 },
          { buildingId: "refinery", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("egpc", "Egyptian General Petroleum", "Egipto", "Energía", 4),
      simpleCompany("orascom", "Orascom Construction", "Egipto", "Construcción", 3),
      simpleCompany("cib_egypt", "Commercial International Bank", "Egipto", "Finanzas", 2)
    ],
    units: {
      abrams_m1a1: 1100,
      m60: 1100,
      rafale: 54,
      f16: 200,
      mig29m: 46,
      fremm: 2,
      mistral_lhd: 2,
      type209_submarine: 4
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 20,
    greenPolicy: false,
    renewablesMW: 19000
  },

  {
    name: "Sudáfrica",
    iso: "ZAF",
    iso2: "ZA",
    flag: "🇿🇦",
    capital: "Pretoria",
    lat: -25.7479,
    lon: 28.2293,
    zoom: 5,
    area: 1221037,
    population: 60400000,
    gdp: 405000000000,
    gdpPerCapita: 6700,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 56,
    happiness: 58,
    stability: 50,
    energyProduction: 225000,
    installedPower: 270000,
    energyDemand: 255000,
    foodProduction: 53000000,
    foodConsumption: 63000000,
    waterProduction: 13800000000,
    co2: 435000000,
    research: 620,
    military: 72000,
    cyber: 820,
    reserves: 28000000000,
    balance: 7000000000,
    imports: 126000000000,
    exports: 135000000000,
    taxRate: 0.17,
    treasury: 240000000,
    debt: 310000000000,
    socialSpending: 85000000000,
    pensions: 36000000000,
    healthSpending: 26000000000,
    educationSpending: 24000000000,
    defenseSpending: 3400000000,
    nextElectionYear: 2029,
    regions: simpleRegions("Sudáfrica", "Pretoria", -25.7479, 28.2293, [
      {
        id: "johannesburg",
        name: "Johannesburgo",
        type: "finance",
        lat: -26.2041,
        lon: 28.0473,
        population: 6400000,
        gdp: 150000000000,
        buildingId: "roads",
        level: 2,
        buildings: [
          { buildingId: "roads", level: 2 },
          { buildingId: "electronics", level: 1 }
        ]
      },
      {
        id: "cape_town",
        name: "Ciudad del Cabo",
        type: "port",
        lat: -33.9249,
        lon: 18.4241,
        population: 4800000,
        gdp: 72000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "park", level: 2 }
        ]
      },
      {
        id: "durban",
        name: "Durban",
        type: "port",
        lat: -29.8587,
        lon: 31.0218,
        population: 3900000,
        gdp: 54000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "chemical", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("sasol", "Sasol", "Sudáfrica", "Energía química", 8),
      simpleCompany("naspers", "Naspers", "Sudáfrica", "Tecnología", 165),
      simpleCompany("anglo_american", "Anglo American", "Sudáfrica", "Minería", 26),
      simpleCompany("standard_bank", "Standard Bank", "Sudáfrica", "Finanzas", 10)
    ],
    units: {
      olifant: 160,
      rooikat: 240,
      gripen_c: 17,
      valour_frigate: 4,
      hero_submarine: 3
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 11,
    greenPolicy: false,
    renewablesMW: 13000
  },

  {
    name: "Nigeria",
    iso: "NGA",
    iso2: "NG",
    flag: "🇳🇬",
    capital: "Abuya",
    lat: 9.0765,
    lon: 7.3986,
    zoom: 5,
    area: 923768,
    population: 223800000,
    gdp: 477000000000,
    gdpPerCapita: 2130,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 47,
    happiness: 50,
    stability: 42,
    energyProduction: 125000,
    installedPower: 170000,
    energyDemand: 155000,
    foodProduction: 145000000,
    foodConsumption: 235000000,
    waterProduction: 42000000000,
    co2: 136000000,
    research: 460,
    military: 230000,
    cyber: 950,
    reserves: 38000000000,
    balance: 9000000000,
    imports: 72000000000,
    exports: 85000000000,
    taxRate: 0.13,
    treasury: 250000000,
    debt: 170000000000,
    socialSpending: 58000000000,
    pensions: 18000000000,
    healthSpending: 18000000000,
    educationSpending: 22000000000,
    defenseSpending: 5000000000,
    nextElectionYear: 2027,
    regions: simpleRegions("Nigeria", "Abuya", 9.0765, 7.3986, [
      {
        id: "lagos",
        name: "Lagos",
        type: "port",
        lat: 6.5244,
        lon: 3.3792,
        population: 21000000,
        gdp: 180000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "roads", level: 1 },
          { buildingId: "electronics", level: 1 }
        ]
      },
      {
        id: "port_harcourt",
        name: "Port Harcourt",
        type: "energy",
        lat: 4.8156,
        lon: 7.0498,
        population: 3200000,
        gdp: 54000000000,
        buildingId: "refinery",
        level: 2,
        buildings: [
          { buildingId: "refinery", level: 2 },
          { buildingId: "ports", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("nnpc", "NNPC", "Nigeria", "Energía", 4),
      simpleCompany("dangote", "Dangote Group", "Nigeria", "Industria", 5),
      simpleCompany("zenith_bank", "Zenith Bank", "Nigeria", "Finanzas", 1.8),
      simpleCompany("mtn_nigeria", "MTN Nigeria", "Nigeria", "Telecomunicaciones", 1.5)
    ],
    units: {
      vt4: 15,
      t72: 70,
      alpha_jet: 24,
      jf17: 3,
      opv: 8
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 24,
    greenPolicy: false,
    renewablesMW: 6000
  },

  {
    name: "Etiopía",
    iso: "ETH",
    iso2: "ET",
    flag: "🇪🇹",
    capital: "Adís Abeba",
    lat: 8.9806,
    lon: 38.7578,
    zoom: 6,
    area: 1104300,
    population: 126500000,
    gdp: 164000000000,
    gdpPerCapita: 1300,
    government: "Democracia",
    regime: "democracy",
    ideology: "social_democracy",
    relation: 42,
    happiness: 49,
    stability: 40,
    energyProduction: 58000,
    installedPower: 78000,
    energyDemand: 70000,
    foodProduction: 76000000,
    foodConsumption: 132000000,
    waterProduction: 26000000000,
    co2: 21000000,
    research: 260,
    military: 162000,
    cyber: 420,
    reserves: 8000000000,
    balance: -7000000000,
    imports: 26000000000,
    exports: 16000000000,
    taxRate: 0.12,
    treasury: 90000000,
    debt: 65000000000,
    socialSpending: 24000000000,
    pensions: 6000000000,
    healthSpending: 7000000000,
    educationSpending: 9000000000,
    defenseSpending: 1800000000,
    nextElectionYear: 2026,
    regions: simpleRegions("Etiopía", "Adís Abeba", 8.9806, 38.7578, [
      {
        id: "dire_dawa",
        name: "Dire Dawa",
        type: "logistics",
        lat: 9.6,
        lon: 41.8661,
        population: 520000,
        gdp: 6000000000,
        buildingId: "rail",
        level: 1,
        buildings: [
          { buildingId: "rail", level: 1 },
          { buildingId: "roads", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("ethiopian_airlines", "Ethiopian Airlines", "Etiopía", "Aerolíneas", 3),
      simpleCompany("ethio_telecom", "Ethio Telecom", "Etiopía", "Telecomunicaciones", 2)
    ],
    units: {
      t72: 250,
      su27: 12,
      mig23: 20,
      mi24: 18
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 32,
    greenPolicy: false,
    renewablesMW: 12000
  },

  {
    name: "Kenia",
    iso: "KEN",
    iso2: "KE",
    flag: "🇰🇪",
    capital: "Nairobi",
    lat: -1.2921,
    lon: 36.8219,
    zoom: 6,
    area: 580367,
    population: 55500000,
    gdp: 113000000000,
    gdpPerCapita: 2040,
    government: "Democracia",
    regime: "democracy",
    ideology: "liberalism",
    relation: 54,
    happiness: 57,
    stability: 55,
    energyProduction: 26000,
    installedPower: 36000,
    energyDemand: 33000,
    foodProduction: 42000000,
    foodConsumption: 58000000,
    waterProduction: 12500000000,
    co2: 19000000,
    research: 240,
    military: 24000,
    cyber: 520,
    reserves: 9000000000,
    balance: -3000000000,
    imports: 26000000000,
    exports: 23000000000,
    taxRate: 0.15,
    treasury: 80000000,
    debt: 74000000000,
    socialSpending: 19000000000,
    pensions: 5000000000,
    healthSpending: 6100000000,
    educationSpending: 7600000000,
    defenseSpending: 1200000000,
    nextElectionYear: 2027,
    regions: simpleRegions("Kenia", "Nairobi", -1.2921, 36.8219, [
      {
        id: "mombasa",
        name: "Mombasa",
        type: "port",
        lat: -4.0435,
        lon: 39.6682,
        population: 1500000,
        gdp: 15000000000,
        buildingId: "ports",
        level: 2,
        buildings: [
          { buildingId: "ports", level: 2 },
          { buildingId: "roads", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("safaricom", "Safaricom", "Kenia", "Telecomunicaciones", 0.18),
      simpleCompany("kenya_airways", "Kenya Airways", "Kenia", "Aerolíneas", 0.05),
      simpleCompany("equity_group", "Equity Group", "Kenia", "Finanzas", 0.35)
    ],
    units: {
      vickers_mbt: 70,
      f5: 17,
      patrol_vessel: 5
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 15,
    greenPolicy: false,
    renewablesMW: 8000
  },

  {
    name: "Angola",
    iso: "AGO",
    iso2: "AO",
    flag: "🇦🇴",
    capital: "Luanda",
    lat: -8.839,
    lon: 13.2894,
    zoom: 6,
    area: 1246700,
    population: 36600000,
    gdp: 115000000000,
    gdpPerCapita: 3140,
    government: "Democracia",
    regime: "democracy",
    ideology: "nationalism",
    relation: 39,
    happiness: 50,
    stability: 47,
    energyProduction: 62000,
    installedPower: 76000,
    energyDemand: 70000,
    foodProduction: 19000000,
    foodConsumption: 38200000,
    waterProduction: 7200000000,
    co2: 31000000,
    research: 150,
    military: 107000,
    cyber: 260,
    reserves: 12000000000,
    balance: 6000000000,
    imports: 18000000000,
    exports: 33000000000,
    taxRate: 0.13,
    treasury: 95000000,
    debt: 64000000000,
    socialSpending: 16000000000,
    pensions: 4500000000,
    healthSpending: 4200000000,
    educationSpending: 5200000000,
    defenseSpending: 2100000000,
    nextElectionYear: 2027,
    regions: simpleRegions("Angola", "Luanda", -8.839, 13.2894, [
      {
        id: "lobito",
        name: "Lobito",
        type: "port",
        lat: -12.3644,
        lon: 13.536,
        population: 400000,
        gdp: 9000000000,
        buildingId: "ports",
        level: 1,
        buildings: [
          { buildingId: "ports", level: 1 },
          { buildingId: "rail", level: 1 }
        ]
      }
    ]),
    companies: [
      simpleCompany("sonangol", "Sonangol", "Angola", "Energía", 3),
      simpleCompany("unitel_angola", "Unitel Angola", "Angola", "Telecomunicaciones", 1)
    ],
    units: {
      t72: 150,
      su30: 12,
      mig23: 20,
      patrol_vessel: 8
    },
    constructionQueue: [],
    militaryQueue: [],
    portfolio: {},
    sanctions: 0,
    warRisk: 19,
    greenPolicy: false,
    renewablesMW: 3500
  }
];


/* =========================================================
   DATA.JS v3
   Parte 9/11
   Organizaciones internacionales, relaciones, recursos,
   tecnologías, eventos globales y mercado ampliado.
   ========================================================= */

const INTERNATIONAL_BLOCS = [
  {
    id: "eu",
    name: "Unión Europea",
    icon: "🇪🇺",
    members: [
      "España",
      "Francia",
      "Alemania",
      "Italia",
      "Portugal",
      "Países Bajos",
      "Bélgica",
      "Austria",
      "Irlanda",
      "Polonia",
      "Chequia",
      "Hungría",
      "Rumanía",
      "Grecia",
      "Croacia",
      "Bulgaria",
      "Suecia",
      "Dinamarca",
      "Finlandia"
    ],
    effects: {
      tradeBonus: 0.08,
      stabilityBonus: 1.5,
      sanctionsCoordination: 0.12
    }
  },
  {
    id: "nato",
    name: "OTAN",
    icon: "🛡️",
    members: [
      "España",
      "Estados Unidos",
      "Canadá",
      "Reino Unido",
      "Francia",
      "Alemania",
      "Italia",
      "Portugal",
      "Países Bajos",
      "Bélgica",
      "Noruega",
      "Suecia",
      "Finlandia",
      "Dinamarca",
      "Polonia",
      "Chequia",
      "Hungría",
      "Rumanía",
      "Grecia",
      "Turquía"
    ],
    effects: {
      militaryDeterrence: 0.15,
      warRiskReduction: 8,
      defenseSpendingPressure: 0.02
    }
  },
  {
    id: "brics",
    name: "BRICS+",
    icon: "🌐",
    members: [
      "Brasil",
      "Rusia",
      "India",
      "China",
      "Sudáfrica",
      "Arabia Saudí",
      "Irán",
      "Egipto",
      "Etiopía"
    ],
    effects: {
      tradeBonus: 0.05,
      westernSanctionResistance: 0.12,
      commodityInfluence: 0.15
    }
  },
  {
    id: "opec",
    name: "OPEP+",
    icon: "🛢️",
    members: [
      "Arabia Saudí",
      "Rusia",
      "Irán",
      "Venezuela",
      "Argelia",
      "Angola",
      "Nigeria"
    ],
    effects: {
      oilPriceInfluence: 0.18,
      energyRevenueBonus: 0.12
    }
  }
];

const STRATEGIC_RESOURCES = [
  {
    id: "oil",
    name: "Petróleo",
    icon: "🛢️",
    basePrice: 82,
    volatility: 0.045,
    unit: "USD/barril",
    producerBonusSectors: ["Energía", "Energía fósil", "Petróleo", "Gas"],
    consumerPenaltySectors: ["Automoción", "Transporte", "Industria"]
  },
  {
    id: "gas",
    name: "Gas natural",
    icon: "🔥",
    basePrice: 34,
    volatility: 0.055,
    unit: "EUR/MWh",
    producerBonusSectors: ["Energía", "Gas"],
    consumerPenaltySectors: ["Industria", "Química", "Electricidad"]
  },
  {
    id: "uranium",
    name: "Uranio",
    icon: "☢️",
    basePrice: 91,
    volatility: 0.035,
    unit: "USD/lb",
    producerBonusSectors: ["Minería", "Energía nuclear"],
    consumerPenaltySectors: ["Energía nuclear"]
  },
  {
    id: "lithium",
    name: "Litio",
    icon: "🔋",
    basePrice: 14500,
    volatility: 0.075,
    unit: "USD/t",
    producerBonusSectors: ["Litio", "Minería"],
    consumerPenaltySectors: ["Automoción eléctrica", "Baterías"]
  },
  {
    id: "rare_earths",
    name: "Tierras raras",
    icon: "🧲",
    basePrice: 7200,
    volatility: 0.065,
    unit: "USD/t",
    producerBonusSectors: ["Minería", "Materiales"],
    consumerPenaltySectors: ["Defensa", "Electrónica", "Semiconductores"]
  },
  {
    id: "wheat",
    name: "Trigo",
    icon: "🌾",
    basePrice: 245,
    volatility: 0.04,
    unit: "USD/t",
    producerBonusSectors: ["Agricultura", "Alimentación"],
    consumerPenaltySectors: ["Alimentación", "Consumo"]
  },
  {
    id: "steel",
    name: "Acero",
    icon: "🏗️",
    basePrice: 720,
    volatility: 0.035,
    unit: "USD/t",
    producerBonusSectors: ["Acero", "Industria"],
    consumerPenaltySectors: ["Automoción", "Construcción", "Defensa naval"]
  },
  {
    id: "semiconductors",
    name: "Semiconductores",
    icon: "💾",
    basePrice: 100,
    volatility: 0.06,
    unit: "índice",
    producerBonusSectors: ["Semiconductores", "Tecnología"],
    consumerPenaltySectors: ["Automoción", "Defensa", "Electrónica"]
  }
];

const GLOBAL_RESOURCE_STATE = STRATEGIC_RESOURCES.map(resource => ({
  id: resource.id,
  price: resource.basePrice,
  lastPrice: resource.basePrice,
  shock: 0,
  trend: 0
}));

const TECHNOLOGIES = [
  {
    id: "advanced_manufacturing",
    name: "Fabricación avanzada",
    category: "industrial",
    year: 2026,
    cost: 120000000,
    days: 180,
    requiredResearch: 900,
    effects: {
      gdpMultiplier: 1.025,
      industrialOutputMultiplier: 1.06,
      constructionCostMultiplier: 0.97
    }
  },
  {
    id: "robotized_factories",
    name: "Fábricas robotizadas",
    category: "industrial",
    year: 2028,
    cost: 220000000,
    days: 270,
    requiredResearch: 1500,
    effects: {
      industrialOutputMultiplier: 1.12,
      jobsMultiplier: 0.94,
      energyDemandMultiplier: 1.04
    }
  },
  {
    id: "green_hydrogen",
    name: "Hidrógeno verde",
    category: "energy",
    year: 2031,
    cost: 420000000,
    days: 420,
    requiredResearch: 2200,
    effects: {
      industrialCo2Multiplier: 0.9,
      exportsBonus: 45000000,
      energyDemandBonusMW: 80
    }
  },
  {
    id: "grid_storage",
    name: "Almacenamiento de red",
    category: "energy",
    year: 2026,
    cost: 180000000,
    days: 220,
    requiredResearch: 1000,
    effects: {
      installedPowerBonusMW: 120,
      renewableEfficiencyMultiplier: 1.08
    }
  },
  {
    id: "small_modular_reactors",
    name: "Reactores modulares pequeños",
    category: "energy",
    year: 2034,
    cost: 650000000,
    days: 540,
    requiredResearch: 2800,
    effects: {
      installedPowerBonusMW: 650,
      energyProductionBonusMW: 600,
      co2Reduction: 9000000
    }
  },
  {
    id: "national_cloud",
    name: "Nube soberana nacional",
    category: "digital",
    year: 2026,
    cost: 160000000,
    days: 200,
    requiredResearch: 950,
    effects: {
      cyberBonus: 300,
      researchBonus: 80,
      servicesOutputMultiplier: 1.04
    }
  },
  {
    id: "ai_public_administration",
    name: "IA en administración pública",
    category: "digital",
    year: 2027,
    cost: 190000000,
    days: 240,
    requiredResearch: 1300,
    effects: {
      taxEfficiencyMultiplier: 1.04,
      publicSpendingMultiplier: 0.98,
      stabilityBonus: 0.5
    }
  },
  {
    id: "quantum_communications",
    name: "Comunicaciones cuánticas",
    category: "digital",
    year: 2035,
    cost: 520000000,
    days: 500,
    requiredResearch: 3200,
    effects: {
      cyberBonus: 1200,
      espionageDefenseBonus: 0.18,
      researchBonus: 160
    }
  },
  {
    id: "network_centric_warfare",
    name: "Guerra en red",
    category: "military",
    year: 2026,
    cost: 240000000,
    days: 260,
    requiredResearch: 1200,
    effects: {
      militaryMultiplier: 1.08,
      cyberBonus: 180,
      warRiskReduction: 1.5
    }
  },
  {
    id: "drone_swarms",
    name: "Enjambres de drones",
    category: "military",
    year: 2029,
    cost: 310000000,
    days: 320,
    requiredResearch: 1800,
    effects: {
      militaryMultiplier: 1.12,
      militaryBonus: 18000,
      cyberDemand: 120
    }
  },
  {
    id: "integrated_air_defense",
    name: "Defensa aérea integrada",
    category: "military",
    year: 2027,
    cost: 360000000,
    days: 360,
    requiredResearch: 1600,
    effects: {
      militaryBonus: 25000,
      stabilityBonus: 0.8,
      warRiskReduction: 4
    }
  },
  {
    id: "high_speed_rail",
    name: "Alta velocidad expandida",
    category: "civil",
    year: 2026,
    cost: 380000000,
    days: 420,
    requiredResearch: 800,
    effects: {
      gdpBonus: 120000000,
      happinessBonus: 1.1,
      co2Reduction: 1400000
    }
  },
  {
    id: "smart_cities",
    name: "Ciudades inteligentes",
    category: "civil",
    year: 2028,
    cost: 260000000,
    days: 300,
    requiredResearch: 1350,
    effects: {
      happinessBonus: 1.4,
      energyDemandMultiplier: 0.97,
      stabilityBonus: 0.5
    }
  },
  {
    id: "earth_observation_satellites",
    name: "Satélites de observación terrestre",
    category: "space",
    year: 2027,
    cost: 280000000,
    days: 320,
    requiredResearch: 1500,
    effects: {
      climateRiskReduction: 2,
      militaryBonus: 6000,
      researchBonus: 90
    }
  }
];

const GLOBAL_EVENTS = [
  {
    id: "oil_price_spike",
    name: "Crisis del petróleo",
    icon: "🛢️",
    probability: 0.006,
    minYear: 2026,
    effects: {
      resource: "oil",
      priceShock: 0.22,
      globalStability: -0.4,
      inflation: 0.5
    },
    message: "Los precios del petróleo se disparan por tensiones en mercados energéticos."
  },
  {
    id: "gas_supply_crisis",
    name: "Crisis del gas",
    icon: "🔥",
    probability: 0.005,
    minYear: 2026,
    effects: {
      resource: "gas",
      priceShock: 0.28,
      energyCostMultiplier: 1.06,
      industrialOutput: -0.01
    },
    message: "La oferta internacional de gas se tensiona; suben costes eléctricos e industriales."
  },
  {
    id: "semiconductor_shortage",
    name: "Escasez de semiconductores",
    icon: "💾",
    probability: 0.004,
    minYear: 2026,
    effects: {
      resource: "semiconductors",
      priceShock: 0.35,
      automotivePenalty: -0.03,
      technologyBonus: 0.02
    },
    message: "Una escasez de semiconductores afecta automoción, defensa y electrónica."
  },
  {
    id: "food_price_spike",
    name: "Crisis alimentaria",
    icon: "🌾",
    probability: 0.005,
    minYear: 2026,
    effects: {
      resource: "wheat",
      priceShock: 0.25,
      happiness: -0.8,
      instability: 0.5
    },
    message: "El precio mundial de alimentos sube por sequías y disrupciones logísticas."
  },
  {
    id: "cyber_wave",
    name: "Oleada global de ciberataques",
    icon: "🛰️",
    probability: 0.004,
    minYear: 2026,
    effects: {
      cyberRisk: 0.12,
      financialShock: -0.015,
      stability: -0.4
    },
    message: "Una oleada global de ciberataques afecta bancos, energía y administraciones."
  },
  {
    id: "climate_disaster_year",
    name: "Año climático extremo",
    icon: "🌡️",
    probability: 0.004,
    minYear: 2028,
    effects: {
      climateRisk: 4,
      foodProduction: -0.025,
      infrastructureDamage: 0.015
    },
    message: "Fenómenos climáticos extremos elevan daños e incertidumbre global."
  },
  {
    id: "ai_productivity_boom",
    name: "Boom de productividad por IA",
    icon: "🤖",
    probability: 0.003,
    minYear: 2028,
    effects: {
      research: 0.03,
      gdp: 0.012,
      jobsDisruption: 0.01
    },
    message: "La adopción de IA acelera productividad, pero desplaza empleo en algunos sectores."
  }
];

const ELECTION_PARTIES = {
  España: [
    {
      id: "social_democrats",
      name: "Bloque socialdemócrata",
      ideology: "social_democracy",
      baseVote: 32
    },
    {
      id: "liberals",
      name: "Bloque liberal",
      ideology: "liberalism",
      baseVote: 24
    },
    {
      id: "conservatives",
      name: "Bloque conservador",
      ideology: "capitalist_liberalism",
      baseVote: 28
    },
    {
      id: "greens",
      name: "Bloque verde",
      ideology: "green",
      baseVote: 8
    },
    {
      id: "nationalists",
      name: "Bloque nacionalista",
      ideology: "nationalism",
      baseVote: 8
    }
  ],
  default: [
    {
      id: "social_democrats",
      name: "Socialdemócratas",
      ideology: "social_democracy",
      baseVote: 30
    },
    {
      id: "liberals",
      name: "Liberales",
      ideology: "liberalism",
      baseVote: 28
    },
    {
      id: "capitalists",
      name: "Capitalistas liberales",
      ideology: "capitalist_liberalism",
      baseVote: 22
    },
    {
      id: "greens",
      name: "Verdes",
      ideology: "green",
      baseVote: 10
    },
    {
      id: "nationalists",
      name: "Nacionalistas",
      ideology: "nationalism",
      baseVote: 10
    }
  ]
};

const FOREIGN_OPERATIONS = [
  {
    id: "spy",
    icon: "🕵️",
    name: "Espiar",
    cost: 25000000,
    cyberRequired: 400,
    risk: 0.18,
    effects: {
      intelligence: 15,
      relationPenaltyOnFail: -4
    }
  },
  {
    id: "sabotage",
    icon: "🧨",
    name: "Sabotear industria",
    cost: 85000000,
    cyberRequired: 900,
    risk: 0.32,
    effects: {
      targetGDPDamage: 0.006,
      targetStabilityDamage: 1.2,
      relationPenaltyOnFail: -12
    }
  },
  {
    id: "cyber_attack",
    icon: "💻",
    name: "Ciberataque financiero",
    cost: 65000000,
    cyberRequired: 1000,
    risk: 0.28,
    effects: {
      targetTreasuryDamage: 0.015,
      targetStabilityDamage: 0.8,
      relationPenaltyOnFail: -10
    }
  },
  {
    id: "attack",
    icon: "⚔️",
    name: "Ataque limitado",
    cost: 250000000,
    militaryRequiredRatio: 0.65,
    risk: 0.45,
    effects: {
      warRisk: 25,
      relationPenalty: -30,
      reputationPenalty: -8
    }
  },
  {
    id: "invade",
    icon: "🚀",
    name: "Invadir",
    cost: 1500000000,
    militaryRequiredRatio: 1.15,
    risk: 0.72,
    effects: {
      warRisk: 75,
      relationPenalty: -55,
      reputationPenalty: -20
    }
  },
  {
    id: "force_surrender",
    icon: "🏳️",
    name: "Forzar rendición",
    cost: 500000000,
    militaryRequiredRatio: 1.8,
    risk: 0.6,
    effects: {
      targetStabilityDamage: 8,
      relationPenalty: -40,
      reputationPenalty: -12
    }
  },
  {
    id: "diplomatic_pressure",
    icon: "📜",
    name: "Presión diplomática",
    cost: 45000000,
    cyberRequired: 0,
    risk: 0.1,
    effects: {
      relationPenalty: -6,
      targetStabilityDamage: 0.5,
      reputationPenalty: -1
    }
  }
];

const POLICY_PRESETS = {
  rearmament: {
    id: "rearmament",
    name: "Rearme nacional",
    icon: "🛡️",
    description: "Incrementa gasto militar, genera bases y unidades automáticamente.",
    baseCost: 850000000,
    effects: {
      defenseSpendingMultiplier: 1.18,
      reputation: -1.5,
      warRisk: 2,
      stability: 0.4
    },
    autoConstruction: [
      { buildingId: "barracks", count: 1 },
      { buildingId: "airbase", count: 1 },
      { buildingId: "cyber", count: 1 }
    ],
    autoUnits: [
      { unitId: "dragon_8x8", quantity: 30 },
      { unitId: "leopard_2e", quantity: 8 },
      { unitId: "eurofighter", quantity: 4 },
      { unitId: "reaper", quantity: 6 }
    ]
  },
  green_transition: {
    id: "green_transition",
    name: "Política verde",
    icon: "🌱",
    description: "Construye renovables, parques y reduce CO₂ con coste fiscal.",
    baseCost: 620000000,
    effects: {
      co2Multiplier: 0.985,
      happiness: 0.8,
      gdpShortTerm: -0.002,
      reputation: 2.5
    },
    autoConstruction: [
      { buildingId: "park", count: 2 },
      { buildingId: "reserve", count: 1 },
      { buildingId: "solar", count: 2 },
      { buildingId: "wind", count: 1 }
    ],
    autoUnits: []
  },
  industrialization: {
    id: "industrialization",
    name: "Industrialización",
    icon: "🏭",
    description: "Construye industria y logística automáticamente, elevando PIB y CO₂.",
    baseCost: 780000000,
    effects: {
      gdpShortTerm: 0.008,
      employment: 0.5,
      co2Increase: 0.012,
      reputation: -1
    },
    autoConstruction: [
      { buildingId: "steel", count: 1 },
      { buildingId: "cars", count: 1 },
      { buildingId: "electronics", count: 1 },
      { buildingId: "roads", count: 2 }
    ],
    autoUnits: []
  },
  welfare_expansion: {
    id: "welfare_expansion",
    name: "Expansión social",
    icon: "🏥",
    description: "Aumenta gasto social, sanidad, educación y estabilidad social.",
    baseCost: 540000000,
    effects: {
      socialSpendingMultiplier: 1.08,
      happiness: 1.2,
      stability: 0.8,
      debtPressure: 0.004
    },
    autoConstruction: [
      { buildingId: "hospital", count: 1 },
      { buildingId: "university", count: 1 },
      { buildingId: "housing", count: 1 }
    ],
    autoUnits: []
  }
};

const MARKET_INDEXES = [
  {
    id: "ibex_nexus",
    name: "IBEX Nexus",
    region: "España",
    base: 11200,
    value: 11200,
    history: [10820, 10940, 11010, 11130, 11200]
  },
  {
    id: "eurostoxx_nexus",
    name: "EuroStoxx Nexus",
    region: "Europa",
    base: 5050,
    value: 5050,
    history: [4890, 4940, 4995, 5020, 5050]
  },
  {
    id: "sp500_nexus",
    name: "S&P Nexus",
    region: "Estados Unidos",
    base: 5900,
    value: 5900,
    history: [5700, 5765, 5820, 5860, 5900]
  },
  {
    id: "asia_nexus",
    name: "Asia Tech Nexus",
    region: "Asia",
    base: 8200,
    value: 8200,
    history: [7950, 8030, 8120, 8170, 8200]
  }
];

const DEFAULT_MARKET_NEWS = [
  "La inflación energética tensiona los márgenes industriales.",
  "El sector defensa recibe nuevas órdenes de compra por inestabilidad geopolítica.",
  "Las tecnológicas se benefician del aumento en gasto de IA y nube.",
  "Las renovables suben por políticas verdes y mayor inversión pública.",
  "El sector automoción sufre por costes de acero, semiconductores y energía.",
  "La banca mejora con tipos altos, pero aumenta el riesgo de morosidad."
];

/* =========================================================
   DATA.JS v3
   Parte 10/11
   Utilidades de datos, agregadores, búsqueda y normalización.
   ========================================================= */

function getAllBuildingDefinitions() {
  return Object.values(BUILDINGS).flat();
}

function findBuildingById(buildingId) {
  return getAllBuildingDefinitions().find(building => building.id === buildingId) || null;
}

function getBuildCategoryName(category) {
  const names = {
    residential: "Residencial",
    industries: "Industrias",
    infrastructure: "Infraestructura",
    energy: "Energía",
    agriculture: "Agricultura",
    parks: "Parques",
    military: "Militar",
    military_units: "Unidades"
  };

  return names[category] || category;
}

function findMilitaryUnitById(unitId) {
  return MILITARY_UNITS.find(unit => unit.id === unitId) || null;
}

function getCountryCompanies(country) {
  return country.companies || [];
}

function getAllCompanies(countries = []) {
  return countries.flatMap(country =>
    (country.companies || []).map(company => ({
      ...company,
      country: company.country || country.name
    }))
  );
}

function getCompanyById(companyId, countries = []) {
  return getAllCompanies(countries).find(company => company.id === companyId) || null;
}

function normalizeCompanyHistory(company) {
  if (!Array.isArray(company.history) || company.history.length === 0) {
    company.history = [
      company.price * 0.94,
      company.price * 0.97,
      company.price * 0.99,
      company.price * 1.01,
      company.price
    ];
  }

  company.history = company.history.slice(-40);
  return company;
}

function normalizeCompanies(country) {
  country.companies ??= [];
  country.companies.forEach(normalizeCompanyHistory);
}

function normalizeRegion(region) {
  region.population ??= 0;
  region.gdp ??= 0;
  region.level ??= 1;
  region.buildings ??= [];

  if (region.buildingId && region.buildings.length === 0) {
    region.buildings.push({
      buildingId: region.buildingId,
      level: region.level || 1
    });
  }

  return region;
}

function normalizeRegions(country) {
  country.regions ??= simpleRegions(country.name, country.capital, country.lat, country.lon);
  country.regions.forEach(normalizeRegion);
}

function normalizeUnits(country) {
  country.units ??= {};
  Object.keys(country.units).forEach(unitId => {
    country.units[unitId] = Number(country.units[unitId]) || 0;
  });
}

function normalizePortfolio(country) {
  country.portfolio ??= {};
}

function normalizeCountry(country) {
  country.treasury ??= Math.max(50_000_000, country.gdp * 0.0008);
  country.debt ??= country.gdp * 0.6;
  country.taxRate ??= 0.2;

  country.relation ??= 50;
  country.happiness ??= 60;
  country.stability ??= 60;
  country.reputation ??= 60;
  country.sanctions ??= 0;
  country.warRisk ??= 0;
  country.greenPolicy ??= false;

  country.energyProduction ??= country.population * 0.004;
  country.installedPower ??= country.energyProduction * 1.15;
  country.energyDemand ??= country.energyProduction * 1.08;

  country.foodProduction ??= country.population * 1.05;
  country.foodConsumption ??= country.population * 1.04;
  country.waterProduction ??= country.population * 350;

  country.co2 ??= country.population * 4;
  country.research ??= Math.max(100, country.gdp / 2_000_000_000);
  country.military ??= Math.max(5000, country.population * 0.003);
  country.cyber ??= Math.max(100, country.research * 0.8);

  country.imports ??= country.gdp * 0.24;
  country.exports ??= country.gdp * 0.25;
  country.balance ??= country.exports - country.imports;
  country.reserves ??= country.gdp * 0.05;

  country.socialSpending ??= country.gdp * 0.15;
  country.pensions ??= country.gdp * 0.09;
  country.healthSpending ??= country.gdp * 0.07;
  country.educationSpending ??= country.gdp * 0.05;
  country.defenseSpending ??= country.gdp * 0.018;

  country.constructionQueue ??= [];
  country.militaryQueue ??= [];
  country.technologyQueue ??= [];
  country.completedTechnologies ??= [];

  country.renewablesMW ??= Math.round(country.installedPower * 0.18);
  country.climateRisk ??= Math.min(100, 15 + country.co2 / 90_000_000);

  country.regime ??= country.regime || "democracy";
  country.ideology ??= country.ideology || "liberalism";
  country.nextElectionYear ??= 2028;

  normalizeRegions(country);
  normalizeCompanies(country);
  normalizeUnits(country);
  normalizePortfolio(country);

  return country;
}

function cloneCountry(base) {
  return JSON.parse(JSON.stringify(base));
}

function getCountriesDataset() {
  return [
    cloneCountry(SPAIN_BASE),
    ...WESTERN_EUROPE_COUNTRIES.map(cloneCountry),
    ...EASTERN_EUROPE_COUNTRIES.map(cloneCountry),
    ...AMERICAS_COUNTRIES.map(cloneCountry),
    cloneCountry(USA_BASE),
    ...ASIA_PACIFIC_COUNTRIES.map(cloneCountry),
    ...AFRICA_COUNTRIES.map(cloneCountry)
  ].map(normalizeCountry);
}

function getCountryByName(countries, name) {
  return countries.find(country => country.name === name) || null;
}

function getCountryByISO(countries, iso) {
  return countries.find(country => country.iso === iso || country.iso2 === iso) || null;
}

function getCountriesByBloc(countries, blocId) {
  const bloc = INTERNATIONAL_BLOCS.find(item => item.id === blocId);
  if (!bloc) return [];

  return countries.filter(country => bloc.members.includes(country.name));
}

function countryBelongsToBloc(countryName, blocId) {
  const bloc = INTERNATIONAL_BLOCS.find(item => item.id === blocId);
  return Boolean(bloc && bloc.members.includes(countryName));
}

function getCountryBlocNames(countryName) {
  return INTERNATIONAL_BLOCS
    .filter(bloc => bloc.members.includes(countryName))
    .map(bloc => bloc.name);
}

function getCountryPrimaryColor(country) {
  if (country.regime === "authoritarian") return "#ef4444";
  if (country.regime === "technocracy") return "#8b5cf6";
  if (country.regime === "monarchy") return "#f59e0b";

  if (country.ideology === "green") return "#22c55e";
  if (country.ideology === "socialism") return "#dc2626";
  if (country.ideology === "social_democracy") return "#38bdf8";
  if (country.ideology === "capitalist_liberalism") return "#facc15";
  if (country.ideology === "nationalism") return "#fb923c";

  return "#3b82f6";
}

function getCountryLayerValue(country, layer) {
  switch (layer) {
    case "political":
      return country.ideology;
    case "economy":
      return country.gdp;
    case "population":
      return country.population;
    case "happiness":
      return country.happiness;
    case "stability":
      return country.stability;
    case "military":
      return country.military;
    case "pollution":
      return country.co2;
    case "climate":
      return country.climateRisk;
    case "resources":
      return country.reserves;
    case "diplomacy":
      return country.relation;
    case "food":
      return country.foodProduction - country.foodConsumption;
    case "energy":
      return country.energyProduction - country.energyDemand;
    default:
      return 0;
  }
}

function getLayerColor(country, layer, countries = []) {
  if (layer === "political") return getCountryPrimaryColor(country);

  const value = getCountryLayerValue(country, layer);

  if (layer === "pollution" || layer === "climate") {
    const normalized = layer === "pollution"
      ? Math.min(100, value / 120_000_000)
      : value;

    if (normalized < 35) return "#22c55e";
    if (normalized < 70) return "#f59e0b";
    return "#ef4444";
  }

  if (layer === "food" || layer === "energy") {
    if (value >= 0) return "#22c55e";
    if (value > -Math.abs(country.population * 0.1)) return "#f59e0b";
    return "#ef4444";
  }

  if (layer === "diplomacy" || layer === "happiness" || layer === "stability") {
    if (value >= 70) return "#22c55e";
    if (value >= 45) return "#f59e0b";
    return "#ef4444";
  }

  const allValues = countries.map(c => getCountryLayerValue(c, layer)).filter(Number.isFinite);
  const max = Math.max(...allValues, 1);
  const ratio = value / max;

  if (ratio > 0.66) return "#ef4444";
  if (ratio > 0.33) return "#8b5cf6";
  return "#38bdf8";
}

function getRegionIcon(region) {
  const icons = {
    capital: "🏛️",
    port: "⚓",
    industry: "🏭",
    technology: "💾",
    finance: "🏦",
    automotive: "🚘",
    logistics: "🚄",
    energy: "🛢️",
    naval: "⚓",
    agriculture: "🌾",
    tourism: "🌴",
    aerospace: "🛰️",
    space: "🚀",
    mining: "⛏️"
  };

  return icons[region.type] || "📍";
}

function getRegionMarkerClass(region) {
  const type = region.type || "default";

  if (type === "capital") return "capital";
  if (type === "port") return "port";
  if (type === "naval") return "military";
  if (type === "energy") return "energy";
  if (type === "agriculture") return "farm";
  if (type === "industry" || type === "automotive" || type === "mining") return "industry";

  return "city";
}

function getCountrySummary(country) {
  return {
    name: country.name,
    flag: country.flag,
    capital: country.capital,
    population: country.population,
    gdp: country.gdp,
    treasury: country.treasury,
    debt: country.debt,
    happiness: country.happiness,
    stability: country.stability,
    military: country.military,
    cyber: country.cyber,
    co2: country.co2,
    energyBalance: country.energyProduction - country.energyDemand,
    foodBalance: country.foodProduction - country.foodConsumption,
    blocs: getCountryBlocNames(country.name)
  };
}

function getInitialResourceState() {
  return GLOBAL_RESOURCE_STATE.map(resource => ({ ...resource }));
}

function getInitialMarketIndexes() {
  return MARKET_INDEXES.map(index => ({
    ...index,
    history: [...index.history]
  }));
}

function getInitialInternationalBlocs() {
  return INTERNATIONAL_BLOCS.map(bloc => ({
    ...bloc,
    members: [...bloc.members],
    effects: { ...bloc.effects }
  }));
}

function getInitialTechnologies() {
  return TECHNOLOGIES.map(technology => ({
    ...technology,
    effects: { ...technology.effects }
  }));
}

function getElectionParties(countryName) {
  return ELECTION_PARTIES[countryName] || ELECTION_PARTIES.default;
}

function buildCountrySearchIndex(countries) {
  return countries.map(country => ({
    name: country.name,
    iso: country.iso,
    iso2: country.iso2,
    flag: country.flag,
    capital: country.capital,
    search: `${country.name} ${country.iso} ${country.iso2} ${country.capital}`.toLowerCase()
  }));
}

function getWorldTotals(countries) {
  return countries.reduce((acc, country) => {
    acc.population += country.population || 0;
    acc.gdp += country.gdp || 0;
    acc.co2 += country.co2 || 0;
    acc.military += country.military || 0;
    acc.energyProduction += country.energyProduction || 0;
    acc.energyDemand += country.energyDemand || 0;
    acc.foodProduction += country.foodProduction || 0;
    acc.foodConsumption += country.foodConsumption || 0;
    return acc;
  }, {
    population: 0,
    gdp: 0,
    co2: 0,
    military: 0,
    energyProduction: 0,
    energyDemand: 0,
    foodProduction: 0,
    foodConsumption: 0
  });
}

function generateCompanyId(name, countryName) {
  return (
    countryName.toLowerCase().replaceAll(" ", "_") +
    "_" +
    name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
  );
}

function createCompanyTemplate(name, countryName, sector, initialPrice = 25) {
  return normalizeCompanyHistory({
    id: generateCompanyId(name, countryName),
    name,
    country: countryName,
    sector,
    price: initialPrice,
    shares: 100_000_000,
    owned: 0,
    controlled: false,
    history: [
      initialPrice * 0.95,
      initialPrice * 0.97,
      initialPrice * 0.99,
      initialPrice * 1.01,
      initialPrice
    ]
  });
}

function getAvailableMilitaryUnitsForCountry(country) {
  const isSpain = country.name === "España";
  const isUSA = country.name === "Estados Unidos";
  const isNATO = countryBelongsToBloc(country.name, "nato");

  if (isSpain) {
    return MILITARY_UNITS;
  }

  if (isUSA) {
    return MILITARY_UNITS.concat([
      {
        id: "abrams_m1a2_export",
        icon: "🛡️",
        name: "M1A2 Abrams",
        type: "Tanque de combate",
        domain: "land",
        cost: 18_000_000,
        days: 24,
        upkeep: 55_000,
        power: 620,
        company: "General Dynamics"
      },
      {
        id: "f22_raptor",
        icon: "🛩️",
        name: "F-22 Raptor",
        type: "Caza superioridad aérea",
        domain: "air",
        cost: 180_000_000,
        days: 90,
        upkeep: 420_000,
        power: 3_200,
        company: "Lockheed Martin"
      },
      {
        id: "b21_raider",
        icon: "✈️",
        name: "B-21 Raider",
        type: "Bombardero furtivo",
        domain: "air",
        cost: 700_000_000,
        days: 180,
        upkeep: 900_000,
        power: 7_500,
        company: "Northrop Grumman"
      }
    ]);
  }

  if (isNATO) {
    return MILITARY_UNITS.filter(unit =>
      [
        "leopard_2e",
        "dragon_8x8",
        "eurofighter",
        "f35a",
        "nh90",
        "reaper",
        "destroyer_aegis",
        "frigate",
        "submarine"
      ].includes(unit.id)
    );
  }

  return MILITARY_UNITS.filter(unit =>
    [
      "tank",
      "fighter",
      "destroyer",
      "submarine",
      "recon_drone",
      "attack_helicopter"
    ].includes(unit.id)
  );
}


/* =========================================================
   DATA.JS v3
   Parte 11/11
   Inicialización del estado global y exportación.
   ========================================================= */

function createInitialGameState() {
  const countries = getCountriesDataset();

  const state = {
    version: "3.0.0",
    selectedCountry: "España",
    countries,
    resources: getInitialResourceState(),
    marketIndexes: getInitialMarketIndexes(),
    internationalBlocs: getInitialInternationalBlocs(),
    technologies: getInitialTechnologies(),
    events: [],
    world: {
      co2ppm: 424.2,
      temperatureDelta: 1.28,
      tension: 32,
      inflation: 2.7,
      foodStress: 18,
      energyStress: 22
    }
  };

  return state;
}

function getWorldCountries() {
  return getCountriesDataset();
}

function getPlayableCountries() {
  return ["España"];
}

/* =========================================================
   EXPORT GLOBAL
========================================================= */

window.MAP_LAYERS = MAP_LAYERS;
window.REGIMES = REGIMES;
window.IDEOLOGIES = IDEOLOGIES;
window.BUILDINGS = BUILDINGS;
window.MILITARY_UNITS = MILITARY_UNITS;

window.SPAIN_BASE = SPAIN_BASE;
window.USA_BASE = USA_BASE;

window.WESTERN_EUROPE_COUNTRIES = WESTERN_EUROPE_COUNTRIES;
window.EASTERN_EUROPE_COUNTRIES = EASTERN_EUROPE_COUNTRIES;
window.AMERICAS_COUNTRIES = AMERICAS_COUNTRIES;
window.ASIA_PACIFIC_COUNTRIES = ASIA_PACIFIC_COUNTRIES;
window.AFRICA_COUNTRIES = AFRICA_COUNTRIES;

window.INTERNATIONAL_BLOCS = INTERNATIONAL_BLOCS;
window.STRATEGIC_RESOURCES = STRATEGIC_RESOURCES;
window.GLOBAL_RESOURCE_STATE = GLOBAL_RESOURCE_STATE;
window.TECHNOLOGIES = TECHNOLOGIES;
window.GLOBAL_EVENTS = GLOBAL_EVENTS;
window.ELECTION_PARTIES = ELECTION_PARTIES;
window.FOREIGN_OPERATIONS = FOREIGN_OPERATIONS;
window.POLICY_PRESETS = POLICY_PRESETS;
window.MARKET_INDEXES = MARKET_INDEXES;
window.DEFAULT_MARKET_NEWS = DEFAULT_MARKET_NEWS;

window.createInitialGameState = createInitialGameState;
window.getWorldCountries = getWorldCountries;
window.getPlayableCountries = getPlayableCountries;

window.getAllBuildingDefinitions = getAllBuildingDefinitions;
window.findBuildingById = findBuildingById;
window.getBuildCategoryName = getBuildCategoryName;
window.findMilitaryUnitById = findMilitaryUnitById;
window.getCountryCompanies = getCountryCompanies;
window.getAllCompanies = getAllCompanies;
window.getCompanyById = getCompanyById;
window.normalizeCompanyHistory = normalizeCompanyHistory;
window.normalizeCompanies = normalizeCompanies;
window.normalizeRegion = normalizeRegion;
window.normalizeRegions = normalizeRegions;
window.normalizeUnits = normalizeUnits;
window.normalizePortfolio = normalizePortfolio;
window.normalizeCountry = normalizeCountry;
window.cloneCountry = cloneCountry;
window.getCountriesDataset = getCountriesDataset;
window.getCountryByName = getCountryByName;
window.getCountryByISO = getCountryByISO;
window.getCountriesByBloc = getCountriesByBloc;
window.countryBelongsToBloc = countryBelongsToBloc;
window.getCountryBlocNames = getCountryBlocNames;
window.getCountryPrimaryColor = getCountryPrimaryColor;
window.getCountryLayerValue = getCountryLayerValue;
window.getLayerColor = getLayerColor;
window.getRegionIcon = getRegionIcon;
window.getRegionMarkerClass = getRegionMarkerClass;
window.getCountrySummary = getCountrySummary;
window.getInitialResourceState = getInitialResourceState;
window.getInitialMarketIndexes = getInitialMarketIndexes;
window.getInitialInternationalBlocs = getInitialInternationalBlocs;
window.getInitialTechnologies = getInitialTechnologies;
window.getElectionParties = getElectionParties;
window.buildCountrySearchIndex = buildCountrySearchIndex;
window.getWorldTotals = getWorldTotals;
window.generateCompanyId = generateCompanyId;
window.createCompanyTemplate = createCompanyTemplate;
window.getAvailableMilitaryUnitsForCountry = getAvailableMilitaryUnitsForCountry;



