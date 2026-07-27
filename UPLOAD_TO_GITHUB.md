# Subir NEXUS Global Alpha v1.5 a GitHub Pages

1. Descarga y descomprime `NEXUS_Global_Alpha_v1.5_GitHub.zip`.
2. Abre la carpeta descomprimida.
3. Selecciona todos los archivos y carpetas interiores.
4. Súbelos a la raíz del repositorio.
5. Comprueba esta estructura:

```text
index.html
404.html
.nojekyll
css/
js/
assets/
tests/
README.md
```

6. En GitHub: `Settings → Pages → Deploy from a branch → main → / (root)`.
7. Espera a que finalice el despliegue.
8. Haz una recarga forzada del navegador.

Los archivos se solicitan con `?v=1.5`, por lo que el navegador no debería reutilizar JavaScript o CSS de v1.4.

No subas únicamente el ZIP: GitHub Pages no lo descomprime.
