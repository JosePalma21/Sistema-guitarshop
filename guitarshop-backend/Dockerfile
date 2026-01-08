FROM node:20-bookworm-slim

WORKDIR /app

# ✅ Prisma/Next suelen necesitar openssl y certificados en slim
RUN apt-get update && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# 1) Copia manifests primero (mejor cache)
COPY package.json package-lock.json* ./

# 2) Copia Prisma antes del install (porque postinstall hace prisma generate)
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

# 3) En Docker (Linux) NO uses el lock de Windows.
#    Instala resolviendo en Linux:
RUN rm -f package-lock.json && npm install

# 4) Copia el resto del código (sin volver a romper node_modules)
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
