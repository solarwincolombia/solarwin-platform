# Solarwin Platform — Guía para Claude Code

## ¿Qué es esto?
Plataforma web para la red de aliados de Solarwin S.A.S. (Colombia).
Permite a brokers e instaladores solares cotizar proyectos, gestionar clientes y cobrar comisiones bajo la marca Solarwin.

## Stack
- **Frontend + Backend**: Next.js 14 (App Router, TypeScript)
- **Base de datos + Auth**: Supabase (PostgreSQL + RLS)
- **Estilos**: Tailwind CSS
- **Deploy**: Vercel

## Cómo correr localmente
```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.local.example .env.local
# → Llenar con tus credenciales de Supabase (ver Setup Supabase abajo)

# 3. Correr en desarrollo
npm run dev
# → Abre http://localhost:3000
```

## Setup Supabase (solo primera vez)
1. Crear proyecto en https://app.supabase.com
2. Ir a SQL Editor → pegar el contenido de `supabase/migrations/001_initial_schema.sql` → ejecutar
3. Copiar URL y anon key desde Settings → API → pegar en `.env.local`

## Estructura del proyecto
```
src/
  app/
    page.tsx                   → Landing pública (/)
    (auth)/
      login/page.tsx           → Login
      register/page.tsx        → Registro (broker o instalador)
    (broker)/
      layout.tsx               → Layout con nav para brokers
      dashboard/page.tsx       → Dashboard broker
      quoter/page.tsx          → Cotizador paso a paso
      quotes/page.tsx          → Lista de cotizaciones (TODO)
      commissions/page.tsx     → Comisiones (TODO)
      resources/page.tsx       → Materiales de ventas (TODO)
    (installer)/
      layout.tsx               → Layout con nav para instaladores
      dashboard/page.tsx       → Dashboard instalador
      projects/page.tsx        → Proyectos (TODO)
      support/page.tsx         → Soporte técnico (TODO)
      warranties/page.tsx      → Garantías (TODO)
      payments/page.tsx        → Pagos (TODO)
      equipment/page.tsx       → Catálogo de equipos (TODO)
  components/
    ui/
      TopBar.tsx               → Barra superior con logo y logout
      SideNav.tsx              → Navegación lateral
  lib/
    supabase/
      client.ts                → Cliente Supabase (browser)
      server.ts                → Cliente Supabase (server components)
  middleware.ts                → Protección de rutas por rol
  types/
    database.ts                → Tipos TypeScript del schema
supabase/
  migrations/
    001_initial_schema.sql     → Schema completo de la DB
```

## Roles de usuario
- **broker**: Puede crear cotizaciones, ver comisiones, acceder a materiales
- **installer**: Puede ver proyectos asignados, solicitar equipos, activar garantías
- **admin**: Acceso total (panel admin por construir)

## Branding Solarwin
- Navy: `#1A2A3A`
- Amarillo: `#FFC107`
- Fondo: `#F5F7FA`

## Páginas por construir (TODO)
- [ ] `(broker)/quotes/page.tsx` — tabla de cotizaciones con filtros y descarga PDF
- [ ] `(broker)/commissions/page.tsx` — historial y estado de comisiones
- [ ] `(broker)/resources/page.tsx` — descarga de materiales de ventas
- [ ] `(installer)/projects/page.tsx` — proyectos con pipeline de etapas
- [ ] `(installer)/support/page.tsx` — tickets de soporte
- [ ] `(installer)/warranties/page.tsx` — garantías por proyecto
- [ ] `(installer)/payments/page.tsx` — historial de pagos
- [ ] `(installer)/equipment/page.tsx` — catálogo + solicitud de equipos
- [ ] `app/(admin)/` — panel admin completo
- [ ] Generación de PDF de cotización (react-pdf o puppeteer)
- [ ] Notificaciones por email (Resend o Supabase Edge Functions)
- [ ] Panel de precios editable por admin

## Comisión Solarwin
```
Mes 1: 25% de (50% del valor del proyecto)
Mes 2: 20% de (50% del valor del proyecto)
Mes 3: 15% de (50% del valor del proyecto)
```
Las comisiones se pagan cuando el cliente realiza cada desembolso.

## Precio de referencia del sistema
- Precio base: $3.200.000 COP por kWp instalado
- Panel: 635W Tier 1
- kWp por panel: 0.635
