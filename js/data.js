/* =========================================================
   NEXUS RTS — DATA.JS
   Base de datos inicial:
   países, edificios, regiones, costes, economía, energía,
   población, CO₂, ejército, mercado y estado inicial.
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
  diplomacy: "Diplomacia"
};

/* =========================================================
   EDIFICIOS / CONSTRUCCIÓN
   Valores absolutos:
   - cost: euros
   - days: días
   - gdp: incremento anual aproximado de PIB
   - jobs: empleos generados
   - energy: MW netos
   - co2: toneladas anuales equivalentes
========================================================= */

const BUILDINGS = {
  residential: [
    {
      id: "housing",
      icon: "🏠",
      name: "Barrio residencial",
      cost: 8_500_000,
      days: 25,
      population: 18_000,
      jobs: 900,
      energy: -18,
      co2: 900,
      happiness: 0.6,
      effect: "+18.000 habitantes · +900 empleos · -18 MW"
    },
    {
      id: "hospital",
      icon: "🏥",
      name: "Hospital comarcal",
      cost: 18_000_000,
      days: 45,
      jobs: 1_600,
      energy: -12,
      co2: 650,
      happiness: 1.4,
      effect: "+1.600 empleos · +salud pública · -12 MW"
    },
    {
      id: "university",
      icon: "🎓",
      name: "Universidad técnica",
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
      cost: 45_000_000,
      days: 90,
      gdp: 140_000_000,
      jobs: 1_500,
      energy: -90,
      co2: 41_000,
      effect: "+140 M€ PIB · +1.500 empleos · +41.000 t CO₂"
    },
    {
      id: "chemical",
      icon: "🧪",
      name: "Planta química",
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
      cost: 26_000_000,
      days: 60,
      gdp: 100_000_000,
      jobs: 1_100,
      energy: -45,
      co2: 15_000,
      research: 8,
      effect: "+100 M€ PIB · +1.100 empleos · +8 I+D"
    },
    {
      id: "refinery",
      icon: "🛢️",
      name: "Refinería de petróleo",
      cost: 30_000_000,
      days: 75,
      gdp: 105_000_000,
      jobs: 2_000,
      energy: 120,
      co2: 98_000,
      effect: "+105 M€ PIB · +120 MW · +98.000 t CO₂"
    }
  ],

  infrastructure: [
    {
      id: "roads",
      icon: "🛣️",
      name: "Mejorar carreteras",
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
      cost: 10_000_000,
      days: 30,
      energy: 80,
      gdp: 15_000_000,
      jobs: 280,
      co2: 500,
      effect: "+80 MW · +15 M€ PIB"
    }
  ],

  energy: [
    {
      id: "solar",
      icon: "☀️",
      name: "Parque solar",
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
      cost: 38_000_000,
      days: 75,
      energy: 250,
      jobs: 500,
      co2: 74_000,
      effect: "+250 MW · +74.000 t CO₂"
    }
  ],

  parks: [
    {
      id: "park",
      icon: "🌳",
      name: "Parque urbano",
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
   PAÍSES BASE
   Valores aproximados de simulación, no base estadística oficial.
========================================================= */

const COUNTRY_DATA = [
  {
    name: "España",
    iso: "ESP",
    iso2: "ES",
    flag: "🇪🇸",
    capital: "Madrid",
    lat: 40.4168,
    lon: -3.7038,
    zoom: 6,
    area: 505_990,
    population: 47_615_034,
    gdp: 1_582_320_000_000,
    gdpPerCapita: 33_327,
    government: "Democracia",
    ideology: "Centro",
    relation: 64.2,
    happiness: 78.6,
    stability: 82.3,
    energyProduction: 289_450,
    installedPower: 352_180,
    energyDemand: 315_000,
    co2: 128_450_000,
    research: 1_245,
    military: 215_000,
    cyber: 1_820,
    reserves: 156_230_000_000,
    balance: 48_250_000_000,
    imports: 298_450_000_000,
    exports: 346_700_000_000,
    taxRate: 0.22
  },
  {
    name: "Francia",
    iso: "FRA",
    iso2: "FR",
    flag: "🇫🇷",
    capital: "París",
    lat: 48.8566,
    lon: 2.3522,
    zoom: 5,
    area: 643_801,
    population: 68_042_591,
    gdp: 3_052_000_000_000,
    gdpPerCapita: 44_850,
    government: "Democracia",
    ideology: "Centro",
    relation: 68,
    happiness: 76,
    stability: 79,
    energyProduction: 445_000,
    installedPower: 540_000,
    energyDemand: 510_000,
    co2: 221_000_000,
    research: 1_800,
    military: 302_000,
    cyber: 2_150,
    reserves: 120_000_000_000,
    balance: 51_300_000_000,
    imports: 640_000_000_000,
    exports: 720_000_000_000,
    taxRate: 0.24
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
    area: 357_588,
    population: 84_607_016,
    gdp: 4_525_000_000_000,
    gdpPerCapita: 53_490,
    government: "Democracia",
    ideology: "Centro industrial",
    relation: 72,
    happiness: 77,
    stability: 80,
    energyProduction: 610_000,
    installedPower: 690_000,
    energyDemand: 660_000,
    co2: 420_000_000,
    research: 2_600,
    military: 340_000,
    cyber: 2_500,
    reserves: 210_000_000_000,
    balance: 50_900_000_000,
    imports: 1_170_000_000_000,
    exports: 1_420_000_000_000,
    taxRate: 0.23
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
    area: 301_340,
    population: 58_870_762,
    gdp: 2_301_000_000_000,
    gdpPerCapita: 39_090,
    government: "Democracia",
    ideology: "Centro",
    relation: 59,
    happiness: 74,
    stability: 71,
    energyProduction: 370_000,
    installedPower: 415_000,
    energyDemand: 405_000,
    co2: 298_000_000,
    research: 1_220,
    military: 185_000,
    cyber: 1_500,
    reserves: 88_000_000_000,
    balance: 33_100_000_000,
    imports: 550_000_000_000,
    exports: 620_000_000_000,
    taxRate: 0.23
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
    area: 92_212,
    population: 10_467_366,
    gdp: 287_000_000_000,
    gdpPerCapita: 27_420,
    government: "Democracia",
    ideology: "Centro",
    relation: 67,
    happiness: 78,
    stability: 75,
    energyProduction: 71_000,
    installedPower: 88_000,
    energyDemand: 84_000,
    co2: 43_000_000,
    research: 420,
    military: 65_000,
    cyber: 900,
    reserves: 28_000_000_000,
    balance: 18_100_000_000,
    imports: 72_000_000_000,
    exports: 94_000_000_000,
    taxRate: 0.21
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
    area: 243_610,
    population: 67_736_802,
    gdp: 3_340_000_000_000,
    gdpPerCapita: 49_300,
    government: "Democracia",
    ideology: "Liberal",
    relation: 66,
    happiness: 75,
    stability: 74,
    energyProduction: 390_000,
    installedPower: 475_000,
    energyDemand: 460_000,
    co2: 326_000_000,
    research: 2_200,
    military: 420_000,
    cyber: 2_700,
    reserves: 170_000_000_000,
    balance: 62_000_000_000,
    imports: 720_000_000_000,
    exports: 890_000_000_000,
    taxRate: 0.23
  },
  {
    name: "Estados Unidos",
    iso: "USA",
    iso2: "US",
    flag: "🇺🇸",
    capital: "Washington D.C.",
    lat: 38.9072,
    lon: -77.0369,
    zoom: 4,
    area: 9_833_517,
    population: 334_914_895,
    gdp: 27_360_000_000_000,
    gdpPerCapita: 81_600,
    government: "Democracia",
    ideology: "Liberal",
    relation: 70,
    happiness: 74,
    stability: 76,
    energyProduction: 4_290_000,
    installedPower: 4_650_000,
    energyDemand: 4_520_000,
    co2: 5_007_000_000,
    research: 7_500,
    military: 1_370_000,
    cyber: 8_200,
    reserves: 680_000_000_000,
    balance: 38_000_000_000,
    imports: 3_050_000_000_000,
    exports: 2_550_000_000_000,
    taxRate: 0.20
  },
  {
    name: "China",
    iso: "CHN",
    iso2: "CN",
    flag: "🇨🇳",
    capital: "Pekín",
    lat: 39.9042,
    lon: 116.4074,
    zoom: 4,
    area: 9_596_961,
    population: 1_411_750_000,
    gdp: 17_790_000_000_000,
    gdpPerCapita: 12_600,
    government: "Autoritario",
    ideology: "Estado",
    relation: 44,
    happiness: 71,
    stability: 76,
    energyProduction: 8_800_000,
    installedPower: 9_450_000,
    energyDemand: 9_200_000,
    co2: 11_472_000_000,
    research: 6_200,
    military: 2_035_000,
    cyber: 7_100,
    reserves: 980_000_000_000,
    balance: 35_000_000_000,
    imports: 3_110_000_000_000,
    exports: 3_340_000_000_000,
    taxRate: 0.19
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
    area: 3_287_263,
    population: 1_428_627_663,
    gdp: 3_730_000_000_000,
    gdpPerCapita: 2_610,
    government: "Democracia",
    ideology: "Mixto",
    relation: 52,
    happiness: 64,
    stability: 60,
    energyProduction: 1_950_000,
    installedPower: 2_200_000,
    energyDemand: 2_120_000,
    co2: 2_709_000_000,
    research: 2_400,
    military: 1_450_000,
    cyber: 3_200,
    reserves: 350_000_000_000,
    balance: 22_000_000_000,
    imports: 680_000_000_000,
    exports: 770_000_000_000,
    taxRate: 0.16
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
    area: 17_098_242,
    population: 143_826_130,
    gdp: 2_240_000_000_000,
    gdpPerCapita: 15_570,
    government: "Autoritario",
    ideology: "Nacionalista",
    relation: 31,
    happiness: 58,
    stability: 55,
    energyProduction: 980_000,
    installedPower: 1_100_000,
    energyDemand: 970_000,
    co2: 1_750_000_000,
    research: 1_900,
    military: 930_000,
    cyber: 3_600,
    reserves: 520_000_000_000,
    balance: 39_000_000_000,
    imports: 320_000_000_000,
    exports: 520_000_000_000,
    taxRate: 0.18
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
    area: 377_975,
    population: 124_516_650,
    gdp: 4_212_000_000_000,
    gdpPerCapita: 33_830,
    government: "Democracia",
    ideology: "Tecnocrático",
    relation: 73,
    happiness: 78,
    stability: 83,
    energyProduction: 920_000,
    installedPower: 1_030_000,
    energyDemand: 1_010_000,
    co2: 1_067_000_000,
    research: 3_900,
    military: 247_000,
    cyber: 3_600,
    reserves: 210_000_000_000,
    balance: 36_000_000_000,
    imports: 750_000_000_000,
    exports: 790_000_000_000,
    taxRate: 0.21
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
    area: 100_210,
    population: 51_712_619,
    gdp: 1_713_000_000_000,
    gdpPerCapita: 33_120,
    government: "Democracia",
    ideology: "Tecnocrático",
    relation: 69,
    happiness: 76,
    stability: 79,
    energyProduction: 620_000,
    installedPower: 690_000,
    energyDemand: 675_000,
    co2: 586_000_000,
    research: 2_500,
    military: 555_000,
    cyber: 3_100,
    reserves: 140_000_000_000,
    balance: 36_000_000_000,
    imports: 680_000_000_000,
    exports: 720_000_000_000,
    taxRate: 0.20
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
    area: 8_515_767,
    population: 216_422_446,
    gdp: 2_170_000_000_000,
    gdpPerCapita: 10_030,
    government: "Democracia",
    ideology: "Mixto",
    relation: 57,
    happiness: 67,
    stability: 61,
    energyProduction: 720_000,
    installedPower: 790_000,
    energyDemand: 760_000,
    co2: 486_000_000,
    research: 1_120,
    military: 360_000,
    cyber: 1_850,
    reserves: 82_000_000_000,
    balance: -10_000_000_000,
    imports: 410_000_000_000,
    exports: 468_000_000_000,
    taxRate: 0.18
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
    area: 1_964_375,
    population: 128_455_567,
    gdp: 1_790_000_000_000,
    gdpPerCapita: 13_940,
    government: "Democracia",
    ideology: "Mixto",
    relation: 54,
    happiness: 66,
    stability: 62,
    energyProduction: 335_000,
    installedPower: 390_000,
    energyDemand: 370_000,
    co2: 487_000_000,
    research: 980,
    military: 277_000,
    cyber: 1_450,
    reserves: 56_000_000_000,
    balance: 23_000_000_000,
    imports: 480_000_000_000,
    exports: 530_000_000_000,
    taxRate: 0.17
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
    area: 7_692_024,
    population: 26_439_111,
    gdp: 1_693_000_000_000,
    gdpPerCapita: 64_030,
    government: "Democracia",
    ideology: "Liberal",
    relation: 75,
    happiness: 79,
    stability: 82,
    energyProduction: 320_000,
    installedPower: 360_000,
    energyDemand: 345_000,
    co2: 392_000_000,
    research: 1_500,
    military: 59_000,
    cyber: 1_550,
    reserves: 88_000_000_000,
    balance: -25_000_000_000,
    imports: 330_000_000_000,
    exports: 410_000_000_000,
    taxRate: 0.19
  },
  {
    name: "Marruecos",
    iso: "MAR",
    iso2: "MA",
    flag: "🇲🇦",
    capital: "Rabat",
    lat: 34.0209,
    lon: -6.8416,
    zoom: 6,
    area: 446_550,
    population: 37_840_044,
    gdp: 152_000_000_000,
    gdpPerCapita: 4_010,
    government: "Monarquía",
    ideology: "Mixto",
    relation: 61,
    happiness: 65,
    stability: 62,
    energyProduction: 43_000,
    installedPower: 58_000,
    energyDemand: 55_000,
    co2: 72_000_000,
    research: 290,
    military: 195_000,
    cyber: 820,
    reserves: 16_000_000_000,
    balance: 31_000_000_000,
    imports: 65_000_000_000,
    exports: 47_000_000_000,
    taxRate: 0.16
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
    area: 385_207,
    population: 5_519_594,
    gdp: 579_000_000_000,
    gdpPerCapita: 104_900,
    government: "Democracia",
    ideology: "Nórdico",
    relation: 82,
    happiness: 84,
    stability: 86,
    energyProduction: 158_000,
    installedPower: 170_000,
    energyDemand: 155_000,
    co2: 41_000_000,
    research: 530,
    military: 26_000,
    cyber: 900,
    reserves: 65_000_000_000,
    balance: 61_000_000_000,
    imports: 110_000_000_000,
    exports: 190_000_000_000,
    taxRate: 0.25
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
    area: 450_295,
    population: 10_612_086,
    gdp: 593_000_000_000,
    gdpPerCapita: 55_880,
    government: "Democracia",
    ideology: "Nórdico",
    relation: 80,
    happiness: 82,
    stability: 84,
    energyProduction: 145_000,
    installedPower: 165_000,
    energyDemand: 150_000,
    co2: 39_000_000,
    research: 620,
    military: 24_000,
    cyber: 1_050,
    reserves: 71_000_000_000,
    balance: 59_000_000_000,
    imports: 180_000_000_000,
    exports: 210_000_000_000,
    taxRate: 0.25
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
    area: 783_562,
    population: 85_326_000,
    gdp: 1_118_000_000_000,
    gdpPerCapita: 13_100,
    government: "Democracia",
    ideology: "Regional",
    relation: 46,
    happiness: 63,
    stability: 57,
    energyProduction: 310_000,
    installedPower: 365_000,
    energyDemand: 350_000,
    co2: 430_000_000,
    research: 860,
    military: 355_000,
    cyber: 1_700,
    reserves: 54_000_000_000,
    balance: 39_000_000_000,
    imports: 230_000_000_000,
    exports: 260_000_000_000,
    taxRate: 0.17
  }
];

/* =========================================================
   MERCADO BASE
========================================================= */

const MARKET_DATA = [
  {
    name: "IberSteel",
    sector: "Industria pesada",
    price: 42.5,
    owned: 0,
    delta: 0.8
  },
  {
    name: "Hispatech",
    sector: "Tecnología",
    price: 28.9,
    owned: 0,
    delta: 1.3
  },
  {
    name: "AgroSol",
    sector: "Alimentación",
    price: 22.4,
    owned: 0,
    delta: -0.2
  },
  {
    name: "Energía Norte",
    sector: "Energía",
    price: 36.2,
    owned: 0,
    delta: 0.4
  }
];

/* =========================================================
   CREACIÓN DEL ESTADO INICIAL
========================================================= */

function createInitialGameState() {
  const countries = structuredCloneSafe(COUNTRY_DATA).map(country => ({
    ...country,
    treasury: country.gdp * 0.0008,
    debt: country.gdp * 0.31,
    laborForce: Math.round(country.population * 0.5),
    unemployment: Math.round(country.population * 0.045),
    foodProduction: Math.round(country.population * 0.118),
    waterProduction: Math.round(country.population * 0.387),
    climateRisk: Math.round(25 + country.co2 / 140_000_000),
    sanctions: 0,
    warRisk: 0,
    greenPolicy: false,
    renewablesMW: 0,
    previousGDP: country.gdp,
    powerRank: 0,
    regions: [],
    constructionQueue: [],
    desperation: 0
  }));

  const state = {
    countries,
    market: structuredCloneSafe(MARKET_DATA),
    events: [],
    global: {
      co2ppm: 422.1,
      temperatureDelta: 1.28,
      worldTension: 18,
      migrationPool: 0,
      marketSentiment: 62
    }
  };

  countries.forEach(country => initializeCountrySites(country));

  return state;
}

/* =========================================================
   REGIONES / SITIOS LOCALES
   Para España usamos geografía real aproximada por ciudades.
========================================================= */

function initializeCountrySites(country) {
  if (country.name === "España") {
    country.regions = [
      {
        id: "madrid",
        name: "Madrid",
        type: "capital",
        lat: 40.4168,
        lon: -3.7038,
        buildingId: null,
        level: 1
      },
      {
        id: "barcelona",
        name: "Barcelona",
        type: "port",
        lat: 41.3874,
        lon: 2.1686,
        buildingId: "ports",
        level: 1
      },
      {
        id: "valencia",
        name: "Valencia",
        type: "energy",
        lat: 39.4699,
        lon: -0.3763,
        buildingId: "solar",
        level: 1
      },
      {
        id: "sevilla",
        name: "Sevilla",
        type: "industry",
        lat: 37.3891,
        lon: -5.9845,
        buildingId: "textile",
        level: 1
      },
      {
        id: "bilbao",
        name: "Bilbao",
        type: "industry",
        lat: 43.263,
        lon: -2.935,
        buildingId: "steel",
        level: 1
      },
      {
        id: "a-coruna",
        name: "A Coruña",
        type: "port",
        lat: 43.3623,
        lon: -8.4115,
        buildingId: "ports",
        level: 1
      },
      {
        id: "zaragoza",
        name: "Zaragoza",
        type: "energy",
        lat: 41.6488,
        lon: -0.8891,
        buildingId: "wind",
        level: 1
      },
      {
        id: "malaga",
        name: "Málaga",
        type: "port",
        lat: 36.7213,
        lon: -4.4214,
        buildingId: "ports",
        level: 1
      },
      {
        id: "valladolid",
        name: "Valladolid",
        type: "agriculture",
        lat: 41.6523,
        lon: -4.7245,
        buildingId: "park",
        level: 1
      },
      {
        id: "murcia",
        name: "Murcia",
        type: "agriculture",
        lat: 37.9922,
        lon: -1.1307,
        buildingId: "park",
        level: 1
      },
      {
        id: "gijon",
        name: "Gijón",
        type: "port",
        lat: 43.5322,
        lon: -5.6611,
        buildingId: null,
        level: 1
      },
      {
        id: "cadiz",
        name: "Cádiz",
        type: "naval",
        lat: 36.5271,
        lon: -6.2886,
        buildingId: null,
        level: 1
      },
      {
  id: "san-sebastian",
  name: "San Sebastián",
  type: "port",
  lat: 43.3183,
  lon: -1.9812,
  buildingId: null,
  level: 1
},
      
    ];
    return;
  }

  country.regions = [
    {
      id: "capital",
      name: country.capital,
      type: "capital",
      lat: country.lat,
      lon: country.lon,
      buildingId: null,
      level: 1
    },
    {
      id: "industry",
      name: "Región industrial",
      type: "industry",
      lat: country.lat + 1.2,
      lon: country.lon - 1.1,
      buildingId: "textile",
      level: 1
    },
    {
      id: "energy",
      name: "Nodo energético",
      type: "energy",
      lat: country.lat - 0.9,
      lon: country.lon + 1.2,
      buildingId: "solar",
      level: 1
    },
    {
      id: "port",
      name: "Puerto principal",
      type: "port",
      lat: country.lat - 0.7,
      lon: country.lon - 0.9,
      buildingId: "ports",
      level: 1
    },
    {
      id: "agriculture",
      name: "Región agraria",
      type: "agriculture",
      lat: country.lat + 0.6,
      lon: country.lon + 0.8,
      buildingId: "park",
      level: 1
    }
  ];
}

/* =========================================================
   UTILIDADES
========================================================= */

function structuredCloneSafe(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

/* =========================================================
   MILITARY
========================================================= */
const MILITARY_UNITS = [
  {
    id: "fighter",
    icon: "🛩️",
    name: "Caza polivalente",
    domain: "air",
    cost: 45_000_000,
    days: 30,
    upkeep: 120_000,
    power: 900
  },
  {
    id: "bomber",
    icon: "✈️",
    name: "Bombardero estratégico",
    domain: "air",
    cost: 120_000_000,
    days: 60,
    upkeep: 280_000,
    power: 2_400
  },
  {
    id: "tank",
    icon: "🛡️",
    name: "Tanque de combate",
    domain: "land",
    cost: 15_000_000,
    days: 20,
    upkeep: 45_000,
    power: 420
  },
  {
    id: "destroyer",
    icon: "🚢",
    name: "Destructor",
    domain: "sea",
    cost: 85_000_000,
    days: 40,
    upkeep: 200_000,
    power: 1_700
  },
  {
    id: "submarine",
    icon: "🌊",
    name: "Submarino",
    domain: "sea",
    cost: 70_000_000,
    days: 40,
    upkeep: 170_000,
    power: 1_600
  },
  {
    id: "amphibious",
    icon: "⚓",
    name: "Unidad anfibia",
    domain: "sea-land",
    cost: 25_000_000,
    days: 25,
    upkeep: 60_000,
    power: 650
  },
  {
    id: "carrier",
    icon: "🛳️",
    name: "Portaviones",
    domain: "sea-air",
    cost: 240_000_000,
    days: 90,
    upkeep: 600_000,
    power: 6_500
  },
  {
    id: "frigate",
    icon: "🚢",
    name: "Fragata",
    domain: "sea",
    cost: 40_000_000,
    days: 25,
    upkeep: 100_000,
    power: 950
  },
  {
    id: "attack_helicopter",
    icon: "🚁",
    name: "Helicóptero de ataque",
    domain: "air-land",
    cost: 30_000_000,
    days: 20,
    upkeep: 80_000,
    power: 700
  },
  {
    id: "recon_drone",
    icon: "🛰️",
    name: "Dron de reconocimiento",
    domain: "air-cyber",
    cost: 8_000_000,
    days: 10,
    upkeep: 20_000,
    power: 180
  }
];


/* =========================================================
   EXPORT GLOBAL
========================================================= */

window.MAP_LAYERS = MAP_LAYERS;
window.BUILDINGS = BUILDINGS;
window.COUNTRY_DATA = COUNTRY_DATA;
window.MARKET_DATA = MARKET_DATA;
window.MILITARY_UNITS = MILITARY_UNITS;

window.createInitialGameState = createInitialGameState;
window.initializeCountrySites = initializeCountrySites;
window.structuredCloneSafe = structuredCloneSafe;
