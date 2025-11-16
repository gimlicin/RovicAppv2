#!/bin/bash
# Explicit build script for Render.com

echo "=== Build Script Started ==="

# Check if we're in the right directory
pwd
ls -la

# Check PHP version
echo "=== Checking PHP ==="
which php
php -v

# Check if composer exists, if not try to install it
echo "=== Checking Composer ==="
which composer || {
    echo "Composer not found, installing..."
    curl -sS https://getcomposer.org/installer | php
    mv composer.phar /usr/local/bin/composer
    chmod +x /usr/local/bin/composer
}

composer --version

# Install PHP dependencies
echo "=== Installing PHP Dependencies ==="
composer install --no-dev --optimize-autoloader --no-interaction

# Check Node and NPM
echo "=== Checking Node/NPM ==="
which node
node --version
which npm
npm --version

# Install Node dependencies
echo "=== Installing Node Dependencies ==="
npm ci

# Build assets
echo "=== Building Assets ==="
npm run build

# Laravel setup
echo "=== Laravel Setup ==="
php artisan --version
cp .env.example .env 2>/dev/null || true
php artisan key:generate --force

# Run migrations during build (only when deploying new code)
echo "=== Running Database Migrations ==="
php artisan migrate --force || echo "Migrations skipped"

# Create storage link
echo "=== Setting up Storage ==="
php artisan storage:link || echo "Storage link already exists"

# Cache config for better performance
echo "=== Caching Configuration ==="
php artisan config:cache || echo "Config caching skipped"

echo "=== Build Script Completed ==="
