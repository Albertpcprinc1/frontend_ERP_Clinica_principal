# ERP Clínica Principal - Frontend Angular

Frontend principal tipo intranet del sistema ERP_CLINICA_PRINCIPAL, desarrollado inicialmente para el Centro Médico San Fernando Huaraz.

## Estado actual

Base visual inicial creada con Angular.

Incluye:

- Angular standalone
- Routing habilitado
- SCSS
- Pantalla institucional inicial
- Paleta visual basada en la identidad de Centro Médico San Fernando
- Logo institucional
- Environment local apuntando al backend Spring Boot

## Tecnologías

- Angular
- TypeScript
- SCSS
- Node.js / npm

## Backend local

El frontend consume el backend desde:

http://localhost:8085/api

Configurado en:

src/environments/environment.ts

## Ejecución local

Instalar dependencias:

npm install

Levantar frontend:

ng serve --port 4300

Abrir en navegador:

http://localhost:4300

## Build

npm run build

## Próximos módulos

- Login
- Layout intranet
- Dashboard
- Almacén / Logística
- Inventario farmacéutico
- Kardex
- Alertas de stock y vencimiento