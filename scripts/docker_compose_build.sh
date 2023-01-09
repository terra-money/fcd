#!/usr/bin/env sh
docker-compose -f docker-compose.yml -f docker-compose.build.yml build indexer --no-cache
docker-compose -f docker-compose.yml -f docker-compose.build.yml build indexer-collector indexer-api --no-cache