/* ==========================================================
   NEXUS GLOBAL
   bootstrap.js
   Motor de arranque
========================================================== */

"use strict";

/* ==========================================================
   CONFIGURACIÓN
========================================================== */

window.NEXUS = window.NEXUS || {};

NEXUS.version = "0.1 Alpha";

NEXUS.boot = {
    ready: false,
    started: false
};

NEXUS.settings = {

    autoSave: true,

    autoSaveInterval: 300000,

    simulationFPS: 60,

    simulationSpeed: 1,

    startCountry: "ESP",

    debug: false

};

/* ==========================================================
   UTILIDADES
========================================================== */

function exists(fn){

    return typeof fn === "function";

}

async function safeCall(fn,...args){

    try{

        if(exists(fn))
            return await fn(...args);

    }

    catch(error){

        console.error(error);

    }

}

/* ==========================================================
   CARGA DE DATOS
========================================================== */

async function bootData(){

    console.log("Loading data...");

    await safeCall(window.initializeData);

}

/* ==========================================================
   MAPA
========================================================== */

async function bootMap(){

    console.log("Loading map...");

    await safeCall(window.startMapEngine);

}

/* ==========================================================
   UI
========================================================== */

async function bootUI(){

    console.log("Loading UI...");

    await safeCall(window.initializeUI);

}

/* ==========================================================
   SIMULACIÓN
========================================================== */

async function bootSimulation(){

    console.log("Loading simulation...");

    await safeCall(window.initializeSimulation);

}

/* ==========================================================
   PAÍS INICIAL
========================================================== */

function bootCountry(){

    if(!window.selectCountry)
        return;

    selectCountry(

        NEXUS.settings.startCountry

    );

}

/* ==========================================================
   GAME LOOP
========================================================== */

let lastTime = performance.now();

function gameLoop(time){

    const delta =
        (time-lastTime)/1000;

    lastTime=time;

    if(window.simulationTick){

        simulationTick(

            delta,

            NEXUS.settings.simulationSpeed

        );

    }

    requestAnimationFrame(gameLoop);

}

/* ==========================================================
   AUTOGUARDADO
========================================================== */

function autoSaveLoop(){

    if(!NEXUS.settings.autoSave)
        return;

    if(window.saveGame){

        saveGame();

        console.log("Autosave");

    }

}

function startAutosave(){

    setInterval(

        autoSaveLoop,

        NEXUS.settings.autoSaveInterval

    );

}

/* ==========================================================
   ATAJOS
========================================================== */

function registerHotkeys(){

    document.addEventListener(

        "keydown",

        e=>{

            switch(e.key){

                case " ":

                    e.preventDefault();

                    if(window.togglePause)
                        togglePause();

                    break;

                case "1":

                    if(window.setSimulationSpeed)
                        setSimulationSpeed(1);

                    break;

                case "2":

                    if(window.setSimulationSpeed)
                        setSimulationSpeed(2);

                    break;

                case "3":

                    if(window.setSimulationSpeed)
                        setSimulationSpeed(5);

                    break;

                case "F2":

                    if(window.toggleMapEditor)
                        toggleMapEditor();

                    break;

                case "F5":

                    location.reload();

                    break;

            }

        }

    );

}

/* ==========================================================
   VALIDACIÓN
========================================================== */

function validateBoot(){

    const required=[

        "simulationTick",

        "renderAll"

    ];

    const missing=[];

    required.forEach(name=>{

        if(typeof window[name]!=="function")

            missing.push(name);

    });

    if(missing.length){

        console.warn(

            "Missing:",

            missing

        );

    }

}

/* ==========================================================
   MENSAJE
========================================================== */

function printBanner(){

    console.log("");

    console.log("====================================");

    console.log("     NEXUS GLOBAL");

    console.log("     Alpha");

    console.log("====================================");

    console.log(

        "Version:",

        NEXUS.version

    );

    console.log("");

}

/* ==========================================================
   ARRANQUE
========================================================== */

async function boot(){

    if(NEXUS.boot.started)
        return;

    NEXUS.boot.started=true;

    printBanner();

    await bootData();

    await bootSimulation();

    await bootUI();

    await bootMap();

    bootCountry();

    validateBoot();

    registerHotkeys();

    startAutosave();

    requestAnimationFrame(

        gameLoop

    );

    NEXUS.boot.ready=true;

    console.log(

        "Game Ready"

    );

}

/* ==========================================================
   EXPORTS
========================================================== */

window.boot=boot;

window.bootData=bootData;

window.bootMap=bootMap;

window.bootUI=bootUI;

window.bootSimulation=bootSimulation;

/* ==========================================================
   AUTO START
========================================================== */

window.addEventListener(

    "load",

    boot

);
