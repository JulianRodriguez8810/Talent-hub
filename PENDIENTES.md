# Pendientes — Talent Hub

## Cómo está hoy (18/11/2026)
- Corre en el **VPS de Hostinger** (`ssh root@177.7.43.164`), en Coolify: proyecto "Talent Hub", app `e9ehaqvz3niuwoil9vcmgoe2`, desde el repo público `JulianRodriguez8810/Talent-hub` (rama `main`, Dockerfile, puerto 3200). Coolify se abre con `ssh -L 8000:localhost:8000 root@177.7.43.164` y http://localhost:8000.
- Sitio: **https://talent.virtual-xpert.net** (ruta en el túnel `vxs-vps` → `http://localhost:80`; DNS en Cloudflare apuntando a ese túnel).
- Datos: volumen `e9ehaqvz3niuwoil9vcmgoe2-talent-hub-datatalenthub-data` en `/app/data`: `talenthub.db`, `cvs/`, `avatars/` y `.env` (solo `TH_SECRET`, la misma de la notebook, así no se cerraron las sesiones).
- Usuarios: solo santiago.blas, dario.silva y julian.rodriguez (@virtual-xpert.net). Para resetear una contraseña: en Coolify → Terminal de la app, `node scripts/usuario.mjs <email> "<Nombre>" <contraseña>`.
- Seguridad ya aplicada: login en el servidor (contraseñas con scrypt), cookie HttpOnly/Secure, 5 intentos fallidos bloquean 15 min, cabeceras de seguridad (CSP, HSTS, no iframes), `noindex` y `robots.txt`.
- Para cambiar código: commit acá, `git push origin main` y **Redeploy** en Coolify.
- Aparece en el panel del VPS (http://vps:8088).
- Vercel (proyecto `talent-hub`) borrado el 14/10.

### Pase al VPS (18/11/2026)
- Copia de los datos del corte en `C:\Aplicaciones WEB\Respaldos Talent Hub\2026-11-18-corte-vps`.
- La notebook quedó con la tarea "Talent Hub" **frenada y deshabilitada** (plan de vuelta). Su `app.js.bak` es la versión anterior al lector de CV nuevo.
- Volver atrás: apuntar el DNS `talent` al túnel `vxs-social` (la ruta sigue en `config-vxs.yml` de la notebook), copiar los datos del volumen a `C:\Aplicaciones\Talent Hub\data` y habilitar/arrancar la tarea.
- [ ] **Respaldo fuera del VPS**: hoy no hay copia diaria (en la notebook iba a OneDrive). Definir junto con FirstTake.
- [ ] Sacar la ruta `talent` de `config-vxs.yml` en la notebook cuando ya no haga falta volver atrás.

## Pendientes
1. **Borrar el proyecto de Supabase** `nbyvtpiiyconbjqduyms` (Settings → General → Delete project). No tocar `qvwxglgufdqgxaeydlga`, que es de VXS.
2. **OneDrive en la notebook**: no está corriendo, así que la copia diaria queda solo en el disco local. Abrirlo, iniciar sesión (`jrodriguez.andres88@outlook.com`) y dejarlo arrancando con Windows; verificar que la carpeta `Backups\Talent Hub` sube a la nube.
3. **Cloudflare Access** (Zero Trust, gratis hasta 50 usuarios): poner una puerta antes del sitio para que solo los 3 emails entren con un código de un solo uso por correo. Es la mejora de seguridad más grande.
   - Quedamos (14/10) en la pantalla "Activate Zero Trust Free", que pide tarjeta: verificar que el resumen diga **Due today $0.00** antes de confirmar.
   - Después: team name `virtualxpert`, saltear WARP. En **Zero Trust → Access controls → Applications → Add an application → Self-hosted** crear "Talent Hub" (`talent.virtual-xpert.net`, sesión 1 mes) y "Panel servidor" (`panel.virtual-xpert.net`), con una policy **Allow** por **Emails** para los 3 usuarios. Login con **One-time PIN**. No proteger `social.virtual-xpert.net` (Meta tiene que poder entrar).
   - Recién con Access creado para `panel`: agregar `panel.virtual-xpert.net` al túnel (`cloudflared tunnel route dns` desde la PC + regla en `config-vxs.yml` → `http://localhost:3199`) para ver el panel desde afuera. El panel ya es de solo lectura cuando la visita llega por el túnel.
4. **Disco de la notebook sin cifrar** (Windows 11 Home, sin BitLocker, con inicio de sesión automático): si la roban, se leen los datos. Ver si admite "Cifrado de dispositivo" o pasar a Windows Pro.
5. ✅ (14/10) Carga de CV en PDF probada con la política de seguridad nueva: funciona.
6. ✅ (14/10) El recuadro del menú lateral ahora dice "Servidor notebook" y muestra "Sincronizado" o "Sin conexión" según responda el servidor.
