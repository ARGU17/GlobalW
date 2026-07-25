# NEXUS Global — Alpha v1.2

Simulador geopolítico, económico, político y militar ejecutable directamente en navegador y preparado para GitHub Pages.

## Cambios principales de v1.2

- **Tiempo diario:** a velocidad x1 cada día de juego dura 10 segundos reales. x2 equivale a 5 segundos y x4 a 2,5 segundos. El botón manual avanza exactamente un día.
- **Mapa mundial geográfico:** motor Canvas con proyección Web Mercator, mosaicos OpenStreetMap cuando existe conexión y límites vectoriales locales Natural Earth como respaldo.
- **197 países:** 193 miembros de Naciones Unidas más Palestina, Ciudad del Vaticano, Taiwán y Kosovo dentro del escenario jugable.
- **Cambio de país:** cualquier país inspeccionado puede convertirse en el país controlado durante la campaña.
- **Activos localizados:** industrias, energía, puertos, bases, infraestructuras y unidades aparecen sobre sus coordenadas al aumentar el zoom.
- **Economía productiva:** instalaciones únicas por territorio, niveles de ampliación, slots, capacidad nominal, empleo, demanda energética y requisitos de infraestructura/tecnología.
- **Fuerzas realistas:** cantidades físicas de efectivos, vehículos, aeronaves, buques, satélites y especialistas. Producción x1, x10, x100 y x1000.
- **Guerra diaria:** frentes, composición de fuerzas, bajas, control territorial, war score, reportes de batalla y resolución del conflicto.
- **Política:** 17 regímenes, transición institucional, elecciones, capital político y partidos.
- **Tecnología:** 32 tecnologías distribuidas entre digital, energía, industria, defensa, espacio, biotecnología, infraestructura, agricultura y sociedad.

## Economía

El modelo ya no interpreta cada clic como una fábrica idéntica adicional. Cada territorio puede disponer de una sola instalación de cada tipo y debe ampliarla por niveles. Los proyectos consumen slots territoriales y exigen determinadas capacidades de infraestructura, energía, tecnología, estabilidad o acceso costero.

Cada instalación tiene:

- capacidad nominal;
- empleo directo;
- producción económica;
- consumo o generación de energía;
- nivel máximo;
- requisitos de implantación;
- posición geográfica visible.

La utilización industrial depende de la confianza, logística y disponibilidad energética. La escasez reduce utilización y crecimiento, mientras que industria, logística y conocimiento mejoran gradualmente la economía.

España mantiene una posición inicial reforzada en industria, logística, renovables, tecnología y preparación militar, pero continúa condicionada por deuda, costes presupuestarios y desequilibrios territoriales.

## Política y partidos

Los países estratégicos incluidos en `js/politics.js` disponen de una selección de partidos reales usada como **plantilla de simulación**, no como afirmación sobre el gobierno o sondeos actuales. Para el resto de países se genera una estructura política nacional coherente para que todos los sistemas sean jugables.

## Cartografía y atribución

- Los límites de países se distribuyen localmente en `assets/maps/world-countries.geojson` y proceden de Natural Earth.
- El mapa puede superponer mosaicos estándar de OpenStreetMap. Estos requieren conexión a Internet y respetan la atribución mostrada dentro del mapa.
- El botón `▦` permite alternar entre la base OSM y el mapa vectorial local.
- No se implementa descarga masiva ni almacenamiento offline de mosaicos.

## Estructura

```text
index.html
404.html
.nojekyll
css/
  styles.css
js/
  polyfills.js
  world-data.js
  data.js
  catalog.js
  politics.js
  economy.js
  simulation-plus.js
  deep-systems.js
  map.js
  ui.js
  app.js
assets/
  icons/
  maps/world-countries.geojson
README.md
CHANGELOG.md
THIRD_PARTY_NOTICES.md
LICENSE.txt
```

## Publicación en GitHub Pages

1. Descomprime `NEXUS_Global_Alpha_v1.2_GitHub.zip`.
2. Sube **los archivos descomprimidos**, no el ZIP.
3. Comprueba que `index.html` esté directamente en la raíz del repositorio.
4. En GitHub abre `Settings → Pages`.
5. Selecciona `Deploy from a branch`, rama `main` y carpeta `/ (root)`.

## Ejecución local

```bash
python3 -m http.server 8080
```

Abre `http://localhost:8080`.

## Controles

- `Espacio`: pausar o continuar.
- `+1 día`: avance manual.
- `x1`: 10 segundos por día.
- `x2`: 5 segundos por día.
- `x4`: 2,5 segundos por día.
- Rueda o gesto: zoom del mapa.
- Arrastre: desplazamiento del mapa.
- `Ctrl/Cmd + S`: guardar.

## Validación realizada

- comprobación sintáctica de todos los JavaScript;
- verificación de rutas internas;
- arranque con 197 países;
- navegación por todos los paneles;
- avance manual y temporizado de un día;
- cambio de país controlado;
- producción militar por lotes y entrega de unidades;
- transición de régimen;
- declaración de guerra y generación de batalla diaria;
- renderizado vectorial del mapa cuando no existe conexión a mosaicos.
