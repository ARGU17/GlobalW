# NEXUS Global — Alpha v1.1

Simulador geopolítico, económico y estratégico ejecutable directamente en navegador. Esta versión recupera la profundidad de los prototipos anteriores y la integra en una arquitectura compacta, estable y preparada para GitHub Pages.

## Contenido jugable

### Economía nacional
- PIB, crecimiento, productividad, inflación, desempleo y confianza empresarial.
- Tesorería, deuda pública, tipo de interés, rating soberano y balanza comercial.
- Presupuesto detallado por sanidad, educación, defensa, infraestructuras, I+D y bienestar.
- Ingresos fiscales, gasto ministerial, servicio de deuda y mantenimiento militar.
- Políticas económicas temporales y proyectos nacionales.

### España reforzada
España comienza como la **8.ª economía mundial** del escenario, con una posición industrial, tecnológica, logística y energética superior a la base anterior, pero conserva restricciones de deuda, dependencia exterior y desigualdad regional.

### Gestión territorial
- Las 17 comunidades autónomas españolas son seleccionables.
- PIB, población, empleo, aprobación, estabilidad, energía, industria, infraestructura e investigación por región.
- Construcción y mejora de 17 tipos de instalaciones.
- Especializaciones y recursos regionales.

### Industria y mercados
- 22 empresas iniciales de sectores estratégicos.
- Compra y venta de participaciones.
- Control empresarial y OPAs sobre empresas extranjeras.
- Precios, capitalización, tendencia y exposición sectorial.

### Tecnología
- Árbol tecnológico con requisitos, costes, tiempos y efectos.
- Cola de investigación, puntos de I+D y tecnologías completadas.

### Defensa y seguridad
- 17 tipos de unidades terrestres, aéreas, navales, espaciales, misilísticas y cibernéticas.
- Producción, despliegue, mantenimiento, preparación, experiencia y doctrina.
- Combustible, munición, repuestos y capacidad logística.
- Guerra básica, alto el fuego y nivel de alerta nuclear.

### Diplomacia e inteligencia
- Relaciones bilaterales, comercio, ayuda, alianzas, sanciones y embargos.
- Rutas comerciales y eficiencia logística.
- Operaciones de inteligencia, espionaje tecnológico, sabotaje, interferencia y ciberoperaciones.
- Informes de inteligencia sobre países objetivo.

### Mundo dinámico
- IA económica y geopolítica para los países no controlados.
- Mercados mundiales de recursos.
- Tensión global, estrés energético, presión alimentaria y clima.
- Eventos estratégicos y objetivos nacionales.

## Visualización

- Mapa mundial estratégico con capas política, PIB, tecnología, estabilidad y poder militar.
- Vista territorial de España con comunidades autónomas interactivas.
- Marcadores visuales de industrias, recursos y unidades.
- Interfaz oscura de gran estrategia, adaptable a ordenador, tableta y móvil.
- 17 iconos SVG de unidades incluidos localmente.
- Sin audio, librerías externas, API keys ni backend.

> El mapa es una representación estratégica estilizada y no una cartografía GIS de precisión. Se ha priorizado rendimiento, legibilidad y funcionamiento completamente local.

## Publicación en GitHub Pages

1. Descomprime `NEXUS_Global_Alpha_v1.1_GitHub.zip`.
2. Sube **el contenido descomprimido**, no el ZIP.
3. Comprueba que `index.html` esté directamente en la raíz del repositorio.
4. Abre `Settings → Pages`.
5. Selecciona `Deploy from a branch`, rama `main` y carpeta `/ (root)`.

La raíz debe quedar así:

```text
index.html
404.html
.nojekyll
css/
js/
assets/
README.md
CHANGELOG.md
LICENSE.txt
```

## Ejecución local

Puede abrirse directamente, aunque para reproducir el entorno de GitHub Pages se recomienda:

```bash
python -m http.server 8080
```

Después abre `http://localhost:8080`.

## Controles

- `Espacio`: iniciar o pausar.
- `+1m`: avanzar un mes.
- `x1`, `x2`, `x4`: velocidad de simulación.
- Barra superior y dock inferior: navegación entre sistemas.
- Botones Guardar, Cargar y Exportar: persistencia local de campaña.

## Validación de la entrega

La distribución se ha comprobado mediante:

- validación sintáctica de todos los archivos JavaScript;
- verificación de rutas CSS, JS y SVG;
- arranque completo del navegador sin errores de ejecución;
- apertura de todos los paneles principales;
- avance de simulación y actualización económica anual;
- construcción, investigación, diplomacia, inteligencia y guerra básica.
