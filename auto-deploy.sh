#!/bin/bash

# Ensure the script fails on any error
set -e

echo "🎁🎁🎁 Starting auto-deploy script..."

echo "🎁🎁🎁 Define Variables"
export $(grep -v '^#' .env | xargs)

echo "🎁🎁🎁 Start Docker if not running"
sudo systemctl start docker || echo "🎁🎁🎁 Docker already running"

echo "🎁🎁🎁 Login to ECR"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $REGISTRY

echo "🎁🎁🎁 Pull the latest image"
docker-compose pull

echo "🎁🎁🎁 Restart containers"
docker-compose down && \
docker-compose up -d

echo "🎁🎁🎁 Deployment Completed"
