/* =========================================================
   NEXUS RTS — MAPS.JS
   Sistema cartográfico:
   - Leaflet + OpenStreetMap
   - Mapa mundial real
   - GeoJSON de países
   - Capas geopolíticas
   - Mapa local del país seleccionado
   - Marcadores de regiones / industrias / puertos / energía
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURACIÓN CARTOGRÁFICA
========================================================= */

const MAP_CONFIG = {
  worldGeoJsonUrl:
    "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json",

  worldInitialView: {
    lat: 25,
    lon: 8,
    zoom: 2
  },

  tileLayer: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution: "© OpenStreetMap"
    }
  }
};

/* =========================================================
   ESTADO INTERNO DEL MAPA
========================================================= */

let WORLD_MAP = null;
let LOCAL_MAP = null;
let WORLD_GEOJSON_LAYER = null;
let WORLD_MARKERS = [];
let LOCAL_MARKERS = [];
let GEOJSON_LOADED = false;

/* =========================================================
   INICIALIZACIÓN
========================================================= */

function initializeMaps() {
  initializeWorldMap();
  initializeLocalMap();
  loadWorldGeoJson();
}

function initializeWorldMap() {
  const container = document.getElementById("world-map");

  if (!container) {
    console.warn("No existe #world-map");
    return;
  }

  if (WORLD_MAP) return;

  WORLD_MAP = L.map("world-map", {
    zoomControl: true,
    worldCopyJump: true,
    minZoom: 2,
    maxZoom: 8
  }).setView(
    [MAP_CONFIG.worldInitialView.lat, MAP_CONFIG.worldInitialView.lon],
    MAP_CONFIG.worldInitialView.zoom
  );

  L.tileLayer(MAP_CONFIG.tileLayer.url, MAP_CONFIG.tileLayer.options).addTo(WORLD_MAP);
}

function initializeLocalMap() {
  const container = document.getElementById("local-map");

  if (!container) {
    console.warn("No existe #local-map");
    return;
  }

  if (LOCAL_MAP) return;

  const country = getSelectedCountry();

  LOCAL_MAP = L.map("local-map", {
    zoomControl: true,
    minZoom: 3,
    maxZoom: 14
  }).setView(
    [country.lat, country.lon],
    country.zoom || 6
  );

  L.tileLayer(MAP_CONFIG.tileLayer.url, MAP_CONFIG.tileLayer.options).addTo(LOCAL_MAP);
}

/* =========================================================
   CARGA GEOJSON MUNDIAL
========================================================= */

function loadWorldGeoJson() {
  fetch(MAP_CONFIG.worldGeoJsonUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error("No se pudo cargar GeoJSON mundial.");
      }

      return response.json();
    })
    .then(geojson => {
      WORLD_GEOJSON_LAYER = L.geoJSON(geojson, {
        style: getCountryFeatureStyle,
        onEachFeature: bindCountryFeatureEvents
      }).addTo(WORLD_MAP);

      GEOJSON_LOADED = true;

      updateWorldMapLayer();
      renderWorldMarkers();

      addEvent("🗺️", "GeoJSON mundial cargado correctamente.");
      renderAll();
    })
    .catch(error => {
      console.warn(error);
      GEOJSON_LOADED = false;

      addEvent(
        "⚠️",
        "No se pudo cargar el GeoJSON mundial. Se mostrarán marcadores sobre OpenStreetMap."
      );

      renderWorldMarkers();
      renderAll();
    });
}

/* =========================================================
   ESTILO DE PAÍSES
========================================================= */

function getCountryFeatureStyle(feature) {
  const country = getCountryFromGeoJsonFeature(feature);

  if (!country) {
    return {
      color: "rgba(214,244,255,0.35)",
      weight: 0.5,
      fillColor: "#2b5b68",
      fillOpacity: 0.35
    };
  }

  const isSelected = country.name === NEXUS.selectedCountry;

  return {
    color: isSelected ? "#ffe65c" : "#d6f4ff",
    weight: isSelected ? 2.8 : 0.7,
    fillColor: getLayerColor(country),
    fillOpacity: isSelected ? 0.72 : 0.55
  };
}

function bindCountryFeatureEvents(feature, layer) {
  const country = getCountryFromGeoJsonFeature(feature);

  if (!country) return;

  layer.on({
    click: () => {
      selectCountry(country.name);
    },

    mouseover: event => {
      event.target.setStyle({
        weight: 2,
        color: "#ffffff"
      });

      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        event.target.bringToFront();
      }
    },

    mouseout: event => {
      if (WORLD_GEOJSON_LAYER) {
        WORLD_GEOJSON_LAYER.resetStyle(event.target);
      }
    }
  });

  layer.bindTooltip(getCountryTooltipHTML(country), {
    sticky: true,
    direction: "top"
  });
}

function getCountryFromGeoJsonFeature(feature) {
  if (!feature) return null;

  const iso3 = feature.id || feature.properties?.iso_a3;
  const name = feature.properties?.name;

  let country = NEXUS.state.countries.find(c => c.iso === iso3);

  if (!country && name) {
    country = NEXUS.state.countries.find(
      c =>
        c.name.toLowerCase() === name.toLowerCase() ||
        translateGeoJsonName(name) === c.name
    );
  }

  return country || null;
}

function translateGeoJsonName(name) {
  const map = {
    Spain: "España",
    France: "Francia",
    Germany: "Alemania",
    Italy: "Italia",
    Portugal: "Portugal",
    "United Kingdom": "Reino Unido",
    Russia: "Rusia",
    "United States of America": "Estados Unidos",
    "United States": "Estados Unidos",
    China: "China",
    India: "India",
    Japan: "Japón",
    "South Korea": "Corea del Sur",
    Brazil: "Brasil",
    Mexico: "México",
    Australia: "Australia",
    Morocco: "Marruecos",
    Norway: "Noruega",
    Sweden: "Suecia",
    Turkey: "Turquía"
  };

  return map[name] || name;
}

/* =========================================================
   CAPAS / COLORES
========================================================= */

function updateWorldMapLayer() {
  renderMapLayerControls();
  renderWorldLegend();

  if (WORLD_GEOJSON_LAYER) {
    WORLD_GEOJSON_LAYER.setStyle(getCountryFeatureStyle);
  }

  renderWorldMarkers();
}

function getLayerColor(country) {
  const layer = NEXUS.activeLayer;

  if (layer === "political") {
    return getPoliticalColor(country);
  }

  const value = getLayerValue(country);
  const normalized = normalizeLayerValue(layer, value);
  const inverse = ["military", "pollution", "climate"].includes(layer);

  if (!inverse) {
    if (normalized < 35) return "#b44949";
    if (normalized < 65) return "#d89036";
    return "#55a96a";
  }

  if (normalized < 35) return "#55a96a";
  if (normalized < 65) return "#d89036";
  return "#d64545";
}

function getPoliticalColor(country) {
  if (country.government === "Democracia") return "#4f8fc9";
  if (country.government === "Autoritario") return "#cc7436";
  if (country.government === "Monarquía") return "#b4863d";
  if (country.government === "Teocracia") return "#9e5dc7";
  return "#607d8b";
}

function getLayerValue(country) {
  switch (NEXUS.activeLayer) {
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
      return country.energyProduction;

    case "diplomacy":
      return country.relation;

    default:
      return country.relation;
  }
}

function normalizeLayerValue(layer, value) {
  switch (layer) {
    case "economy":
      return clamp(value / 3_000_000_000_000 * 100, 0, 100);

    case "population":
      return clamp(value / 350_000_000 * 100, 0, 100);

    case "happiness":
    case "stability":
    case "climate":
    case "diplomacy":
      return clamp(value, 0, 100);

    case "military":
      return clamp(value / 600_000 * 100, 0, 100);

    case "pollution":
      return clamp(value / 900_000_000 * 100, 0, 100);

    case "resources":
      return clamp(value / 1_000_000 * 100, 0, 100);

    default:
      return clamp(value, 0, 100);
  }
}

function getLayerText(country) {
  switch (NEXUS.activeLayer) {
    case "political":
      return country.government;

    case "economy":
      return formatEuro(country.gdp);

    case "population":
      return formatNumber(country.population);

    case "happiness":
      return country.happiness.toFixed(1) + "/100";

    case "stability":
      return country.stability.toFixed(1) + "/100";

    case "military":
      return formatNumber(country.military);

    case "pollution":
      return formatNumber(country.co2) + " t CO₂";

    case "climate":
      return country.climateRisk.toFixed(0) + "/100";

    case "resources":
      return formatNumber(country.energyProduction) + " MW";

    case "diplomacy":
      return country.relation.toFixed(1) + "/100";

    default:
      return "";
  }
}

/* =========================================================
   CONTROLES DE CAPAS / LEYENDA
========================================================= */

function renderMapLayerControls() {
  const container = document.getElementById("world-map-layers");

  if (!container) return;

  container.innerHTML = `
    <h3 class="section-title">Capas</h3>
    ${Object.entries(MAP_LAYERS).map(([key, label]) => `
      <button 
        data-layer="${key}" 
        class="${NEXUS.activeLayer === key ? "active" : ""}">
        ${label}
      </button>
    `).join("")}
  `;
}

function renderWorldLegend() {
  const container = document.getElementById("world-map-legend");

  if (!container) return;

  if (NEXUS.activeLayer === "political") {
    container.innerHTML = `
      <h3 class="section-title">Leyenda política</h3>
      ${legendRow("#4f8fc9", "Democracia")}
      ${legendRow("#cc7436", "Autoritario")}
      ${legendRow("#b4863d", "Monarquía")}
      ${legendRow("#9e5dc7", "Teocracia / híbrido")}
    `;
    return;
  }

  container.innerHTML = `
    <h3 class="section-title">${MAP_LAYERS[NEXUS.activeLayer]}</h3>
    ${legendRow("#55a96a", "Favorable / bajo")}
    ${legendRow("#d89036", "Medio / tensión")}
    ${legendRow("#d64545", "Crítico / alto")}
  `;
}

function legendRow(color, text) {
  return `
    <div class="legend-row">
      <span class="legend-swatch" style="background:${color}"></span>
      <span>${text}</span>
    </div>
  `;
}

/* =========================================================
   MARCADORES MUNDIALES
========================================================= */

function renderWorldMarkers() {
  if (!WORLD_MAP) return;

  WORLD_MARKERS.forEach(marker => WORLD_MAP.removeLayer(marker));
  WORLD_MARKERS = [];

  NEXUS.state.countries.forEach(country => {
    const isSelected = country.name === NEXUS.selectedCountry;

    const marker = L.circleMarker([country.lat, country.lon], {
      radius: isSelected ? 8 : 5,
      color: isSelected ? "#ffe65c" : "#e6f7ff",
      weight: isSelected ? 3 : 1,
      fillColor: getLayerColor(country),
      fillOpacity: 0.92
    })
      .addTo(WORLD_MAP)
      .bindTooltip(`${country.flag} ${country.name}`, {
        permanent: isSelected,
        direction: "top"
      });

    marker.on("click", () => {
      selectCountry(country.name);
    });

    WORLD_MARKERS.push(marker);
  });
}

/* =========================================================
   MAPA LOCAL DEL PAÍS
========================================================= */

function renderLocalMap() {
  if (!LOCAL_MAP) return;

  const country = getSelectedCountry();

  LOCAL_MARKERS.forEach(marker => LOCAL_MAP.removeLayer(marker));
  LOCAL_MARKERS = [];

  LOCAL_MAP.setView([country.lat, country.lon], country.zoom || 6);

  if (!country.regions || country.regions.length === 0) {
    initializeCountrySites(country);
  }

  country.regions.forEach(region => {
    const building = findBuildingById(region.buildingId);
    const markerClass = getRegionMarkerClass(region);
    const markerIcon = building ? building.icon : getRegionIcon(region);

    const icon = L.divIcon({
      className: "",
      html: `<div class="marker-icon ${markerClass}">${markerIcon}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker([region.lat, region.lon], { icon })
      .addTo(LOCAL_MAP)
      .bindTooltip(
        `${region.name}<br>Nivel ${region.level}`,
        {
          permanent: true,
          direction: "top",
          offset: [0, -12]
        }
      );

    marker.on("click", () => {
      openRegionPopup(region);
    });

    LOCAL_MARKERS.push(marker);
  });
}

function getRegionMarkerClass(region) {
  switch (region.type) {
    case "capital":
      return "capital";

    case "industry":
      return "industry";

    case "port":
    case "naval":
      return "port";

    case "energy":
      return "energy";

    case "agriculture":
      return "farm";

    case "military":
      return "military";

    default:
      return "";
  }
}

function getRegionIcon(region) {
  switch (region.type) {
    case "capital":
      return "⭐";

    case "industry":
      return "🏭";

    case "port":
      return "⚓";

    case "naval":
      return "⚓";

    case "energy":
      return "⚡";

    case "agriculture":
      return "🌾";

    case "military":
      return "🎖️";

    default:
      return "📍";
  }
}

function openRegionPopup(region) {
  const building = findBuildingById(region.buildingId);

  const content = `
    <div>
      <h3 style="margin:0 0 6px">${region.name}</h3>
      <div>Tipo: <b>${region.type}</b></div>
      <div>Nivel: <b>${region.level}</b></div>
      <div>Infraestructura: <b>${building ? building.name : "Sin edificio principal"}</b></div>
      <hr style="border-color:#214466">
      <div class="small">
        Para construir o mejorar esta región, selecciona una construcción en el panel derecho.
      </div>
    </div>
  `;

  L.popup()
    .setLatLng([region.lat, region.lon])
    .setContent(content)
    .openOn(LOCAL_MAP);
}

/* =========================================================
   PAÍS SELECCIONADO / FOCO
========================================================= */

function focusMapsOnSelectedCountry() {
  const country = getSelectedCountry();

  if (!country) return;

  if (WORLD_MAP) {
    WORLD_MAP.setView([country.lat, country.lon], country.name === "España" ? 5 : 3);
  }

  if (LOCAL_MAP) {
    LOCAL_MAP.setView([country.lat, country.lon], country.zoom || 6);
  }

  updateWorldMapLayer();
  renderLocalMap();
}

function rebuildMapsAfterLoad() {
  if (!WORLD_MAP || !LOCAL_MAP) return;

  updateWorldMapLayer();
  renderLocalMap();
  focusMapsOnSelectedCountry();
}

/* =========================================================
   TOOLTIP HTML
========================================================= */

function getCountryTooltipHTML(country) {
  return `
    <b>${country.flag} ${country.name}</b><br>
    Capital: ${country.capital}<br>
    Capa: ${getLayerText(country)}<br>
    PIB: ${formatEuro(country.gdp)}<br>
    Población: ${formatNumber(country.population)}<br>
    Energía: ${formatNumber(country.energyProduction)} MW<br>
    Poder militar: ${formatNumber(country.military)}<br>
    CO₂: ${formatNumber(country.co2)} t
  `;
}

/* =========================================================
   EXPORT GLOBAL
========================================================= */

window.MAP_CONFIG = MAP_CONFIG;

window.initializeMaps = initializeMaps;
window.initializeWorldMap = initializeWorldMap;
window.initializeLocalMap = initializeLocalMap;
window.loadWorldGeoJson = loadWorldGeoJson;

window.updateWorldMapLayer = updateWorldMapLayer;
window.renderWorldMarkers = renderWorldMarkers;
window.renderLocalMap = renderLocalMap;
window.focusMapsOnSelectedCountry = focusMapsOnSelectedCountry;
window.rebuildMapsAfterLoad = rebuildMapsAfterLoad;

window.getLayerColor = getLayerColor;
window.getLayerValue = getLayerValue;
window.getLayerText = getLayerText;
window.normalizeLayerValue = normalizeLayerValue;
