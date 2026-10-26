# 🏢 Modo LOCAL — Servidor en tu red, sin internet

Todo corre **dentro de tu red**: un servidor en una PC, los datos y fotos en
ese disco duro, y respaldo automático diario al disco que indiques.
No se usa Supabase, Cloudinary ni Vercel. Nada sale a internet.

## Requisitos (en la PC que será servidor)

- Node.js 18 o superior (https://nodejs.org, versión LTS)
- Estar conectada a la misma red que los celulares/PCs de la operación

## Puesta en marcha (una sola vez)

```bat
cd bitacora-app
copy .env.local.example .env.local
installar Dependencias:
npm install
npm run build
```

1. Edita el archivo **iniciar-servidor.bat**:
   - `BACKUP_DIR` → carpeta del disco del colaborador para respaldos diarios (ej. `D:\RespaldosBitacora`)
   - `BACKUP_TIME` → hora del respaldo (ej. `20:00`)
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` → usuario inicial
2. Doble clic a **iniciar-servidor.bat** (o `npm run servidor`).
3. La consola mostrará la IP. En otro equipo ejecuta `ipconfig` para verla (ej. `192.168.1.50`).

## Acceso de todos

En cualquier celular o PC **de la misma red**:

```
http://192.168.1.50:8080
```

- En el celular: "Agregar a pantalla de inicio" → queda como app.
- En PC: ícono de instalar en la barra de direcciones.
- **Importante:** el PC servidor debe quedarse encendido. Si se apaga, nadie podrá capturar hasta encenderlo de nuevo.

## Seguridad (mismo nivel que la versión en nube)

- Usuario + contraseña (hash scrypt) y **2FA TOTP** (Google/Microsoft Authenticator)
- Sesiones firmadas con expiración (12 h)
- El primer inicio crea el usuario `ADMIN_EMAIL`. **Cámbiala** después:
  - Cuenta → (el servidor expone `POST /api/auth/cambiar-password` con `{"actual": "...", "nueva": "..."}`)
- Cada usuario se registra en cada evaluación, foto y bitácora (trazabilidad completa)

## Dónde viven los datos

```
bitacora-app/data/
├── db.json          ← TODA la información (catálogo, bitácoras, evaluaciones, acciones)
├── fotos/           ← las fotografías originales en disco
├── secret.key       ← llave de sesiones (no borrar ni compartir)
└── respaldos/       ← respaldos si no se configuró BACKUP_DIR externo
```

## Respaldo diario automático

Todos los días a la hora configurada (ej. 20:00), el servidor copia **db.json + todas
las fotos** a:

```
BACKUP_DIR\bitacora-respaldo-AAAA-MM-DD\
```

Ej.: `D:\RespaldosBitacora\bitacora-respaldo-2026-01-15\`

- Se puede forzar en cualquier momento: `POST /api/backup/ahora` con sesión válida.
- Recomendación: que `BACKUP_DIR` apunte a un **disco externo o segunda unidad** —
  así el respaldo sobrevive aunque falle el disco principal.

## Actualizar la aplicación

```bat
git pull
npm install
npm run build
```
y reiniciar el servidor (cerrar la ventana del .bat y volver a abrirla). Los datos **no se pierden**: viven en `data/`.

## Notas

- La barra de almacenamiento ahora muestra el **espacio real del disco** usado por fotos.
- El modo nube (Supabase/Cloudinary/Vercel) sigue disponible: basta con no poner
  `VITE_MODE=local` y configurar `.env` como antes. Los dos modos no comparten datos.
