# Usar a imagem oficial do Node.js
FROM node:22-alpine

# Definir o diretório de trabalho dentro do contentor
WORKDIR /app

# Copiar os ficheiros de dependências
# Nota: Garante que tens um package.json na pasta
COPY package*.json ./

# Instalar as dependências
RUN npm install

# Copiar o resto do código (auth_server.js, pastas views, public, etc.)
COPY . .

# Expor a porta em que o servidor corre (3001)
EXPOSE 3001

# Comando para iniciar o servidor
CMD ["node", "server_auth.js"]