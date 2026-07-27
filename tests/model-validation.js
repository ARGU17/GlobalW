"use strict";

const fs = require("fs");
const vm = require("vm");
const path = require("path");

const root = path.resolve(__dirname, "..");
global.window = global;
if (!global.crypto) global.crypto = require("crypto").webcrypto;
if (!global.performance) global.performance = { now: () => Date.now() };

for (const file of [
  "world-data.js","data.js","catalog.js","politics.js","economy.js",
  "simulation-plus.js","deep-systems.js","alpha-v13.js","alpha-v14.js"
]) {
  vm.runInThisContext(fs.readFileSync(path.join(root,"js",file),"utf8"), { filename:file });
}

const E = global.NEXUS_ECONOMY;
const C = global.NEXUS_CATALOG;
const assert = (condition,message) => { if (!condition) throw new Error(message); };

const state = E.createInitialState();
assert(state.version === "1.4-alpha", "Versión incorrecta");
assert(state.countries.length === 197, "Deben existir 197 países");
assert(state.companies.length >= 170, "Bolsa insuficientemente ampliada");
assert(C.buildings.length >= 40, "Catálogo industrial insuficiente");
assert(C.technologies.length >= 60, "Árbol tecnológico insuficiente");
assert(E.getCountryRegions(state,"ESP").length === 17, "España debe tener 17 comunidades");

// Verifica que cada definición industrial pueda pasar de cola a activo territorial.
for (const def of C.buildings) {
  const s = E.createInitialState();
  const country = E.getCountry(s,"ESP");
  country.economy.treasury = 100000;
  country.systems.technology = 100;
  country.systems.industry = 100;
  country.systems.energy = 100;
  country.systems.logistics = 100;
  const region = E.getCountryRegions(s,"ESP")[0];
  region.capacitySlots = 999;
  region.infra = 100; region.energy = 100; region.stability = 100;
  // Evita que activos iniciales bloqueen la prueba de un tipo ya existente.
  for (const r of E.getCountryRegions(s,"ESP")) r.buildings = r.buildings.filter(x=>x.typeId!==def.id);
  country.productionQueue = country.productionQueue.filter(q=>q.buildingId!==def.id);
  const result = E.buildInRegion(s,region.id,def.id);
  assert(result.ok, `No se pudo iniciar ${def.id}: ${result.message}`);
  const queue = country.productionQueue.find(q=>q.kind==="facilityV3"&&q.buildingId===def.id);
  assert(queue, `Falta cola protegida para ${def.id}`);
  queue.daysRemaining = 1;
  E.tickDay(s);
  const current = E.getCountry(s,"ESP");
  const built = E.facilitiesInRegion(s,current,region.id).some(x=>x.typeId===def.id);
  assert(built, `La instalación ${def.id} desapareció sin construirse`);
  assert(!current.productionQueue.some(q=>q.id===queue.id), `La cola completada ${def.id} no se retiró`);
}

// Movimiento regional.
{
  const s = E.createInitialState(), country = E.getCountry(s,"ESP");
  const unit = country.units.find(u=>u.quantity>0), id=unit.id;
  const target = E.getCountryRegions(s,"ESP").find(r=>r.id!==unit.regionId);
  assert(E.moveUnit(s,id,target.id,"ESP").ok,"No se inició el movimiento regional");
  for(let i=0;i<30;i++) E.tickDay(s);
  const moved=E.getCountry(s,"ESP").units.find(u=>u.id===id);
  assert(moved.regionId===target.id&&!moved.movement,"La unidad no llegó a la región de destino");
}

// Guerra y conquista regional frente a un Estado pequeño.
{
  const s=E.createInitialState(),attacker=E.getCountry(s,"ESP"),defender=E.getCountry(s,"AND");
  s.controlledCountryId="ESP";attacker.relations.AND=0;defender.relations.ESP=0;attacker.militaryReadiness=99;
  assert(E.warAction(s,"AND","declare").ok,"No se pudo declarar la guerra de validación");
  const unit=attacker.units.filter(u=>u.quantity>0&&!['frigate','destroyer','submarine','carrier','satellite','missile','cyber'].includes(u.typeId)).sort((a,b)=>b.quantity-a.quantity)[0];
  const region=E.getCountryRegions(s,"AND")[0];
  assert(E.attackRegion(s,unit.id,"AND",region.id).ok,"No se inició el ataque regional");
  for(let i=0;i<75&&E.getRegion(s,"AND",region.id).controllerId!=="ESP";i++)E.tickDay(s);
  assert(E.getRegion(s,"AND",region.id).controllerId==="ESP","La conquista regional no se resolvió");
  assert(E.getControlledRegions(s,"ESP").some(r=>r.id===region.id),"La región conquistada no aparece entre los territorios controlados");
  const occupiedProduction=Object.values(E.getCountry(s,"ESP").resourceBalance||{}).reduce((sum,row)=>sum+(row.occupationProduction||0),0);
  assert(occupiedProduction>0,"La ocupación no transfirió producción regional");
}

// Compatibilidad política: extremos incompatibles, espacios próximos negociables.
{
  const extreme=E.coalitionCompatibility(186),near=E.coalitionCompatibility(15);
  assert(extreme.chance===0,"Los extremos opuestos no deben coaligarse");
  assert(near.chance>=.8,"Partidos ideológicamente próximos deben negociar con facilidad");
}

console.log(JSON.stringify({
  ok:true,
  version:state.version,
  countries:state.countries.length,
  companies:state.companies.length,
  industries:C.buildings.length,
  technologies:C.technologies.length,
  regionsSpain:E.getCountryRegions(state,"ESP").length
},null,2));
