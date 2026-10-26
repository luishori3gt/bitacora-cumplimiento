# 📋 Manual de Usuario — Bitácora de Cumplimiento Accel-VPC

**Versión 2.0** · Aplicación para registrar diariamente el cumplimiento por área con evidencia fotográfica, indicadores y acciones correctivas.

---

## 1. Ingresar a la aplicación

1. Abre la app desde el ícono instalado (celular o PC). Si no la tienes instalada, entra al enlace del sitio y usa "Instalar aplicación".
2. Escribe tu **correo** y **contraseña**.
3. Escribe el **código de 6 dígitos** de tu app autenticadora (Google/Microsoft Authenticator).
4. Si es tu primer ingreso: ve a **Cuenta / 2FA → + Activar**, escanea el código QR con la app autenticadora y verifica. La app cerrará sesión y volverás a entrar con tu nuevo código.

> ⚠️ Sin el código de 6 dígitos no se puede entrar, aunque la contraseña sea correcta. Esto es un requisito de seguridad de TI.

---

## 2. Iniciar la bitácora del día (una por día)

1. Pestaña **📋 Bitácora**.
2. Verifica el campo **Sitio / almacén** (ej. "Accel-VPC"). Puedes escribir otro si aplican varios.
3. Presiona **▶ Iniciar bitácora de hoy**. La **fecha se asigna automáticamente**.
4. Aparecen las **8 áreas** como botones. Cada una muestra:
   - `0/4 evaluados` → lineamientos ya evaluados / total
   - `📷 0/2` → fotos tomadas / mínimo requerido
   - % de cumplimiento ponderado en vivo

> ❗ Solo puede existir **una bitácora por día**. Si el día ya fue iniciado por otro compañero, continuarás sobre la misma.

---

## 3. Evaluar un área

1. Toca el botón del área (ej. "Aduana principal").
2. Verás los **lineamientos agrupados por Clasificación** (Lavado de manos, Instalaciones, etc.).
3. Para cada lineamiento elige una opción:

| Botón | Cuándo usarlo | Qué pasa |
|---|---|---|
| **✔ Cumple** | El punto se cumple | Se guarda al instante |
| **✘ No cumple** | Hay incumplimiento | Se guarda y **se abre el registro de Acción Correctiva** (ver sección 4) |
| **— No revisado** | El punto no pudo revisarse ese día | Cuenta como "no evaluado", no afecta el % (pero **bloquea cerrar el área**) |

4. Debajo de cada lineamiento hay una caja **"Hallazgo / comentario…"**: describe lo observado (ej. "Puerta trasera sin cierre completo"). Es obligatorio dar contexto en cada "No cumple".
5. Debajo verás **👤 quién evaluó y a qué hora** — es la trazabilidad del registro.

> 📶 **Sin internet:** todo se guarda en el teléfono y se sube solo al regresar la señal. No detengas la ronda por falta de señal.

---

## 4. Acción correctiva (al marcar "No cumple")

Al marcar **✘ No cumple** la app pregunta:

1. **¿Quién es el responsable de corregirlo?** (por defecto, tu usuario — cámbialo si es otra persona)
2. **Fecha límite** (por defecto, 7 días)

Con eso se crea automáticamente una **acción correctiva** visible en la pestaña **✅ Acciones**. Ahí se puede:
- Cambiar el responsable o la fecha límite
- Cambiar el estatus: **Abierta → En proceso → Resuelta** (o Cancelada)
- Ver alertas de acciones **vencidas** ⏰ y **críticas sin resolver** ❗

> Los hallazgos **críticos** (higiene, lavado de manos, contaminación cruzada, plagas) son los que más urgen cerrar: penalizan más en la calificación.

---

## 5. Fotos de evidencia

### Dónde se toman
- **Fotos generales del área**: mínimo **2 por área**, obligatorias para cerrar.
- **📷 Foto por lineamiento**: cada punto tiene su propio botón — la foto queda adjunta a ese punto específico.

### Cómo
| Botón | Función |
|---|---|
| **📸 Tomar foto con la cámara** | Abre la cámara en vivo (webcam en PC / cámara del celular). Botón "📸 Tomar foto" para capturar |
| **📎 Subir archivo(s)** | Adjunta fotos ya existentes (permite varias) |
| **✕** sobre la miniatura | Elimina la foto (solo mientras la bitácora está abierta) |
| Toque/clic en la miniatura | **Amplía la foto** — navega con las flechas ‹ › y sale con **Esc** |

### Todo sobre las fotos
- Llevan **sello de fecha, hora, área, punto y GPS** grabado en la imagen (no se puede quitar).
- Si **no hay internet**, entran a una **cola**: verás "⏳ N foto(s) en cola" y se suben solas al regresar la señal (o toca "Reintentar ahora").
- Si aparece un error, se muestra el **motivo** debajo del aviso.

---

## 6. Cerrar el área

Un área se considera **completa** solo cuando:
- ✅ Todos los lineamientos fueron evaluados (ninguno en "No revisado")
- ✅ Tiene **mínimo 2 fotos**

Entonces el botón inferior cambia a **"✔ Guardar y regresar"**. Si falta algo, el mismo botón te dice qué falta.

---

## 7. Cerrar la bitácora del día 🔒

1. Cuando las 8 áreas estén completas, regresa a **📋 Bitácora**.
2. Presiona **🔒 Cerrar bitácora del día**.
3. **Firma en pantalla** (con el dedo o el ratón), escribe tu nombre y confirma.
4. La bitácora queda **CERRADA: ya no se puede editar**. Es el registro oficial del día.

> ❌ Si algún área está incompleta, la app te dirá exactamente qué falta y no dejará cerrar.

---

## 8. Reportes (PDF para compartir)

| Reporte | Dónde | Contenido |
|---|---|---|
| **📄 Diario** | 📋 Bitácora (al cerrar) o 🗂 Históricos | Resumen ejecutivo del día, calificación por área y clasificación, hallazgos, acciones correctivas, evidencias y firmas |
| **📄 Semanal** | 📊 Indicadores | Lunes a hoy: tendencia día por día, áreas, top 10 de incumplimientos, acciones |
| **📄 Mensual** | 📊 Indicadores | Del día 1 al hoy, misma estructura |
| **📅 Periodo personalizado** | 📊 Indicadores | Cualquier rango de fechas |

En todos: botón **"🖨️ Guardar como PDF / Imprimir"**. El primer apartado siempre es el **resumen ejecutivo con la calificación**.

---

## 9. Indicadores (📊)

- **Cumplimiento ponderado general** — los hallazgos críticos pesan más que los de orden y limpieza.
- **Tabla por área** y **por área + clasificación**, con semáforo (🟢 ≥90 %, 🟡 70–89 %, 🔴 <70 %).
- **📈 Tendencia por día** con comparativo ▲▼ contra el día anterior.
- **📉 Seguimiento**: áreas, clasificaciones y lineamientos con **menor cumplimiento** (lo que urge corregir).
- **📥 Exportar Excel (CSV)**: 3 archivos — calificaciones, seguimiento por lineamiento y acciones correctivas.

---

## 10. Históricos (🗂 — para quien revisa)

1. Elige la **fecha** (🔒 = cerrada).
2. Elige el **área** → verás cada punto con su estado, comentario y **fotos ampliables**.
3. **Filtros**: mostrar solo los que "No cumplen", o filtrar por **usuario que evaluó**.
4. Botón **📄 Reporte PDF del día** desde ahí mismo.

---

## 11. Cuenta / 🔐

| Opción | Para qué |
|---|---|
| **2FA** | Activar/desactivar la verificación en 2 pasos (obligatoria) |
| **⏰ Recordatorio diario** | Notificación a la hora que elijas para no olvidar la bitácora |
| **💾 Respaldo** | Descarga todo el contenido en un archivo JSON |
| **🔳 QR por área** | Genera QR imprimibles: al escanearlos se abre directo el checklist del área |
| **🛠 Editor de lineamientos** | Agrega o elimina lineamientos del catálogo (con severidad) sin tocar la base de datos |

---

## 12. Reglas de oro (resumen)

1. **Una bitácora por día** — la fecha se asigna sola.
2. **Mínimo 2 fotos por área** y **cero lineamientos sin evaluar** para poder cerrar.
3. Todo "No cumple" **genera acción correctiva** con responsable y fecha límite.
4. Lo **cerrado no se edita** — es el registro oficial.
5. Las fotos llevan **fecha, hora, área, punto y GPS** grabados.
6. Los hallazgos **críticos** pesan más en la calificación y son prioridad de corrección.
7. **Sin internet no se detiene la operación**: todo se sincroniza solo.

---

## 13. Problemas frecuentes

| Problema | Solución |
|---|---|
| No me llega el código de 6 dígitos | El código lo genera tu app autenticadora (Google/Microsoft Authenticator), no llega por SMS. Revisa que la hora del celular esté automática |
| Fotos "en cola" y no suben | Verifica internet y toca "Reintentar ahora". El aviso muestra el motivo del fallo |
| "El área X tiene N foto(s)" al cerrar | Toma las fotos mínimas (2) de esa área antes de cerrar |
| "El área X tiene lineamientos sin evaluar" | Regresa al área y evalúa los puntos pendientes (o márcalos "No revisado" si no aplicaron) |
| La cámara no abre | Da permiso al navegador (candado 🔒 en la barra de direcciones) y reintenta |
| La pantalla se ve como la versión vieja | Recarga con Ctrl+Shift+R, o cierra y abre la app instalada |
| Se me borró una foto por error | Solo se puede recuperar si la bitácora sigue abierta — vuelve a tomarla |
| Cambié de celular | Entra desde el nuevo, ve a Cuenta / 2FA: desactiva el 2FA viejo y activa uno nuevo escaneando el QR |

---

*Bitácora de Cumplimiento · Accel-VPC · Soporte: contacta al administrador del sistema.*
