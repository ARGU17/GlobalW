# Validación técnica — Alpha v1.4

## Comprobaciones automáticas

- Sintaxis válida en los 13 archivos JavaScript mediante `node --check`.
- JSON válido en el GeoJSON mundial y el TopoJSON regional español.
- 197 países creados por el motor.
- 176 empresas disponibles en la Bolsa.
- 42 instalaciones industriales, energéticas, sanitarias y logísticas.
- 62 tecnologías en el árbol de investigación.
- 17 comunidades autónomas españolas.
- Ocho recursos nacionales y regionales.
- Identificadores únicos para empresas, instalaciones y tecnologías.
- Todas las rutas CSS, JavaScript y cartográficas referenciadas desde `index.html` existen.
- Los 13 paneles principales se renderizan mediante una prueba DOM aislada.
- El panel político contiene el semicírculo dinámico y el marcador de mayoría.
- El panel bursátil renderiza la ampliación a 176 empresas con límite visual de 60 tarjetas por consulta para mantener rendimiento.

## Prueba del fallo de construcción

Se ejecutó una campaña independiente para cada uno de los 42 tipos de instalación:

1. inicio del proyecto;
2. confirmación del cobro y de la cola `facilityV3`;
3. reducción forzada a un día restante;
4. avance de la simulación;
5. comprobación de que la instalación aparece en la región elegida;
6. comprobación de que solo entonces se elimina la entrada de la cola.

Resultado: **42/42 instalaciones completadas correctamente**.

También se verificó la construcción en un país distinto de España, registrando el activo en su región estratégica.

## Mapa

- El GeoJSON incluye 204 geometrías y cubre los 197 Estados jugables.
- La geometría de Rusia cruza ±180°. El nuevo algoritmo desenvuelve cada anillo antes de proyectarlo y elimina saltos superiores a media vuelta del mundo.
- El límite circular calculado para Rusia es de aproximadamente 170,44° de longitud, con centro geográfico cercano a 104,88° E; ya no se interpreta como una geometría superpuesta sobre Canadá.
- El encuadre de países usa límites circulares, no únicamente un centro manual.

## Fuerzas y regiones

- Movimiento entre regiones completado y posición final registrada.
- Declaración de guerra y ofensiva regional iniciadas correctamente.
- Conquista de una región de validación, cambio de controlador y acceso a recursos comprobados.
- La región ocupada aparece entre los territorios controlados y transfiere el 55% de su producción regional.
- Batallas rechazadas frente a defensores superiores también comprobadas.

## Política

- Partidos con distancia ideológica extrema: probabilidad de coalición 0.
- Partidos próximos: compatibilidad alta o muy alta.
- Apoyo de coalición y eje político recalculados dinámicamente.
- Semicírculo proporcional generado con el total de partidos normalizado al 100%.

## Ejecución reproducible

```bash
node tests/model-validation.js
node tests/ui-render-validation.js
```

Salida esperada:

```json
{
  "ok": true,
  "version": "1.4-alpha",
  "countries": 197,
  "companies": 176,
  "industries": 42,
  "technologies": 62,
  "regionsSpain": 17
}
```

La navegación visual automatizada con Chromium está bloqueada en el entorno de empaquetado. Se realizaron validaciones sintácticas, de datos, de lógica y de integridad del paquete; se recomienda una recarga forzada tras publicar para evitar caché de v1.3.
