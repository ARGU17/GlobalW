"use strict";

window.NEXUS_MAP_ENGINE = (() => {
  const TILE_SIZE=256,MIN_ZOOM=1,MAX_ZOOM=7;
  let state,callbacks={},canvas,ctx,tooltip,geojson={features:[]},width=0,height=0,dpr=1;
  let camera={lat:18,lng:8,zoom:2};
  let dragging=false,lastPointer=null,hitCountries=[],hitMarkers=[],tileCache=new Map(),needsRender=true,frame=null;
  const markerEmoji={housing:"🏘",hospital:"✚",university:"🎓",autoPlant:"🚗",steelPlant:"🏗",chipFab:"▦",shipyard:"⚓",aerospace:"✈",solar:"☀",wind:"✣",nuclear:"☢",grid:"⚡",rail:"═",port:"⚓",airbase:"▲",navalBase:"≈",cyberCenter:"◆"};
  const unitEmoji={infantry:"◆",mechanized:"▣",armor:"▰",artillery:"✦",airDefense:"⌁",rocketArtillery:"✹",fighter:"▲",drone:"◇",bomber:"▼",transport:"✈",frigate:"≈",destroyer:"≋",submarine:"◒",carrier:"▱",satellite:"✧",missile:"↟",cyber:"⌘"};

  function initialize(nextState,nextCallbacks={}){
    state=nextState;callbacks=nextCallbacks;
    canvas=document.getElementById("strategicMap");tooltip=document.getElementById("mapTooltip");
    if(!canvas||canvas.tagName!=="CANVAS")throw new Error("El mapa requiere <canvas id=\"strategicMap\">.");
    ctx=canvas.getContext("2d",{alpha:false});
    camera.lat=state.mapCenter?.[0]??18;camera.lng=state.mapCenter?.[1]??8;camera.zoom=state.mapZoom??2;
    bindEvents();resize();loadWorld();startLoop();
  }

  async function loadWorld(){
    try{const response=await fetch("assets/maps/world-countries.geojson",{cache:"force-cache"});if(!response.ok)throw new Error(`GeoJSON ${response.status}`);geojson=await response.json();needsRender=true;}
    catch(error){console.error("No se pudo cargar el mapa mundial local",error);geojson={features:[]};showTipAt(width/2,height/2,"<strong>Mapa sin geometría</strong><span>Comprueba assets/maps/world-countries.geojson.</span>")}
  }

  function bindEvents(){
    if(canvas.dataset.bound)return;canvas.dataset.bound="1";
    window.addEventListener("resize",resize,{passive:true});
    canvas.addEventListener("pointerdown",e=>{dragging=true;lastPointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);canvas.classList.add("dragging")});
    canvas.addEventListener("pointermove",e=>{
      if(dragging&&lastPointer){panBy(e.clientX-lastPointer.x,e.clientY-lastPointer.y);lastPointer={x:e.clientX,y:e.clientY};hideTip();return}
      hover(e);
    });
    const stop=e=>{dragging=false;lastPointer=null;canvas.classList.remove("dragging");canvas.releasePointerCapture?.(e.pointerId)};
    canvas.addEventListener("pointerup",stop);canvas.addEventListener("pointercancel",stop);canvas.addEventListener("pointerleave",e=>{if(!dragging)hideTip()});
    canvas.addEventListener("wheel",e=>{e.preventDefault();zoomAt(e.offsetX,e.offsetY,e.deltaY<0?.42:-.42)},{passive:false});
    canvas.addEventListener("click",clickMap);
    document.getElementById("mapZoomIn")?.addEventListener("click",()=>zoomAt(width/2,height/2,.6));
    document.getElementById("mapZoomOut")?.addEventListener("click",()=>zoomAt(width/2,height/2,-.6));
    document.getElementById("mapReset")?.addEventListener("click",()=>{camera={lat:18,lng:8,zoom:2};persistCamera();needsRender=true});
    document.getElementById("mapBaseToggle")?.addEventListener("click",()=>{state.mapBase=state.mapBase==="vector"?"osm":"vector";needsRender=true});
  }

  function resize(){const rect=canvas.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);width=Math.max(300,Math.round(rect.width));height=Math.max(260,Math.round(rect.height));canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);needsRender=true}
  function startLoop(){if(frame)return;const loop=()=>{if(needsRender||state?.wars?.some(w=>!w.ended)){draw();needsRender=false}frame=requestAnimationFrame(loop)};frame=requestAnimationFrame(loop)}
  function render(){needsRender=true}

  function worldSize(z=camera.zoom){return TILE_SIZE*Math.pow(2,z)}
  function project(lat,lng,z=camera.zoom){const size=worldSize(z);const sin=Math.sin(clampLat(lat)*Math.PI/180);return{x:(lng+180)/360*size,y:(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*size}}
  function unproject(x,y,z=camera.zoom){const size=worldSize(z);const lng=x/size*360-180;const n=Math.PI-2*Math.PI*y/size;const lat=180/Math.PI*Math.atan(.5*(Math.exp(n)-Math.exp(-n)));return{lat:clampLat(lat),lng:normalizeLng(lng)}}
  function clampLat(v){return Math.max(-85.0511,Math.min(85.0511,v))}
  function normalizeLng(v){while(v<-180)v+=360;while(v>180)v-=360;return v}
  function centerWorld(){return project(camera.lat,camera.lng)}
  function toScreen(lat,lng){const p=project(lat,lng),c=centerWorld(),size=worldSize();let dx=p.x-c.x;while(dx>size/2)dx-=size;while(dx<-size/2)dx+=size;return{x:width/2+dx,y:height/2+(p.y-c.y)}}
  function screenToGeo(x,y){const c=centerWorld();return unproject(c.x+(x-width/2),c.y+(y-height/2))}

  function panBy(dx,dy){const c=centerWorld(),next=unproject(c.x-dx,c.y-dy);camera.lat=next.lat;camera.lng=next.lng;persistCamera();needsRender=true}
  function zoomAt(x,y,delta){const before=screenToGeo(x,y);camera.zoom=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,camera.zoom+delta));const after=screenToGeo(x,y);camera.lat=clampLat(camera.lat+(before.lat-after.lat));camera.lng=normalizeLng(camera.lng+(before.lng-after.lng));persistCamera();needsRender=true}
  function persistCamera(){if(!state)return;state.mapCenter=[camera.lat,camera.lng];state.mapZoom=camera.zoom}

  function draw(){if(!ctx)return;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);drawBackground();drawTiles();drawAtmosphere();drawCountries();drawRegions();drawFacilities();drawUnits();drawWars();drawHUD();ctx.restore()}
  function drawBackground(){const g=ctx.createLinearGradient(0,0,0,height);g.addColorStop(0,"#061725");g.addColorStop(.55,"#082437");g.addColorStop(1,"#04111d");ctx.fillStyle=g;ctx.fillRect(0,0,width,height)}

  function drawTiles(){if(state?.mapBase==="vector")return;const z=Math.max(1,Math.min(7,Math.floor(camera.zoom)));const zScale=Math.pow(2,camera.zoom-z);const centerZ=project(camera.lat,camera.lng,z);const viewW=width/zScale,viewH=height/zScale;const left=centerZ.x-viewW/2,top=centerZ.y-viewH/2;const minX=Math.floor(left/TILE_SIZE),maxX=Math.floor((left+viewW)/TILE_SIZE),minY=Math.floor(top/TILE_SIZE),maxY=Math.floor((top+viewH)/TILE_SIZE);const n=Math.pow(2,z);
    ctx.save();ctx.translate(width/2,height/2);ctx.scale(zScale,zScale);ctx.translate(-centerZ.x,-centerZ.y);
    for(let ty=minY;ty<=maxY;ty++){if(ty<0||ty>=n)continue;for(let tx=minX;tx<=maxX;tx++){const wrapped=((tx%n)+n)%n;const img=getTile(z,wrapped,ty);if(img?.complete&&img.naturalWidth){try{ctx.drawImage(img,tx*TILE_SIZE,ty*TILE_SIZE,TILE_SIZE,TILE_SIZE)}catch(_){}}else{ctx.fillStyle=(tx+ty)%2?"#0a2737":"#0b2c3e";ctx.fillRect(tx*TILE_SIZE,ty*TILE_SIZE,TILE_SIZE,TILE_SIZE)}}}
    ctx.restore();
  }
  function getTile(z,x,y){const key=`${z}/${x}/${y}`;if(tileCache.has(key))return tileCache.get(key);if(tileCache.size>260){const first=tileCache.keys().next().value;tileCache.delete(first)}const img=new Image();img.decoding="async";img.onload=()=>{needsRender=true};img.onerror=()=>{img.failed=true};img.src=`https://tile.openstreetmap.org/${z}/${x}/${y}.png`;tileCache.set(key,img);return img}
  function drawAtmosphere(){ctx.fillStyle=state?.mapBase==="vector"?"rgba(2,13,23,.05)":"rgba(2,10,18,.38)";ctx.fillRect(0,0,width,height);const g=ctx.createRadialGradient(width*.5,height*.45,50,width*.5,height*.45,Math.max(width,height)*.7);g.addColorStop(0,"rgba(58,146,189,.02)");g.addColorStop(1,"rgba(0,5,12,.32)");ctx.fillStyle=g;ctx.fillRect(0,0,width,height)}

  function drawCountries(){hitCountries=[];for(const feature of geojson.features||[]){const id=feature.properties?.ISO3;if(!id)continue;const country=state.countries.find(c=>c.id===id);if(!country)continue;const selected=id===state.selectedCountryId,controlled=id===state.controlledCountryId;const paths=geometryPaths(feature.geometry);for(const path of paths){if(!path)continue;ctx.save();ctx.fillStyle=countryColor(country);ctx.globalAlpha=selected?.62:controlled?.5:camera.zoom<3?.38:.22;ctx.fill(path);ctx.globalAlpha=selected||controlled?1:.74;ctx.strokeStyle=selected?"#ffffff":controlled?"#ffe66d":"#7dc8e5";ctx.lineWidth=selected?2.2:controlled?1.8:.55;ctx.stroke(path);ctx.restore();hitCountries.push({path,country})}
      if(camera.zoom>3.4&&state.settings?.showMapLabels!==false&&country.economy.gdp>80){const p=toScreen(country.map.lat,country.map.lng);drawLabel(p.x,p.y,country.name,selected||controlled?"#fff":"#c8e6f3",selected?12:9)}
    }}
  function geometryPaths(geometry){if(!geometry)return[];if(geometry.type==="Point"){const [lng,lat]=geometry.coordinates,p=toScreen(lat,lng),r=Math.max(3,2+camera.zoom*.45),path=new Path2D();path.arc(p.x,p.y,r,0,Math.PI*2);return[path]};const polygons=geometry.type==="Polygon"?[geometry.coordinates]:geometry.type==="MultiPolygon"?geometry.coordinates:[];const result=[];for(const polygon of polygons){const path=new Path2D();for(const ring of polygon){let started=false;for(const coord of ring){const p=toScreen(coord[1],coord[0]);if(!started){path.moveTo(p.x,p.y);started=true}else path.lineTo(p.x,p.y)}path.closePath()}result.push(path)}return result}
  function countryColor(c){const layer=state.mapLayer||"political";if(layer==="political")return c.color||"#4d8fd8";if(layer==="economy")return heat(c.economy.gdp,1,30000,"#214562","#ffd75f");if(layer==="military")return heat(c.systems.military,10,100,"#263f54","#ff5d6f");if(layer==="technology")return heat(c.systems.technology,10,100,"#252d61","#4de4ff");if(layer==="stability")return heat(c.systems.stability,20,98,"#7b3345","#45d58a");return c.color}
  function heat(v,min,max,a,b){const t=Math.max(0,Math.min(1,(Math.log1p(v)-Math.log1p(min))/(Math.log1p(max)-Math.log1p(min))));const A=hex(a),B=hex(b);return`rgb(${Math.round(A[0]+(B[0]-A[0])*t)},${Math.round(A[1]+(B[1]-A[1])*t)},${Math.round(A[2]+(B[2]-A[2])*t)})`}
  function hex(h){h=h.replace("#","");return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}

  function drawRegions(){if(camera.zoom<4||!(state.selectedCountryId==="ESP"||state.controlledCountryId==="ESP"))return;for(const region of state.regions){const p=toScreen(region.lat,region.lng),selected=region.id===state.selectedRegionId;const radius=Math.max(9,Math.min(28,7+region.gdp/18))*Math.pow(1.12,camera.zoom-4);ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fillStyle=selected?"rgba(255,220,82,.32)":"rgba(57,184,221,.16)";ctx.fill();ctx.strokeStyle=selected?"#ffe46a":"#63cae7";ctx.lineWidth=selected?2:1;ctx.stroke();ctx.restore();if(camera.zoom>4.8)drawLabel(p.x,p.y-radius-5,region.name,selected?"#ffe46a":"#d8f4ff",8)}}

  function drawFacilities(){hitMarkers=[];if(camera.zoom<3.5)return;const countriesToShow=new Set([state.controlledCountryId,state.selectedCountryId]);for(const country of state.countries){if(!countriesToShow.has(country.id)&&camera.zoom<5.5)continue;let facilities=[];if(country.id==="ESP")facilities=state.regions.flatMap(r=>r.buildings.map(b=>({...b,regionName:r.name})));else facilities=(country.facilities||[]).map(b=>({...b,regionName:country.name}));for(const facility of facilities){const p=toScreen(facility.lat??country.map.lat,facility.lng??country.map.lng);if(p.x<-25||p.x>width+25||p.y<-25||p.y>height+25)continue;const def=NEXUS_CATALOG.buildings.find(b=>b.id===facility.typeId);drawMarker(p.x,p.y,markerEmoji[facility.typeId]||"●",def?.family?.includes("Energía")?"#ffd35d":def?.family?.includes("Defensa")?"#ff6877":"#4dd7ff",facility.level||1);hitMarkers.push({x:p.x,y:p.y,r:16,html:`<strong>${def?.icon||"🏭"} ${def?.name||facility.typeId}</strong><span>${facility.regionName} · Nivel ${facility.level||1}</span><span>${def?.capacity||"Capacidad estratégica"}</span><span>${def?.jobs?.toLocaleString("es-ES")||0} empleos por nivel</span>`})}}}
  function drawMarker(x,y,glyph,color,badge){ctx.save();ctx.shadowColor="rgba(0,0,0,.7)";ctx.shadowBlur=8;ctx.beginPath();ctx.arc(x,y,11,0,Math.PI*2);ctx.fillStyle="#07131d";ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=color;ctx.lineWidth=1.6;ctx.stroke();ctx.font="10px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#fff";ctx.fillText(glyph,x,y+1);if(badge>1){ctx.beginPath();ctx.arc(x+9,y-9,6,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.font="bold 7px system-ui";ctx.fillStyle="#061019";ctx.fillText(String(badge),x+9,y-9)}ctx.restore()}

  function drawUnits(){if(camera.zoom<3.2)return;const show=new Set([state.controlledCountryId,state.selectedCountryId]);for(const country of state.countries){if(!show.has(country.id))continue;for(const unit of country.units||[]){if(unit.quantity<=0)continue;const p=toScreen(unit.lat??country.map.lat,unit.lng??country.map.lng);if(p.x<-30||p.x>width+30||p.y<-30||p.y>height+30)continue;const def=state.unitCatalog.find(x=>x.id===unit.typeId);ctx.save();ctx.beginPath();ctx.roundRect(p.x-16,p.y-12,32,24,6);ctx.fillStyle="rgba(7,18,28,.94)";ctx.fill();ctx.strokeStyle=country.id===state.controlledCountryId?"#ffe063":"#65d8ff";ctx.lineWidth=1.5;ctx.stroke();ctx.font="bold 11px system-ui";ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(unitEmoji[unit.typeId]||"◆",p.x-7,p.y);ctx.font="bold 7px system-ui";ctx.fillText(shortQty(unit.quantity),p.x+7,p.y);ctx.restore();hitMarkers.push({x:p.x,y:p.y,r:18,html:`<strong>${def?.name||unit.typeId}</strong><span>${unit.quantity.toLocaleString("es-ES")} ${def?.unitName||"unidades"}</span><span>Preparación ${unit.readiness.toFixed(0)}% · Fuerza ${unit.strength.toFixed(0)}%</span><span>${unit.status||"desplegada"}</span>`})}}}
  function shortQty(v){if(v>=1e6)return`${(v/1e6).toFixed(1)}M`;if(v>=1000)return`${(v/1000).toFixed(v>=10000?0:1)}k`;return String(v)}

  function drawWars(){const now=Date.now();for(const war of state.wars.filter(w=>!w.ended)){const a=state.countries.find(c=>c.id===war.attacker),d=state.countries.find(c=>c.id===war.defender);if(!a||!d)continue;const p1=toScreen(a.map.lat,a.map.lng),p2=toScreen(d.map.lat,d.map.lng),mx=(p1.x+p2.x)/2,my=(p1.y+p2.y)/2-30;ctx.save();ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.quadraticCurveTo(mx,my,p2.x,p2.y);ctx.setLineDash([8,7]);ctx.lineDashOffset=-(now/90)%15;ctx.strokeStyle="rgba(255,72,86,.9)";ctx.lineWidth=2.4;ctx.stroke();ctx.setLineDash([]);const battle=war.lastBattle;const bp=battle?toScreen(battle.lat,battle.lng):{x:mx,y:my};const pulse=11+Math.sin(now/220)*4;ctx.beginPath();ctx.arc(bp.x,bp.y,pulse,0,Math.PI*2);ctx.fillStyle="rgba(255,70,80,.15)";ctx.fill();ctx.strokeStyle="#ff5868";ctx.lineWidth=2;ctx.stroke();ctx.font="16px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#fff";ctx.fillText("⚔",bp.x,bp.y);ctx.restore();hitMarkers.push({x:bp.x,y:bp.y,r:22,html:`<strong>⚔ ${a.name} vs ${d.name}</strong><span>Día ${war.days} · War score ${war.warScore.toFixed(1)}</span><span>${battle?.title||"Frente activo"}</span><span>Bajas ${war.attackerLosses.toLocaleString("es-ES")} / ${war.defenderLosses.toLocaleString("es-ES")}</span>`})}}

  function drawHUD(){ctx.save();ctx.fillStyle="rgba(4,15,24,.82)";ctx.fillRect(10,height-32,310,22);ctx.font="9px system-ui";ctx.fillStyle="#b8d5e4";ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillText(`Zoom ${camera.zoom.toFixed(1)} · ${state.mapBase==="vector"?"Mapa vectorial local":"OpenStreetMap + límites Natural Earth"}`,18,height-21);ctx.restore()}
  function drawLabel(x,y,text,color,size){ctx.save();ctx.font=`700 ${size}px system-ui`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineWidth=3;ctx.strokeStyle="rgba(2,10,16,.9)";ctx.strokeText(text,x,y);ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore()}

  function hover(e){const p=eventPoint(e);const marker=[...hitMarkers].reverse().find(m=>Math.hypot(p.x-m.x,p.y-m.y)<=m.r);if(marker){showTipAt(p.x,p.y,marker.html);canvas.style.cursor="pointer";return}const hit=[...hitCountries].reverse().find(h=>ctx.isPointInPath(h.path,p.x,p.y));if(hit){const c=hit.country;showTipAt(p.x,p.y,`<strong>${c.flag} ${c.name}</strong><span>PIB ${c.economy.gdp.toLocaleString("es-ES",{maximumFractionDigits:0})} mil M€ · ${c.economy.population.toLocaleString("es-ES",{maximumFractionDigits:1})} M hab.</span><span>Industria ${c.systems.industry.toFixed(0)} · Tecnología ${c.systems.technology.toFixed(0)} · Militar ${c.systems.military.toFixed(0)}</span><span>${c.id===state.controlledCountryId?"CONTROLADO":"Clic para inspeccionar"}</span>`);canvas.style.cursor="pointer";return}hideTip();canvas.style.cursor=dragging?"grabbing":"grab"}
  function clickMap(e){if(dragging)return;const p=eventPoint(e);const marker=[...hitMarkers].reverse().find(m=>Math.hypot(p.x-m.x,p.y-m.y)<=m.r);if(marker){showTipAt(p.x,p.y,marker.html);return}const hit=[...hitCountries].reverse().find(h=>ctx.isPointInPath(h.path,p.x,p.y));if(hit)callbacks.selectCountry?.(hit.country.id)}
  function eventPoint(e){const rect=canvas.getBoundingClientRect();return{x:e.clientX-rect.left,y:e.clientY-rect.top}}
  function showTipAt(x,y,html){if(!tooltip)return;tooltip.innerHTML=html;tooltip.hidden=false;tooltip.style.left=`${Math.min(width-260,Math.max(8,x+15))}px`;tooltip.style.top=`${Math.min(height-130,Math.max(8,y+15))}px`}
  function hideTip(){if(tooltip)tooltip.hidden=true}

  function focusCountry(id){const c=state.countries.find(x=>x.id===id);if(!c)return;camera.lat=c.map?.lat||0;camera.lng=c.map?.lng||0;camera.zoom=Math.max(camera.zoom,id==="ESP"?4.6:3.5);persistCamera();needsRender=true}
  function focusRegion(id){const p=NEXUS_WORLD.regionCapitals[id];if(!p)return;camera.lat=p[0];camera.lng=p[1];camera.zoom=6;persistCamera();needsRender=true}

  return{initialize,render,focusCountry,focusRegion};
})();
