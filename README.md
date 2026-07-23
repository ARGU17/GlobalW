# NEXUS Global — Alpha v1.0

Alpha jugable de simulación geopolítica y económica, reconstruida desde cero para funcionar de forma estable en GitHub Pages, sin backend y sin audio.

## Qué incluye

- Mapa estratégico SVG totalmente autónomo, sin APIs ni mapas externos.
- Vista mundial con selección y control de países.
- Vista regional detallada de las 17 comunidades autónomas españolas.
- España reforzada como escenario principal: economía, industria, logística, energía, tecnología y defensa mejoradas.
- Economía mensual con ingresos, gastos, deuda, inflación, desempleo, confianza, crecimiento y aprobación.
- Presupuestos configurables para sanidad, educación, defensa, infraestructura, I+D y protección social.
- Inversión regional en infraestructura, industria, energía y cohesión.
- Empresas, compra de participaciones y OPAs.
- Producción y despliegue de unidades terrestres, aéreas, navales y espaciales.
- Unidades con ilustraciones SVG propias y ligeras.
- Diplomacia: comercio, ayuda, inteligencia y sanciones.
- Proyectos nacionales, eventos y guardado local.
- Exportación e importación de partidas JSON.
- Diseño responsive para ordenador, tableta y móvil.

## Cómo publicar en GitHub Pages

1. Descomprime el ZIP.
2. Sube **todo el contenido** de la carpeta `nexus-alpha-v1` a la raíz de tu repositorio.
3. En GitHub abre `Settings → Pages`.
4. Selecciona la rama principal y la carpeta `/root`.
5. Espera a que GitHub publique la URL.

La estructura debe conservarse:

```text
index.html
css/styles.css
js/data.js
js/economy.js
js/map.js
js/ui.js
js/app.js
assets/icons/*.svg
```

## Ejecución local

Puede abrirse directamente con `index.html`, aunque se recomienda un servidor local:

```bash
python -m http.server 8080
```

Después abre `http://localhost:8080`.

## Modelo económico

Los datos son un **escenario ficticio de juego**, no una reproducción exacta de estadísticas oficiales. España parte deliberadamente reforzada para ofrecer una campaña rápida y con capacidad real de actuación. La economía se actualiza mensualmente y combina:

- presión fiscal y recaudación;
- gasto público y servicio de deuda;
- infraestructura, I+D, educación e industria;
- inflación, desempleo y confianza;
- energía, estabilidad y aprobación social.

## Compatibilidad

Probado como proyecto estático sin dependencias, compiladores ni paquetes npm. Funciona con navegadores modernos basados en Chromium, Safari y Firefox.
