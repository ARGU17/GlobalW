"use strict";

window.NEXUS_MAP_ENGINE = (() => {
  const NS="http://www.w3.org/2000/svg";
  const continents=[
    "M40 120 C94 62 204 51 299 104 C344 132 337 190 292 220 C252 246 207 242 175 275 C137 306 68 270 47 218 C32 181 20 147 40 120 Z",
    "M260 282 C311 259 371 300 388 358 C402 416 369 493 329 560 C297 590 260 536 266 481 C271 428 224 331 260 282 Z",
    "M490 91 C550 53 642 59 714 103 C747 131 729 183 690 202 C649 222 590 208 550 184 C514 163 461 119 490 91 Z",
    "M504 215 C558 188 640 211 682 274 C712 326 681 423 628 490 C581 522 525 467 529 405 C534 344 468 254 504 215 Z",
    "M674 87 C790 42 1004 64 1135 145 C1175 185 1121 254 1032 273 C955 289 928 331 851 314 C777 296 701 272 672 221 C649 177 640 112 674 87 Z",
    "M913 416 C966 384 1056 402 1095 456 C1108 500 1047 542 980 533 C921 526 872 455 913 416 Z",
    "M435 68 C462 49 499 57 506 82 C502 108 466 120 443 101 Z"
  ];
  let svg,tooltip,stateRef,callbacks={};

  function initialize(state,handlers={}){stateRef=state;callbacks=handlers;svg=document.getElementById("strategicMap");tooltip=document.getElementById("mapTooltip");render()}
  function render(){if(!svg||!stateRef)return;clear();defs();ocean();stateRef.mapMode==="regions"?renderSpain():renderWorld()}
  function clear(){while(svg.firstChild)svg.removeChild(svg.firstChild)}
  function el(tag,attrs={}){const node=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))node.setAttribute(k,v);return node}
  function tx(x,y,value,cls,anchor="middle"){const n=el("text",{x,y,class:cls,"text-anchor":anchor});n.textContent=value;return n}

  function defs(){
    const d=el("defs");
    const ocean=el("radialGradient",{id:"oceanGradient",cx:"52%",cy:"44%",r:"80%"});
    ocean.append(el("stop",{offset:"0%","stop-color":"#0c4668"}),el("stop",{offset:"55%","stop-color":"#07243a"}),el("stop",{offset:"100%","stop-color":"#03111d"}));d.append(ocean);
    const land=el("linearGradient",{id:"landGradient",x1:"0",y1:"0",x2:"1",y2:"1"});land.append(el("stop",{offset:"0%","stop-color":"#476f66"}),el("stop",{offset:"100%","stop-color":"#1f4c58"}));d.append(land);
    const glow=el("filter",{id:"softGlow",x:"-50%",y:"-50%",width:"200%",height:"200%"});glow.append(el("feGaussianBlur",{stdDeviation:"5",result:"blur"}));const merge=el("feMerge");merge.append(el("feMergeNode",{in:"blur"}),el("feMergeNode",{in:"SourceGraphic"}));glow.append(merge);d.append(glow);
    const shadow=el("filter",{id:"mapShadow",x:"-30%",y:"-30%",width:"160%",height:"160%"});shadow.append(el("feDropShadow",{dx:"0",dy:"4",stdDeviation:"4","flood-color":"#000","flood-opacity":".65"}));d.append(shadow);
    const pattern=el("pattern",{id:"seaPattern",width:"32",height:"32",patternUnits:"userSpaceOnUse",patternTransform:"rotate(12)"});pattern.append(el("path",{d:"M0 16 Q8 10 16 16 T32 16",fill:"none",stroke:"#8acfff","stroke-opacity":".07","stroke-width":"1"}));d.append(pattern);
    svg.append(d);
  }

  function ocean(){svg.setAttribute("viewBox",stateRef.mapMode==="regions"?"0 0 900 600":"0 0 1200 620");svg.append(el("rect",{x:0,y:0,width:"100%",height:"100%",fill:"url(#oceanGradient)"}),el("rect",{x:0,y:0,width:"100%",height:"100%",fill:"url(#seaPattern)"}));const grid=el("g",{class:"map-grid"});for(let x=0;x<=1200;x+=60)grid.append(el("line",{x1:x,y1:0,x2:x,y2:620}));for(let y=0;y<=620;y+=60)grid.append(el("line",{x1:0,y1:y,x2:1200,y2:y}));svg.append(grid)}

  function renderWorld(){
    const world=el("g",{class:"world-layer"});const land=el("g",{class:"landmass-layer",filter:"url(#mapShadow)"});continents.forEach(d=>land.append(el("path",{d,class:"continent-shape",fill:"url(#landGradient)"})));world.append(land);
    world.append(tx(170,75,"AMÉRICA DEL NORTE","continent-label"),tx(315,575,"AMÉRICA DEL SUR","continent-label"),tx(600,65,"EUROPA","continent-label"),tx(595,520,"ÁFRICA","continent-label"),tx(885,65,"ASIA-PACÍFICO","continent-label"));
    world.append(tx(430,348,"Océano Atlántico","ocean-label"),tx(1030,350,"Océano Pacífico","ocean-label"),tx(770,435,"Océano Índico","ocean-label"));
    const nodes=el("g",{class:"country-layer"});stateRef.countries.forEach(c=>nodes.append(countryNode(c)));world.append(nodes);svg.append(world);routes();strategicMarkers();
  }

  function countryNode(country){
    const selected=country.id===stateRef.selectedCountryId;const g=el("g",{class:`country-node${selected?" selected":""}`,transform:`translate(${country.map.x} ${country.map.y})`,tabindex:"0",role:"button"});
    const radius=country.map.size*1.18;const path=countryBlob(country.id,radius);g.append(el("path",{d:path,fill:countryFill(country),class:"country-hex"}));
    g.append(tx(0,3,country.flag,"country-flag"));if(stateRef.settings.showMapLabels!==false){g.append(tx(0,radius+15,country.name,"country-name"),tx(0,radius+28,layerValue(country),"country-gdp"))}
    g.addEventListener("click",()=>callbacks.selectCountry?.(country.id));g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")callbacks.selectCountry?.(country.id)});g.addEventListener("mousemove",e=>tip(e,countryTooltip(country)));g.addEventListener("mouseleave",hideTip);return g;
  }

  function countryBlob(id,r){let seed=[...id].reduce((a,c)=>a+c.charCodeAt(0),0);const pts=[];for(let i=0;i<10;i++){const a=Math.PI*2*i/10-Math.PI/2;seed=(seed*9301+49297)%233280;const rr=r*(.82+(seed/233280)*.28);pts.push([Math.cos(a)*rr,Math.sin(a)*rr])}return `M${pts.map(p=>p.map(v=>v.toFixed(1)).join(",")).join(" L")} Z`}
  function countryFill(c){const l=stateRef.mapLayer||"political";if(l==="political")return c.color;if(l==="economy")return heat(c.economy.gdp,100,30000,"#214e78","#ffe065");if(l==="military")return heat(c.systems.military,45,100,"#2e5667","#ff5d6f");if(l==="technology")return heat(c.systems.technology,45,100,"#273e72","#56e7ff");if(l==="stability")return heat(c.systems.stability,45,95,"#7b3445","#46d68b");return c.color}
  function heat(v,min,max,a,b){const t=Math.max(0,Math.min(1,(v-min)/(max-min)));const pa=hex(a),pb=hex(b);return `rgb(${Math.round(pa[0]+(pb[0]-pa[0])*t)},${Math.round(pa[1]+(pb[1]-pa[1])*t)},${Math.round(pa[2]+(pb[2]-pa[2])*t)})`}
  function hex(h){h=h.replace("#","");return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
  function layerValue(c){return({political:`Influencia ${c.influence.toFixed(0)}`,economy:`${c.economy.gdp.toFixed(0)} B€`,military:`Militar ${c.systems.military.toFixed(0)}`,technology:`Tecnología ${c.systems.technology.toFixed(0)}`,stability:`Estabilidad ${c.systems.stability.toFixed(0)}`})[stateRef.mapLayer]||""}
  function countryTooltip(c){const selected=NEXUS_ECONOMY.getCountry(stateRef);const rel=selected.id===c.id?100:selected.relations[c.id]??50;return `<strong>${c.flag} ${c.name}</strong><span>PIB ${c.economy.gdp.toFixed(0)} mil M€ · Crecimiento ${c.economy.growth.toFixed(1)}%</span><span>Industria ${c.systems.industry.toFixed(0)} · Tecnología ${c.systems.technology.toFixed(0)}</span><span>Militar ${c.systems.military.toFixed(0)} · Estabilidad ${c.systems.stability.toFixed(0)}</span><span>Relación ${rel.toFixed(0)} · Influencia ${c.influence.toFixed(0)}</span>`}

  function routes(){const layer=el("g",{class:"route-layer"});const selected=NEXUS_ECONOMY.getCountry(stateRef);stateRef.tradeRoutes.filter(r=>r.a===selected.id||r.b===selected.id).forEach(r=>{const a=stateRef.countries.find(c=>c.id===r.a),b=stateRef.countries.find(c=>c.id===r.b);if(!a||!b)return;layer.append(el("path",{d:`M${a.map.x},${a.map.y} Q${(a.map.x+b.map.x)/2},${Math.min(a.map.y,b.map.y)-55} ${b.map.x},${b.map.y}`,class:"diplomatic-route","stroke-opacity":Math.max(.2,r.efficiency/120)}))});svg.append(layer)}
  function strategicMarkers(){const g=el("g",{class:"strategic-markers"});const c=NEXUS_ECONOMY.getCountry(stateRef);if(c.units.length){const p=c.map;const ring=el("circle",{cx:p.x,cy:p.y,r:p.size*1.8,fill:"none",stroke:"#ffe55f","stroke-width":"1","stroke-dasharray":"4 5",opacity:".6"});g.append(ring)}if(stateRef.world.tension>55)g.append(tx(1120,565,`⚠ Tensión mundial ${stateRef.world.tension.toFixed(0)}%`,"warning-label","end"));svg.append(g)}

  function renderSpain(){
    const root=el("g",{class:"region-layer"});root.append(tx(450,35,"ESPAÑA · CONTROL TERRITORIAL Y CAPACIDADES","region-title"),tx(450,58,"Economía regional, instalaciones, energía, recursos y unidades desplegadas","region-subtitle"));
    const frame=el("rect",{x:58,y:82,width:740,height:500,rx:18,fill:"#0b2b3d",stroke:"#2b6e8c","stroke-width":"1"});root.append(frame);
    stateRef.regions.forEach(r=>root.append(regionNode(r)));svg.append(root);regionConnections();regionIcons();renderUnits();
  }

  function regionNode(r){const selected=r.id===stateRef.selectedRegionId;const g=el("g",{class:`region-node${selected?" selected":""}`,tabindex:"0",role:"button"});g.append(el("polygon",{points:r.polygon,class:"region-polygon",fill:regionColor(r)}));const c=center(r.polygon);if(stateRef.settings.showMapLabels!==false){g.append(tx(c.x,c.y-4,shortName(r.name),"region-name"),tx(c.x,c.y+12,`${r.gdp.toFixed(0)} B€`,"region-value"))}g.addEventListener("click",()=>callbacks.selectRegion?.(r.id));g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")callbacks.selectRegion?.(r.id)});g.addEventListener("mousemove",e=>tip(e,`<strong>${r.name}</strong><span>${r.specialization}</span><span>PIB ${r.gdp.toFixed(1)} mil M€ · Población ${r.population.toFixed(2)} M</span><span>Industria ${r.industry.toFixed(0)} · Infra ${r.infra.toFixed(0)} · Energía ${r.energy.toFixed(0)}</span><span>${r.buildings.length} instalaciones · ${r.resources.join(" · ")}</span>`));g.addEventListener("mouseleave",hideTip);return g}
  function regionColor(r){const layer=stateRef.mapLayer;if(layer==="economy")return heat(r.gdp,10,310,"#234b73","#ffe064");if(layer==="military")return heat(r.defense,35,80,"#334e63","#ff6976");if(layer==="technology")return heat(r.research,40,100,"#2a3b6e","#55e3ff");if(layer==="stability")return heat(r.stability,65,95,"#81404e","#49d88e");const v=(r.infra+r.industry+r.energy+r.stability)/4;return v>=88?"#3bd49c":v>=80?"#38aec4":v>=70?"#477bc3":"#745a8c"}
  function regionConnections(){const g=el("g",{class:"region-links"});const links=[["GAL","AST"],["AST","PVA"],["PVA","NAV"],["NAV","ARA"],["ARA","CAT"],["CYL","MAD"],["MAD","CLM"],["CLM","VAL"],["VAL","MUR"],["CLM","AND"],["EXT","AND"],["CYL","GAL"]];links.forEach(([a,b])=>{const ra=stateRef.regions.find(r=>r.id===a),rb=stateRef.regions.find(r=>r.id===b);if(!ra||!rb)return;const pa=center(ra.polygon),pb=center(rb.polygon);g.append(el("line",{x1:pa.x,y1:pa.y,x2:pb.x,y2:pb.y,stroke:"#75d5ff","stroke-width":"1","stroke-dasharray":"3 5",opacity:".28"}))});svg.append(g)}
  function regionIcons(){const g=el("g",{class:"regional-assets"});stateRef.regions.forEach(r=>{const p=center(r.polygon),icons=r.buildings.slice(0,3).map(b=>buildingGlyph(b.typeId));icons.forEach((ic,i)=>{const t=tx(p.x-14+i*14,p.y+27,ic,"asset-icon");t.addEventListener("mousemove",e=>tip(e,`<strong>${r.name}</strong><span>${r.buildings.map(b=>NEXUS_CATALOG.buildings.find(x=>x.id===b.typeId)?.name).filter(Boolean).join(" · ")}</span>`));t.addEventListener("mouseleave",hideTip);g.append(t)})});svg.append(g)}
  function buildingGlyph(id){return({housing:"🏘",hospital:"✚",university:"🎓",autoPlant:"🚗",steelPlant:"🏗",chipFab:"▦",shipyard:"⚓",aerospace:"✈",solar:"☀",wind:"✣",nuclear:"☢",grid:"⚡",rail:"═",port:"⚓",airbase:"▲",navalBase:"≈",cyberCenter:"◆"})[id]||"●"}
  function renderUnits(){const c=NEXUS_ECONOMY.getCountry(stateRef);const grouped={};c.units.forEach(u=>(grouped[u.regionId]||=[]).push(u));const layer=el("g",{class:"unit-map-layer"});Object.entries(grouped).forEach(([id,units])=>{const r=stateRef.regions.find(x=>x.id===id);if(!r)return;const p=center(r.polygon),def=stateRef.unitCatalog.find(d=>d.id===units[0].typeId),g=el("g",{class:"unit-marker",transform:`translate(${p.x+20} ${p.y-18})`});g.append(el("circle",{r:13,class:"unit-marker-bg"}),tx(0,4,unitGlyph(def?.id),"unit-marker-icon"));if(units.length>1)g.append(tx(12,-10,units.length,"unit-count"));g.addEventListener("mousemove",e=>tip(e,`<strong>${r.name}</strong><span>${units.length} unidades desplegadas</span><span>Preparación media ${(units.reduce((s,u)=>s+u.readiness,0)/units.length).toFixed(0)}%</span>`));g.addEventListener("mouseleave",hideTip);layer.append(g)});svg.append(layer)}
  function unitGlyph(id){return({infantry:"◆",mechanized:"▣",armor:"▰",artillery:"✦",airDefense:"⌁",rocketArtillery:"✹",fighter:"▲",drone:"◇",bomber:"▼",transport:"✈",frigate:"≈",destroyer:"≋",submarine:"◒",carrier:"▱",satellite:"✧",missile:"↟",cyber:"⌘"})[id]||"◆"}
  function shortName(n){return n.replace("Comunidad de ","").replace("Comunitat Valenciana","Valencia").replace("Castilla-La Mancha","C.-La Mancha").replace("Castilla y León","C. y León").replace("Región de ","")}
  function center(points){const p=points.split(" ").map(x=>x.split(",").map(Number));return{x:p.reduce((s,x)=>s+x[0],0)/p.length,y:p.reduce((s,x)=>s+x[1],0)/p.length}}
  function tip(event,html){if(!tooltip)return;tooltip.innerHTML=html;tooltip.hidden=false;const rect=svg.getBoundingClientRect();tooltip.style.left=`${Math.min(rect.width-230,event.clientX-rect.left+16)}px`;tooltip.style.top=`${Math.min(rect.height-110,event.clientY-rect.top+16)}px`}
  function hideTip(){if(tooltip)tooltip.hidden=true}

  return {initialize,render};
})();
