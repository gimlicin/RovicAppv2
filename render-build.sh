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
# Don't copy .env.example - Render uses environment variables
php artisan key:generate --force

# Run migrations during build (only when deploying new code)
echo "=== Running Database Migrations ==="
php artisan migrate --force || echo "Migrations skipped"

# Create storage link
echo "=== Setting up Storage ==="
php artisan storage:link || echo "Storage link already exists"

# Clear and cache config for better performance
echo "=== Clearing Old Config Cache ==="
php artisan config:clear || echo "Config clear skipped"

echo "=== Caching Fresh Configuration ==="
php artisan config:cache || echo "Config caching skipped"

echo "=== Clearing Route Cache ==="
php artisan route:clear || echo "Route clear skipped"

echo "=== Clearing View Cache ==="
php artisan view:clear || echo "View clear skipped"

echo "=== Build Script Completed ==="
