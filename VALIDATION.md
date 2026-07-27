# Validación técnica — Alpha v1.5

## Comprobaciones automáticas

- Sintaxis válida en todos los archivos JavaScript mediante `node --check`.
- 197 países creados por el motor.
- 176 empresas disponibles en Bolsa.
- 42 instalaciones industriales, energéticas, sanitarias y logísticas.
- 62 tecnologías.
- 17 comunidades autónomas españolas.
- Los 13 paneles principales se renderizan mediante una prueba DOM aislada.
- El panel político contiene el semicírculo, el marcador de mayoría y la Mesa de Coalición.
- El panel militar contiene inventario, producción, despliegue, batallas y tratados.

## Prueba de construcción al cambiar de mes

1. Se inicia una instalación en una región española.
2. Se fija el calendario en el último día del mes.
3. Se avanza al mes siguiente.
4. Se comprueba que la cola `facilityV3` sigue existiendo.
5. Se avanza hasta completar el plazo.
6. Se confirma que la instalación aparece en la región y la cola se retira únicamente después.

Resultado: **correcto**.

## Prueba de producción militar al cambiar de mes

1. Se registra el inventario inicial de submarinos.
2. Se lanza una orden de 10 unidades.
3. Se cruza el cierre mensual.
4. Se comprueba que la orden `unitV2` no desaparece.
5. Se completa la producción.
6. Se comprueba que el inventario aumenta exactamente en 10.

Resultado: **correcto**.

## Prueba de frentes y despliegue

- División de un grupo de infantería en un nuevo destacamento.
- Creación de un grupo independiente.
- Asignación a una región diferente.
- Movimiento y posición territorial conservados.

Resultado: **correcto**.

## Prueba de guerra y anexión

- Declaración de guerra.
- Ventaja militar suficiente.
- Capitulación del defensor.
- Anexión total.
- Todas las regiones cambian a `ownerId` y `controllerId` del vencedor.
- El país derrotado queda registrado como no soberano y anexionado.

Resultado: **correcto**.

## Prueba política

- Los partidos reciben un reparto normalizado de 350 escaños.
- Mayoría absoluta fijada en 176 escaños.
- Partidos próximos tienen compatibilidad alta.
- Extrema izquierda y extrema derecha tienen probabilidad de coalición cero.
- Gráfico y controles se renderizan en el panel político.

Resultado: **correcto**.

## Ejecución reproducible

```bash
node tests/model-validation.js
node tests/ui-render-validation.js
```

Salida principal esperada:

```json
{
  "ok": true,
  "version": "1.5-alpha",
  "countries": 197,
  "companies": 176,
  "industries": 42,
  "technologies": 62,
  "regionsSpain": 17
}
```

La captura automatizada con Chromium no fue fiable en el entorno de empaquetado por restricciones del proceso gráfico. Sí se completaron las pruebas sintácticas, de modelo, colas, producción, movimiento, anexión y renderizado DOM.
