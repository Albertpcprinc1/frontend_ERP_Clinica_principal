# Despliegue Frontend Intranet - EC2 como VPS

## Proyecto

ERP Clínica Principal - Centro Médico San Fernando Huaraz.

## Dominio de intranet

https://intranet.sanfernandocentromedico.com

## API productiva

https://api.sanfernandocentromedico.com/api

## Build productivo

El frontend Angular de intranet debe compilarse con:

npm run build:prod

o directamente:

npx ng build --configuration=production

## Environment productivo

Archivo:

src/environments/environment.prod.ts

Contenido esperado:

apiUrl: 'https://api.sanfernandocentromedico.com/api'

## Reemplazo de environment

En producción Angular reemplaza:

src/environments/environment.ts

por:

src/environments/environment.prod.ts

mediante fileReplacements en angular.json.

## Carpeta de salida del build

El build genera los archivos en:

dist/frontend_ERP_Clinica_principal/browser

## Carpeta destino en EC2

Los archivos compilados deberán copiarse en:

/var/www/sanfernando/intranet

## Nginx

Nginx servirá la intranet como aplicación SPA.

Regla requerida:

try_files $uri $uri/ /index.html;

Esto permite que rutas como:

/intranet/dashboard
/intranet/almacen
/intranet/catalogo-dci
/intranet/medicamentos

funcionen correctamente al refrescar el navegador.

## Validación

Después del build se debe verificar que el dist contenga:

api.sanfernandocentromedico.com

y que no contenga:

localhost:8085

Comando de validación en Windows:

Get-ChildItem .\dist -Recurse -File |
  Select-String -Pattern "api.sanfernandocentromedico.com|localhost:8085" |
  Select-Object Path, LineNumber, Line

## Estado

Frontend intranet preparado para despliegue inicial en EC2 administrada como VPS.