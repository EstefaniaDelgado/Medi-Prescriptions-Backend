FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --only=production

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar código fuente
COPY . .

# Compilar aplicación
RUN npm run build

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]