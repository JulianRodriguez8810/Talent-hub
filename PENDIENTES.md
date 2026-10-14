# Pendientes — Talent Hub

## Cómo está hoy (14/10/2026)
- Corre en la **notebook** (`ssh julian@192.168.1.35`), en `C:\Aplicaciones\Talent Hub`, puerto 3200, tarea "Talent Hub" al iniciar sesión.
- Sitio: **https://talent.virtual-xpert.net** (túnel de Cloudflare `vxs-social`, el mismo de VXS; DNS de `virtual-xpert.net` en Cloudflare).
- Datos: `data/talenthub.db` (SQLite) y `data/cvs/`. Copia diaria a `C:\Users\Julian\OneDrive\Backups\Talent Hub` (últimas 14).
- Usuarios: solo santiago.blas, dario.silva y julian.rodriguez (@virtual-xpert.net). Cada uno cambia su contraseña desde la app; para resetear una: `node scripts/usuario.mjs <email> "<Nombre>" <contraseña>` en la notebook.
- Seguridad ya aplicada: login en el servidor (contraseñas con scrypt), cookie HttpOnly/Secure, 5 intentos fallidos bloquean 15 min, cabeceras de seguridad (CSP, HSTS, no iframes), `noindex` y `robots.txt`.
- Para cambiar código: editar acá, copiar con `scp` a la notebook y reiniciar la tarea (botón en el Panel del servidor, http://127.0.0.1:3199 en la notebook).
- Vercel (proyecto `talent-hub`) borrado el 14/10.

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
