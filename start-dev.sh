#!/bin/bash
docker compose --env-file .env.development -f docker-compose.development.yml up "$@"

# ./start-dev.sh db backend