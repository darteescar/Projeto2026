#!/bin/bash
# Importa o dataset de comentarios para a base de dados recursosEscolares, coleção comentarios
mongoimport --host localhost --db recursosEscolares --collection comentarios --type json --file /docker-entrypoint-initdb.d/json/comentarios.json --jsonArray

# Importa o dataset de users para a base de dados recursosEscolares, coleção users
mongoimport --host localhost --db recursosEscolares --collection users --type json --file /docker-entrypoint-initdb.d/json/users.json --jsonArray

echo "Import concluído."