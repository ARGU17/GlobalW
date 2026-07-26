# NEXUS Global — Alpha v1.3

Simulador geopolítico, económico, político, industrial y militar ejecutable directamente en navegador y preparado para GitHub Pages.

## Novedades principales de v1.3

### Bolsa global recuperada y ampliada

- Panel **Bolsa** integrado en la navegación principal y en la barra inferior.
- 74 empresas cotizadas dentro del escenario, incluyendo compañías españolas e internacionales con nombres reales.
- Índices simulados, cotización diaria, capitalización, ingresos, beneficio, margen, PER, dividendo y beta.
- Compra y venta de participaciones con cargo a la tesorería del país controlado.
- OPA para alcanzar el control estratégico de una empresa.
- Cartera independiente para cada país controlable.

Los nombres corporativos se usan únicamente como referencia visual. Todos los precios, estados financieros y movimientos son ficticios y no constituyen datos de mercado.

### Comercio marítimo visible

- Cada acuerdo comercial crea o activa un corredor marítimo.
- Los corredores disponen de uno o varios buques según su volumen.
- Los barcos se desplazan visualmente en el mapa entre los puertos de ambos países.
- Cada viaje lleva el recurso que mejor compensa el excedente del exportador y el déficit del importador.
- Las entregas modifican inventarios, importaciones, exportaciones y tesorería.
- El panel de Diplomacia lista rutas, cargas, buques y progreso.

### Producción y consumo de recursos

La barra superior muestra en tiempo real la producción, el consumo y el balance de:

- electricidad;
- alimentos;
- combustibles;
- acero;
- vehículos;
- electrónica;
- maquinaria;
- medicamentos.

Los balances dependen de población, capacidad industrial, energía, tecnología e instalaciones construidas. Los déficits pueden cubrirse mediante rutas comerciales.

### Reloj horario

- Se mantiene la velocidad de **1 día cada 10 segundos reales** a x1.
- El reloj muestra el avance horario dentro del día en formato `HH:MM:SS`.
- x2 y x4 aceleran tanto el reloj como el cambio de día de forma sincronizada.
- Pausar conserva la hora exacta alcanzada.

### Comunidades autónomas en el mapa

- Las 17 comunidades autónomas españolas se dibujan como polígonos seleccionables al acercar el mapa.
- Se muestran etiquetas, capital, población, PIB, industria y desempleo.
- Una lista lateral permite seleccionar directamente cada comunidad.
- El juego intenta cargar geometría administrativa detallada de `es-atlas`; si no hay conexión usa un respaldo local incluido.

### Empleo, población y modelo productivo

- Ampliar una instalación aumenta inmediatamente capacidad, producción y empleo directo.
- El cierre mensual aplica los nuevos puestos al desempleo, vacantes, migración y población.
- La población evoluciona por crecimiento natural y migración neta.
- El PIB y la productividad reaccionan a empleo, capacidad, tecnología y demografía.
- El modelo productivo cambia gradualmente según las instalaciones dominantes: automoción, industria pesada, energía, digital, defensa y construcción.
- Las comunidades reciben su parte del crecimiento de empleo y población.

## Sistemas conservados de v1.2

- 197 países jugables y cambio de país durante la campaña.
- Simulación diaria y botón de avance manual.
- Mapa Canvas/Web Mercator, OpenStreetMap opcional y límites locales Natural Earth.
- Instalaciones y unidades localizadas sobre el mapa.
- Producción militar x1, x10, x100 y x1000.
- Guerra diaria con frentes, composición de fuerzas, bajas, control territorial y reportes de batalla.
- 17 regímenes políticos, elecciones, transiciones y partidos.
- Más de 30 tecnologías.
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
  map.js
  ui.js
  app.js
assets/
  icons/
  maps/
    world-countries.geojson
    spain-autonomous-regions.topojson
README.md
CHANGELOG.md
THIRD_PARTY_NOTICES.md
UPLOAD_TO_GITHUB.md
LICENSE.txt
```

## Publicación en GitHub Pages

1. Descomprime `NEXUS_Global_Alpha_v1.3_GitHub.zip`.
2. Sube **el contenido descomprimido**, no el ZIP.
3. Verifica que `index.html` esté directamente en la raíz del repositorio.
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

## Compatibilidad de guardados

La versión v1.3 intenta migrar partidas de v1.2, v1.1 y v1.0. Las antiguas rutas comerciales se convierten automáticamente al nuevo formato con buques y cargas.
