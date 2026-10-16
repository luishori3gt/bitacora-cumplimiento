# 📋 Bitácora de Cumplimiento — Accel-VPC

App web progresiva (**PWA**) para documentar diariamente el cumplimiento por área con
**evidencia fotográfica obligatoria**, comentarios, indicadores y seguridad con
**verificación en 2 pasos (2FA)**. Funciona en **móvil y escritorio** con una sola base de código
(se instala como app en Android, iOS y Windows).

## Stack elegido

| Capa | Servicio | Por qué |
|---|---|---|
| Base de datos + Auth 2FA | **Supabase** (Postgres) | Auth con TOTP nativo, RLS, API automática, plan gratis |
| Fotos + barra de almacenamiento | **Cloudinary** | API de cuota en tiempo real, compresión automática, ~25 GB gratis |
| Hosting (alternativa a Netlify) | **Vercel** | Deploy desde GitHub, HTTPS y dominio gratis |
| Frontend | React + Vite + PWA (vite-plugin-pwa) | Offline, instalable, rápida |

## Estructura

```
bitacora-app/
├── src/
│   ├── pages/            Login (con 2FA), Home (bitácora diaria), AreaCapture,
│   │                     Dashboard (indicadores), Account (activar 2FA con QR)
│   ├── components/       StorageBar (barra de almacenamiento Cloudinary)
│   └── supabase.js       Cliente y configuración
├── supabase/
│   ├── schema.sql        Tablas, RLS, vista de calificaciones y función de cierre
│   ├── seed.sql          Catálogo: 8 áreas y 237 lineamientos (desde tu Excel)
│   └── functions/cloudinary-usage/   Edge Function para la barra de cuota
└── public/icons/         Íconos PWA
```

## Reglas de negocio implementadas

- ✅ **Una bitácora por día**, la **fecha se asigna automáticamente** al iniciarla.
- ✅ **Botones por cada área** (las 8 pestañas del Excel) con progreso en vivo.
- ✅ Cada lineamiento: **Cumple / No cumple / No revisado** + **comentario/hallazgo**.
- ✅ **Mínimo 2 fotos por área** y todos los lineamientos evaluados para poder
  **cerrar el área y la bitácora del día** (bloqueo en el cliente Y en la base de datos).
- ✅ Dashboard con **% de cumplimiento por Área, por Área+Clasificación, por día y total**.
- ✅ **Barra de almacenamiento** (usado/disponible en Cloudinary) con alertas al 70% y 90%.
- ✅ **2FA TOTP** (Google/Microsoft Authenticator) con código QR.

## Puesta en marcha

### 1. Supabase (https://supabase.com → New Project)
1. SQL Editor → pega y ejecuta `supabase/schema.sql`.
2. Después ejecuta `supabase/seed.sql` (carga las 8 áreas y 237 lineamientos).
3. Authentication → habilita **Email**; crea los usuarios de tu equipo (o activa
   "Allow new users to sign up" y desactívalo después de invitarlos).
4. Anota **Project URL** y **anon key**.

### 2. Cloudinary (https://cloudinary.com → gratis)
1. Settings → Upload → **Add upload preset** → modo **Unsigned** con nombre `bitacora_unsigned`.
2. Anota tu **cloud name**. La **API key/secret** van en la Edge Function (paso 4).

### 3. App
```bash
cd bitacora-app
cp .env.example .env   # y llena los 4 valores
npm install
npm run dev            # prueba local
```

### 4. Edge Function de la barra de almacenamiento
```bash
npm i -g supabase
supabase login
supabase link --project-ref TU-REF
supabase secrets set CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=...
supabase functions deploy cloudinary-usage
supabase functions deploy cloudinary-destroy   # borrado seguro de fotos
```

### 5. Publicar en Vercel (alternativa a Netlify)
```bash
npm i -g vercel
vercel            # primera vez: vincula el proyecto
vercel --prod
```
En Vercel → Settings → Environment Variables agrega las 4 variables `VITE_*`.
También puedes conectar el repo de GitHub y que cada push se despliegue solo.

### 6. Instalar como app (las "2 versiones")
- **Móvil:** abre la URL en Chrome/Safari → "Agregar a pantalla de inicio".
- **Escritorio:** abre la URL en Chrome/Edge → ícono de instalar en la barra de direcciones.

## Primer arranque de cada usuario
1. Inicia sesión con correo y contraseña.
2. Ve a **Cuenta / 2FA** → escanea el QR con Google Authenticator → verifica.
3. A partir de ahí el login pedirá siempre el código de 6 dígitos.
