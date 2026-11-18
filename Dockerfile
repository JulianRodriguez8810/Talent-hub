# Imagen de Talent Hub para el VPS (Coolify). Los datos viven en un volumen montado en /app/data.
# Configuración: data/.env en el volumen (TH_SECRET obligatoria, BACKUP_DIR opcional) o variables en Coolify.
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3200
COPY server.mjs index.html app.html app.js servidor-hostinger.jpg ./
COPY scripts/usuario.mjs ./scripts/
# El volumen hereda este dueño al crearse: sin esto, el usuario node no puede escribir la base
RUN mkdir -p data && chown node:node data
USER node
EXPOSE 3200
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD wget -qO- http://127.0.0.1:3200/salud >/dev/null || exit 1
CMD ["node", "server.mjs"]
