"use strict";
const fs=require("fs"),vm=require("vm"),path=require("path");
const root=path.resolve(__dirname,"..");
global.window=global;
if(!global.performance)global.performance={now:()=>Date.now()};

class FakeClassList{add(){} remove(){} toggle(){} contains(){return false}}
class FakeElement{
  constructor(id=""){this.id=id;this.innerHTML="";this.textContent="";this.value="";this.checked=false;this.hidden=false;this.dataset={};this.style={};this.classList=new FakeClassList();this.parentElement=this;this.tagName="DIV";}
  addEventListener(){} removeEventListener(){} querySelector(){return new FakeElement()} querySelectorAll(){return[]} closest(){return null} setAttribute(){} removeAttribute(){} appendChild(){} remove(){}
}
const elements=new Map();
const get=id=>{if(!elements.has(id))elements.set(id,new FakeElement(id));return elements.get(id)};
global.document={
  body:new FakeElement("body"),
  getElementById:get,
  querySelectorAll:()=>[],
  addEventListener:()=>{},
  createElement:()=>new FakeElement(),
};
global.setInterval=()=>1;global.clearInterval=()=>{};global.confirm=()=>true;
global.NEXUS_MAP_ENGINE={render(){}};

for(const file of ["world-data.js","data.js","catalog.js","politics.js","economy.js","simulation-plus.js","deep-systems.js","alpha-v13.js","alpha-v14.js","alpha-v15.js","ui.js"]){
  vm.runInThisContext(fs.readFileSync(path.join(root,"js",file),"utf8"),{filename:file});
}
const state=NEXUS_ECONOMY.createInitialState();
const actions={setPanel:p=>state.activePanel=p};
NEXUS_UI.initialize(state,actions);
const panels=["overview","economy","regions","industry","stock","politics","technology","military","diplomacy","intelligence","objectives","events","settings"];
const rendered={};
for(const panel of panels){state.activePanel=panel;NEXUS_UI.renderAll();const html=get("mainPanel").innerHTML;if(!html||html.length<40)throw new Error(`Panel ${panel} vacío`);rendered[panel]=html.length;}
if(!get("mainPanel").innerHTML.includes("Configuración"))throw new Error("El último panel no se renderizó");
state.activePanel="politics";NEXUS_UI.renderAll();const politics=get("mainPanel").innerHTML;
if(!politics.includes("PODER DE LA COALICIÓN")||!politics.includes("50% · MAYORÍA")||!politics.includes("Mesa de coalición"))throw new Error("Gráfico o mesa de coalición ausente");
state.activePanel="stock";NEXUS_UI.renderAll();if(!get("mainPanel").innerHTML.includes("176"))throw new Error("Bolsa ampliada no visible");
console.log(JSON.stringify({ok:true,panels:rendered,politicsChart:true,stockCompanies:state.companies.length},null,2));
