# NEXUS Global — Alpha v1.5

Simulador geopolítico, económico, político, industrial y militar ejecutable directamente en navegador y preparado para GitHub Pages.

## Correcciones críticas de v1.5

### Construcción industrial

Se corrigió la causa real del fallo de las industrias. El procesador económico mensual modificaba todas las entradas de `productionQueue`, incluidas las colas diarias `facilityV3` y `unitV2`. Como estas no utilizaban `monthsRemaining`, el valor se convertía en `NaN` y la orden desaparecía al cerrar el mes.

La nueva versión:

- procesa mensualmente solo las órdenes heredadas basadas en meses;
- conserva íntegramente las colas diarias de industria y armamento;
- guarda país, región, instalación, coste, plazo y estado de cada proyecto;
- registra la instalación en la región elegida antes de retirar la cola;
- incorpora un libro de integridad para recuperar proyectos que desaparezcan de un guardado;
- mantiene la creación y ampliación de las 42 instalaciones disponibles.

### Inventario y despliegue militar

- Recuento real por tipo de unidad: personal, blindados, artillería, cazas, drones, fragatas, submarinos, misiles y demás sistemas.
- Las entregas de producción aumentan el inventario existente de la región de destino.
- Inventario agregado con cantidad, grupos, regiones, preparación y unidades en movimiento.
- Las fuerzas pueden dividirse en destacamentos para operar desde distintas regiones y abrir varios flancos.
- Movimiento regional animado y órdenes de ataque desde cada grupo desplegado.
- Los marcadores del mapa muestran cantidad, región, estado y tiempo restante de desplazamiento.

### Guerra, balance y anexiones

- Partes diarios de guerra con fuerza atacante y defensora, bajas, puntuación, control territorial y última batalla.
- Batallas regionales visibles en el mapa y en el Centro de Guerra.
- Condiciones de capitulación ligadas a la ventaja militar y territorial.
- Tratados con cuatro desenlaces:
  - paz negociada;
  - capitulación;
  - anexión de regiones ocupadas;
  - anexión completa del país derrotado.
- Las regiones anexionadas cambian de propietario y controlador.
- La anexión modifica tesorería, estabilidad, tensión internacional y acceso a recursos.
- Historial de conflictos y tratados resueltos.

### Política y coaliciones

- Gráfico semicircular dinámico: 180° representan el 100% del poder y la línea de 90° marca la mayoría.
- Conversión del apoyo electoral en 350 escaños simulados.
- Mesa de coalición con miembros del Gobierno, socios potenciales, escaños y coste político.
- Compatibilidad ideológica gradual:
  - acuerdos rápidos entre partidos próximos;
  - coaliciones viables desde el centro hacia izquierda o derecha;
  - acuerdos transversales difíciles;
  - extremos opuestos incompatibles.
- Botones funcionales para negociar y romper acuerdos.

## Sistemas incluidos

- 197 países jugables y cambio de Estado controlado durante la partida.
- Simulación diaria: x1 equivale a un día cada 10 segundos reales.
- Reloj horario dentro de cada día.
- Mapa Web Mercator con límites mundiales locales y OpenStreetMap opcional.
- 17 comunidades autónomas españolas y regiones estratégicas para el resto de países.
- Recursos, industria, empleo, población y modelo productivo regional.
- 42 instalaciones industriales, energéticas, sanitarias, agrícolas y logísticas.
- 62 tecnologías.
- Bolsa global con 176 empresas, compra, venta, cartera y OPAs.
- Comercio marítimo con barcos animados y entregas físicas.
- Producción militar x1, x10, x100 y x1000.
- Diplomacia, regímenes, partidos, elecciones, inteligencia y objetivos.
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
  alpha-v15.js
  map.js
  ui.js
  app.js
assets/
  icons/
  maps/
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

1. Descomprime `NEXUS_Global_Alpha_v1.5_GitHub.zip`.
2. Sube todos los archivos y carpetas interiores a la raíz del repositorio.
3. Comprueba que `index.html` esté directamente en la raíz.
4. En GitHub abre `Settings → Pages`.
5. Selecciona `Deploy from a branch`, rama `main` y carpeta `/ (root)`.
6. Espera el despliegue y realiza una recarga forzada.

No subas el ZIP sin descomprimirlo: GitHub Pages no lo extrae automáticamente.

## Ejecución local

```bash
python3 -m http.server 8080
```

Abre `http://localhost:8080`.

## Validación

```bash
node tests/model-validation.js
node tests/ui-render-validation.js
```

## Compatibilidad de guardados

v1.5 utiliza `nexus_alpha_v1_5_save` y migra automáticamente partidas de v1.4, v1.3, v1.2, v1.1 y v1.0. Los recursos CSS y JavaScript se cargan con versión de caché `v=1.5` para evitar que GitHub Pages o el navegador reutilicen archivos anteriores.

## Aviso bursátil

Los nombres corporativos se utilizan como referencia dentro de una simulación ficticia. Las cotizaciones y estados financieros no son datos reales ni asesoramiento financiero.
