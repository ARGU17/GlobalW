# Validación técnica — Alpha v1.3

Comprobaciones realizadas antes de empaquetar:

- sintaxis válida en los 12 archivos JavaScript mediante `node --check`;
- 197 países creados por el motor;
- 74 empresas disponibles en la Bolsa;
- ocho recursos con producción, consumo, inventario y balance;
- migración de las rutas comerciales antiguas al formato con buques;
- rutas iniciales normalizadas y buques con carga y movimiento diario;
- creación de una ruta nueva al firmar un acuerdo comercial;
- compra y venta de participaciones;
- ampliación industrial y aumento de empleo directo;
- avance de 35 días, cierre mensual y actualización de población;
- 17 comunidades autónomas en el archivo regional local;
- orden correcto de carga de scripts;
- ausencia de rutas locales rotas en `index.html`;
- respuesta HTTP 200 para HTML, CSS, JavaScript y ambos mapas locales.

La validación de lógica se ejecutó en un entorno JavaScript aislado. La prueba visual automatizada con Chromium no estuvo disponible en el entorno de empaquetado; por ello se recomienda una recarga forzada del navegador después de publicar para evitar caché de versiones anteriores.
