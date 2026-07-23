"use strict";

window.NEXUS_MAP_ENGINE = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const continentPaths = [
    "M72 110 C140 60 250 65 305 125 C326 166 294 208 244 220 C195 234 173 272 118 252 C74 232 45 177 72 110 Z",
    "M255 282 C295 265 348 293 374 342 C390 385 368 471 331 532 C296 567 257 518 268 463 C280 413 228 345 255 282 Z",
    "M515 98 C565 66 650 70 702 108 C731 128 721 173 690 194 C652 216 609 207 580 186 C546 160 497 132 515 98 Z",
    "M520 218 C574 190 640 214 675 274 C698 316 681 403 634 465 C594 500 535 453 540 396 C546 338 486 258 520 218 Z",
    "M681 95 C768 55 969 68 1089 145 C1140 190 1087 257 1018 270 C952 284 921 335 856 311 C791 286 722 278 685 225 C657 187 647 119 681 95 Z",
    "M924 420 C970 392 1046 406 1081 455 C1095 494 1040 532 984 526 C934 520 889 456 924 420 Z",
    "M450 74 C472 58 500 64 507 85 C504 106 471 118 452 101 Z"
  ];

  let svg;
  let worldLayer;
  let regionLayer;
  let unitLayer;
  let tooltip;
  let stateRef;
  let callbacks = {};

  function initialize(state, handlers = {}) {
    stateRef = state;
    callbacks = handlers;
    svg = document.getElementById("strategicMap");
    tooltip = document.getElementById("mapTooltip");
    if (!svg) return;
    render();
  }

  function clear() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }

  function element(tag, attrs = {}) {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
    return el;
  }

  function text(x, y, content, className, anchor = "middle") {
    const el = element("text", { x, y, class: className, "text-anchor": anchor });
    el.textContent = content;
    return el;
  }

  function render() {
    if (!svg || !stateRef) return;
    clear();
    renderDefs();
    renderOcean();
    if (stateRef.mapMode === "regions") renderSpainRegions();
    else renderWorld();
  }

  function renderDefs() {
    const defs = element("defs");
    const ocean = element("linearGradient", { id: "oceanGradient", x1: "0", y1: "0", x2: "1", y2: "1" });
    ocean.appendChild(element("stop", { offset: "0%", "stop-color": "#071829" }));
    ocean.appendChild(element("stop", { offset: "55%", "stop-color": "#0a263a" }));
    ocean.appendChild(element("stop", { offset: "100%", "stop-color": "#06111f" }));
    defs.appendChild(ocean);
    const glow = element("filter", { id: "softGlow", x: "-50%", y: "-50%", width: "200%", height: "200%" });
    glow.appendChild(element("feGaussianBlur", { stdDeviation: "5", result: "blur" }));
    const merge = element("feMerge");
    merge.appendChild(element("feMergeNode", { in: "blur" }));
    merge.appendChild(element("feMergeNode", { in: "SourceGraphic" }));
    glow.appendChild(merge);
    defs.appendChild(glow);
    svg.appendChild(defs);
  }

  function renderOcean() {
    svg.setAttribute("viewBox", stateRef.mapMode === "regions" ? "0 0 900 600" : "0 0 1200 620");
    svg.appendChild(element("rect", { x: 0, y: 0, width: "100%", height: "100%", fill: "url(#oceanGradient)" }));
    const grid = element("g", { class: "map-grid" });
    for (let x = 0; x <= 1200; x += 60) grid.appendChild(element("line", { x1: x, y1: 0, x2: x, y2: 620 }));
    for (let y = 0; y <= 620; y += 60) grid.appendChild(element("line", { x1: 0, y1: y, x2: 1200, y2: y }));
    svg.appendChild(grid);
  }

  function renderWorld() {
    worldLayer = element("g", { class: "world-layer" });
    const land = element("g", { class: "landmass-layer" });
    for (const d of continentPaths) land.appendChild(element("path", { d, class: "continent-shape" }));
    worldLayer.appendChild(land);
    worldLayer.appendChild(text(150, 78, "NORTEAMÉRICA", "continent-label"));
    worldLayer.appendChild(text(320, 555, "SUDAMÉRICA", "continent-label"));
    worldLayer.appendChild(text(605, 68, "EUROPA", "continent-label"));
    worldLayer.appendChild(text(600, 505, "ÁFRICA", "continent-label"));
    worldLayer.appendChild(text(885, 70, "ASIA", "continent-label"));

    for (const country of stateRef.countries) worldLayer.appendChild(createCountryNode(country));
    svg.appendChild(worldLayer);
    renderWorldRoutes();
  }

  function createCountryNode(country) {
    const selected = country.id === stateRef.selectedCountryId;
    const g = element("g", {
      class: `country-node${selected ? " selected" : ""}`,
      transform: `translate(${country.map.x} ${country.map.y})`,
      tabindex: "0",
      role: "button",
      "aria-label": country.name
    });
    const radius = country.map.size;
    const hex = hexPath(radius);
    g.appendChild(element("path", {
      d: hex,
      fill: country.color,
      class: "country-hex",
      "data-country": country.id
    }));
    g.appendChild(text(0, 4, country.flag, "country-flag"));
    g.appendChild(text(0, radius + 18, country.name, "country-name"));
    g.appendChild(text(0, radius + 32, `${country.economy.gdp.toFixed(0)} B€`, "country-gdp"));
    g.addEventListener("click", () => callbacks.selectCountry?.(country.id));
    g.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") callbacks.selectCountry?.(country.id);
    });
    g.addEventListener("mousemove", event => showTooltip(event, `<strong>${country.flag} ${country.name}</strong><span>PIB ${country.economy.gdp.toFixed(0)} mil M€</span><span>Estabilidad ${country.systems.stability.toFixed(0)}%</span><span>Poder militar ${country.systems.military.toFixed(0)}</span>`));
    g.addEventListener("mouseleave", hideTooltip);
    return g;
  }

  function renderWorldRoutes() {
    const routes = [
      ["ESP", "PRT"], ["ESP", "FRA"], ["ESP", "MAR"], ["ESP", "USA"], ["ESP", "DEU"], ["ESP", "ITA"]
    ];
    const lines = element("g", { class: "route-layer" });
    const selected = NEXUS_ECONOMY.getCountry(stateRef);
    for (const [aId, bId] of routes) {
      if (selected.id !== aId && selected.id !== bId) continue;
      const a = stateRef.countries.find(c => c.id === aId);
      const b = stateRef.countries.find(c => c.id === bId);
      if (!a || !b) continue;
      lines.appendChild(element("path", {
        d: `M${a.map.x},${a.map.y} Q${(a.map.x + b.map.x) / 2},${Math.min(a.map.y, b.map.y) - 65} ${b.map.x},${b.map.y}`,
        class: "diplomatic-route"
      }));
    }
    svg.appendChild(lines);
  }

  function renderSpainRegions() {
    regionLayer = element("g", { class: "region-layer" });
    regionLayer.appendChild(text(450, 42, "ADMINISTRACIÓN TERRITORIAL · ESPAÑA", "region-title"));
    regionLayer.appendChild(text(450, 67, "Selecciona una comunidad para invertir, desplegar unidades o revisar su capacidad", "region-subtitle"));

    for (const region of stateRef.regions) {
      const selected = region.id === stateRef.selectedRegionId;
      const g = element("g", { class: `region-node${selected ? " selected" : ""}`, tabindex: "0", role: "button" });
      const polygon = element("polygon", {
        points: region.polygon,
        class: "region-polygon",
        fill: regionColor(region),
        "data-region": region.id
      });
      g.appendChild(polygon);
      const center = polygonCenter(region.polygon);
      g.appendChild(text(center.x, center.y - 4, region.name, "region-name"));
      g.appendChild(text(center.x, center.y + 14, `${region.gdp.toFixed(0)} B€`, "region-value"));
      g.addEventListener("click", () => callbacks.selectRegion?.(region.id));
      g.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") callbacks.selectRegion?.(region.id);
      });
      g.addEventListener("mousemove", event => showTooltip(event, `<strong>${region.name}</strong><span>${region.specialization}</span><span>PIB ${region.gdp.toFixed(0)} mil M€</span><span>Infraestructura ${region.infra.toFixed(0)}</span>`));
      g.addEventListener("mouseleave", hideTooltip);
      regionLayer.appendChild(g);
    }
    svg.appendChild(regionLayer);
    renderUnits();
  }

  function renderUnits() {
    unitLayer = element("g", { class: "unit-map-layer" });
    const country = NEXUS_ECONOMY.getCountry(stateRef);
    const grouped = {};
    for (const unit of country.units) {
      grouped[unit.regionId] ||= [];
      grouped[unit.regionId].push(unit);
    }
    for (const [regionId, units] of Object.entries(grouped)) {
      const region = stateRef.regions.find(r => r.id === regionId);
      if (!region) continue;
      const center = polygonCenter(region.polygon);
      const firstDef = stateRef.unitCatalog.find(def => def.id === units[0].typeId);
      const g = element("g", { class: "unit-marker", transform: `translate(${center.x + 18} ${center.y + 20})` });
      g.appendChild(element("circle", { r: 15, class: "unit-marker-bg" }));
      g.appendChild(text(0, 5, unitGlyph(firstDef?.id), "unit-marker-icon"));
      if (units.length > 1) g.appendChild(text(13, -11, units.length, "unit-count"));
      g.addEventListener("mousemove", event => showTooltip(event, `<strong>${region.name}</strong><span>${units.length} unidades desplegadas</span><span>${units.map(u => stateRef.unitCatalog.find(d => d.id === u.typeId)?.name).join(" · ")}</span>`));
      g.addEventListener("mouseleave", hideTooltip);
      unitLayer.appendChild(g);
    }
    svg.appendChild(unitLayer);
  }

  function unitGlyph(typeId) {
    return { infantry: "◆", mechanized: "▣", armor: "▰", artillery: "✦", fighter: "▲", drone: "◇", frigate: "≈", submarine: "◒", satellite: "✧" }[typeId] || "◆";
  }

  function regionColor(region) {
    const value = (region.infra + region.industry + region.energy + region.stability) / 4;
    if (value >= 88) return "#43d9a3";
    if (value >= 80) return "#59c9c3";
    if (value >= 70) return "#548fd8";
    return "#6f7890";
  }

  function hexPath(radius) {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 3 * i - Math.PI / 6;
      points.push(`${Math.cos(angle) * radius},${Math.sin(angle) * radius}`);
    }
    return `M${points.join(" L")} Z`;
  }

  function polygonCenter(pointsString) {
    const points = pointsString.split(" ").map(pair => pair.split(",").map(Number));
    const sum = points.reduce((acc, [x, y]) => ({ x: acc.x + x, y: acc.y + y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  }

  function showTooltip(event, html) {
    if (!tooltip) return;
    tooltip.innerHTML = html;
    tooltip.hidden = false;
    const container = svg.getBoundingClientRect();
    tooltip.style.left = `${event.clientX - container.left + 16}px`;
    tooltip.style.top = `${event.clientY - container.top + 16}px`;
  }

  function hideTooltip() {
    if (tooltip) tooltip.hidden = true;
  }

  return { initialize, render };
})();
