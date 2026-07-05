/* =========================================================
   MAPS.JS v1
   BLOQUE 1/20
   Motor base del mapa: canvas, cámara, zoom, pan y coordenadas.
========================================================= */

window.NEXUS_MAP = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,

  camera: {
    x: 0,
    y: 0,
    zoom: 1,
    minZoom: 0.45,
    maxZoom: 5
  },

  mouse: {
    x: 0,
    y: 0,
    worldX: 0,
    worldY: 0,
    dragging: false,
    lastX: 0,
    lastY: 0
  },

  layers: {
    political: true,
    borders: true,
    regions: true,
    cities: true,
    infrastructure: false,
    military: false,
    resources: false,
    trade: false
  },

  selected: {
    country: null,
    region: null,
    city: null
  },

  hover: {
    country: null,
    region: null,
    city: null
  }
};

/* =========================================================
   INICIALIZACIÓN
========================================================= */

function initializeMapEngine(canvasId = "gameMapCanvas") {
  const canvas = document.getElementById(canvasId);

  if (!canvas) {
    console.warn("Canvas de mapa no encontrado:", canvasId);
    return;
  }

  NEXUS_MAP.canvas = canvas;
  NEXUS_MAP.ctx = canvas.getContext("2d");

  resizeMapCanvas();
  centerMapCamera();
  registerMapEvents();

  requestAnimationFrame(mapRenderLoop);
}

function resizeMapCanvas() {
  const canvas = NEXUS_MAP.canvas;
  if (!canvas) return;

  const parent = canvas.parentElement || document.body;

  NEXUS_MAP.width = parent.clientWidth || window.innerWidth;
  NEXUS_MAP.height = parent.clientHeight || window.innerHeight;

  canvas.width = NEXUS_MAP.width * window.devicePixelRatio;
  canvas.height = NEXUS_MAP.height * window.devicePixelRatio;

  canvas.style.width = `${NEXUS_MAP.width}px`;
  canvas.style.height = `${NEXUS_MAP.height}px`;

  NEXUS_MAP.ctx.setTransform(
    window.devicePixelRatio,
    0,
    0,
    window.devicePixelRatio,
    0,
    0
  );
}

function centerMapCamera() {
  NEXUS_MAP.camera.x = 0;
  NEXUS_MAP.camera.y = 0;
  NEXUS_MAP.camera.zoom = 1;
}

/* =========================================================
   EVENTOS DE MAPA
========================================================= */

function registerMapEvents() {
  const canvas = NEXUS_MAP.canvas;
  if (!canvas) return;

  window.addEventListener("resize", resizeMapCanvas);

  canvas.addEventListener("mousedown", onMapMouseDown);
  canvas.addEventListener("mousemove", onMapMouseMove);
  canvas.addEventListener("mouseup", onMapMouseUp);
  canvas.addEventListener("mouseleave", onMapMouseUp);
  canvas.addEventListener("wheel", onMapWheel, { passive: false });
  canvas.addEventListener("click", onMapClick);
}

function onMapMouseDown(event) {
  NEXUS_MAP.mouse.dragging = true;
  NEXUS_MAP.mouse.lastX = event.clientX;
  NEXUS_MAP.mouse.lastY = event.clientY;
}

function onMapMouseMove(event) {
  const mouse = NEXUS_MAP.mouse;

  mouse.x = event.offsetX;
  mouse.y = event.offsetY;

  const world = screenToWorld(mouse.x, mouse.y);
  mouse.worldX = world.x;
  mouse.worldY = world.y;

  if (mouse.dragging) {
    const dx = event.clientX - mouse.lastX;
    const dy = event.clientY - mouse.lastY;

    NEXUS_MAP.camera.x += dx / NEXUS_MAP.camera.zoom;
    NEXUS_MAP.camera.y += dy / NEXUS_MAP.camera.zoom;

    mouse.lastX = event.clientX;
    mouse.lastY = event.clientY;
  }

  updateMapHover(mouse.worldX, mouse.worldY);
}

function onMapMouseUp() {
  NEXUS_MAP.mouse.dragging = false;
}

function onMapWheel(event) {
  event.preventDefault();

  const camera = NEXUS_MAP.camera;
  const before = screenToWorld(event.offsetX, event.offsetY);

  const zoomFactor = event.deltaY < 0 ? 1.12 : 0.88;

  camera.zoom = clamp(
    camera.zoom * zoomFactor,
    camera.minZoom,
    camera.maxZoom
  );

  const after = screenToWorld(event.offsetX, event.offsetY);

  camera.x += after.x - before.x;
  camera.y += after.y - before.y;
}

function onMapClick() {
  const hover = NEXUS_MAP.hover;

  if (hover.country) {
    NEXUS_MAP.selected.country = hover.country;
    setPlayableCountry?.(hover.country.name);
  }

  if (hover.region) {
    NEXUS_MAP.selected.region = hover.region;
    setSelectedRegion?.(hover.region.id);
  }

  renderAll?.();
}

/* =========================================================
   CONVERSIÓN COORDENADAS
========================================================= */

function worldToScreen(x, y) {
  const camera = NEXUS_MAP.camera;

  return {
    x: (x + camera.x) * camera.zoom + NEXUS_MAP.width / 2,
    y: (y + camera.y) * camera.zoom + NEXUS_MAP.height / 2
  };
}

function screenToWorld(x, y) {
  const camera = NEXUS_MAP.camera;

  return {
    x: (x - NEXUS_MAP.width / 2) / camera.zoom - camera.x,
    y: (y - NEXUS_MAP.height / 2) / camera.zoom - camera.y
  };
}

/* =========================================================
   HOVER BASE
========================================================= */

function updateMapHover(worldX, worldY) {
  NEXUS_MAP.hover.country = null;
  NEXUS_MAP.hover.region = null;
  NEXUS_MAP.hover.city = null;

  if (typeof detectCountryAt === "function") {
    NEXUS_MAP.hover.country = detectCountryAt(worldX, worldY);
  }

  if (typeof detectRegionAt === "function") {
    NEXUS_MAP.hover.region = detectRegionAt(worldX, worldY);
  }

  if (typeof detectCityAt === "function") {
    NEXUS_MAP.hover.city = detectCityAt(worldX, worldY);
  }
}

/* =========================================================
   RENDER LOOP
========================================================= */

function mapRenderLoop() {
  clearMapCanvas();

  if (typeof renderBaseWorldMap === "function") {
    renderBaseWorldMap();
  }

  if (typeof renderMapOverlays === "function") {
    renderMapOverlays();
  }

  requestAnimationFrame(mapRenderLoop);
}

function clearMapCanvas() {
  const ctx = NEXUS_MAP.ctx;
  if (!ctx) return;

  ctx.clearRect(0, 0, NEXUS_MAP.width, NEXUS_MAP.height);

  ctx.fillStyle = "#071426";
  ctx.fillRect(0, 0, NEXUS_MAP.width, NEXUS_MAP.height);
}

/* =========================================================
   UTILIDADES DE CAPA
========================================================= */

function toggleMapLayer(layerId) {
  if (!(layerId in NEXUS_MAP.layers)) return;

  NEXUS_MAP.layers[layerId] = !NEXUS_MAP.layers[layerId];
  renderAll?.();
}

function setMapLayer(layerId, value) {
  if (!(layerId in NEXUS_MAP.layers)) return;

  NEXUS_MAP.layers[layerId] = Boolean(value);
  renderAll?.();
}

function getMapCamera() {
  return structuredClone(NEXUS_MAP.camera);
}

function setMapCamera(x, y, zoom = NEXUS_MAP.camera.zoom) {
  NEXUS_MAP.camera.x = Number(x) || 0;
  NEXUS_MAP.camera.y = Number(y) || 0;
  NEXUS_MAP.camera.zoom = clamp(
    Number(zoom) || 1,
    NEXUS_MAP.camera.minZoom,
    NEXUS_MAP.camera.maxZoom
  );
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 1
========================================================= */

window.initializeMapEngine = initializeMapEngine;
window.resizeMapCanvas = resizeMapCanvas;
window.centerMapCamera = centerMapCamera;
window.registerMapEvents = registerMapEvents;

window.worldToScreen = worldToScreen;
window.screenToWorld = screenToWorld;

window.updateMapHover = updateMapHover;
window.mapRenderLoop = mapRenderLoop;
window.clearMapCanvas = clearMapCanvas;

window.toggleMapLayer = toggleMapLayer;
window.setMapLayer = setMapLayer;
window.getMapCamera = getMapCamera;
window.setMapCamera = setMapCamera;



/* =========================================================
   MAPS.JS v1
   BLOQUE 2/20
   Carga y renderizado del mapa mundial
========================================================= */

NEXUS_MAP.world = {

    loaded:false,

    countries:[],

    bounds:null

};

/* ========================================================= */

async function loadWorldMap(){

    try{

        const response=
            await fetch(
                "assets/maps/world.geojson"
            );

        const geojson=
            await response.json();

        NEXUS_MAP.world.countries=
            geojson.features;

        calculateWorldBounds();

        NEXUS_MAP.world.loaded=true;

        console.log(
            "Mapa mundial cargado:",
            NEXUS_MAP.world.countries.length,
            "países."
        );

    }

    catch(error){

        console.error(
            error
        );

    }

}

/* ========================================================= */

function calculateWorldBounds(){

    let minX=999999;
    let minY=999999;

    let maxX=-999999;
    let maxY=-999999;

    NEXUS_MAP.world.countries.forEach(country=>{

        const geometry=
            country.geometry;

        processGeometry(
            geometry,
            point=>{

                minX=Math.min(minX,point[0]);
                maxX=Math.max(maxX,point[0]);

                minY=Math.min(minY,point[1]);
                maxY=Math.max(maxY,point[1]);

            });

    });

    NEXUS_MAP.world.bounds={

        minX,
        maxX,

        minY,
        maxY

    };

}

/* ========================================================= */

function renderBaseWorldMap(){

    if(
        !NEXUS_MAP.world.loaded
    )
        return;

    const ctx=
        NEXUS_MAP.ctx;

    NEXUS_MAP.world.countries.forEach(country=>{

        drawCountryPolygon(
            ctx,
            country
        );

    });

}

/* ========================================================= */

function drawCountryPolygon(
    ctx,
    feature
){

    const geometry=
        feature.geometry;

    const color=
        getCountryRenderColor(
            feature
        );

    ctx.beginPath();

    processGeometry(
        geometry,
        point=>{

            const screen=
                geoToScreen(
                    point[0],
                    point[1]
                );

            ctx.lineTo(
                screen.x,
                screen.y
            );

        },
        true
    );

    ctx.fillStyle=color;

    ctx.fill();

    ctx.strokeStyle=
        "#202020";

    ctx.lineWidth=0.6;

    ctx.stroke();

}

/* ========================================================= */

function processGeometry(
    geometry,
    callback,
    draw=false
){

    if(
        geometry.type==="Polygon"
    ){

        geometry.coordinates.forEach(ring=>{

            ring.forEach(callback);

        });

    }

    else if(

        geometry.type==="MultiPolygon"

    ){

        geometry.coordinates.forEach(poly=>{

            poly.forEach(ring=>{

                ring.forEach(callback);

            });

        });

    }

}

/* ========================================================= */

function geoToScreen(
    lon,
    lat
){

    const camera=
        NEXUS_MAP.camera;

    const x=
        lon*5;

    const y=
        -lat*5;

    return worldToScreen(
        x,
        y
    );

}

/* ========================================================= */

function getCountryRenderColor(
    feature
){

    const iso=

        feature.properties.ISO_A3 ||

        feature.properties.iso_a3 ||

        feature.properties.ADM0_A3;

    const gameCountry=

        NEXUS.state.countries.find(

            c=>

            c.iso===iso

        );

    if(!gameCountry)
        return "#777777";

    if(
        NEXUS_MAP.selected.country &&
        NEXUS_MAP.selected.country.iso===iso
    )
        return "#FFD54F";

    if(
        gameCountry.atWar
    )
        return "#B71C1C";

    if(
        gameCountry.relation>80
    )
        return "#43A047";

    return "#607D8B";

}

/* ========================================================= */

function zoomToCountry(
    iso
){

    const feature=

        NEXUS_MAP.world.countries.find(f=>

            (f.properties.ISO_A3||

            f.properties.iso_a3)

            ===iso

        );

    if(!feature)
        return;

    const center=
        calculateFeatureCenter(
            feature
        );

    setMapCamera(

        -center.x,

        -center.y,

        3

    );

}

/* ========================================================= */

function calculateFeatureCenter(
    feature
){

    let sx=0;
    let sy=0;
    let n=0;

    processGeometry(

        feature.geometry,

        point=>{

            sx+=point[0];
            sy+=point[1];
            n++;

        }

    );

    return{

        x:sx/n*5,

        y:-sy/n*5

    };

}

/* ========================================================= */

window.loadWorldMap=
loadWorldMap;

window.renderBaseWorldMap=
renderBaseWorldMap;

window.geoToScreen=
geoToScreen;

window.zoomToCountry=
zoomToCountry;

window.calculateFeatureCenter=
calculateFeatureCenter;


/* =========================================================
   MAPS.JS v1
   BLOQUE 3/20
   Fronteras, capas políticas y selección
========================================================= */

NEXUS_MAP.styles = {

    ocean:"#0B2038",

    border:"#202020",

    selected:"#FFD54F",

    hover:"#FFF176",

    war:"#C62828",

    ally:"#43A047",

    neutral:"#607D8B",

    enemy:"#EF6C00"

};

/* ========================================================= */

function renderMapOverlays(){

    renderPoliticalBorders();

    renderCountryLabels();

    renderSelectedCountry();

    renderHoveredCountry();

}

/* ========================================================= */

function renderPoliticalBorders(){

    if(!NEXUS_MAP.layers.borders)
        return;

    const ctx=NEXUS_MAP.ctx;

    ctx.save();

    ctx.strokeStyle=
        NEXUS_MAP.styles.border;

    ctx.lineWidth=
        Math.max(
            0.6,
            1/NEXUS_MAP.camera.zoom
        );

    NEXUS_MAP.world.countries.forEach(feature=>{

        drawCountryOutline(
            ctx,
            feature
        );

    });

    ctx.restore();

}

/* ========================================================= */

function drawCountryOutline(
    ctx,
    feature
){

    beginCountryPath(
        ctx,
        feature.geometry
    );

    ctx.stroke();

}

/* ========================================================= */

function beginCountryPath(
    ctx,
    geometry
){

    ctx.beginPath();

    const polygons=

        geometry.type==="Polygon"

        ?

        [geometry.coordinates]

        :

        geometry.coordinates;

    polygons.forEach(poly=>{

        poly.forEach(ring=>{

            ring.forEach((point,index)=>{

                const s=
                    geoToScreen(
                        point[0],
                        point[1]
                    );

                if(index===0)
                    ctx.moveTo(
                        s.x,
                        s.y
                    );
                else
                    ctx.lineTo(
                        s.x,
                        s.y
                    );

            });

            ctx.closePath();

        });

    });

}

/* ========================================================= */

function renderSelectedCountry(){

    if(
        !NEXUS_MAP.selected.country
    )
        return;

    highlightCountry(

        NEXUS_MAP.selected.country.iso,

        NEXUS_MAP.styles.selected,

        3

    );

}

/* ========================================================= */

function renderHoveredCountry(){

    if(
        !NEXUS_MAP.hover.country
    )
        return;

    highlightCountry(

        NEXUS_MAP.hover.country.iso,

        NEXUS_MAP.styles.hover,

        2

    );

}

/* ========================================================= */

function highlightCountry(
    iso,
    color,
    width
){

    const feature=

        NEXUS_MAP.world.countries.find(f=>

            (f.properties.ISO_A3||

             f.properties.iso_a3)

            ===iso

        );

    if(!feature)
        return;

    const ctx=
        NEXUS_MAP.ctx;

    ctx.save();

    ctx.strokeStyle=color;

    ctx.lineWidth=
        width/
        NEXUS_MAP.camera.zoom;

    beginCountryPath(
        ctx,
        feature.geometry
    );

    ctx.stroke();

    ctx.restore();

}

/* ========================================================= */

function renderCountryLabels(){

    if(
        NEXUS_MAP.camera.zoom<1.4
    )
        return;

    const ctx=
        NEXUS_MAP.ctx;

    ctx.save();

    ctx.font=
        `${12*NEXUS_MAP.camera.zoom}px Arial`;

    ctx.textAlign="center";

    ctx.fillStyle="white";

    NEXUS_MAP.world.countries.forEach(feature=>{

        const iso=

            feature.properties.ISO_A3||

            feature.properties.iso_a3;

        const gameCountry=

            getCountryByISO(iso);

        if(!gameCountry)
            return;

        const center=
            calculateFeatureCenter(
                feature
            );

        const screen=
            worldToScreen(
                center.x,
                center.y
            );

        ctx.fillText(

            gameCountry.name,

            screen.x,

            screen.y

        );

    });

    ctx.restore();

}

/* ========================================================= */

function detectCountryAt(
    worldX,
    worldY
){

    const lon=
        worldX/5;

    const lat=
        -worldY/5;

    for(const feature of
        NEXUS_MAP.world.countries){

        if(
            pointInsideFeature(
                lon,
                lat,
                feature
            )
        ){

            const iso=

                feature.properties.ISO_A3||

                feature.properties.iso_a3;

            return getCountryByISO(
                iso
            );

        }

    }

    return null;

}

/* ========================================================= */

function pointInsideFeature(
    lon,
    lat,
    feature
){

    /* Simplificado.
       En el bloque 4/20 se sustituirá
       por un algoritmo ray-casting
       completo para polígonos. */

    const c=
        calculateFeatureCenter(
            feature
        );

    const dx=
        lon-c.x/5;

    const dy=
        lat+c.y/5;

    return(
        dx*dx+
        dy*dy
    )<20;

}

/* ========================================================= */

function getCountryByISO(
    iso
){

    return NEXUS.state.countries.find(

        c=>c.iso===iso

    );

}

/* ========================================================= */

window.renderMapOverlays=
renderMapOverlays;

window.detectCountryAt=
detectCountryAt;

window.highlightCountry=
highlightCountry;

window.drawCountryOutline=
drawCountryOutline;

window.beginCountryPath=
beginCountryPath;

window.renderPoliticalBorders=
renderPoliticalBorders;

window.renderCountryLabels=
renderCountryLabels;

window.getCountryByISO=
getCountryByISO;


/* =========================================================
   MAPS.JS v1
   BLOQUE 4/20
   Regiones administrativas reales/simuladas:
   provincias, comunidades, estados y selección regional.
========================================================= */

NEXUS_MAP.regions = {
  loaded: false,
  features: [],
  byCountry: new Map()
};

/* =========================================================
   CARGA DE REGIONES GEOJSON
========================================================= */

async function loadAdministrativeRegions() {
  const sources = [
    "assets/maps/spain_provinces.geojson",
    "assets/maps/europe_regions.geojson",
    "assets/maps/us_states.geojson"
  ];

  NEXUS_MAP.regions.features = [];

  for (const url of sources) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const geojson = await response.json();
      if (!geojson?.features?.length) continue;

      NEXUS_MAP.regions.features.push(...geojson.features);
    } catch (error) {
      console.warn("No se pudo cargar región:", url);
    }
  }

  indexAdministrativeRegions();
  NEXUS_MAP.regions.loaded = true;

  console.log("Regiones administrativas cargadas:", NEXUS_MAP.regions.features.length);
}

function indexAdministrativeRegions() {
  NEXUS_MAP.regions.byCountry.clear();

  for (const feature of NEXUS_MAP.regions.features) {
    const iso = getRegionFeatureISO(feature);
    if (!iso) continue;

    if (!NEXUS_MAP.regions.byCountry.has(iso)) {
      NEXUS_MAP.regions.byCountry.set(iso, []);
    }

    NEXUS_MAP.regions.byCountry.get(iso).push(feature);
  }
}

function getRegionFeatureISO(feature) {
  return (
    feature.properties.ISO_A3 ||
    feature.properties.iso_a3 ||
    feature.properties.ADM0_A3 ||
    feature.properties.CNTR_CODE ||
    feature.properties.country_iso ||
    feature.properties.iso ||
    null
  );
}

function getRegionFeatureName(feature) {
  return (
    feature.properties.NAME ||
    feature.properties.name ||
    feature.properties.NAME_1 ||
    feature.properties.NAME_2 ||
    feature.properties.provincia ||
    feature.properties.Provincia ||
    feature.properties.NOMBRE ||
    "Región"
  );
}

/* =========================================================
   RENDER DE REGIONES
========================================================= */

const OLD_RENDER_MAP_OVERLAYS_REGIONS = window.renderMapOverlays;

function renderMapOverlays() {
  if (typeof OLD_RENDER_MAP_OVERLAYS_REGIONS === "function") {
    OLD_RENDER_MAP_OVERLAYS_REGIONS();
  }

  renderAdministrativeRegions();
  renderSelectedRegionOutline();
  renderHoveredRegionOutline();
}

function renderAdministrativeRegions() {
  if (!NEXUS_MAP.layers.regions) return;
  if (!NEXUS_MAP.regions.loaded) return;
  if (NEXUS_MAP.camera.zoom < 1.7) return;

  const selectedCountry = getSelectedCountry();
  if (!selectedCountry) return;

  const features = NEXUS_MAP.regions.byCountry.get(selectedCountry.iso) || [];

  const ctx = NEXUS_MAP.ctx;
  ctx.save();

  for (const feature of features) {
    drawRegionPolygon(ctx, feature, getRegionRenderColor(feature));
  }

  ctx.restore();
}

function drawRegionPolygon(ctx, feature, color = "rgba(255,255,255,0.08)") {
  beginCountryPath(ctx, feature.geometry);

  ctx.fillStyle = color;
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.32)";
  ctx.lineWidth = Math.max(0.35, 0.8 / NEXUS_MAP.camera.zoom);
  ctx.stroke();
}

function getRegionRenderColor(feature) {
  const region = matchFeatureToGameRegion(feature);
  if (!region) return "rgba(255,255,255,0.07)";

  if (region.occupiedBy) return "rgba(198,40,40,0.42)";
  if (region.damageLevel > 5) return "rgba(255,112,67,0.36)";
  if (region.type === "capital") return "rgba(255,213,79,0.32)";
  if (region.type === "industry" || region.type === "automotive") return "rgba(66,165,245,0.26)";
  if (region.type === "naval" || region.type === "port") return "rgba(38,198,218,0.28)";
  if (region.type === "energy") return "rgba(255,202,40,0.26)";
  if (region.type === "agriculture") return "rgba(102,187,106,0.26)";

  return "rgba(255,255,255,0.10)";
}

function renderSelectedRegionOutline() {
  const region = NEXUS_MAP.selected.region || getSelectedRegion();
  if (!region) return;

  const feature = findFeatureForGameRegion(region);
  if (!feature) return;

  outlineRegionFeature(feature, "#FFD54F", 3);
}

function renderHoveredRegionOutline() {
  const region = NEXUS_MAP.hover.region;
  if (!region) return;

  const feature = findFeatureForGameRegion(region);
  if (!feature) return;

  outlineRegionFeature(feature, "#FFF176", 2);
}

function outlineRegionFeature(feature, color, width = 2) {
  const ctx = NEXUS_MAP.ctx;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width / NEXUS_MAP.camera.zoom;

  beginCountryPath(ctx, feature.geometry);
  ctx.stroke();

  ctx.restore();
}

/* =========================================================
   DETECCIÓN DE REGIÓN
========================================================= */

function detectRegionAt(worldX, worldY) {
  if (!NEXUS_MAP.regions.loaded) return null;

  const country = getSelectedCountry();
  if (!country) return null;

  const lon = worldX / 5;
  const lat = -worldY / 5;

  const features = NEXUS_MAP.regions.byCountry.get(country.iso) || [];

  for (const feature of features) {
    if (pointInsidePolygonFeature(lon, lat, feature)) {
      return matchFeatureToGameRegion(feature);
    }
  }

  return null;
}

function pointInsidePolygonFeature(lon, lat, feature) {
  const geometry = feature.geometry;

  if (geometry.type === "Polygon") {
    return geometry.coordinates.some(ring => pointInRing(lon, lat, ring));
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some(poly =>
      poly.some(ring => pointInRing(lon, lat, ring))
    );
  }

  return false;
}

function pointInRing(lon, lat, ring) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0000001) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/* =========================================================
   MATCH GEOJSON ↔ REGIÓN DEL JUEGO
========================================================= */

function matchFeatureToGameRegion(feature) {
  const country = getSelectedCountry();
  if (!country) return null;

  const featureName = normalizeRegionName(getRegionFeatureName(feature));

  return (country.regions || []).find(region => {
    const regionName = normalizeRegionName(region.name);
    return (
      regionName === featureName ||
      regionName.includes(featureName) ||
      featureName.includes(regionName)
    );
  }) || null;
}

function findFeatureForGameRegion(region) {
  const country = getSelectedCountry();
  if (!country || !region) return null;

  const features = NEXUS_MAP.regions.byCountry.get(country.iso) || [];
  const regionName = normalizeRegionName(region.name);

  return features.find(feature => {
    const featureName = normalizeRegionName(getRegionFeatureName(feature));
    return (
      featureName === regionName ||
      featureName.includes(regionName) ||
      regionName.includes(featureName)
    );
  }) || null;
}

function normalizeRegionName(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/provincia de/g, "")
    .replace(/comunidad de/g, "")
    .replace(/comunidad autonoma de/g, "")
    .replace(/autonomous community of/g, "")
    .replace(/province of/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/* =========================================================
   FALLBACK: REGIONES SIMULADAS SI NO HAY GEOJSON
========================================================= */

function generateFallbackRegionFeaturesForCountry(country) {
  if (!country?.regions?.length) return [];

  return country.regions.map((region, index) => {
    const angle = (Math.PI * 2 * index) / country.regions.length;
    const cx = (country.lon || 0) + Math.cos(angle) * 2.2;
    const cy = (country.lat || 0) + Math.sin(angle) * 1.5;
    const size = 0.9;

    return {
      type: "Feature",
      properties: {
        ISO_A3: country.iso,
        NAME: region.name,
        fallback: true
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [cx - size, cy - size],
          [cx + size, cy - size],
          [cx + size, cy + size],
          [cx - size, cy + size],
          [cx - size, cy - size]
        ]]
      }
    };
  });
}

function ensureFallbackRegions() {
  for (const country of NEXUS.state.countries || []) {
    if (NEXUS_MAP.regions.byCountry.has(country.iso)) continue;

    const fallback = generateFallbackRegionFeaturesForCountry(country);
    if (!fallback.length) continue;

    NEXUS_MAP.regions.features.push(...fallback);
    NEXUS_MAP.regions.byCountry.set(country.iso, fallback);
  }

  NEXUS_MAP.regions.loaded = true;
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 4
========================================================= */

window.loadAdministrativeRegions = loadAdministrativeRegions;
window.indexAdministrativeRegions = indexAdministrativeRegions;
window.getRegionFeatureISO = getRegionFeatureISO;
window.getRegionFeatureName = getRegionFeatureName;

window.renderMapOverlays = renderMapOverlays;
window.renderAdministrativeRegions = renderAdministrativeRegions;
window.drawRegionPolygon = drawRegionPolygon;
window.getRegionRenderColor = getRegionRenderColor;
window.renderSelectedRegionOutline = renderSelectedRegionOutline;
window.renderHoveredRegionOutline = renderHoveredRegionOutline;
window.outlineRegionFeature = outlineRegionFeature;

window.detectRegionAt = detectRegionAt;
window.pointInsidePolygonFeature = pointInsidePolygonFeature;
window.pointInRing = pointInRing;

window.matchFeatureToGameRegion = matchFeatureToGameRegion;
window.findFeatureForGameRegion = findFeatureForGameRegion;
window.normalizeRegionName = normalizeRegionName;

window.generateFallbackRegionFeaturesForCountry = generateFallbackRegionFeaturesForCountry;
window.ensureFallbackRegions = ensureFallbackRegions;


/* =========================================================
   MAPS.JS v1
   BLOQUE 5/20
   Sistema de ciudades
========================================================= */

NEXUS_MAP.cities = {
    loaded: false,
    features: [],
    visible: [],
    selected: null,
    hover: null
};

/* =========================================================
   CARGA DE CIUDADES
========================================================= */

async function loadCities() {

    try {

        const response = await fetch("assets/maps/cities.json");

        NEXUS_MAP.cities.features = await response.json();

        NEXUS_MAP.cities.loaded = true;

    }

    catch {

        generateFallbackCities();

    }

}

function generateFallbackCities() {

    NEXUS_MAP.cities.features = [];

    (NEXUS.state.countries || []).forEach(country => {

        (country.regions || []).forEach(region => {

            NEXUS_MAP.cities.features.push({

                id: region.id,

                name: region.name,

                iso: country.iso,

                population: region.population || 100000,

                x: region.lon || country.lon || 0,

                y: region.lat || country.lat || 0,

                capital: region.type === "capital",

                airport: true,

                port: region.type === "port",

                military: false,

                industry: region.gdp || 0

            });

        });

    });

    NEXUS_MAP.cities.loaded = true;

}

/* =========================================================
   RENDER
========================================================= */

function renderCities() {

    if (!NEXUS_MAP.layers.cities) return;

    if (!NEXUS_MAP.cities.loaded) return;

    if (NEXUS_MAP.camera.zoom < 2) return;

    const ctx = NEXUS_MAP.ctx;

    ctx.save();

    NEXUS_MAP.cities.visible = [];

    NEXUS_MAP.cities.features.forEach(city => {

        const screen = geoToScreen(city.x, city.y);

        if (
            screen.x < -50 ||
            screen.x > NEXUS_MAP.width + 50 ||
            screen.y < -50 ||
            screen.y > NEXUS_MAP.height + 50
        ) return;

        NEXUS_MAP.cities.visible.push(city);

        drawCity(city);

    });

    ctx.restore();

}

/* ========================================================= */

function drawCity(city) {

    const ctx = NEXUS_MAP.ctx;

    const p = geoToScreen(city.x, city.y);

    let radius = 3;

    if (city.population > 500000)
        radius = 4;

    if (city.population > 2000000)
        radius = 5;

    if (city.capital)
        radius = 6;

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        radius,
        0,
        Math.PI * 2
    );

    if (city === NEXUS_MAP.selected.city)
        ctx.fillStyle = "#FFD54F";

    else if (city === NEXUS_MAP.hover.city)
        ctx.fillStyle = "#FFF176";

    else if (city.capital)
        ctx.fillStyle = "#FF5252";

    else
        ctx.fillStyle = "#ECEFF1";

    ctx.fill();

    if (NEXUS_MAP.camera.zoom > 3) {

        ctx.fillStyle = "white";

        ctx.font = "12px Arial";

        ctx.fillText(
            city.name,
            p.x + 8,
            p.y - 4
        );

    }

}

/* =========================================================
   DETECCIÓN
========================================================= */

function detectCityAt(worldX, worldY) {

    let best = null;

    let bestDistance = 999999;

    NEXUS_MAP.cities.visible.forEach(city => {

        const dx = worldX - city.x * 5;

        const dy = worldY + city.y * 5;

        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < bestDistance && d < 12) {

            bestDistance = d;

            best = city;

        }

    });

    return best;

}

/* =========================================================
   PANEL DE CIUDAD
========================================================= */

function openCityInfo(city) {

    if (!city) return;

    NEXUS_MAP.selected.city = city;

    openModal(

        `🏙️ ${city.name}`,

        `

        <h3>${city.name}</h3>

        <table class="info-table">

            <tr>

                <td>Población</td>

                <td>${formatNumber(city.population)}</td>

            </tr>

            <tr>

                <td>Industria</td>

                <td>${formatMoney(city.industry)}</td>

            </tr>

            <tr>

                <td>Capital</td>

                <td>${city.capital ? "Sí" : "No"}</td>

            </tr>

            <tr>

                <td>Puerto</td>

                <td>${city.port ? "Sí" : "No"}</td>

            </tr>

            <tr>

                <td>Aeropuerto</td>

                <td>${city.airport ? "Sí" : "No"}</td>

            </tr>

            <tr>

                <td>Base militar</td>

                <td>${city.military ? "Sí" : "No"}</td>

            </tr>

        </table>

        <hr>

        <button onclick="centerCameraOnCity('${city.id}')">

            🎯 Centrar mapa

        </button>

        `

    );

}

/* ========================================================= */

function centerCameraOnCity(cityId) {

    const city =
        NEXUS_MAP.cities.features.find(
            c => c.id === cityId
        );

    if (!city) return;

    setMapCamera(

        -(city.x * 5),

        city.y * 5,

        4

    );

}

/* ========================================================= */

const OLD_RENDER_OVERLAYS_5 = window.renderMapOverlays;

window.renderMapOverlays = function () {

    if (typeof OLD_RENDER_OVERLAYS_5 === "function")
        OLD_RENDER_OVERLAYS_5();

    renderCities();

};

/* ========================================================= */

window.loadCities = loadCities;
window.renderCities = renderCities;
window.drawCity = drawCity;
window.detectCityAt = detectCityAt;
window.openCityInfo = openCityInfo;
window.centerCameraOnCity = centerCameraOnCity;



/* =========================================================
   MAPS.JS v1
   BLOQUE 6/20
   Infraestructuras: carreteras, ferrocarril, puertos,
   aeropuertos, red eléctrica, oleoductos y gasoductos.
========================================================= */

NEXUS_MAP.infrastructure = {
  loaded: false,
  roads: [],
  rail: [],
  ports: [],
  airports: [],
  powerLines: [],
  pipelines: []
};

/* =========================================================
   CARGA DE INFRAESTRUCTURAS
========================================================= */

async function loadInfrastructure() {
  const sources = [
    ["roads", "assets/maps/roads.geojson"],
    ["rail", "assets/maps/rail.geojson"],
    ["ports", "assets/maps/ports.geojson"],
    ["airports", "assets/maps/airports.geojson"],
    ["powerLines", "assets/maps/power_lines.geojson"],
    ["pipelines", "assets/maps/pipelines.geojson"]
  ];

  let loadedAny = false;

  for (const [key, url] of sources) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      NEXUS_MAP.infrastructure[key] = data.features || [];
      loadedAny = true;
    } catch (error) {
      console.warn("No se pudo cargar infraestructura:", url);
    }
  }

  if (!loadedAny) {
    generateFallbackInfrastructure();
  }

  NEXUS_MAP.infrastructure.loaded = true;
}

/* =========================================================
   FALLBACK JUGABLE
========================================================= */

function generateFallbackInfrastructure() {
  const cities = NEXUS_MAP.cities.features || [];

  NEXUS_MAP.infrastructure.roads = [];
  NEXUS_MAP.infrastructure.rail = [];
  NEXUS_MAP.infrastructure.ports = [];
  NEXUS_MAP.infrastructure.airports = [];
  NEXUS_MAP.infrastructure.powerLines = [];
  NEXUS_MAP.infrastructure.pipelines = [];

  for (const country of NEXUS.state.countries || []) {
    const countryCities = cities
      .filter(c => c.iso === country.iso)
      .sort((a, b) => (b.population || 0) - (a.population || 0));

    for (let i = 0; i < countryCities.length - 1; i++) {
      const a = countryCities[i];
      const b = countryCities[i + 1];

      NEXUS_MAP.infrastructure.roads.push(makeLineFeature(a, b, country.iso, "road"));
      if (i % 2 === 0) NEXUS_MAP.infrastructure.rail.push(makeLineFeature(a, b, country.iso, "rail"));
      if (i % 3 === 0) NEXUS_MAP.infrastructure.powerLines.push(makeLineFeature(a, b, country.iso, "power"));
    }

    for (const city of countryCities) {
      if (city.port) NEXUS_MAP.infrastructure.ports.push(makePointFeature(city, country.iso, "port"));
      if (city.airport) NEXUS_MAP.infrastructure.airports.push(makePointFeature(city, country.iso, "airport"));
    }

    if (countryCities.length >= 2) {
      NEXUS_MAP.infrastructure.pipelines.push(
        makeLineFeature(countryCities[0], countryCities[countryCities.length - 1], country.iso, "pipeline")
      );
    }
  }
}

function makeLineFeature(a, b, iso, type) {
  return {
    type: "Feature",
    properties: {
      iso,
      type,
      name: `${a.name} - ${b.name}`
    },
    geometry: {
      type: "LineString",
      coordinates: [
        [a.x, a.y],
        [b.x, b.y]
      ]
    }
  };
}

function makePointFeature(city, iso, type) {
  return {
    type: "Feature",
    properties: {
      iso,
      type,
      name: city.name
    },
    geometry: {
      type: "Point",
      coordinates: [city.x, city.y]
    }
  };
}

/* =========================================================
   RENDER
========================================================= */

function renderInfrastructure() {
  if (!NEXUS_MAP.layers.infrastructure) return;
  if (!NEXUS_MAP.infrastructure.loaded) return;
  if (NEXUS_MAP.camera.zoom < 2.1) return;

  renderInfrastructureLines(NEXUS_MAP.infrastructure.roads, "#78909C", 1.1, 0.55);
  renderInfrastructureLines(NEXUS_MAP.infrastructure.rail, "#CFD8DC", 1.4, 0.75);
  renderInfrastructureLines(NEXUS_MAP.infrastructure.powerLines, "#FFD54F", 1.0, 0.55);
  renderInfrastructureLines(NEXUS_MAP.infrastructure.pipelines, "#8D6E63", 1.3, 0.65);

  renderInfrastructurePoints(NEXUS_MAP.infrastructure.ports, "⚓");
  renderInfrastructurePoints(NEXUS_MAP.infrastructure.airports, "✈️");
}

function renderInfrastructureLines(features, color, width = 1, alpha = 1) {
  const ctx = NEXUS_MAP.ctx;
  if (!ctx || !features?.length) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.4, width / NEXUS_MAP.camera.zoom);

  for (const feature of features) {
    drawLineFeature(ctx, feature);
  }

  ctx.restore();
}

function drawLineFeature(ctx, feature) {
  const geometry = feature.geometry;
  if (!geometry) return;

  const lines =
    geometry.type === "LineString"
      ? [geometry.coordinates]
      : geometry.type === "MultiLineString"
        ? geometry.coordinates
        : [];

  for (const line of lines) {
    ctx.beginPath();

    line.forEach((point, index) => {
      const s = geoToScreen(point[0], point[1]);

      if (index === 0) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    });

    ctx.stroke();
  }
}

function renderInfrastructurePoints(features, icon) {
  const ctx = NEXUS_MAP.ctx;
  if (!ctx || !features?.length) return;

  ctx.save();
  ctx.font = `${Math.max(12, 14 / NEXUS_MAP.camera.zoom)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const feature of features) {
    const point = feature.geometry?.coordinates;
    if (!point) continue;

    const s = geoToScreen(point[0], point[1]);

    if (
      s.x < -30 ||
      s.x > NEXUS_MAP.width + 30 ||
      s.y < -30 ||
      s.y > NEXUS_MAP.height + 30
    ) continue;

    ctx.fillText(icon, s.x, s.y);
  }

  ctx.restore();
}

/* =========================================================
   DETECCIÓN / CONSULTA
========================================================= */

function getInfrastructureNear(lon, lat, radius = 1.5) {
  const result = {
    roads: 0,
    rail: 0,
    ports: 0,
    airports: 0,
    powerLines: 0,
    pipelines: 0
  };

  for (const key of Object.keys(result)) {
    const features = NEXUS_MAP.infrastructure[key] || [];

    for (const feature of features) {
      if (featureNearPoint(feature, lon, lat, radius)) {
        result[key]++;
      }
    }
  }

  return result;
}

function featureNearPoint(feature, lon, lat, radius) {
  const geometry = feature.geometry;
  if (!geometry) return false;

  if (geometry.type === "Point") {
    const [x, y] = geometry.coordinates;
    return distanceGeo(lon, lat, x, y) <= radius;
  }

  const lines =
    geometry.type === "LineString"
      ? [geometry.coordinates]
      : geometry.type === "MultiLineString"
        ? geometry.coordinates
        : [];

  for (const line of lines) {
    for (const point of line) {
      if (distanceGeo(lon, lat, point[0], point[1]) <= radius) return true;
    }
  }

  return false;
}

function distanceGeo(lon1, lat1, lon2, lat2) {
  const dx = lon1 - lon2;
  const dy = lat1 - lat2;
  return Math.sqrt(dx * dx + dy * dy);
}

/* =========================================================
   INTEGRACIÓN OVERLAY
========================================================= */

const OLD_RENDER_OVERLAYS_INFRASTRUCTURE = window.renderMapOverlays;

function renderMapOverlays() {
  if (typeof OLD_RENDER_OVERLAYS_INFRASTRUCTURE === "function") {
    OLD_RENDER_OVERLAYS_INFRASTRUCTURE();
  }

  renderInfrastructure();
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 6
========================================================= */

window.loadInfrastructure = loadInfrastructure;
window.generateFallbackInfrastructure = generateFallbackInfrastructure;
window.makeLineFeature = makeLineFeature;
window.makePointFeature = makePointFeature;

window.renderInfrastructure = renderInfrastructure;
window.renderInfrastructureLines = renderInfrastructureLines;
window.drawLineFeature = drawLineFeature;
window.renderInfrastructurePoints = renderInfrastructurePoints;

window.getInfrastructureNear = getInfrastructureNear;
window.featureNearPoint = featureNearPoint;
window.distanceGeo = distanceGeo;

window.renderMapOverlays = renderMapOverlays;


/* =========================================================
   MAPS.JS v1
   BLOQUE 7/20
   Energía: centrales, renovables, red eléctrica,
   subestaciones e interconexiones.
========================================================= */

NEXUS_MAP.energy = {
  loaded: false,
  plants: [],
  substations: [],
  interconnectors: [],
  gridNodes: []
};

/* =========================================================
   CARGA DE ENERGÍA
========================================================= */

async function loadEnergyMapData() {
  const sources = [
    ["plants", "assets/maps/power_plants.geojson"],
    ["substations", "assets/maps/substations.geojson"],
    ["interconnectors", "assets/maps/interconnectors.geojson"],
    ["gridNodes", "assets/maps/grid_nodes.geojson"]
  ];

  let loadedAny = false;

  for (const [key, url] of sources) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const data = await response.json();
      NEXUS_MAP.energy[key] = data.features || [];
      loadedAny = true;
    } catch (error) {
      console.warn("No se pudo cargar energía:", url);
    }
  }

  if (!loadedAny) {
    generateFallbackEnergyMap();
  }

  NEXUS_MAP.energy.loaded = true;
}

/* =========================================================
   FALLBACK JUGABLE
========================================================= */

function generateFallbackEnergyMap() {
  NEXUS_MAP.energy.plants = [];
  NEXUS_MAP.energy.substations = [];
  NEXUS_MAP.energy.interconnectors = [];
  NEXUS_MAP.energy.gridNodes = [];

  for (const country of NEXUS.state.countries || []) {
    const cities = (NEXUS_MAP.cities.features || [])
      .filter(city => city.iso === country.iso)
      .sort((a, b) => (b.population || 0) - (a.population || 0));

    for (let i = 0; i < Math.min(5, cities.length); i++) {
      const city = cities[i];

      NEXUS_MAP.energy.plants.push({
        type: "Feature",
        properties: {
          iso: country.iso,
          name: `${city.name} Energy Hub`,
          energyType: pickFallbackEnergyType(country, city),
          capacityMW: Math.round((country.energyProduction || 10000) / Math.max(3, cities.length))
        },
        geometry: {
          type: "Point",
          coordinates: [
            city.x + randomBetween(-0.35, 0.35),
            city.y + randomBetween(-0.25, 0.25)
          ]
        }
      });

      NEXUS_MAP.energy.substations.push({
        type: "Feature",
        properties: {
          iso: country.iso,
          name: `${city.name} Substation`,
          voltageKV: 220
        },
        geometry: {
          type: "Point",
          coordinates: [
            city.x + randomBetween(-0.2, 0.2),
            city.y + randomBetween(-0.2, 0.2)
          ]
        }
      });
    }

    for (let i = 0; i < cities.length - 1; i++) {
      NEXUS_MAP.energy.interconnectors.push({
        type: "Feature",
        properties: {
          iso: country.iso,
          name: `${cities[i].name} ⇄ ${cities[i + 1].name}`,
          voltageKV: i % 2 === 0 ? 400 : 220
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [cities[i].x, cities[i].y],
            [cities[i + 1].x, cities[i + 1].y]
          ]
        }
      });
    }
  }
}

function pickFallbackEnergyType(country, city) {
  const co2PerCapita = (country.co2 || 0) / Math.max(country.population || 1, 1);

  if (city.capital) return "gas";
  if (co2PerCapita > 7) return randomChoice(["coal", "gas", "nuclear"]);
  if ((country.renewablesMW || 0) > 5000) return randomChoice(["wind", "solar", "hydro"]);

  return randomChoice(["gas", "solar", "wind", "hydro"]);
}

/* =========================================================
   RENDER ENERGÍA
========================================================= */

function renderEnergyLayer() {
  if (!NEXUS_MAP.layers.energy) return;
  if (!NEXUS_MAP.energy.loaded) return;
  if (NEXUS_MAP.camera.zoom < 2.2) return;

  renderEnergyInterconnectors();
  renderEnergyPoints();
}

function renderEnergyInterconnectors() {
  const ctx = NEXUS_MAP.ctx;
  if (!ctx) return;

  ctx.save();

  for (const line of NEXUS_MAP.energy.interconnectors || []) {
    const voltage = line.properties?.voltageKV || 220;

    ctx.strokeStyle = voltage >= 400 ? "#FFD54F" : "#FFF59D";
    ctx.globalAlpha = voltage >= 400 ? 0.75 : 0.45;
    ctx.lineWidth = Math.max(0.5, (voltage >= 400 ? 1.6 : 1.0) / NEXUS_MAP.camera.zoom);

    drawLineFeature(ctx, line);
  }

  ctx.restore();
}

function renderEnergyPoints() {
  for (const plant of NEXUS_MAP.energy.plants || []) {
    drawEnergyPlant(plant);
  }

  if (NEXUS_MAP.camera.zoom >= 3.2) {
    for (const substation of NEXUS_MAP.energy.substations || []) {
      drawEnergySubstation(substation);
    }
  }
}

function drawEnergyPlant(feature) {
  const ctx = NEXUS_MAP.ctx;
  const point = feature.geometry?.coordinates;
  if (!ctx || !point) return;

  const screen = geoToScreen(point[0], point[1]);
  if (!pointOnScreen(screen, 40)) return;

  const type = feature.properties?.energyType || "power";
  const capacity = feature.properties?.capacityMW || 0;

  const radius = clamp(3 + Math.sqrt(capacity) / 12, 4, 12);

  ctx.save();

  ctx.beginPath();
  ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = getEnergyColor(type);
  ctx.globalAlpha = 0.88;
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(0.5, 1 / NEXUS_MAP.camera.zoom);
  ctx.stroke();

  if (NEXUS_MAP.camera.zoom >= 3) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.font = "11px Arial";
    ctx.fillText(getEnergyIcon(type), screen.x + radius + 3, screen.y + 3);
  }

  ctx.restore();
}

function drawEnergySubstation(feature) {
  const ctx = NEXUS_MAP.ctx;
  const point = feature.geometry?.coordinates;
  if (!ctx || !point) return;

  const screen = geoToScreen(point[0], point[1]);
  if (!pointOnScreen(screen, 30)) return;

  ctx.save();
  ctx.fillStyle = "#ECEFF1";
  ctx.strokeStyle = "#FFD54F";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.rect(screen.x - 3, screen.y - 3, 6, 6);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function getEnergyColor(type) {
  return {
    coal: "#424242",
    gas: "#FF8A65",
    nuclear: "#BA68C8",
    hydro: "#29B6F6",
    wind: "#80CBC4",
    solar: "#FFD54F",
    oil: "#5D4037",
    biomass: "#8BC34A",
    power: "#FFFFFF"
  }[type] || "#FFFFFF";
}

function getEnergyIcon(type) {
  return {
    coal: "⛏️",
    gas: "🔥",
    nuclear: "☢️",
    hydro: "💧",
    wind: "🌬️",
    solar: "☀️",
    oil: "🛢️",
    biomass: "🌱",
    power: "⚡"
  }[type] || "⚡";
}

/* =========================================================
   CONSULTA ENERGÉTICA
========================================================= */

function getEnergyAssetsNear(lon, lat, radius = 1.2) {
  const plants = (NEXUS_MAP.energy.plants || []).filter(feature =>
    feature.geometry?.type === "Point" &&
    distanceGeo(lon, lat, feature.geometry.coordinates[0], feature.geometry.coordinates[1]) <= radius
  );

  const substations = (NEXUS_MAP.energy.substations || []).filter(feature =>
    feature.geometry?.type === "Point" &&
    distanceGeo(lon, lat, feature.geometry.coordinates[0], feature.geometry.coordinates[1]) <= radius
  );

  return {
    plants,
    substations,
    totalCapacityMW: plants.reduce((sum, p) => sum + (p.properties?.capacityMW || 0), 0)
  };
}

function pointOnScreen(screen, margin = 0) {
  return (
    screen.x >= -margin &&
    screen.x <= NEXUS_MAP.width + margin &&
    screen.y >= -margin &&
    screen.y <= NEXUS_MAP.height + margin
  );
}

/* =========================================================
   INTEGRACIÓN OVERLAY
========================================================= */

NEXUS_MAP.layers.energy ??= false;

const OLD_RENDER_OVERLAYS_ENERGY = window.renderMapOverlays;

function renderMapOverlays() {
  if (typeof OLD_RENDER_OVERLAYS_ENERGY === "function") {
    OLD_RENDER_OVERLAYS_ENERGY();
  }

  renderEnergyLayer();
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 7
========================================================= */

window.loadEnergyMapData = loadEnergyMapData;
window.generateFallbackEnergyMap = generateFallbackEnergyMap;
window.pickFallbackEnergyType = pickFallbackEnergyType;

window.renderEnergyLayer = renderEnergyLayer;
window.renderEnergyInterconnectors = renderEnergyInterconnectors;
window.renderEnergyPoints = renderEnergyPoints;
window.drawEnergyPlant = drawEnergyPlant;
window.drawEnergySubstation = drawEnergySubstation;
window.getEnergyColor = getEnergyColor;
window.getEnergyIcon = getEnergyIcon;

window.getEnergyAssetsNear = getEnergyAssetsNear;
window.pointOnScreen = pointOnScreen;

window.renderMapOverlays = renderMapOverlays;

/* =========================================================
   MAPS.JS v1
   BLOQUE 8/20
   Recursos naturales estratégicos
========================================================= */

NEXUS_MAP.resources = {
    loaded: false,
    deposits: [],
    visible: [],
    selected: null
};

/* =========================================================
   CARGA
========================================================= */

async function loadResourceMap() {

    try {

        const response = await fetch(
            "assets/maps/resources.geojson"
        );

        const geojson = await response.json();

        NEXUS_MAP.resources.deposits =
            geojson.features || [];

    }

    catch {

        generateFallbackResources();

    }

    NEXUS_MAP.resources.loaded = true;

}

/* ========================================================= */

function generateFallbackResources() {

    NEXUS_MAP.resources.deposits = [];

    const resourceTypes = [

        "iron",
        "copper",
        "lithium",
        "oil",
        "gas",
        "uranium",
        "gold",
        "rare_earths",
        "coal",
        "bauxite"

    ];

    (NEXUS.state.countries || []).forEach(country => {

        const count =
            Math.floor(Math.random() * 6) + 6;

        for (let i = 0; i < count; i++) {

            const resource =
                randomChoice(resourceTypes);

            NEXUS_MAP.resources.deposits.push({

                id:
                    crypto.randomUUID(),

                iso:
                    country.iso,

                type:
                    resource,

                reserve:
                    randomBetween(
                        50,
                        5000
                    ),

                extraction:
                    randomBetween(
                        0,
                        100
                    ),

                discovered:
                    true,

                x:
                    (country.lon || 0)
                    + randomBetween(-3,3),

                y:
                    (country.lat || 0)
                    + randomBetween(-2,2)

            });

        }

    });

}

/* =========================================================
   RENDER
========================================================= */

function renderResources() {

    if(!NEXUS_MAP.layers.resources)
        return;

    if(!NEXUS_MAP.resources.loaded)
        return;

    if(NEXUS_MAP.camera.zoom<2)
        return;

    const ctx =
        NEXUS_MAP.ctx;

    NEXUS_MAP.resources.visible=[];

    NEXUS_MAP.resources.deposits.forEach(resource=>{

        const screen=
            geoToScreen(
                resource.x,
                resource.y
            );

        if(
            !pointOnScreen(
                screen,
                30
            )
        ) return;

        NEXUS_MAP.resources.visible.push(
            resource
        );

        drawResource(
            resource,
            screen
        );

    });

}

/* ========================================================= */

function drawResource(
    resource,
    screen
){

    const ctx=
        NEXUS_MAP.ctx;

    ctx.save();

    ctx.font=
        `${Math.max(
            12,
            14/NEXUS_MAP.camera.zoom
        )}px Arial`;

    ctx.textAlign="center";

    ctx.textBaseline="middle";

    ctx.fillText(

        getResourceIcon(
            resource.type
        ),

        screen.x,

        screen.y

    );

    if(
        NEXUS_MAP.camera.zoom>3
    ){

        ctx.font="10px Arial";

        ctx.fillStyle="white";

        ctx.fillText(

            resource.reserve.toFixed(0),

            screen.x,

            screen.y+14

        );

    }

    ctx.restore();

}

/* ========================================================= */

function detectResourceAt(
    worldX,
    worldY
){

    let best=null;

    let bestD=999999;

    NEXUS_MAP.resources.visible.forEach(r=>{

        const dx=
            worldX-r.x*5;

        const dy=
            worldY+r.y*5;

        const d=
            Math.sqrt(
                dx*dx+dy*dy
            );

        if(
            d<10 &&
            d<bestD
        ){

            best=r;

            bestD=d;

        }

    });

    return best;

}

/* ========================================================= */

function openResourceInfo(resource){

    if(!resource)
        return;

    NEXUS_MAP.resources.selected=
        resource;

    openModal(

        "⛏️ Recurso estratégico",

        `

        <h3>

            ${getResourceIcon(resource.type)}

            ${getResourceName(resource.type)}

        </h3>

        <table class="info-table">

            <tr>

                <td>Reserva</td>

                <td>${resource.reserve.toFixed(0)} Mt</td>

            </tr>

            <tr>

                <td>Extracción</td>

                <td>${resource.extraction.toFixed(1)}</td>

            </tr>

            <tr>

                <td>País</td>

                <td>${resource.iso}</td>

            </tr>

        </table>

        <hr>

        <button
            onclick="investResource('${resource.id}')">

            🔬 Mejorar extracción

        </button>

        <button
            onclick="closeModal()">

            Cerrar

        </button>

        `

    );

}

/* ========================================================= */

function investResource(id){

    const r=
        NEXUS_MAP.resources.deposits.find(
            x=>x.id===id
        );

    if(!r)
        return;

    r.extraction*=1.10;

    notify(

        "⛏️",

        `${getResourceName(r.type)} mejorado.`,

        "success"

    );

    closeModal();

}

/* ========================================================= */

function getResourceIcon(type){

    return{

        iron:"⛓️",

        copper:"🟠",

        lithium:"🔋",

        oil:"🛢️",

        gas:"🔥",

        uranium:"☢️",

        gold:"🥇",

        coal:"⚫",

        bauxite:"🪨",

        rare_earths:"💎"

    }[type] || "⛏️";

}

function getResourceName(type){

    return{

        iron:"Hierro",

        copper:"Cobre",

        lithium:"Litio",

        oil:"Petróleo",

        gas:"Gas Natural",

        uranium:"Uranio",

        gold:"Oro",

        coal:"Carbón",

        bauxite:"Bauxita",

        rare_earths:"Tierras Raras"

    }[type] || type;

}

/* =========================================================
   INTEGRACIÓN
========================================================= */

const OLD_RENDER_OVERLAYS_RESOURCES =
    window.renderMapOverlays;

window.renderMapOverlays=function(){

    if(
        typeof OLD_RENDER_OVERLAYS_RESOURCES==="function"
    )
        OLD_RENDER_OVERLAYS_RESOURCES();

    renderResources();

};

/* =========================================================
   EXPORT
========================================================= */

window.loadResourceMap=loadResourceMap;
window.generateFallbackResources=generateFallbackResources;
window.renderResources=renderResources;
window.drawResource=drawResource;
window.detectResourceAt=detectResourceAt;
window.openResourceInfo=openResourceInfo;
window.investResource=investResource;
window.getResourceIcon=getResourceIcon;
window.getResourceName=getResourceName;


/* =========================================================
   MAPS.JS v1
   BLOQUE 9/20
   Industria: fábricas, astilleros, defensa, automoción,
   semiconductores, aeroespacial y centros industriales.
========================================================= */

NEXUS_MAP.industry = {
  loaded: false,
  facilities: [],
  visible: [],
  selected: null
};

/* =========================================================
   CARGA / FALLBACK
========================================================= */

async function loadIndustryMap() {
  try {
    const response = await fetch("assets/maps/industry.geojson");
    if (!response.ok) throw new Error("industry.geojson no disponible");

    const geojson = await response.json();

    NEXUS_MAP.industry.facilities = (geojson.features || []).map(feature => ({
      id: feature.properties?.id || crypto.randomUUID(),
      name: feature.properties?.name || "Instalación industrial",
      iso: feature.properties?.iso || feature.properties?.ISO_A3,
      sector: feature.properties?.sector || "industry",
      level: Number(feature.properties?.level || 1),
      output: Number(feature.properties?.output || 100),
      owner: feature.properties?.owner || null,
      damaged: Boolean(feature.properties?.damaged),
      x: feature.geometry?.coordinates?.[0] || 0,
      y: feature.geometry?.coordinates?.[1] || 0
    }));

  } catch (error) {
    generateFallbackIndustryMap();
  }

  NEXUS_MAP.industry.loaded = true;
}

function generateFallbackIndustryMap() {
  NEXUS_MAP.industry.facilities = [];

  for (const country of NEXUS.state.countries || []) {
    const cities = (NEXUS_MAP.cities.features || [])
      .filter(city => city.iso === country.iso)
      .sort((a, b) => (b.industry || b.population || 0) - (a.industry || a.population || 0));

    const sectors = pickCountryIndustrySectors(country);

    for (let i = 0; i < Math.min(cities.length, sectors.length); i++) {
      const city = cities[i];
      const sector = sectors[i];

      NEXUS_MAP.industry.facilities.push({
        id: crypto.randomUUID(),
        name: generateFacilityName(country, city, sector),
        iso: country.iso,
        sector,
        level: Math.max(1, Math.round(randomBetween(1, 4))),
        output: Math.round(randomBetween(80, 600)),
        owner: country.name,
        damaged: false,
        x: city.x + randomBetween(-0.25, 0.25),
        y: city.y + randomBetween(-0.18, 0.18)
      });
    }
  }
}

function pickCountryIndustrySectors(country) {
  const base = ["industry", "automotive", "steel", "electronics", "energy"];

  if ((country.military || 0) > 120000) base.push("defense", "shipyard", "aerospace");
  if ((country.research || 0) > 1500) base.push("semiconductors", "biotech", "space");
  if ((country.energyProduction || 0) > 90000) base.push("battery", "hydrogen");
  if (country.name === "España") base.push("automotive", "shipyard", "aerospace", "rail");
  if (country.name === "Estados Unidos") base.push("defense", "aerospace", "semiconductors", "space");
  if (country.name === "Alemania") base.push("automotive", "machinery", "chemicals");
  if (country.name === "Francia") base.push("aerospace", "nuclear", "defense");
  if (country.name === "China") base.push("electronics", "battery", "shipyard", "semiconductors");

  return [...base, ...base].slice(0, 12);
}

function generateFacilityName(country, city, sector) {
  const names = {
    automotive: ["Automotive Works", "Motor Plant", "Gigafactory"],
    defense: ["Defense Systems", "Arms Complex", "Military Industries"],
    shipyard: ["Naval Yard", "Shipbuilding Complex", "Astilleros"],
    aerospace: ["Aerospace Campus", "Aircraft Works", "Aero Systems"],
    semiconductors: ["Semiconductor Fab", "Microelectronics Center"],
    battery: ["Battery Gigafactory", "Energy Storage Plant"],
    steel: ["Steelworks", "Acería"],
    electronics: ["Electronics Hub", "Digital Systems"],
    energy: ["Energy Industries", "Power Equipment"],
    space: ["Space Center", "Launch Systems"],
    biotech: ["Biotech Campus", "Pharma Works"],
    rail: ["Rail Systems", "Rolling Stock Plant"],
    machinery: ["Machinery Works", "Precision Engineering"],
    chemicals: ["Chemical Complex", "Industrial Chemistry"],
    nuclear: ["Nuclear Engineering", "Atomic Systems"],
    hydrogen: ["Hydrogen Plant", "H2 Valley"],
    industry: ["Industrial Park", "Manufacturing Hub"]
  };

  const options = names[sector] || names.industry;
  return `${city.name} ${randomChoice(options)}`;
}

/* =========================================================
   RENDER INDUSTRIAL
========================================================= */

function renderIndustryLayer() {
  if (!NEXUS_MAP.layers.industry) return;
  if (!NEXUS_MAP.industry.loaded) return;
  if (NEXUS_MAP.camera.zoom < 2.3) return;

  NEXUS_MAP.industry.visible = [];

  for (const facility of NEXUS_MAP.industry.facilities) {
    const screen = geoToScreen(facility.x, facility.y);

    if (!pointOnScreen(screen, 40)) continue;

    NEXUS_MAP.industry.visible.push(facility);
    drawIndustryFacility(facility, screen);
  }
}

function drawIndustryFacility(facility, screen) {
  const ctx = NEXUS_MAP.ctx;
  if (!ctx) return;

  const radius = clamp(3 + facility.level * 1.2, 4, 10);

  ctx.save();

  ctx.beginPath();
  ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = getIndustryColor(facility.sector);
  ctx.globalAlpha = facility.damaged ? 0.45 : 0.90;
  ctx.fill();

  ctx.strokeStyle =
    facility === NEXUS_MAP.industry.selected
      ? "#FFD54F"
      : facility.damaged
        ? "#FF1744"
        : "#FFFFFF";

  ctx.lineWidth = facility === NEXUS_MAP.industry.selected ? 2 : 0.8;
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.font = `${Math.max(11, 13 / NEXUS_MAP.camera.zoom)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(getIndustryIcon(facility.sector), screen.x, screen.y);

  if (NEXUS_MAP.camera.zoom > 3.4) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "10px Arial";
    ctx.fillText(facility.name, screen.x + radius + 4, screen.y + 3);
  }

  ctx.restore();
}

function getIndustryColor(sector) {
  return {
    automotive: "#1976D2",
    defense: "#D32F2F",
    shipyard: "#00838F",
    aerospace: "#7B1FA2",
    semiconductors: "#00ACC1",
    battery: "#43A047",
    steel: "#757575",
    electronics: "#29B6F6",
    energy: "#FBC02D",
    space: "#5E35B1",
    biotech: "#66BB6A",
    rail: "#8D6E63",
    machinery: "#546E7A",
    chemicals: "#AB47BC",
    nuclear: "#CE93D8",
    hydrogen: "#80DEEA",
    industry: "#90A4AE"
  }[sector] || "#90A4AE";
}

function getIndustryIcon(sector) {
  return {
    automotive: "🚗",
    defense: "🪖",
    shipyard: "🚢",
    aerospace: "✈️",
    semiconductors: "🧩",
    battery: "🔋",
    steel: "🏗️",
    electronics: "💻",
    energy: "⚡",
    space: "🚀",
    biotech: "💊",
    rail: "🚄",
    machinery: "⚙️",
    chemicals: "🧪",
    nuclear: "☢️",
    hydrogen: "💧",
    industry: "🏭"
  }[sector] || "🏭";
}

/* =========================================================
   DETECCIÓN / INTERACCIÓN
========================================================= */

function detectIndustryAt(worldX, worldY) {
  let best = null;
  let bestDistance = Infinity;

  for (const facility of NEXUS_MAP.industry.visible || []) {
    const dx = worldX - facility.x * 5;
    const dy = worldY + facility.y * 5;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d < 10 && d < bestDistance) {
      best = facility;
      bestDistance = d;
    }
  }

  return best;
}

function openIndustryFacilityInfo(facility) {
  if (!facility) return;

  NEXUS_MAP.industry.selected = facility;

  const country = getCountryByISO(facility.iso);

  openModal("🏭 Instalación industrial", `
    <h3>${getIndustryIcon(facility.sector)} ${facility.name}</h3>

    <table class="info-table">
      <tr><td>País</td><td>${country?.name || facility.iso}</td></tr>
      <tr><td>Sector</td><td>${getIndustrySectorName(facility.sector)}</td></tr>
      <tr><td>Nivel</td><td>${facility.level}</td></tr>
      <tr><td>Producción</td><td>${formatNumber(facility.output)}</td></tr>
      <tr><td>Propietario</td><td>${facility.owner || country?.name || "—"}</td></tr>
      <tr><td>Estado</td><td>${facility.damaged ? "Dañada" : "Operativa"}</td></tr>
    </table>

    <hr>

    <button onclick="upgradeIndustryFacility('${facility.id}')">⬆️ Mejorar</button>
    <button onclick="repairIndustryFacility('${facility.id}')">🛠️ Reparar</button>
    <button onclick="centerCameraOnIndustry('${facility.id}')">🎯 Centrar</button>
  `);
}

function getIndustrySectorName(sector) {
  return {
    automotive: "Automoción",
    defense: "Defensa",
    shipyard: "Astilleros",
    aerospace: "Aeroespacial",
    semiconductors: "Semiconductores",
    battery: "Baterías",
    steel: "Acero",
    electronics: "Electrónica",
    energy: "Energía",
    space: "Espacial",
    biotech: "Biotecnología",
    rail: "Ferroviario",
    machinery: "Maquinaria",
    chemicals: "Química",
    nuclear: "Nuclear",
    hydrogen: "Hidrógeno",
    industry: "Industria general"
  }[sector] || sector;
}

function upgradeIndustryFacility(id) {
  const facility = NEXUS_MAP.industry.facilities.find(f => f.id === id);
  const country = getSelectedCountry();

  if (!facility || !country) return;

  const cost = 75_000_000 * facility.level;

  if (country.treasury < cost) {
    notify("⛔", "Fondos insuficientes para mejorar instalación.", "error");
    return;
  }

  country.treasury -= cost;
  facility.level = Math.min(10, facility.level + 1);
  facility.output *= 1.18;

  notify("🏭", `${facility.name} mejorada a nivel ${facility.level}.`, "success");
  closeModal();
  renderAll?.();
}

function repairIndustryFacility(id) {
  const facility = NEXUS_MAP.industry.facilities.find(f => f.id === id);
  const country = getSelectedCountry();

  if (!facility || !country) return;

  const cost = 35_000_000 * facility.level;

  if (country.treasury < cost) {
    notify("⛔", "Fondos insuficientes para reparar instalación.", "error");
    return;
  }

  country.treasury -= cost;
  facility.damaged = false;

  notify("🛠️", `${facility.name} reparada.`, "success");
  closeModal();
  renderAll?.();
}

function centerCameraOnIndustry(id) {
  const facility = NEXUS_MAP.industry.facilities.find(f => f.id === id);
  if (!facility) return;

  setMapCamera(
    -(facility.x * 5),
    facility.y * 5,
    4.2
  );
}

/* =========================================================
   EFECTOS DE MAPA SOBRE SIMULACIÓN
========================================================= */

function applyIndustryMapOutputToCountries() {
  for (const facility of NEXUS_MAP.industry.facilities || []) {
    if (facility.damaged) continue;

    const country = getCountryByISO(facility.iso);
    if (!country) continue;

    const output = facility.output * facility.level;

    country.gdp += output * 25_000;
    country.exports += output * 3_000;
    country.businessConfidence = boundedDelta(country.businessConfidence || 50, 0.0008, 0, 100);

    if (facility.sector === "defense") country.military += output * 0.4;
    if (facility.sector === "semiconductors") country.research += output * 0.006;
    if (facility.sector === "energy") country.energyProduction += output * 0.08;
    if (facility.sector === "battery") country.renewablesMW = (country.renewablesMW || 0) + output * 0.01;
  }
}

/* =========================================================
   INTEGRACIÓN OVERLAY Y TICK
========================================================= */

NEXUS_MAP.layers.industry ??= false;

const OLD_RENDER_OVERLAYS_INDUSTRY = window.renderMapOverlays;

function renderMapOverlays() {
  if (typeof OLD_RENDER_OVERLAYS_INDUSTRY === "function") {
    OLD_RENDER_OVERLAYS_INDUSTRY();
  }

  renderIndustryLayer();
}

const OLD_SIMULATION_TICK_INDUSTRY_MAP = window.simulationTick;

function simulationTick() {
  if (typeof OLD_SIMULATION_TICK_INDUSTRY_MAP === "function") {
    OLD_SIMULATION_TICK_INDUSTRY_MAP();
  }

  applyIndustryMapOutputToCountries();
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 9
========================================================= */

window.loadIndustryMap = loadIndustryMap;
window.generateFallbackIndustryMap = generateFallbackIndustryMap;
window.pickCountryIndustrySectors = pickCountryIndustrySectors;
window.generateFacilityName = generateFacilityName;

window.renderIndustryLayer = renderIndustryLayer;
window.drawIndustryFacility = drawIndustryFacility;
window.getIndustryColor = getIndustryColor;
window.getIndustryIcon = getIndustryIcon;

window.detectIndustryAt = detectIndustryAt;
window.openIndustryFacilityInfo = openIndustryFacilityInfo;
window.getIndustrySectorName = getIndustrySectorName;
window.upgradeIndustryFacility = upgradeIndustryFacility;
window.repairIndustryFacility = repairIndustryFacility;
window.centerCameraOnIndustry = centerCameraOnIndustry;

window.applyIndustryMapOutputToCountries = applyIndustryMapOutputToCountries;
window.renderMapOverlays = renderMapOverlays;
window.simulationTick = simulationTick;


/* =========================================================
   MAPS.JS v1
   BLOQUE 10/20
   Fuerzas terrestres, divisiones y movimientos
========================================================= */

NEXUS_MAP.landUnits = {
    loaded: false,
    units: [],
    selected: null,
    hovered: null
};

/* =========================================================
   GENERACIÓN INICIAL
========================================================= */

function generateLandUnits(){

    NEXUS_MAP.landUnits.units=[];

    (NEXUS.state.countries||[]).forEach(country=>{

        const regions=country.regions||[];

        regions.forEach(region=>{

            const divisions=Math.max(
                1,
                Math.round(
                    (region.population||1000000)/2500000
                )
            );

            for(let i=0;i<divisions;i++){

                NEXUS_MAP.landUnits.units.push({

                    id:crypto.randomUUID(),

                    country:country.name,

                    iso:country.iso,

                    region:region.id,

                    name:
                        `${region.name} Division ${i+1}`,

                    type:randomChoice([
                        "infantry",
                        "mechanized",
                        "armor",
                        "artillery",
                        "airborne"
                    ]),

                    soldiers:
                        Math.round(
                            randomBetween(
                                3000,
                                12000
                            )
                        ),

                    morale:
                        randomBetween(
                            70,
                            100
                        ),

                    readiness:
                        randomBetween(
                            60,
                            100
                        ),

                    experience:
                        randomBetween(
                            20,
                            90
                        ),

                    hp:100,

                    destination:null,

                    moving:false,

                    speed:randomBetween(
                        0.01,
                        0.03
                    ),

                    x:
                        (region.lon||country.lon||0)+
                        randomBetween(-0.25,0.25),

                    y:
                        (region.lat||country.lat||0)+
                        randomBetween(-0.25,0.25)

                });

            }

        });

    });

    NEXUS_MAP.landUnits.loaded=true;

}

/* =========================================================
   RENDER
========================================================= */

function renderLandUnits(){

    if(!NEXUS_MAP.layers.military)
        return;

    if(!NEXUS_MAP.landUnits.loaded)
        return;

    if(NEXUS_MAP.camera.zoom<2.4)
        return;

    NEXUS_MAP.landUnits.units.forEach(unit=>{

        drawLandUnit(unit);

    });

}

/* ========================================================= */

function drawLandUnit(unit){

    const ctx=NEXUS_MAP.ctx;

    const p=geoToScreen(
        unit.x,
        unit.y
    );

    if(!pointOnScreen(p,40))
        return;

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        7,
        0,
        Math.PI*2
    );

    ctx.fillStyle=
        getCountryColor(unit.iso);

    ctx.fill();

    if(
        unit===NEXUS_MAP.landUnits.selected
    ){

        ctx.strokeStyle="#FFD54F";
        ctx.lineWidth=2;
        ctx.stroke();

    }

    ctx.font="11px Arial";
    ctx.textAlign="center";
    ctx.textBaseline="middle";

    ctx.fillStyle="white";

    ctx.fillText(

        getUnitIcon(
            unit.type
        ),

        p.x,

        p.y

    );

    if(
        NEXUS_MAP.camera.zoom>3.5
    ){

        ctx.font="10px Arial";

        ctx.fillText(

            unit.name,

            p.x,

            p.y+18

        );

    }

    ctx.restore();

}

/* =========================================================
   MOVIMIENTO
========================================================= */

function updateLandUnits(){

    NEXUS_MAP.landUnits.units.forEach(unit=>{

        if(
            !unit.moving ||
            !unit.destination
        )
            return;

        const dx=
            unit.destination.x-unit.x;

        const dy=
            unit.destination.y-unit.y;

        const dist=
            Math.sqrt(
                dx*dx+
                dy*dy
            );

        if(dist<0.02){

            unit.x=
                unit.destination.x;

            unit.y=
                unit.destination.y;

            unit.destination=null;

            unit.moving=false;

            return;

        }

        unit.x+=
            dx*unit.speed;

        unit.y+=
            dy*unit.speed;

    });

}

/* ========================================================= */

function moveSelectedUnit(
    lon,
    lat
){

    const unit=
        NEXUS_MAP.landUnits.selected;

    if(!unit)
        return;

    unit.destination={

        x:lon,

        y:lat

    };

    unit.moving=true;

}

/* ========================================================= */

function detectLandUnit(
    worldX,
    worldY
){

    let best=null;

    let dBest=9999;

    NEXUS_MAP.landUnits.units.forEach(unit=>{

        const dx=
            worldX-unit.x*5;

        const dy=
            worldY+unit.y*5;

        const d=
            Math.sqrt(
                dx*dx+
                dy*dy
            );

        if(
            d<8 &&
            d<dBest
        ){

            best=unit;

            dBest=d;

        }

    });

    return best;

}

/* ========================================================= */

function openLandUnit(unit){

    if(!unit)
        return;

    NEXUS_MAP.landUnits.selected=
        unit;

    openModal(

        "🪖 Unidad",

        `

        <h3>

            ${unit.name}

        </h3>

        <table class="info-table">

        <tr>

            <td>Tipo</td>

            <td>${unit.type}</td>

        </tr>

        <tr>

            <td>Soldados</td>

            <td>${formatNumber(unit.soldiers)}</td>

        </tr>

        <tr>

            <td>Moral</td>

            <td>${unit.morale.toFixed(0)}%</td>

        </tr>

        <tr>

            <td>Preparación</td>

            <td>${unit.readiness.toFixed(0)}%</td>

        </tr>

        <tr>

            <td>Experiencia</td>

            <td>${unit.experience.toFixed(0)}%</td>

        </tr>

        <tr>

            <td>Vida</td>

            <td>${unit.hp}%</td>

        </tr>

        </table>

        <hr>

        <button
            onclick="closeModal()">

            Cerrar

        </button>

        `

    );

}

/* ========================================================= */

function getUnitIcon(type){

    return{

        infantry:"🪖",

        mechanized:"🚛",

        armor:"🛡️",

        artillery:"💥",

        airborne:"🪂"

    }[type]||"🪖";

}

/* ========================================================= */

const OLD_RENDER_MAP_10=
window.renderMapOverlays;

window.renderMapOverlays=function(){

    if(typeof OLD_RENDER_MAP_10==="function")
        OLD_RENDER_MAP_10();

    renderLandUnits();

};

const OLD_SIMULATION_TICK_10=
window.simulationTick;

window.simulationTick=function(){

    if(typeof OLD_SIMULATION_TICK_10==="function")
        OLD_SIMULATION_TICK_10();

    updateLandUnits();

};

/* =========================================================
   EXPORT
========================================================= */

window.generateLandUnits=generateLandUnits;
window.renderLandUnits=renderLandUnits;
window.updateLandUnits=updateLandUnits;
window.detectLandUnit=detectLandUnit;
window.moveSelectedUnit=moveSelectedUnit;
window.openLandUnit=openLandUnit;
window.getUnitIcon=getUnitIcon;


/* =========================================================
   MAPS.JS v1
   BLOQUE 11/20
   Aviación Militar
========================================================= */

NEXUS_MAP.airUnits = {
    loaded: false,
    units: [],
    selected: null,
    hovered: null
};

/* =========================================================
   GENERACIÓN
========================================================= */

function generateAirUnits() {

    NEXUS_MAP.airUnits.units = [];

    (NEXUS.state.countries || []).forEach(country => {

        const airbases = (NEXUS_MAP.cities.features || [])
            .filter(c => c.iso === country.iso && c.airport);

        airbases.forEach(base => {

            const aircraft = Math.max(
                2,
                Math.round((country.airPower || 100) / 250)
            );

            for (let i = 0; i < aircraft; i++) {

                const type = randomChoice([
                    "fighter",
                    "multirole",
                    "bomber",
                    "awacs",
                    "drone",
                    "tanker"
                ]);

                NEXUS_MAP.airUnits.units.push({

                    id: crypto.randomUUID(),

                    country: country.name,

                    iso: country.iso,

                    base: base.id,

                    name: `${base.name} ${type.toUpperCase()} ${i + 1}`,

                    type,

                    x: base.x + randomBetween(-0.08, 0.08),

                    y: base.y + randomBetween(-0.08, 0.08),

                    altitude: 0,

                    fuel: 100,

                    hp: 100,

                    readiness: randomBetween(70, 100),

                    mission: "ground",

                    destination: null,

                    moving: false,

                    speed: getAircraftSpeed(type)

                });

            }

        });

    });

    NEXUS_MAP.airUnits.loaded = true;

}

/* =========================================================
   RENDER
========================================================= */

function renderAirUnits() {

    if (!NEXUS_MAP.layers.military) return;
    if (!NEXUS_MAP.airUnits.loaded) return;
    if (NEXUS_MAP.camera.zoom < 2.6) return;

    NEXUS_MAP.airUnits.units.forEach(drawAirUnit);

}

function drawAirUnit(unit) {

    const ctx = NEXUS_MAP.ctx;

    const p = geoToScreen(unit.x, unit.y);

    if (!pointOnScreen(p, 40)) return;

    ctx.save();

    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        getAircraftIcon(unit.type),
        p.x,
        p.y
    );

    if (unit === NEXUS_MAP.airUnits.selected) {

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            12,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle = "#FFD54F";
        ctx.lineWidth = 2;
        ctx.stroke();

    }

    if (NEXUS_MAP.camera.zoom > 3.6) {

        ctx.font = "10px Arial";
        ctx.fillStyle = "white";

        ctx.fillText(
            unit.name,
            p.x,
            p.y + 16
        );

    }

    ctx.restore();

}

/* =========================================================
   MOVIMIENTO
========================================================= */

function updateAirUnits() {

    NEXUS_MAP.airUnits.units.forEach(unit => {

        if (!unit.moving || !unit.destination)
            return;

        const dx = unit.destination.x - unit.x;
        const dy = unit.destination.y - unit.y;

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.05) {

            unit.x = unit.destination.x;
            unit.y = unit.destination.y;

            unit.destination = null;
            unit.moving = false;

            unit.mission = "patrol";

            return;

        }

        unit.x += dx * unit.speed;
        unit.y += dy * unit.speed;

        unit.altitude = 9000;
        unit.fuel -= 0.02;

        if (unit.fuel <= 10) {

            unit.destination = {

                x: getAirbase(unit.base).x,
                y: getAirbase(unit.base).y

            };

            unit.mission = "return";

        }

    });

}

/* ========================================================= */

function sendAircraft(unitId, lon, lat) {

    const unit =
        NEXUS_MAP.airUnits.units.find(
            u => u.id === unitId
        );

    if (!unit) return;

    unit.destination = {

        x: lon,
        y: lat

    };

    unit.moving = true;
    unit.mission = "combat";

}

/* ========================================================= */

function detectAirUnit(worldX, worldY) {

    let best = null;
    let bestD = 9999;

    NEXUS_MAP.airUnits.units.forEach(unit => {

        const dx = worldX - unit.x * 5;
        const dy = worldY + unit.y * 5;

        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < 10 && d < bestD) {

            best = unit;
            bestD = d;

        }

    });

    return best;

}

/* ========================================================= */

function openAirUnit(unit) {

    if (!unit) return;

    NEXUS_MAP.airUnits.selected = unit;

    openModal(

        "✈️ Unidad aérea",

        `

        <h3>${unit.name}</h3>

        <table class="info-table">

        <tr><td>Tipo</td><td>${unit.type}</td></tr>

        <tr><td>Combustible</td><td>${unit.fuel.toFixed(0)}%</td></tr>

        <tr><td>Altitud</td><td>${unit.altitude.toFixed(0)} m</td></tr>

        <tr><td>Preparación</td><td>${unit.readiness.toFixed(0)}%</td></tr>

        <tr><td>Misión</td><td>${unit.mission}</td></tr>

        <tr><td>Vida</td><td>${unit.hp}%</td></tr>

        </table>

        <hr>

        <button onclick="closeModal()">

            Cerrar

        </button>

        `

    );

}

/* ========================================================= */

function getAircraftSpeed(type) {

    return {

        fighter: 0.040,
        multirole: 0.038,
        bomber: 0.026,
        awacs: 0.018,
        drone: 0.020,
        tanker: 0.022

    }[type] || 0.025;

}

function getAircraftIcon(type) {

    return {

        fighter: "✈️",
        multirole: "🛩️",
        bomber: "💣",
        awacs: "📡",
        drone: "🛰️",
        tanker: "⛽"

    }[type] || "✈️";

}

function getAirbase(id) {

    return NEXUS_MAP.cities.features.find(
        c => c.id === id
    );

}

/* =========================================================
   INTEGRACIÓN
========================================================= */

const OLD_RENDER_MAP_11 = window.renderMapOverlays;

window.renderMapOverlays = function () {

    if (typeof OLD_RENDER_MAP_11 === "function")
        OLD_RENDER_MAP_11();

    renderAirUnits();

};

const OLD_SIMULATION_TICK_11 = window.simulationTick;

window.simulationTick = function () {

    if (typeof OLD_SIMULATION_TICK_11 === "function")
        OLD_SIMULATION_TICK_11();

    updateAirUnits();

};

/* =========================================================
   EXPORT
========================================================= */

window.generateAirUnits = generateAirUnits;
window.renderAirUnits = renderAirUnits;
window.updateAirUnits = updateAirUnits;
window.detectAirUnit = detectAirUnit;
window.sendAircraft = sendAircraft;
window.openAirUnit = openAirUnit;
window.getAircraftIcon = getAircraftIcon;
window.getAircraftSpeed = getAircraftSpeed;
window.getAirbase = getAirbase;


/* =========================================================
   MAPS.JS v1
   BLOQUE 12/20
   Marina: flotas, portaaviones, destructores, submarinos,
   anfibios, logística naval y movimiento marítimo.
========================================================= */

NEXUS_MAP.navalUnits = {
  loaded: false,
  fleets: [],
  selected: null,
  hovered: null
};

/* =========================================================
   GENERACIÓN
========================================================= */

function generateNavalUnits() {
  NEXUS_MAP.navalUnits.fleets = [];

  for (const country of NEXUS.state.countries || []) {
    const ports = (NEXUS_MAP.cities.features || [])
      .filter(city => city.iso === country.iso && city.port);

    if (!ports.length) continue;

    const navalPower = calculateNavalPower?.(country, "all") || country.military * 0.12 || 1000;
    const fleetCount = clamp(Math.round(navalPower / 35000), 1, 6);

    for (let i = 0; i < fleetCount; i++) {
      const port = ports[i % ports.length];

      NEXUS_MAP.navalUnits.fleets.push({
        id: crypto.randomUUID(),
        country: country.name,
        iso: country.iso,
        homePort: port.id,
        name: `${country.name} Fleet ${i + 1}`,
        type: pickFleetType(country, navalPower),
        ships: generateFleetComposition(country, navalPower),
        mission: "port",
        hp: 100,
        fuel: 100,
        readiness: randomBetween(65, 100),
        destination: null,
        moving: false,
        speed: 0.010,
        x: port.x + randomBetween(-0.18, 0.18),
        y: port.y + randomBetween(-0.12, 0.12)
      });
    }
  }

  NEXUS_MAP.navalUnits.loaded = true;
}

function pickFleetType(country, navalPower) {
  if (navalPower > 180000 && randomChance(0.35)) return "carrier_group";
  if (navalPower > 90000 && randomChance(0.45)) return "surface_action";
  if (randomChance(0.35)) return "submarine";
  if (randomChance(0.25)) return "amphibious";
  return "patrol";
}

function generateFleetComposition(country, navalPower) {
  const type = pickFleetType(country, navalPower);

  const ships = {
    carrier: 0,
    destroyer: 0,
    frigate: 0,
    submarine: 0,
    amphibious: 0,
    logistics: 1
  };

  if (type === "carrier_group") {
    ships.carrier = 1;
    ships.destroyer = Math.round(randomBetween(2, 5));
    ships.frigate = Math.round(randomBetween(2, 6));
    ships.submarine = Math.round(randomBetween(1, 3));
    ships.logistics = 2;
  } else if (type === "surface_action") {
    ships.destroyer = Math.round(randomBetween(1, 4));
    ships.frigate = Math.round(randomBetween(2, 6));
    ships.submarine = Math.round(randomBetween(0, 2));
  } else if (type === "submarine") {
    ships.submarine = Math.round(randomBetween(2, 6));
    ships.logistics = 0;
  } else if (type === "amphibious") {
    ships.amphibious = Math.round(randomBetween(1, 3));
    ships.destroyer = Math.round(randomBetween(1, 3));
    ships.frigate = Math.round(randomBetween(1, 4));
  } else {
    ships.frigate = Math.round(randomBetween(1, 4));
    ships.destroyer = Math.round(randomBetween(0, 2));
  }

  return ships;
}

/* =========================================================
   RENDER
========================================================= */

function renderNavalUnits() {
  if (!NEXUS_MAP.layers.military) return;
  if (!NEXUS_MAP.navalUnits.loaded) return;
  if (NEXUS_MAP.camera.zoom < 2.1) return;

  for (const fleet of NEXUS_MAP.navalUnits.fleets) {
    drawNavalFleet(fleet);
  }
}

function drawNavalFleet(fleet) {
  const ctx = NEXUS_MAP.ctx;
  const p = geoToScreen(fleet.x, fleet.y);

  if (!ctx || !pointOnScreen(p, 50)) return;

  ctx.save();

  ctx.beginPath();
  ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
  ctx.fillStyle = getCountryColor(fleet.iso);
  ctx.globalAlpha = fleet.hp < 50 ? 0.55 : 0.92;
  ctx.fill();

  ctx.strokeStyle =
    fleet === NEXUS_MAP.navalUnits.selected
      ? "#FFD54F"
      : fleet.type === "submarine"
        ? "#80DEEA"
        : "#FFFFFF";

  ctx.lineWidth = fleet === NEXUS_MAP.navalUnits.selected ? 2.2 : 0.9;
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.font = "15px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(getFleetIcon(fleet.type), p.x, p.y);

  if (NEXUS_MAP.camera.zoom > 3.4) {
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "10px Arial";
    ctx.fillText(fleet.name, p.x, p.y + 18);
  }

  ctx.restore();
}

/* =========================================================
   MOVIMIENTO NAVAL
========================================================= */

function updateNavalUnits() {
  for (const fleet of NEXUS_MAP.navalUnits.fleets) {
    if (!fleet.moving || !fleet.destination) continue;

    const dx = fleet.destination.x - fleet.x;
    const dy = fleet.destination.y - fleet.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.025) {
      fleet.x = fleet.destination.x;
      fleet.y = fleet.destination.y;
      fleet.destination = null;
      fleet.moving = false;
      fleet.mission = "patrol";
      continue;
    }

    fleet.x += dx * fleet.speed;
    fleet.y += dy * fleet.speed;

    fleet.fuel -= 0.01;

    if (fleet.fuel <= 8) {
      returnFleetToPort(fleet);
    }
  }
}

function sendFleet(fleetId, lon, lat) {
  const fleet = NEXUS_MAP.navalUnits.fleets.find(f => f.id === fleetId);
  if (!fleet) return;

  fleet.destination = { x: lon, y: lat };
  fleet.moving = true;
  fleet.mission = "transit";
}

function returnFleetToPort(fleet) {
  const port = getNavalPort(fleet.homePort);
  if (!port) return;

  fleet.destination = { x: port.x, y: port.y };
  fleet.moving = true;
  fleet.mission = "return";
}

function refuelFleet(fleet) {
  if (!fleet) return;

  const port = getNavalPort(fleet.homePort);
  if (!port) return;

  if (distanceGeo(fleet.x, fleet.y, port.x, port.y) < 0.35) {
    fleet.fuel = 100;
    fleet.hp = Math.min(100, fleet.hp + 12);
    fleet.readiness = Math.min(100, fleet.readiness + 8);
    fleet.mission = "port";
  }
}

/* =========================================================
   DETECCIÓN / INTERACCIÓN
========================================================= */

function detectNavalUnit(worldX, worldY) {
  let best = null;
  let bestDistance = Infinity;

  for (const fleet of NEXUS_MAP.navalUnits.fleets || []) {
    const dx = worldX - fleet.x * 5;
    const dy = worldY + fleet.y * 5;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d < 12 && d < bestDistance) {
      best = fleet;
      bestDistance = d;
    }
  }

  return best;
}

function openNavalFleet(fleet) {
  if (!fleet) return;

  NEXUS_MAP.navalUnits.selected = fleet;

  openModal("🚢 Grupo naval", `
    <h3>${getFleetIcon(fleet.type)} ${fleet.name}</h3>

    <table class="info-table">
      <tr><td>País</td><td>${fleet.country}</td></tr>
      <tr><td>Tipo</td><td>${getFleetTypeName(fleet.type)}</td></tr>
      <tr><td>Misión</td><td>${fleet.mission}</td></tr>
      <tr><td>Combustible</td><td>${fleet.fuel.toFixed(0)}%</td></tr>
      <tr><td>Preparación</td><td>${fleet.readiness.toFixed(0)}%</td></tr>
      <tr><td>Vida</td><td>${fleet.hp.toFixed(0)}%</td></tr>
      <tr><td>Portaaviones</td><td>${fleet.ships.carrier}</td></tr>
      <tr><td>Destructores</td><td>${fleet.ships.destroyer}</td></tr>
      <tr><td>Fragatas</td><td>${fleet.ships.frigate}</td></tr>
      <tr><td>Submarinos</td><td>${fleet.ships.submarine}</td></tr>
      <tr><td>Anfibios</td><td>${fleet.ships.amphibious}</td></tr>
      <tr><td>Logísticos</td><td>${fleet.ships.logistics}</td></tr>
    </table>

    <hr>

    <button onclick="returnFleetToPortById('${fleet.id}')">⚓ Volver a puerto</button>
    <button onclick="centerCameraOnFleet('${fleet.id}')">🎯 Centrar</button>
  `);
}

function returnFleetToPortById(id) {
  const fleet = NEXUS_MAP.navalUnits.fleets.find(f => f.id === id);
  if (!fleet) return;

  returnFleetToPort(fleet);
  closeModal();
}

function centerCameraOnFleet(id) {
  const fleet = NEXUS_MAP.navalUnits.fleets.find(f => f.id === id);
  if (!fleet) return;

  setMapCamera(
    -(fleet.x * 5),
    fleet.y * 5,
    4
  );
}

function getNavalPort(id) {
  return (NEXUS_MAP.cities.features || []).find(c => c.id === id);
}

function getFleetIcon(type) {
  return {
    carrier_group: "🛳️",
    surface_action: "🚢",
    submarine: "🔱",
    amphibious: "⛴️",
    patrol: "🚤"
  }[type] || "🚢";
}

function getFleetTypeName(type) {
  return {
    carrier_group: "Grupo de portaaviones",
    surface_action: "Grupo de superficie",
    submarine: "Flotilla submarina",
    amphibious: "Grupo anfibio",
    patrol: "Patrulla naval"
  }[type] || type;
}

/* =========================================================
   EFECTOS SOBRE SIMULACIÓN
========================================================= */

function applyNavalMapEffects() {
  for (const fleet of NEXUS_MAP.navalUnits.fleets || []) {
    const country = getCountryByISO(fleet.iso);
    if (!country) continue;

    const power =
      fleet.ships.carrier * 4500 +
      fleet.ships.destroyer * 1800 +
      fleet.ships.frigate * 950 +
      fleet.ships.submarine * 1600 +
      fleet.ships.amphibious * 1200 +
      fleet.ships.logistics * 250;

    if (fleet.mission === "patrol") {
      country.convoyRisk = boundedDelta(country.convoyRisk || 0, -0.012, 0, 100);
      country.militaryReadiness = boundedDelta(country.militaryReadiness || 70, 0.002, 0, 100);
    }

    if (fleet.fuel < 15) {
      country.militaryReadiness = boundedDelta(country.militaryReadiness || 70, -0.004, 0, 100);
    }

    fleet.mapPower = power * (fleet.readiness / 100) * (fleet.hp / 100);
  }
}

/* =========================================================
   INTEGRACIÓN OVERLAY Y TICK
========================================================= */

const OLD_RENDER_MAP_NAVAL = window.renderMapOverlays;

function renderMapOverlays() {
  if (typeof OLD_RENDER_MAP_NAVAL === "function") {
    OLD_RENDER_MAP_NAVAL();
  }

  renderNavalUnits();
}

const OLD_SIMULATION_TICK_NAVAL_MAP = window.simulationTick;

function simulationTick() {
  if (typeof OLD_SIMULATION_TICK_NAVAL_MAP === "function") {
    OLD_SIMULATION_TICK_NAVAL_MAP();
  }

  updateNavalUnits();
  applyNavalMapEffects();
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 12
========================================================= */

window.generateNavalUnits = generateNavalUnits;
window.pickFleetType = pickFleetType;
window.generateFleetComposition = generateFleetComposition;

window.renderNavalUnits = renderNavalUnits;
window.drawNavalFleet = drawNavalFleet;

window.updateNavalUnits = updateNavalUnits;
window.sendFleet = sendFleet;
window.returnFleetToPort = returnFleetToPort;
window.refuelFleet = refuelFleet;

window.detectNavalUnit = detectNavalUnit;
window.openNavalFleet = openNavalFleet;
window.returnFleetToPortById = returnFleetToPortById;
window.centerCameraOnFleet = centerCameraOnFleet;

window.getNavalPort = getNavalPort;
window.getFleetIcon = getFleetIcon;
window.getFleetTypeName = getFleetTypeName;

window.applyNavalMapEffects = applyNavalMapEffects;

window.renderMapOverlays = renderMapOverlays;
window.simulationTick = simulationTick;


/* =========================================================
   MAPS.JS v1
   BLOQUE 13/20
   Satélites e ISR
========================================================= */

NEXUS_MAP.space = {
    loaded: false,
    satellites: [],
    selected: null
};

/* =========================================================
   GENERACIÓN
========================================================= */

function generateSatellites(){

    NEXUS_MAP.space.satellites=[];

    (NEXUS.state.countries||[]).forEach(country=>{

        const amount=Math.max(
            0,
            Math.round(
                (country.spaceCapability||0)/20
            )
        );

        for(let i=0;i<amount;i++){

            const orbit=randomChoice([
                "LEO",
                "MEO",
                "GEO"
            ]);

            NEXUS_MAP.space.satellites.push({

                id:crypto.randomUUID(),

                iso:country.iso,

                country:country.name,

                name:`${country.name} SAT-${i+1}`,

                orbit,

                angle:Math.random()*360,

                speed:getOrbitSpeed(orbit),

                coverage:getOrbitCoverage(orbit),

                mission:randomChoice([
                    "ISR",
                    "Navigation",
                    "Communication",
                    "Weather",
                    "Early Warning"
                ]),

                health:100,

                active:true

            });

        }

    });

    NEXUS_MAP.space.loaded=true;

}

/* =========================================================
   RENDER
========================================================= */

function renderSatellites(){

    if(!NEXUS_MAP.layers.space)
        return;

    if(!NEXUS_MAP.space.loaded)
        return;

    const ctx=NEXUS_MAP.ctx;

    ctx.save();

    NEXUS_MAP.space.satellites.forEach(sat=>{

        const pos=
            calculateSatellitePosition(sat);

        const p=
            geoToScreen(
                pos.lon,
                pos.lat
            );

        if(!pointOnScreen(p,50))
            return;

        ctx.font="15px Arial";

        ctx.textAlign="center";

        ctx.fillText(
            "🛰️",
            p.x,
            p.y
        );

        if(
            NEXUS_MAP.camera.zoom>3.5
        ){

            ctx.font="10px Arial";

            ctx.fillStyle="white";

            ctx.fillText(

                sat.name,

                p.x,

                p.y+16

            );

        }

    });

    ctx.restore();

}

/* =========================================================
   MOVIMIENTO ORBITAL
========================================================= */

function updateSatellites(){

    NEXUS_MAP.space.satellites.forEach(sat=>{

        sat.angle+=sat.speed;

        if(
            sat.angle>=360
        )
            sat.angle-=360;

    });

}

/* ========================================================= */

function calculateSatellitePosition(sat){

    const angle=
        sat.angle*Math.PI/180;

    const inclination={

        LEO:45,

        MEO:30,

        GEO:0

    }[sat.orbit];

    return{

        lon:
            Math.cos(angle)*180,

        lat:
            Math.sin(angle)*inclination

    };

}

/* =========================================================
   COBERTURA
========================================================= */

function getOrbitCoverage(type){

    return{

        LEO:18,

        MEO:40,

        GEO:80

    }[type];

}

function getOrbitSpeed(type){

    return{

        LEO:0.60,

        MEO:0.18,

        GEO:0.04

    }[type];

}

/* ========================================================= */

function isLocationCovered(lon,lat,iso){

    const sats=

        NEXUS_MAP.space.satellites.filter(s=>

            s.iso===iso &&

            s.active

        );

    for(const sat of sats){

        const pos=
            calculateSatellitePosition(sat);

        const dx=
            lon-pos.lon;

        const dy=
            lat-pos.lat;

        const dist=
            Math.sqrt(dx*dx+dy*dy);

        if(
            dist<=sat.coverage
        )
            return true;

    }

    return false;

}

/* =========================================================
   ISR
========================================================= */

function getISRLevel(countryISO){

    let value=0;

    NEXUS_MAP.space.satellites.forEach(s=>{

        if(
            s.iso!==countryISO
        )
            return;

        if(
            !s.active
        )
            return;

        switch(s.mission){

            case "ISR":
                value+=10;
                break;

            case "Communication":
                value+=3;
                break;

            case "Navigation":
                value+=2;
                break;

            case "Early Warning":
                value+=6;
                break;

        }

    });

    return value;

}

/* ========================================================= */

function detectEnemyUnits(countryISO){

    const visible=[];

    [
        ...NEXUS_MAP.landUnits.units,
        ...NEXUS_MAP.airUnits.units,
        ...NEXUS_MAP.navalUnits.fleets

    ].forEach(unit=>{

        if(
            unit.iso===countryISO
        )
            return;

        if(

            isLocationCovered(

                unit.x,

                unit.y,

                countryISO

            )

        ){

            visible.push(unit);

        }

    });

    return visible;

}

/* ========================================================= */

function openSatellitePanel(){

    openModal(

        "🛰️ Satélites",

        `

        <h3>

            Activos:

            ${NEXUS_MAP.space.satellites.length}

        </h3>

        <p>

            ISR Nacional:

            ${getISRLevel(
                getSelectedCountry().iso
            )}

        </p>

        <button
            onclick="closeModal()">

            Cerrar

        </button>

        `

    );

}

/* =========================================================
   INTEGRACIÓN
========================================================= */

NEXUS_MAP.layers.space ??= false;

const OLD_RENDER_MAP_13=
window.renderMapOverlays;

window.renderMapOverlays=function(){

    if(typeof OLD_RENDER_MAP_13==="function")
        OLD_RENDER_MAP_13();

    renderSatellites();

};

const OLD_SIMULATION_TICK_13=
window.simulationTick;

window.simulationTick=function(){

    if(typeof OLD_SIMULATION_TICK_13==="function")
        OLD_SIMULATION_TICK_13();

    updateSatellites();

};

/* =========================================================
   EXPORT
========================================================= */

window.generateSatellites=generateSatellites;
window.renderSatellites=renderSatellites;
window.updateSatellites=updateSatellites;
window.calculateSatellitePosition=calculateSatellitePosition;
window.getOrbitCoverage=getOrbitCoverage;
window.getOrbitSpeed=getOrbitSpeed;
window.isLocationCovered=isLocationCovered;
window.getISRLevel=getISRLevel;
window.detectEnemyUnits=detectEnemyUnits;
window.openSatellitePanel=openSatellitePanel;


/* =========================================================
   MAPS.JS v1
   BLOQUE 14/20
   Sensores: radares terrestres, navales, AWACS, satélites,
   detección, jamming y cobertura ISR.
========================================================= */

NEXUS_MAP.sensors = {
  loaded: false,
  radars: [],
  detectedUnits: [],
  selected: null
};

/* =========================================================
   GENERACIÓN DE RADARES
========================================================= */

function generateSensorNetwork() {
  NEXUS_MAP.sensors.radars = [];

  for (const country of NEXUS.state.countries || []) {
    const cities = (NEXUS_MAP.cities.features || [])
      .filter(city => city.iso === country.iso)
      .sort((a, b) => (b.population || 0) - (a.population || 0));

    const radarCount = clamp(
      Math.round((country.cyber || 0) / 700 + (country.military || 0) / 90000),
      1,
      8
    );

    for (let i = 0; i < Math.min(radarCount, cities.length); i++) {
      const city = cities[i];

      NEXUS_MAP.sensors.radars.push({
        id: crypto.randomUUID(),
        iso: country.iso,
        country: country.name,
        name: `${city.name} Radar ${i + 1}`,
        type: i === 0 ? "strategic" : randomChoice(["air", "coastal", "mobile"]),
        x: city.x + randomBetween(-0.25, 0.25),
        y: city.y + randomBetween(-0.18, 0.18),
        range: getRadarRange(i === 0 ? "strategic" : "air"),
        power: randomBetween(60, 100),
        damaged: false,
        jammed: 0
      });
    }
  }

  NEXUS_MAP.sensors.loaded = true;
}

function getRadarRange(type) {
  return {
    strategic: 18,
    air: 11,
    coastal: 13,
    mobile: 7,
    naval: 10,
    awacs: 16,
    satellite: 35
  }[type] || 8;
}

/* =========================================================
   RENDER DE SENSORES
========================================================= */

function renderSensorLayer() {
  if (!NEXUS_MAP.layers.sensors) return;
  if (!NEXUS_MAP.sensors.loaded) return;
  if (NEXUS_MAP.camera.zoom < 2) return;

  renderRadarCoverage();
  renderRadarSites();
  renderDetectedUnits();
}

function renderRadarCoverage() {
  const ctx = NEXUS_MAP.ctx;
  if (!ctx) return;

  const selectedCountry = getSelectedCountry();

  ctx.save();

  for (const radar of NEXUS_MAP.sensors.radars) {
    if (selectedCountry && radar.iso !== selectedCountry.iso) continue;
    if (radar.damaged) continue;

    const p = geoToScreen(radar.x, radar.y);
    const radius = radar.range * 5 * NEXUS_MAP.camera.zoom;

    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(76, 175, 255, 0.08)";
    ctx.fill();

    ctx.strokeStyle = "rgba(76, 175, 255, 0.24)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

function renderRadarSites() {
  const ctx = NEXUS_MAP.ctx;
  if (!ctx) return;

  ctx.save();
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const radar of NEXUS_MAP.sensors.radars) {
    const p = geoToScreen(radar.x, radar.y);
    if (!pointOnScreen(p, 40)) continue;

    ctx.globalAlpha = radar.damaged ? 0.45 : radar.jammed > 0 ? 0.65 : 1;
    ctx.fillText(getRadarIcon(radar.type), p.x, p.y);

    if (NEXUS_MAP.camera.zoom > 3.4) {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "10px Arial";
      ctx.fillText(radar.name, p.x + 8, p.y + 12);
      ctx.font = "14px Arial";
    }
  }

  ctx.restore();
}

function getRadarIcon(type) {
  return {
    strategic: "📡",
    air: "📶",
    coastal: "🌊",
    mobile: "🚛",
    naval: "🚢",
    awacs: "✈️",
    satellite: "🛰️"
  }[type] || "📡";
}

/* =========================================================
   DETECCIÓN DE UNIDADES
========================================================= */

function updateSensorDetections() {
  NEXUS_MAP.sensors.detectedUnits = [];

  const selectedCountry = getSelectedCountry();
  if (!selectedCountry) return;

  const ownISO = selectedCountry.iso;

  const candidates = [
    ...(NEXUS_MAP.landUnits?.units || []),
    ...(NEXUS_MAP.airUnits?.units || []),
    ...(NEXUS_MAP.navalUnits?.fleets || [])
  ].filter(unit => unit.iso !== ownISO);

  for (const unit of candidates) {
    if (isUnitDetectedByCountry(unit, ownISO)) {
      NEXUS_MAP.sensors.detectedUnits.push(unit);
    }
  }
}

function isUnitDetectedByCountry(unit, observerISO) {
  const lon = unit.x;
  const lat = unit.y;

  if (isLocationCovered?.(lon, lat, observerISO)) return true;
  if (isDetectedByGroundRadar(lon, lat, observerISO, unit)) return true;
  if (isDetectedByAWACS(lon, lat, observerISO)) return true;
  if (isDetectedByNavalRadar(lon, lat, observerISO)) return true;

  return false;
}

function isDetectedByGroundRadar(lon, lat, observerISO, unit = null) {
  const radars = (NEXUS_MAP.sensors.radars || [])
    .filter(r => r.iso === observerISO && !r.damaged);

  for (const radar of radars) {
    const effectiveRange = radar.range * (1 - clamp((radar.jammed || 0) / 100, 0, 0.8));
    const dist = distanceGeo(lon, lat, radar.x, radar.y);

    if (dist <= effectiveRange) {
      const stealthPenalty = getUnitStealthPenalty(unit);
      if (randomChance(clamp(0.92 - stealthPenalty, 0.2, 0.98))) return true;
    }
  }

  return false;
}

function isDetectedByAWACS(lon, lat, observerISO) {
  const awacs = (NEXUS_MAP.airUnits?.units || [])
    .filter(unit => unit.iso === observerISO && unit.type === "awacs" && unit.hp > 30);

  for (const unit of awacs) {
    if (distanceGeo(lon, lat, unit.x, unit.y) <= getRadarRange("awacs")) {
      return true;
    }
  }

  return false;
}

function isDetectedByNavalRadar(lon, lat, observerISO) {
  const fleets = (NEXUS_MAP.navalUnits?.fleets || [])
    .filter(fleet => fleet.iso === observerISO && fleet.hp > 35);

  for (const fleet of fleets) {
    if (distanceGeo(lon, lat, fleet.x, fleet.y) <= getRadarRange("naval")) {
      return true;
    }
  }

  return false;
}

function getUnitStealthPenalty(unit) {
  if (!unit) return 0;

  if (unit.type === "submarine") return 0.55;
  if (unit.type === "drone") return 0.18;
  if (unit.type === "fighter" || unit.type === "multirole") return 0.12;
  if (unit.type === "airborne") return 0.08;

  if (unit.ships?.submarine > 0 && unit.type === "submarine") return 0.50;

  return 0;
}

/* =========================================================
   RENDER DE UNIDADES DETECTADAS
========================================================= */

function renderDetectedUnits() {
  if (NEXUS_MAP.camera.zoom < 2.4) return;

  const ctx = NEXUS_MAP.ctx;
  if (!ctx) return;

  ctx.save();

  for (const unit of NEXUS_MAP.sensors.detectedUnits || []) {
    const p = geoToScreen(unit.x, unit.y);
    if (!pointOnScreen(p, 40)) continue;

    ctx.beginPath();
    ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 82, 82, 0.88)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "10px Arial";
    ctx.fillStyle = "#FFCDD2";
    ctx.textAlign = "center";
    ctx.fillText("DETECTADO", p.x, p.y - 15);
  }

  ctx.restore();
}

/* =========================================================
   GUERRA ELECTRÓNICA EN MAPA
========================================================= */

function jamRadarAt(lon, lat, radius = 8, strength = 25) {
  for (const radar of NEXUS_MAP.sensors.radars || []) {
    if (distanceGeo(lon, lat, radar.x, radar.y) <= radius) {
      radar.jammed = clamp((radar.jammed || 0) + strength, 0, 100);
    }
  }

  notify?.("📡", "Jamming radar aplicado sobre la zona.", "info");
}

function decayRadarJamming() {
  for (const radar of NEXUS_MAP.sensors.radars || []) {
    radar.jammed = Math.max(0, (radar.jammed || 0) - 0.25);
  }
}

function damageRadarNear(lon, lat, radius = 2.5) {
  const candidates = (NEXUS_MAP.sensors.radars || [])
    .filter(radar => distanceGeo(lon, lat, radar.x, radar.y) <= radius);

  if (!candidates.length) return null;

  const radar = randomChoice(candidates);
  radar.damaged = true;

  addEvent?.("📡", `${radar.country}: radar dañado en ${radar.name}.`);
  return radar;
}

function repairRadar(radarId) {
  const radar = NEXUS_MAP.sensors.radars.find(r => r.id === radarId);
  const country = getSelectedCountry();

  if (!radar || !country) return;

  const cost = 40_000_000;

  if (country.treasury < cost) {
    notify?.("⛔", "Fondos insuficientes para reparar radar.", "error");
    return;
  }

  country.treasury -= cost;
  radar.damaged = false;
  radar.jammed = 0;

  notify?.("📡", `${radar.name} reparado.`, "success");
}

/* =========================================================
   PANEL DE SENSOR
========================================================= */

function openRadarInfo(radar) {
  if (!radar) return;

  NEXUS_MAP.sensors.selected = radar;

  openModal("📡 Radar", `
    <h3>${getRadarIcon(radar.type)} ${radar.name}</h3>

    <table class="info-table">
      <tr><td>País</td><td>${radar.country}</td></tr>
      <tr><td>Tipo</td><td>${radar.type}</td></tr>
      <tr><td>Alcance</td><td>${radar.range.toFixed(1)}</td></tr>
      <tr><td>Potencia</td><td>${radar.power.toFixed(0)}%</td></tr>
      <tr><td>Jamming</td><td>${radar.jammed.toFixed(0)}%</td></tr>
      <tr><td>Estado</td><td>${radar.damaged ? "Dañado" : "Operativo"}</td></tr>
    </table>

    <hr>

    <button onclick="repairRadar('${radar.id}')">🛠️ Reparar</button>
  `);
}

function detectRadarAt(worldX, worldY) {
  let best = null;
  let bestDistance = Infinity;

  for (const radar of NEXUS_MAP.sensors.radars || []) {
    const dx = worldX - radar.x * 5;
    const dy = worldY + radar.y * 5;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d < 10 && d < bestDistance) {
      best = radar;
      bestDistance = d;
    }
  }

  return best;
}

/* =========================================================
   INTEGRACIÓN OVERLAY Y TICK
========================================================= */

NEXUS_MAP.layers.sensors ??= false;

const OLD_RENDER_MAP_SENSORS = window.renderMapOverlays;

function renderMapOverlays() {
  if (typeof OLD_RENDER_MAP_SENSORS === "function") {
    OLD_RENDER_MAP_SENSORS();
  }

  renderSensorLayer();
}

const OLD_SIMULATION_TICK_SENSORS = window.simulationTick;

function simulationTick() {
  if (typeof OLD_SIMULATION_TICK_SENSORS === "function") {
    OLD_SIMULATION_TICK_SENSORS();
  }

  decayRadarJamming();
  updateSensorDetections();
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 14
========================================================= */

window.generateSensorNetwork = generateSensorNetwork;
window.getRadarRange = getRadarRange;

window.renderSensorLayer = renderSensorLayer;
window.renderRadarCoverage = renderRadarCoverage;
window.renderRadarSites = renderRadarSites;
window.getRadarIcon = getRadarIcon;

window.updateSensorDetections = updateSensorDetections;
window.isUnitDetectedByCountry = isUnitDetectedByCountry;
window.isDetectedByGroundRadar = isDetectedByGroundRadar;
window.isDetectedByAWACS = isDetectedByAWACS;
window.isDetectedByNavalRadar = isDetectedByNavalRadar;
window.getUnitStealthPenalty = getUnitStealthPenalty;
window.renderDetectedUnits = renderDetectedUnits;

window.jamRadarAt = jamRadarAt;
window.decayRadarJamming = decayRadarJamming;
window.damageRadarNear = damageRadarNear;
window.repairRadar = repairRadar;

window.openRadarInfo = openRadarInfo;
window.detectRadarAt = detectRadarAt;

window.renderMapOverlays = renderMapOverlays;
window.simulationTick = simulationTick;


/* =========================================================
   MAPS.JS v1
   BLOQUE 15/20
   Misiles: lanzamientos, trayectorias, impactos, interceptación
   visual y efectos sobre mapa.
========================================================= */

NEXUS_MAP.missiles = {
  active: [],
  impacts: [],
  selected: null
};

/* =========================================================
   LANZAMIENTO VISUAL
========================================================= */

function launchMapMissile(attackerISO, targetLon, targetLat, strikeType = "cruise") {
  const country = getCountryByISO(attackerISO);
  if (!country) return null;

  const origin = pickMissileLaunchPoint(country, strikeType);
  if (!origin) return null;

  const missile = {
    id: crypto.randomUUID(),
    attackerISO,
    attackerName: country.name,
    strikeType,
    x: origin.x,
    y: origin.y,
    targetX: targetLon,
    targetY: targetLat,
    progress: 0,
    speed: getMapMissileSpeed(strikeType),
    altitude: getMapMissileAltitude(strikeType),
    intercepted: false,
    completed: false
  };

  NEXUS_MAP.missiles.active.push(missile);

  addEvent?.("🚀", `${country.name}: lanzamiento ${getMissileStrikeName?.(strikeType) || strikeType}.`);

  return missile;
}

function pickMissileLaunchPoint(country, strikeType = "cruise") {
  const cities = (NEXUS_MAP.cities.features || []).filter(c => c.iso === country.iso);

  if (strikeType === "cruise") {
    const naval = (NEXUS_MAP.navalUnits?.fleets || []).find(f => f.iso === country.iso);
    if (naval) return { x: naval.x, y: naval.y };
  }

  const airbase = cities.find(c => c.airport);
  if (airbase) return { x: airbase.x, y: airbase.y };

  const capital = cities.find(c => c.capital) || cities[0];
  if (capital) return { x: capital.x, y: capital.y };

  return { x: country.lon || 0, y: country.lat || 0 };
}

function getMapMissileSpeed(type) {
  return {
    cruise: 0.012,
    ballistic: 0.028,
    hypersonic: 0.045,
    saturation: 0.020
  }[type] || 0.015;
}

function getMapMissileAltitude(type) {
  return {
    cruise: 0.15,
    ballistic: 1.00,
    hypersonic: 0.65,
    saturation: 0.35
  }[type] || 0.25;
}

/* =========================================================
   ACTUALIZACIÓN
========================================================= */

function updateMapMissiles() {
  for (const missile of NEXUS_MAP.missiles.active) {
    if (missile.completed) continue;

    missile.progress += missile.speed;

    const p = getMissileCurrentPosition(missile);

    missile.x = p.x;
    missile.y = p.y;

    if (!missile.intercepted && shouldMapMissileBeIntercepted(missile)) {
      missile.intercepted = true;
      missile.completed = true;

      addMissileImpact(missile.x, missile.y, "intercept");
      addEvent?.("🛡️", `Misil ${missile.strikeType} interceptado en vuelo.`);
      continue;
    }

    if (missile.progress >= 1) {
      missile.completed = true;
      addMissileImpact(missile.targetX, missile.targetY, "impact");
      damageMapAssetsNear(missile.targetX, missile.targetY, missile.strikeType);
    }
  }

  NEXUS_MAP.missiles.active = NEXUS_MAP.missiles.active.filter(m => !m.completed);
  NEXUS_MAP.missiles.impacts = NEXUS_MAP.missiles.impacts.filter(i => i.life > 0);

  for (const impact of NEXUS_MAP.missiles.impacts) {
    impact.life -= 1;
  }
}

function getMissileCurrentPosition(missile) {
  const t = clamp(missile.progress, 0, 1);

  const x = missile.x * (1 - t) + missile.targetX * t;
  const y = missile.y * (1 - t) + missile.targetY * t;

  const arc = Math.sin(t * Math.PI) * missile.altitude;

  return {
    x,
    y: y + arc
  };
}

function shouldMapMissileBeIntercepted(missile) {
  const defender = getCountryAtGeo(missile.targetX, missile.targetY);
  if (!defender) return false;

  const attacker = getCountryByISO(missile.attackerISO);
  if (!attacker) return false;

  const chance = calculateAdvancedMissileInterceptionChance
    ? calculateAdvancedMissileInterceptionChance(attacker, defender, missile.strikeType)
    : 0.22;

  return randomChance(chance * 0.015);
}

/* =========================================================
   IMPACTOS Y DAÑOS EN MAPA
========================================================= */

function addMissileImpact(lon, lat, type = "impact") {
  NEXUS_MAP.missiles.impacts.push({
    id: crypto.randomUUID(),
    x: lon,
    y: lat,
    type,
    life: type === "impact" ? 90 : 45,
    radius: type === "impact" ? 1.2 : 0.6
  });
}

function damageMapAssetsNear(lon, lat, strikeType = "cruise") {
  const radius = {
    cruise: 0.8,
    ballistic: 1.2,
    hypersonic: 1.0,
    saturation: 1.8
  }[strikeType] || 0.8;

  for (const facility of NEXUS_MAP.industry?.facilities || []) {
    if (distanceGeo(lon, lat, facility.x, facility.y) <= radius) {
      facility.damaged = true;
      facility.output *= 0.85;
    }
  }

  for (const plant of NEXUS_MAP.energy?.plants || []) {
    const p = plant.geometry?.coordinates;
    if (p && distanceGeo(lon, lat, p[0], p[1]) <= radius) {
      plant.properties.capacityMW *= 0.88;
    }
  }

  damageRadarNear?.(lon, lat, radius);

  addEvent?.("💥", `Impacto de misil causa daños en infraestructura estratégica.`);
}

function getCountryAtGeo(lon, lat) {
  for (const feature of NEXUS_MAP.world?.countries || []) {
    if (!pointInsideFeature?.(lon, lat, feature)) continue;

    const iso =
      feature.properties.ISO_A3 ||
      feature.properties.iso_a3 ||
      feature.properties.ADM0_A3;

    return getCountryByISO(iso);
  }

  return null;
}

/* =========================================================
   RENDER
========================================================= */

function renderMissilesLayer() {
  if (!NEXUS_MAP.layers.missiles) return;

  renderActiveMissiles();
  renderMissileImpacts();
}

function renderActiveMissiles() {
  const ctx = NEXUS_MAP.ctx;
  if (!ctx) return;

  ctx.save();

  for (const missile of NEXUS_MAP.missiles.active) {
    const p = geoToScreen(missile.x, missile.y);
    const target = geoToScreen(missile.targetX, missile.targetY);

    ctx.strokeStyle = getMissileRenderColor(missile.strikeType);
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(getMapMissileIcon(missile.strikeType), p.x, p.y);
  }

  ctx.restore();
}

function renderMissileImpacts() {
  const ctx = NEXUS_MAP.ctx;
  if (!ctx) return;

  ctx.save();

  for (const impact of NEXUS_MAP.missiles.impacts) {
    const p = geoToScreen(impact.x, impact.y);
    const alpha = clamp(impact.life / 90, 0, 1);
    const radius = impact.radius * 10 * NEXUS_MAP.camera.zoom * (1.2 - alpha);

    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);

    ctx.fillStyle =
      impact.type === "intercept"
        ? `rgba(144,202,249,${0.28 * alpha})`
        : `rgba(255,87,34,${0.34 * alpha})`;

    ctx.fill();

    ctx.strokeStyle =
      impact.type === "intercept"
        ? `rgba(187,222,251,${0.65 * alpha})`
        : `rgba(255,204,188,${0.75 * alpha})`;

    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

function getMissileRenderColor(type) {
  return {
    cruise: "#FFB74D",
    ballistic: "#EF5350",
    hypersonic: "#CE93D8",
    saturation: "#FF7043"
  }[type] || "#FFB74D";
}

function getMapMissileIcon(type) {
  return {
    cruise: "🚀",
    ballistic: "☄️",
    hypersonic: "⚡",
    saturation: "💥"
  }[type] || "🚀";
}

/* =========================================================
   INTEGRACIÓN CON ATAQUE REAL
========================================================= */

const OLD_LAUNCH_MISSILE_STRIKE_MAP = window.launchMissileStrike;

function launchMissileStrike(targetCountryName, strikeType = "cruise", targetRegionId = null) {
  const attacker = getSelectedCountry();
  const target = getCountryByName(NEXUS.state.countries, targetCountryName);

  if (attacker && target) {
    const region = targetRegionId
      ? target.regions?.find(r => r.id === targetRegionId)
      : pickStrategicRegion?.(target, "capital");

    const lon = region?.lon || target.lon || 0;
    const lat = region?.lat || target.lat || 0;

    launchMapMissile(attacker.iso, lon, lat, strikeType);
  }

  if (typeof OLD_LAUNCH_MISSILE_STRIKE_MAP === "function") {
    OLD_LAUNCH_MISSILE_STRIKE_MAP(targetCountryName, strikeType, targetRegionId);
  }
}

/* =========================================================
   OVERLAY Y TICK
========================================================= */

NEXUS_MAP.layers.missiles ??= true;

const OLD_RENDER_MAP_MISSILES = window.renderMapOverlays;

function renderMapOverlays() {
  if (typeof OLD_RENDER_MAP_MISSILES === "function") {
    OLD_RENDER_MAP_MISSILES();
  }

  renderMissilesLayer();
}

const OLD_SIMULATION_TICK_MISSILES = window.simulationTick;

function simulationTick() {
  if (typeof OLD_SIMULATION_TICK_MISSILES === "function") {
    OLD_SIMULATION_TICK_MISSILES();
  }

  updateMapMissiles();
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 15
========================================================= */

window.launchMapMissile = launchMapMissile;
window.pickMissileLaunchPoint = pickMissileLaunchPoint;
window.getMapMissileSpeed = getMapMissileSpeed;
window.getMapMissileAltitude = getMapMissileAltitude;

window.updateMapMissiles = updateMapMissiles;
window.getMissileCurrentPosition = getMissileCurrentPosition;
window.shouldMapMissileBeIntercepted = shouldMapMissileBeIntercepted;

window.addMissileImpact = addMissileImpact;
window.damageMapAssetsNear = damageMapAssetsNear;
window.getCountryAtGeo = getCountryAtGeo;

window.renderMissilesLayer = renderMissilesLayer;
window.renderActiveMissiles = renderActiveMissiles;
window.renderMissileImpacts = renderMissileImpacts;
window.getMissileRenderColor = getMissileRenderColor;
window.getMapMissileIcon = getMapMissileIcon;

window.launchMissileStrike = launchMissileStrike;
window.renderMapOverlays = renderMapOverlays;
window.simulationTick = simulationTick;


/* =========================================================
   MAPS.JS v1
   BLOQUE 16/20
   Frentes, ocupación y control territorial
========================================================= */

NEXUS_MAP.war = {

    fronts:[],

    occupations:[],

    battles:[]

};

/* ========================================================= */

function updateMapWar(){

    updateFrontLines();

    updateBattles();

    updateOccupations();

}

/* ========================================================= */

function updateFrontLines(){

    NEXUS_MAP.war.fronts=[];

    const wars=
        NEXUS.state.wars||[];

    wars.forEach(war=>{

        war.fronts?.forEach(front=>{

            NEXUS_MAP.war.fronts.push({

                attacker:
                    war.attacker,

                defender:
                    war.defender,

                x1:front.x1,

                y1:front.y1,

                x2:front.x2,

                y2:front.y2,

                intensity:
                    front.intensity||50

            });

        });

    });

}

/* ========================================================= */

function updateBattles(){

    NEXUS_MAP.war.battles.forEach(b=>{

        b.life--;

    });

    NEXUS_MAP.war.battles=

        NEXUS_MAP.war.battles.filter(

            b=>b.life>0

        );

}

/* ========================================================= */

function createBattleEffect(

    lon,

    lat,

    intensity=1

){

    NEXUS_MAP.war.battles.push({

        x:lon,

        y:lat,

        radius:0.5+intensity,

        life:90,

        intensity

    });

}

/* ========================================================= */

function updateOccupations(){

    const wars=
        NEXUS.state.wars||[];

    wars.forEach(war=>{

        const attacker=

            getCountryByName(

                NEXUS.state.countries,

                war.attacker

            );

        const defender=

            getCountryByName(

                NEXUS.state.countries,

                war.defender

            );

        if(

            !attacker ||

            !defender

        )

            return;

        defender.regions?.forEach(region=>{

            const nearby=

                getFriendlyPowerNear(

                    attacker.iso,

                    region.lon,

                    region.lat

                );

            const enemy=

                getFriendlyPowerNear(

                    defender.iso,

                    region.lon,

                    region.lat

                );

            if(

                nearby>

                enemy*1.6

            ){

                region.occupiedBy=

                    attacker.iso;

            }

        });

    });

}

/* ========================================================= */

function getFriendlyPowerNear(

    iso,

    lon,

    lat

){

    let power=0;

    NEXUS_MAP.landUnits.units.forEach(unit=>{

        if(unit.iso!==iso)
            return;

        const d=

            distanceGeo(

                lon,

                lat,

                unit.x,

                unit.y

            );

        if(d<2){

            power+=

                unit.soldiers*

                unit.hp/100*

                unit.readiness/100;

        }

    });

    return power;

}

/* ========================================================= */

function renderWarLayer(){

    renderFrontLines();

    renderOccupiedRegions();

    renderBattles();

}

/* ========================================================= */

function renderFrontLines(){

    const ctx=

        NEXUS_MAP.ctx;

    ctx.save();

    ctx.strokeStyle="#ff0000";

    ctx.lineWidth=3;

    ctx.setLineDash([10,8]);

    NEXUS_MAP.war.fronts.forEach(front=>{

        const a=

            geoToScreen(

                front.x1,

                front.y1

            );

        const b=

            geoToScreen(

                front.x2,

                front.y2

            );

        ctx.beginPath();

        ctx.moveTo(a.x,a.y);

        ctx.lineTo(b.x,b.y);

        ctx.stroke();

    });

    ctx.restore();

}

/* ========================================================= */

function renderOccupiedRegions(){

    if(

        !NEXUS_MAP.regions.loaded

    )

        return;

    const ctx=

        NEXUS_MAP.ctx;

    ctx.save();

    NEXUS_MAP.regions.features.forEach(feature=>{

        const region=

            matchFeatureToGameRegion(

                feature

            );

        if(

            !region ||

            !region.occupiedBy

        )

            return;

        drawRegionPolygon(

            ctx,

            feature,

            "rgba(255,0,0,0.30)"

        );

    });

    ctx.restore();

}

/* ========================================================= */

function renderBattles(){

    const ctx=

        NEXUS_MAP.ctx;

    ctx.save();

    NEXUS_MAP.war.battles.forEach(b=>{

        const p=

            geoToScreen(

                b.x,

                b.y

            );

        const alpha=

            b.life/90;

        ctx.beginPath();

        ctx.arc(

            p.x,

            p.y,

            b.radius*

            15*

            alpha,

            0,

            Math.PI*2

        );

        ctx.fillStyle=

            `rgba(255,80,0,${0.4*alpha})`;

        ctx.fill();

    });

    ctx.restore();

}

/* ========================================================= */

const OLD_RENDER_MAP_16=

window.renderMapOverlays;

window.renderMapOverlays=function(){

    if(

        typeof OLD_RENDER_MAP_16==="function"

    )

        OLD_RENDER_MAP_16();

    renderWarLayer();

};

const OLD_SIMULATION_16=

window.simulationTick;

window.simulationTick=function(){

    if(

        typeof OLD_SIMULATION_16==="function"

    )

        OLD_SIMULATION_16();

    updateMapWar();

};

/* =========================================================
   EXPORT
========================================================= */

window.updateMapWar=
updateMapWar;

window.renderWarLayer=
renderWarLayer;

window.createBattleEffect=
createBattleEffect;


/* =========================================================
   MAPS.JS v1
   BLOQUE 17/20
   Animaciones: explosiones, humo, fuego, estelas, pulsos,
   movimiento visual y efectos de combate.
========================================================= */

NEXUS_MAP.animations = {
  particles: [],
  trails: [],
  pulses: [],
  maxParticles: 700,
  maxTrails: 220,
  maxPulses: 120
};

/* =========================================================
   ACTUALIZACIÓN
========================================================= */

function updateMapAnimations() {
  updateParticles();
  updateTrails();
  updatePulses();
  pruneMapAnimations();
}

function updateParticles() {
  for (const p of NEXUS_MAP.animations.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    p.size *= p.growth || 1;
  }

  NEXUS_MAP.animations.particles =
    NEXUS_MAP.animations.particles.filter(p => p.life > 0);
}

function updateTrails() {
  for (const trail of NEXUS_MAP.animations.trails) {
    trail.life -= trail.decay;
  }

  NEXUS_MAP.animations.trails =
    NEXUS_MAP.animations.trails.filter(t => t.life > 0);
}

function updatePulses() {
  for (const pulse of NEXUS_MAP.animations.pulses) {
    pulse.radius += pulse.speed;
    pulse.life -= pulse.decay;
  }

  NEXUS_MAP.animations.pulses =
    NEXUS_MAP.animations.pulses.filter(p => p.life > 0);
}

function pruneMapAnimations() {
  NEXUS_MAP.animations.particles =
    NEXUS_MAP.animations.particles.slice(-NEXUS_MAP.animations.maxParticles);

  NEXUS_MAP.animations.trails =
    NEXUS_MAP.animations.trails.slice(-NEXUS_MAP.animations.maxTrails);

  NEXUS_MAP.animations.pulses =
    NEXUS_MAP.animations.pulses.slice(-NEXUS_MAP.animations.maxPulses);
}

/* =========================================================
   CREACIÓN DE EFECTOS
========================================================= */

function createExplosion(lon, lat, intensity = 1) {
  const count = Math.round(18 * intensity);

  for (let i = 0; i < count; i++) {
    const angle = randomBetween(0, Math.PI * 2);
    const speed = randomBetween(0.01, 0.045) * intensity;

    NEXUS_MAP.animations.particles.push({
      x: lon,
      y: lat,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: randomBetween(2, 6) * intensity,
      life: randomBetween(0.45, 1),
      decay: randomBetween(0.012, 0.025),
      growth: 0.985,
      color: randomChoice(["#FF7043", "#FFB74D", "#FFF176", "#D84315"])
    });
  }

  createPulse(lon, lat, 0.4 * intensity, "#FF7043", 0.035 * intensity);
  createSmoke(lon, lat, intensity * 0.7);
}

function createSmoke(lon, lat, intensity = 1) {
  const count = Math.round(12 * intensity);

  for (let i = 0; i < count; i++) {
    NEXUS_MAP.animations.particles.push({
      x: lon + randomBetween(-0.08, 0.08),
      y: lat + randomBetween(-0.05, 0.05),
      vx: randomBetween(-0.005, 0.005),
      vy: randomBetween(-0.009, -0.002),
      size: randomBetween(4, 11) * intensity,
      life: randomBetween(0.55, 1.2),
      decay: randomBetween(0.006, 0.014),
      growth: 1.012,
      color: "rgba(160,160,160,0.75)"
    });
  }
}

function createFire(lon, lat, intensity = 1) {
  const count = Math.round(8 * intensity);

  for (let i = 0; i < count; i++) {
    NEXUS_MAP.animations.particles.push({
      x: lon + randomBetween(-0.05, 0.05),
      y: lat + randomBetween(-0.04, 0.04),
      vx: randomBetween(-0.003, 0.003),
      vy: randomBetween(-0.012, -0.004),
      size: randomBetween(2, 5) * intensity,
      life: randomBetween(0.4, 0.85),
      decay: randomBetween(0.012, 0.024),
      growth: 0.99,
      color: randomChoice(["#FF5722", "#FF9800", "#FFC107"])
    });
  }
}

function createPulse(lon, lat, radius = 1, color = "#90CAF9", speed = 0.03) {
  NEXUS_MAP.animations.pulses.push({
    x: lon,
    y: lat,
    radius,
    color,
    speed,
    life: 1,
    decay: 0.018
  });
}

function createTrail(fromLon, fromLat, toLon, toLat, color = "#FFB74D") {
  NEXUS_MAP.animations.trails.push({
    x1: fromLon,
    y1: fromLat,
    x2: toLon,
    y2: toLat,
    color,
    life: 1,
    decay: 0.018
  });
}

/* =========================================================
   RENDER
========================================================= */

function renderMapAnimations() {
  renderTrails();
  renderPulses();
  renderParticles();
}

function renderParticles() {
  const ctx = NEXUS_MAP.ctx;
  if (!ctx) return;

  ctx.save();

  for (const p of NEXUS_MAP.animations.particles) {
    const screen = geoToScreen(p.x, p.y);
    if (!pointOnScreen(screen, 80)) continue;

    ctx.globalAlpha = clamp(p.life, 0, 1);
    ctx.fillStyle = p.color;

    ctx.beginPath();
    ctx.arc(
      screen.x,
      screen.y,
      Math.max(1, p.size * NEXUS_MAP.camera.zoom * 0.25),
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.restore();
}

function renderTrails() {
  const ctx = NEXUS_MAP.ctx;
  if (!ctx) return;

  ctx.save();

  for (const trail of NEXUS_MAP.animations.trails) {
    const a = geoToScreen(trail.x1, trail.y1);
    const b = geoToScreen(trail.x2, trail.y2);

    ctx.globalAlpha = clamp(trail.life, 0, 1) * 0.65;
    ctx.strokeStyle = trail.color;
    ctx.lineWidth = Math.max(1, 2.2 / NEXUS_MAP.camera.zoom);

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  ctx.restore();
}

function renderPulses() {
  const ctx = NEXUS_MAP.ctx;
  if (!ctx) return;

  ctx.save();

  for (const pulse of NEXUS_MAP.animations.pulses) {
    const p = geoToScreen(pulse.x, pulse.y);

    ctx.globalAlpha = clamp(pulse.life, 0, 1) * 0.55;
    ctx.strokeStyle = pulse.color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(
      p.x,
      p.y,
      pulse.radius * 10 * NEXUS_MAP.camera.zoom,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  ctx.restore();
}

/* =========================================================
   INTEGRACIÓN CON EFECTOS EXISTENTES
========================================================= */

const OLD_ADD_MISSILE_IMPACT_ANIM = window.addMissileImpact;

function addMissileImpact(lon, lat, type = "impact") {
  if (typeof OLD_ADD_MISSILE_IMPACT_ANIM === "function") {
    OLD_ADD_MISSILE_IMPACT_ANIM(lon, lat, type);
  }

  if (type === "impact") {
    createExplosion(lon, lat, 1.4);
    createFire(lon, lat, 1.0);
  } else {
    createPulse(lon, lat, 0.7, "#90CAF9", 0.04);
  }
}

const OLD_CREATE_BATTLE_EFFECT_ANIM = window.createBattleEffect;

function createBattleEffect(lon, lat, intensity = 1) {
  if (typeof OLD_CREATE_BATTLE_EFFECT_ANIM === "function") {
    OLD_CREATE_BATTLE_EFFECT_ANIM(lon, lat, intensity);
  }

  createExplosion(lon, lat, intensity);
  createSmoke(lon, lat, intensity);
}

/* =========================================================
   OVERLAY Y TICK
========================================================= */

const OLD_RENDER_MAP_ANIMATIONS = window.renderMapOverlays;

function renderMapOverlays() {
  if (typeof OLD_RENDER_MAP_ANIMATIONS === "function") {
    OLD_RENDER_MAP_ANIMATIONS();
  }

  renderMapAnimations();
}

const OLD_SIMULATION_TICK_ANIMATIONS = window.simulationTick;

function simulationTick() {
  if (typeof OLD_SIMULATION_TICK_ANIMATIONS === "function") {
    OLD_SIMULATION_TICK_ANIMATIONS();
  }

  updateMapAnimations();
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 17
========================================================= */

window.updateMapAnimations = updateMapAnimations;
window.updateParticles = updateParticles;
window.updateTrails = updateTrails;
window.updatePulses = updatePulses;
window.pruneMapAnimations = pruneMapAnimations;

window.createExplosion = createExplosion;
window.createSmoke = createSmoke;
window.createFire = createFire;
window.createPulse = createPulse;
window.createTrail = createTrail;

window.renderMapAnimations = renderMapAnimations;
window.renderParticles = renderParticles;
window.renderTrails = renderTrails;
window.renderPulses = renderPulses;

window.addMissileImpact = addMissileImpact;
window.createBattleEffect = createBattleEffect;

window.renderMapOverlays = renderMapOverlays;
window.simulationTick = simulationTick;

/* =========================================================
   MAPS.JS v1
   BLOQUE 18/20
   Optimización y Render Inteligente
========================================================= */

NEXUS_MAP.performance = {

    lod: "high",

    autoLOD: true,

    spatialIndex: new Map(),

    cellSize: 5,

    frameTime: 16,

    maxRenderedUnits: 2500,

    visibleEntities: []

};

/* =========================================================
   ACTUALIZACIÓN
========================================================= */

function updatePerformanceSystem(){

    updateLOD();

    rebuildSpatialIndex();

}

/* =========================================================
   LOD
========================================================= */

function updateLOD(){

    if(!NEXUS_MAP.performance.autoLOD)
        return;

    const zoom=
        NEXUS_MAP.camera.zoom;

    if(zoom<1){

        NEXUS_MAP.performance.lod="continent";

    }else if(zoom<2){

        NEXUS_MAP.performance.lod="country";

    }else if(zoom<3){

        NEXUS_MAP.performance.lod="region";

    }else{

        NEXUS_MAP.performance.lod="city";

    }

}

/* =========================================================
   SPATIAL INDEX
========================================================= */

function rebuildSpatialIndex(){

    const grid=
        new Map();

    const size=
        NEXUS_MAP.performance.cellSize;

    const add=(entity)=>{

        const cx=
            Math.floor(entity.x/size);

        const cy=
            Math.floor(entity.y/size);

        const key=
            cx+"_"+cy;

        if(!grid.has(key))
            grid.set(key,[]);

        grid.get(key).push(entity);

    };

    [

        ...(NEXUS_MAP.landUnits?.units||[]),

        ...(NEXUS_MAP.airUnits?.units||[]),

        ...(NEXUS_MAP.navalUnits?.fleets||[]),

        ...(NEXUS_MAP.resources?.deposits||[]),

        ...(NEXUS_MAP.industry?.facilities||[])

    ].forEach(add);

    NEXUS_MAP.performance.spatialIndex=
        grid;

}

/* ========================================================= */

function getEntitiesNear(

    lon,

    lat,

    radius=5

){

    const size=
        NEXUS_MAP.performance.cellSize;

    const result=[];

    const minX=
        Math.floor((lon-radius)/size);

    const maxX=
        Math.floor((lon+radius)/size);

    const minY=
        Math.floor((lat-radius)/size);

    const maxY=
        Math.floor((lat+radius)/size);

    for(let x=minX;x<=maxX;x++){

        for(let y=minY;y<=maxY;y++){

            const key=x+"_"+y;

            if(
                !NEXUS_MAP.performance.spatialIndex.has(key)
            )
                continue;

            result.push(

                ...NEXUS_MAP.performance.spatialIndex.get(key)

            );

        }

    }

    return result;

}

/* =========================================================
   CULLING
========================================================= */

function isVisibleOnScreen(entity){

    const p=
        geoToScreen(
            entity.x,
            entity.y
        );

    return pointOnScreen(
        p,
        100
    );

}

/* ========================================================= */

function renderOptimizedCollection(

    collection,

    renderer

){

    let rendered=0;

    const max=
        NEXUS_MAP.performance.maxRenderedUnits;

    for(const entity of collection){

        if(rendered>=max)
            break;

        if(
            !isVisibleOnScreen(entity)
        )
            continue;

        renderer(entity);

        rendered++;

    }

}

/* =========================================================
   AGRUPACIÓN AUTOMÁTICA
========================================================= */

function clusterUnits(units){

    if(

        NEXUS_MAP.performance.lod==="city"

    )

        return units;

    const clusters=[];

    const used=new Set();

    for(let i=0;i<units.length;i++){

        if(used.has(i))
            continue;

        const base=
            units[i];

        const cluster={

            x:base.x,

            y:base.y,

            units:[base],

            soldiers:

                base.soldiers||0

        };

        used.add(i);

        for(let j=i+1;j<units.length;j++){

            if(used.has(j))
                continue;

            const other=
                units[j];

            if(

                distanceGeo(

                    base.x,

                    base.y,

                    other.x,

                    other.y

                )<0.5

            ){

                cluster.units.push(other);

                cluster.soldiers+=
                    other.soldiers||0;

                used.add(j);

            }

        }

        clusters.push(cluster);

    }

    return clusters;

}

/* ========================================================= */

function renderClusters(clusters){

    const ctx=
        NEXUS_MAP.ctx;

    ctx.save();

    clusters.forEach(c=>{

        if(c.units.length===1)
            return;

        const p=
            geoToScreen(
                c.x,
                c.y
            );

        ctx.beginPath();

        ctx.arc(

            p.x,

            p.y,

            10,

            0,

            Math.PI*2

        );

        ctx.fillStyle=
            "rgba(33,150,243,0.75)";

        ctx.fill();

        ctx.fillStyle="white";

        ctx.textAlign="center";

        ctx.textBaseline="middle";

        ctx.font="11px Arial";

        ctx.fillText(

            c.units.length,

            p.x,

            p.y

        );

    });

    ctx.restore();

}

/* =========================================================
   FPS
========================================================= */

let __frameStart=performance.now();

function beginFrame(){

    __frameStart=
        performance.now();

}

function endFrame(){

    NEXUS_MAP.performance.frameTime=

        performance.now()-__frameStart;

}

/* =========================================================
   OVERLAY
========================================================= */

const OLD_RENDER_MAP_18=
window.renderMapOverlays;

window.renderMapOverlays=function(){

    beginFrame();

    if(
        typeof OLD_RENDER_MAP_18==="function"
    )
        OLD_RENDER_MAP_18();

    endFrame();

};

const OLD_SIMULATION_18=
window.simulationTick;

window.simulationTick=function(){

    if(
        typeof OLD_SIMULATION_18==="function"
    )
        OLD_SIMULATION_18();

    updatePerformanceSystem();

};

/* =========================================================
   EXPORT
========================================================= */

window.updatePerformanceSystem=
updatePerformanceSystem;

window.rebuildSpatialIndex=
rebuildSpatialIndex;

window.getEntitiesNear=
getEntitiesNear;

window.renderOptimizedCollection=
renderOptimizedCollection;

window.clusterUnits=
clusterUnits;

window.renderClusters=
renderClusters;

window.beginFrame=
beginFrame;

window.endFrame=
endFrame;



/* =========================================================
   MAPS.JS v1
   BLOQUE 19/20
   Debug y editor ligero de mapa.
========================================================= */

NEXUS_MAP.editor = {
  enabled: false,
  tool: "inspect",
  snapToCity: true,
  lastClick: null
};

/* =========================================================
   PANEL DEBUG
========================================================= */

function toggleMapEditor() {
  NEXUS_MAP.editor.enabled = !NEXUS_MAP.editor.enabled;

  notify?.(
    "🧭",
    `Editor de mapa: ${NEXUS_MAP.editor.enabled ? "ON" : "OFF"}`,
    "info"
  );

  renderMapEditorPanel();
}

function renderMapEditorPanel() {
  const panel = document.getElementById("mapEditorPanel");
  if (!panel) return;

  panel.innerHTML = `
    <div class="panel-header">
      <h2>🧭 Editor de mapa</h2>
      <button onclick="toggleMapEditor()">ON/OFF</button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card"><span>LOD</span><b>${NEXUS_MAP.performance?.lod || "-"}</b></div>
      <div class="kpi-card"><span>Frame</span><b>${Number(NEXUS_MAP.performance?.frameTime || 0).toFixed(1)} ms</b></div>
      <div class="kpi-card"><span>Zoom</span><b>${NEXUS_MAP.camera.zoom.toFixed(2)}</b></div>
      <div class="kpi-card"><span>Entidades</span><b>${getMapEntityCount()}</b></div>
    </div>

    <h3>🛠️ Herramienta</h3>
    <select onchange="setMapEditorTool(this.value)">
      ${["inspect","city","resource","industry","radar","land","air","naval","explosion"]
        .map(t => `<option value="${t}" ${NEXUS_MAP.editor.tool === t ? "selected" : ""}>${t}</option>`)
        .join("")}
    </select>

    <h3>🧩 Capas</h3>
    <div class="actions-grid">
      ${Object.keys(NEXUS_MAP.layers).map(layer => `
        <button onclick="toggleMapLayer('${layer}'); renderMapEditorPanel();">
          ${NEXUS_MAP.layers[layer] ? "✅" : "⬜"} ${layer}
        </button>
      `).join("")}
    </div>

    <h3>📍 Último clic</h3>
    <pre>${JSON.stringify(NEXUS_MAP.editor.lastClick, null, 2)}</pre>
  `;
}

function setMapEditorTool(tool) {
  NEXUS_MAP.editor.tool = tool;
  notify?.("🛠️", `Herramienta seleccionada: ${tool}`, "info");
}

function getMapEntityCount() {
  return (
    (NEXUS_MAP.cities?.features?.length || 0) +
    (NEXUS_MAP.resources?.deposits?.length || 0) +
    (NEXUS_MAP.industry?.facilities?.length || 0) +
    (NEXUS_MAP.landUnits?.units?.length || 0) +
    (NEXUS_MAP.airUnits?.units?.length || 0) +
    (NEXUS_MAP.navalUnits?.fleets?.length || 0) +
    (NEXUS_MAP.sensors?.radars?.length || 0) +
    (NEXUS_MAP.space?.satellites?.length || 0)
  );
}

/* =========================================================
   CLICK EDITOR
========================================================= */

const OLD_ON_MAP_CLICK_EDITOR = window.onMapClick;

function onMapClick(event) {
  if (!NEXUS_MAP.editor.enabled) {
    if (typeof OLD_ON_MAP_CLICK_EDITOR === "function") {
      OLD_ON_MAP_CLICK_EDITOR(event);
    }
    return;
  }

  const world = screenToWorld(event.offsetX, event.offsetY);
  const lon = world.x / 5;
  const lat = -world.y / 5;

  NEXUS_MAP.editor.lastClick = {
    lon: Number(lon.toFixed(4)),
    lat: Number(lat.toFixed(4)),
    tool: NEXUS_MAP.editor.tool
  };

  executeMapEditorTool(lon, lat);
  renderMapEditorPanel();
  renderAll?.();
}

function executeMapEditorTool(lon, lat) {
  const tool = NEXUS_MAP.editor.tool;

  if (tool === "inspect") {
    inspectMapPosition(lon, lat);
  }

  if (tool === "city") {
    editorCreateCity(lon, lat);
  }

  if (tool === "resource") {
    editorCreateResource(lon, lat);
  }

  if (tool === "industry") {
    editorCreateIndustry(lon, lat);
  }

  if (tool === "radar") {
    editorCreateRadar(lon, lat);
  }

  if (tool === "land") {
    editorCreateLandUnit(lon, lat);
  }

  if (tool === "air") {
    editorCreateAirUnit(lon, lat);
  }

  if (tool === "naval") {
    editorCreateNavalFleet(lon, lat);
  }

  if (tool === "explosion") {
    createExplosion(lon, lat, 1.2);
  }
}

/* =========================================================
   INSPECCIÓN
========================================================= */

function inspectMapPosition(lon, lat) {
  const country = getCountryAtGeo?.(lon, lat);
  const infra = getInfrastructureNear?.(lon, lat, 1.5);
  const energy = getEnergyAssetsNear?.(lon, lat, 1.5);
  const entities = getEntitiesNear?.(lon, lat, 2) || [];

  openModal("🔎 Inspección mapa", `
    <h3>Posición</h3>
    <table class="info-table">
      <tr><td>Lon</td><td>${lon.toFixed(4)}</td></tr>
      <tr><td>Lat</td><td>${lat.toFixed(4)}</td></tr>
      <tr><td>País</td><td>${country?.name || "—"}</td></tr>
      <tr><td>Entidades próximas</td><td>${entities.length}</td></tr>
      <tr><td>Carreteras</td><td>${infra?.roads || 0}</td></tr>
      <tr><td>Ferrocarril</td><td>${infra?.rail || 0}</td></tr>
      <tr><td>Puertos</td><td>${infra?.ports || 0}</td></tr>
      <tr><td>Aeropuertos</td><td>${infra?.airports || 0}</td></tr>
      <tr><td>Capacidad energía cercana</td><td>${formatNumber(energy?.totalCapacityMW || 0)} MW</td></tr>
    </table>
  `);
}

/* =========================================================
   CREACIÓN RÁPIDA
========================================================= */

function editorCreateCity(lon, lat) {
  const country = getCountryAtGeo?.(lon, lat) || getSelectedCountry();
  const name = prompt("Nombre de ciudad:", "Nueva Ciudad");
  if (!name || !country) return;

  NEXUS_MAP.cities.features.push({
    id: crypto.randomUUID(),
    name,
    iso: country.iso,
    population: 250000,
    x: lon,
    y: lat,
    capital: false,
    airport: false,
    port: false,
    military: false,
    industry: 250000000
  });

  notify?.("🏙️", `Ciudad creada: ${name}`, "success");
}

function editorCreateResource(lon, lat) {
  const country = getCountryAtGeo?.(lon, lat) || getSelectedCountry();
  if (!country) return;

  const type = prompt("Tipo recurso:", "lithium") || "lithium";

  NEXUS_MAP.resources.deposits.push({
    id: crypto.randomUUID(),
    iso: country.iso,
    type,
    reserve: randomBetween(100, 2500),
    extraction: randomBetween(10, 60),
    discovered: true,
    x: lon,
    y: lat
  });

  notify?.("⛏️", `Recurso creado: ${getResourceName(type)}`, "success");
}

function editorCreateIndustry(lon, lat) {
  const country = getCountryAtGeo?.(lon, lat) || getSelectedCountry();
  if (!country) return;

  const sector = prompt("Sector industrial:", "automotive") || "industry";

  NEXUS_MAP.industry.facilities.push({
    id: crypto.randomUUID(),
    name: `${country.name} ${getIndustrySectorName(sector)} Plant`,
    iso: country.iso,
    sector,
    level: 1,
    output: 120,
    owner: country.name,
    damaged: false,
    x: lon,
    y: lat
  });

  notify?.("🏭", `Industria creada: ${sector}`, "success");
}

function editorCreateRadar(lon, lat) {
  const country = getCountryAtGeo?.(lon, lat) || getSelectedCountry();
  if (!country) return;

  NEXUS_MAP.sensors.radars.push({
    id: crypto.randomUUID(),
    iso: country.iso,
    country: country.name,
    name: `${country.name} Radar`,
    type: "mobile",
    x: lon,
    y: lat,
    range: getRadarRange("mobile"),
    power: 70,
    damaged: false,
    jammed: 0
  });

  notify?.("📡", "Radar creado.", "success");
}

function editorCreateLandUnit(lon, lat) {
  const country = getCountryAtGeo?.(lon, lat) || getSelectedCountry();
  if (!country) return;

  NEXUS_MAP.landUnits.units.push({
    id: crypto.randomUUID(),
    country: country.name,
    iso: country.iso,
    region: null,
    name: `${country.name} Test Division`,
    type: "mechanized",
    soldiers: 8000,
    morale: 80,
    readiness: 80,
    experience: 40,
    hp: 100,
    destination: null,
    moving: false,
    speed: 0.02,
    x: lon,
    y: lat
  });

  notify?.("🪖", "Unidad terrestre creada.", "success");
}

function editorCreateAirUnit(lon, lat) {
  const country = getCountryAtGeo?.(lon, lat) || getSelectedCountry();
  if (!country) return;

  NEXUS_MAP.airUnits.units.push({
    id: crypto.randomUUID(),
    country: country.name,
    iso: country.iso,
    base: null,
    name: `${country.name} Fighter`,
    type: "fighter",
    x: lon,
    y: lat,
    altitude: 0,
    fuel: 100,
    hp: 100,
    readiness: 85,
    mission: "ground",
    destination: null,
    moving: false,
    speed: getAircraftSpeed("fighter")
  });

  notify?.("✈️", "Unidad aérea creada.", "success");
}

function editorCreateNavalFleet(lon, lat) {
  const country = getCountryAtGeo?.(lon, lat) || getSelectedCountry();
  if (!country) return;

  NEXUS_MAP.navalUnits.fleets.push({
    id: crypto.randomUUID(),
    country: country.name,
    iso: country.iso,
    homePort: null,
    name: `${country.name} Task Force`,
    type: "surface_action",
    ships: {
      carrier: 0,
      destroyer: 2,
      frigate: 3,
      submarine: 1,
      amphibious: 0,
      logistics: 1
    },
    mission: "patrol",
    hp: 100,
    fuel: 100,
    readiness: 85,
    destination: null,
    moving: false,
    speed: 0.010,
    x: lon,
    y: lat
  });

  notify?.("🚢", "Flota creada.", "success");
}

/* =========================================================
   EXPORT / IMPORT MAPA
========================================================= */

function exportMapState() {
  const payload = {
    cities: NEXUS_MAP.cities.features,
    resources: NEXUS_MAP.resources.deposits,
    industry: NEXUS_MAP.industry.facilities,
    radars: NEXUS_MAP.sensors.radars,
    landUnits: NEXUS_MAP.landUnits.units,
    airUnits: NEXUS_MAP.airUnits.units,
    navalFleets: NEXUS_MAP.navalUnits.fleets
  };

  navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
  notify?.("📤", "Estado de mapa copiado al portapapeles.", "success");
}

function importMapState(raw) {
  try {
    const data = JSON.parse(raw);

    if (data.cities) NEXUS_MAP.cities.features = data.cities;
    if (data.resources) NEXUS_MAP.resources.deposits = data.resources;
    if (data.industry) NEXUS_MAP.industry.facilities = data.industry;
    if (data.radars) NEXUS_MAP.sensors.radars = data.radars;
    if (data.landUnits) NEXUS_MAP.landUnits.units = data.landUnits;
    if (data.airUnits) NEXUS_MAP.airUnits.units = data.airUnits;
    if (data.navalFleets) NEXUS_MAP.navalUnits.fleets = data.navalFleets;

    rebuildSpatialIndex?.();

    notify?.("📥", "Estado de mapa importado.", "success");
    renderAll?.();

    return true;
  } catch (error) {
    console.error(error);
    notify?.("⛔", "JSON de mapa inválido.", "error");
    return false;
  }
}

/* =========================================================
   EXPORT GLOBAL — BLOQUE 19
========================================================= */

window.toggleMapEditor = toggleMapEditor;
window.renderMapEditorPanel = renderMapEditorPanel;
window.setMapEditorTool = setMapEditorTool;
window.getMapEntityCount = getMapEntityCount;

window.onMapClick = onMapClick;
window.executeMapEditorTool = executeMapEditorTool;
window.inspectMapPosition = inspectMapPosition;

window.editorCreateCity = editorCreateCity;
window.editorCreateResource = editorCreateResource;
window.editorCreateIndustry = editorCreateIndustry;
window.editorCreateRadar = editorCreateRadar;
window.editorCreateLandUnit = editorCreateLandUnit;
window.editorCreateAirUnit = editorCreateAirUnit;
window.editorCreateNavalFleet = editorCreateNavalFleet;

window.exportMapState = exportMapState;
window.importMapState = importMapState;


/* =========================================================
   MAPS.JS v1
   BLOQUE 20/20
   Inicialización global e integración completa
========================================================= */

const MAPS_VERSION = "1.0.0";

/* =========================================================
   REGISTRO DE CAPAS
========================================================= */

function initializeMapLayers() {

    NEXUS_MAP.layers = {

        terrain: true,

        political: true,

        borders: true,

        regions: true,

        cities: true,

        infrastructure: true,

        resources: true,

        industry: true,

        energy: true,

        military: true,

        sensors: true,

        space: true,

        missiles: true,

        weather: true,

        war: true,

        ui: true

    };

}

/* =========================================================
   CARGA COMPLETA
========================================================= */

async function initializeMapSystems() {

    console.log("Inicializando mapa...");

    initializeMapLayers();

    await loadWorldMap?.();

    await loadAdministrativeRegions?.();

    await loadCities?.();

    await loadInfrastructure?.();

    await loadEnergyMapData?.();

    await loadResourceMap?.();

    await loadIndustryMap?.();

    ensureFallbackRegions?.();

    generateLandUnits?.();

    generateAirUnits?.();

    generateNavalUnits?.();

    generateSatellites?.();

    generateSensorNetwork?.();

    rebuildSpatialIndex?.();

    console.log("Mapa inicializado.");

}

/* =========================================================
   TICK GLOBAL
========================================================= */

function updateMapSystems() {

    updatePerformanceSystem?.();

    updateLandUnits?.();

    updateAirUnits?.();

    updateNavalUnits?.();

    updateSatellites?.();

    updateSensorDetections?.();

    updateMapMissiles?.();

    updateMapWar?.();

    updateMapAnimations?.();

}

/* =========================================================
   RENDER GLOBAL
========================================================= */

function renderMapSystems() {

    if(!NEXUS_MAP.ctx)
        return;

    renderTerrain?.();

    renderPoliticalMap?.();

    renderAdministrativeRegions?.();

    renderInfrastructure?.();

    renderEnergyLayer?.();

    renderResources?.();

    renderIndustryLayer?.();

    renderCities?.();

    renderLandUnits?.();

    renderAirUnits?.();

    renderNavalUnits?.();

    renderSensorLayer?.();

    renderSatellites?.();

    renderMissilesLayer?.();

    renderWarLayer?.();

    renderMapAnimations?.();

}

/* =========================================================
   BUCLE
========================================================= */

function mapFrame() {

    updateMapSystems();

    renderMapSystems();

}

/* =========================================================
   INTEGRACIÓN CON SIMULATION.JS
========================================================= */

const OLD_SIMULATION_TICK_MAPS =
window.simulationTick;

window.simulationTick = function () {

    if(typeof OLD_SIMULATION_TICK_MAPS==="function")
        OLD_SIMULATION_TICK_MAPS();

    mapFrame();

};

/* =========================================================
   INTEGRACIÓN CON UI
========================================================= */

function registerMapUI() {

    window.addEventListener(

        "resize",

        ()=>{

            resizeMap?.();

        }

    );

    window.addEventListener(

        "keydown",

        e=>{

            if(e.key==="F2")
                toggleMapEditor?.();

            if(e.key==="F3")
                toggleLayerMenu?.();

        }

    );

}

/* =========================================================
   HOTLOAD
========================================================= */

function reloadMap() {

    rebuildSpatialIndex?.();

    renderAll?.();

}

/* =========================================================
   ESTADÍSTICAS
========================================================= */

function getMapStatistics() {

    return{

        version:MAPS_VERSION,

        countries:

            NEXUS.state.countries?.length||0,

        cities:

            NEXUS_MAP.cities?.features?.length||0,

        industries:

            NEXUS_MAP.industry?.facilities?.length||0,

        resources:

            NEXUS_MAP.resources?.deposits?.length||0,

        landUnits:

            NEXUS_MAP.landUnits?.units?.length||0,

        airUnits:

            NEXUS_MAP.airUnits?.units?.length||0,

        fleets:

            NEXUS_MAP.navalUnits?.fleets?.length||0,

        satellites:

            NEXUS_MAP.space?.satellites?.length||0,

        radars:

            NEXUS_MAP.sensors?.radars?.length||0,

        activeMissiles:

            NEXUS_MAP.missiles?.active?.length||0

    };

}

/* =========================================================
   VALIDACIÓN
========================================================= */

function validateMapIntegrity() {

    const errors=[];

    if(!NEXUS_MAP.world)
        errors.push("World");

    if(!NEXUS_MAP.cities)
        errors.push("Cities");

    if(!NEXUS_MAP.resources)
        errors.push("Resources");

    if(!NEXUS_MAP.industry)
        errors.push("Industry");

    if(!NEXUS_MAP.landUnits)
        errors.push("Land");

    if(!NEXUS_MAP.airUnits)
        errors.push("Air");

    if(!NEXUS_MAP.navalUnits)
        errors.push("Naval");

    if(errors.length){

        console.warn(

            "Mapa incompleto:",

            errors

        );

        return false;

    }

    return true;

}

/* =========================================================
   ARRANQUE
========================================================= */

async function startMapEngine() {

    await initializeMapSystems();

    registerMapUI();

    validateMapIntegrity();

    console.log(

        "================================"

    );

    console.log(

        " Nexus Global Map Engine "

    );

    console.log(

        " Version:",

        MAPS_VERSION

    );

    console.log(

        getMapStatistics()

    );

    console.log(

        "================================"

    );

}

/* =========================================================
   EXPORT
========================================================= */

window.startMapEngine = startMapEngine;

window.initializeMapSystems = initializeMapSystems;

window.initializeMapLayers = initializeMapLayers;

window.updateMapSystems = updateMapSystems;

window.renderMapSystems = renderMapSystems;

window.mapFrame = mapFrame;

window.reloadMap = reloadMap;

window.getMapStatistics = getMapStatistics;

window.validateMapIntegrity = validateMapIntegrity;

/* =========================================================
   AUTO START
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        startMapEngine();

    }

);

