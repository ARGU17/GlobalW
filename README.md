# NEXUS Global — Alpha v1.4

Simulador geopolítico, económico, político, industrial y militar ejecutable directamente en navegador y preparado para GitHub Pages.

## Cambios principales de v1.4

### Construcción industrial protegida

La cola industrial se ha sustituido por un flujo transaccional:

1. el proyecto conserva país, región, instalación, coste cobrado y días restantes;
2. al terminar, el activo se registra en la región elegida;
3. si la región ya no existe, se intenta reubicar el proyecto;
4. si no puede completarse, el coste se reembolsa;
5. una instalación duplicada se transforma en una ampliación de nivel.

La validación automática comprueba los **42 tipos de instalaciones**, incluidos complejos farmacéuticos, alimentarios, petrolíferos, químicos, mineros, digitales y energéticos.

### Mapa mundial y Rusia

- Proyección Web Mercator con geometrías locales del mundo.
- Corrección del cruce del antimeridiano: Rusia, Fiyi y otros Estados ya no se dibujan sobre Canadá o el hemisferio incorrecto.
- Cálculo circular de límites geográficos para centrar y ajustar el zoom de países extensos.
- Selección de países mediante su geometría real.
- OpenStreetMap opcional como base visual; mapa vectorial local disponible sin conexión.
- Zoom máximo ampliado y marcadores de industrias, unidades, rutas y batallas.

### Territorios y recursos

- Regiones estratégicas para los 197 países.
- España conserva sus 17 comunidades autónomas con geometría detallada.
- Cada región muestra población, PIB, infraestructura, industria, energía, estabilidad, defensa y producción de recursos.
- Los recursos regionales pueden inspeccionarse antes de iniciar una ofensiva.
- El suelo industrial se amplía en bloques de **2 slots** con un coste reducido y progresivo.

### Industria ampliada

El catálogo contiene **42 instalaciones**, entre ellas:

- plantas farmacéuticas y campus biotecnológicos;
- complejos alimentarios y agroindustriales;
- refinerías, campos petrolíferos, yacimientos de gas y terminales de GNL;
- petroquímica, fertilizantes y química avanzada;
- minas de cobre y litio;
- gigafactorías de baterías, electrónica y bienes de equipo;
- centros de datos, desaladoras, hidrógeno, geotermia e hidroeléctrica;
- reciclaje, industria textil y producción de defensa.

Cada instalación consume slots, energía y capacidad territorial, genera empleo, modifica la producción y puede ampliarse por niveles.

### Bolsa global

- **176 empresas** en el escenario.
- Nombres corporativos reales usados como referencia visual.
- Precios, capitalización, ingresos, beneficio, PER, dividendo y evolución diaria totalmente ficticios.
- Compra del 1% o 5%, venta, cartera por Estado y OPA.
- Filtros por texto y sector.

### Investigación

- **62 tecnologías** en ramas de energía, industria, digitalización, salud, alimentación, infraestructuras, defensa, espacio, clima y ciencia.
- Requisitos encadenados, coste, duración y efectos nacionales.

### Fuerzas regionales y conquista

- Las unidades se asignan a regiones concretas.
- Movimiento animado sobre el mapa con plazo según distancia y movilidad.
- Ataques contra regiones enemigas cuando existe una guerra activa.
- Batallas diarias con fuerza atacante, defensa regional, logística, bajas y progreso de control.
- Una región capturada cambia de controlador y concede acceso a sus recursos.

### Coaliciones políticas

- Eje ideológico de extrema izquierda a extrema derecha.
- La compatibilidad determina coste político y probabilidad de acuerdo.
- Partidos próximos se coaligan con facilidad; los extremos opuestos son incompatibles.
- Coaliciones de centro con izquierda o derecha son viables; acuerdos transversales requieren más negociación.
- Gráfico semicircular dinámico: **180° representan el 100% del poder** y la marca de **90° representa el 50%**.

## Sistemas conservados

- 197 países jugables y cambio de país durante la campaña.
- Un día cada 10 segundos reales a x1; x2, x4 y avance manual.
- Reloj horario dentro del día.
- Producción y consumo de ocho recursos en la barra superior.
- Comercio marítimo con barcos animados y entregas físicas.
- Producción militar x1, x10, x100 y x1000.
- Regímenes, elecciones, partidos, diplomacia, inteligencia y guerra mundial.
- Guardado local, importación y exportación JSON.

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
  alpha-v13.js
  alpha-v14.js
  map.js
  ui.js
  app.js
assets/
  icons/
  maps/
    world-countries.geojson
    spain-autonomous-regions.topojson
tests/
  model-validation.js
  ui-render-validation.js
README.md
CHANGELOG.md
VALIDATION.md
THIRD_PARTY_NOTICES.md
UPLOAD_TO_GITHUB.md
LICENSE.txt
```

## Publicación en GitHub Pages

1. Descomprime `NEXUS_Global_Alpha_v1.4_GitHub.zip`.
2. Sube **todo el contenido descomprimido**, no el ZIP.
3. Comprueba que `index.html` esté directamente en la raíz del repositorio.
4. En GitHub abre `Settings → Pages`.
5. Selecciona `Deploy from a branch`, rama `main` y carpeta `/ (root)`.
6. Tras publicar, realiza una recarga forzada para eliminar la caché de versiones anteriores.

## Ejecución local

```bash
python3 -m http.server 8080
```

Abre `http://localhost:8080`.

## Validación del modelo

Con Node.js instalado:

```bash
node tests/model-validation.js
```

## Compatibilidad de guardados

v1.4 utiliza una clave de guardado nueva y migra partidas de v1.3, v1.2, v1.1 y v1.0. Las colas industriales antiguas se convierten al formato protegido `facilityV3`.

## Aviso bursátil

Los nombres de empresas se utilizan únicamente como referencia dentro de una simulación ficticia. Ninguna cotización ni estado financiero debe interpretarse como información real o asesoramiento financiero.
