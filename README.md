# NEXUS Global — Alpha v1.0.1

Alpha jugable de simulación geopolítica y económica, preparada para alojamiento estático en GitHub Pages. No necesita backend, npm, API keys ni audio.

## Correcciones de esta versión

- Estructura preparada para que `index.html` quede en la raíz del repositorio.
- Carga robusta de partidas antiguas o incompletas.
- Recuperación segura cuando `localStorage` contiene datos de versiones anteriores.
- Comprobación de rutas relativas para GitHub Pages.
- Página `404.html` compatible con Pages.
- Versión modular y versión autónoma de un único archivo.

## Publicación en GitHub Pages

> GitHub no descomprime archivos ZIP dentro de un repositorio. Primero debes descomprimir el ZIP y después subir su contenido.

1. Descomprime `NEXUS_Global_Alpha_v1.0.1_GitHub.zip`.
2. Abre la carpeta descomprimida.
3. Sube a la raíz del repositorio estos elementos: `index.html`, `404.html`, `css`, `js`, `assets`, `.nojekyll`, `README.md` y `LICENSE.txt`.
4. En GitHub, abre `Settings → Pages`.
5. En **Build and deployment**, selecciona **Deploy from a branch**.
6. Selecciona la rama principal y la carpeta `/ (root)`.

La raíz del repositorio debe verse así:

```text
index.html
404.html
.nojekyll
css/
js/
assets/
README.md
LICENSE.txt
```

No subas la carpeta contenedora completa como un nivel adicional. `index.html` debe quedar directamente en la raíz.

## Alternativa para móvil o iPad

La distribución `NEXUS_Global_Alpha_v1.0.1_SingleFile.zip` contiene un único `index.html` autónomo. Es la opción más sencilla cuando GitHub no permite subir carpetas desde el dispositivo.

## Ejecución local

La versión modular puede abrirse directamente, aunque se recomienda un servidor local:

```bash
python -m http.server 8080
```

Después abre `http://localhost:8080`.

## Contenido

- Mapa estratégico SVG sin dependencias externas.
- Vista mundial y gestión detallada de las 17 comunidades autónomas españolas.
- España reforzada como potencia industrial europea.
- Economía mensual con PIB, inflación, desempleo, deuda, tesorería, fiscalidad y presupuestos.
- Industria, empresas, compra de participaciones y OPAs.
- Producción y despliegue de unidades terrestres, aéreas, navales y espaciales.
- Diplomacia, comercio, ayuda, inteligencia y sanciones.
- Proyectos nacionales, eventos y guardado local.
- Exportación e importación de partidas JSON.
- Interfaz responsive para ordenador, tableta y móvil.
