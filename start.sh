#!/bin/bash

echo "Starting RovicApp with database setup..."

# Wait a moment for services to be ready
sleep 5

# Parse DATABASE_URL if available
if [ ! -z "$DATABASE_URL" ]; then
    echo "Parsing DATABASE_URL..."
    
    # Extract components from postgresql://user:pass@host[:port]/database
    DB_USER=$(echo $DATABASE_URL | sed 's/postgresql:\/\/\([^:]*\):.*/\1/')
    DB_PASS=$(echo $DATABASE_URL | sed 's/postgresql:\/\/[^:]*:\([^@]*\)@.*/\1/')
    DB_HOST=$(echo $DATABASE_URL | sed 's/.*@\([^:\/]*\).*/\1/')
    # Extract port or default to 5432
    if echo $DATABASE_URL | grep -q ':[0-9]\+/'; then
        DB_PORT=$(echo $DATABASE_URL | grep -o ':[0-9]\+/' | sed 's/[:\/]//g')
    else
        DB_PORT="5432"
    fi
    DB_NAME=$(echo $DATABASE_URL | sed 's/.*\/\([^?]*\).*/\1/')
    
    # Set environment variables for Laravel
    export DB_CONNECTION=pgsql
    export DB_HOST=$DB_HOST
    export DB_PORT=$DB_PORT
    export DB_DATABASE=$DB_NAME
    export DB_USERNAME=$DB_USER
    export DB_PASSWORD=$DB_PASS
    
    echo "=== Parsed Database Config ==="
    echo "DB_HOST: $DB_HOST"
    echo "DB_PORT: $DB_PORT" 
    echo "DB_DATABASE: $DB_NAME"
    echo "DB_USERNAME: $DB_USER"
    echo "=============================="
    
    echo "Database URL found, configuration complete"
    # Note: Migrations now run in build script (render-build.sh)
    # This startup script only runs when server restarts (not on every deploy)
else
    echo "No DATABASE_URL found, skipping database setup"
fi

# Configure nginx with proper PORT
echo "Configuring nginx for port $PORT..."
sed -i "s/listen 80/listen $PORT/g" /etc/nginx/sites-available/default

# Ensure storage directories exist with proper permissions
echo "Setting up storage directories..."
mkdir -p storage/logs storage/framework/{sessions,views,cache} storage/app/public bootstrap/cache
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# CRITICAL: Clear config cache so Laravel reads fresh environment variables
echo "Clearing Laravel config cache..."
php artisan config:clear || echo "Config clear failed"

# Cache config NOW (after DB connection is available)
echo "Caching Laravel config..."
php artisan config:cache || echo "Config cache failed"

# Run database migrations (critical for first deploy!)
echo "Running database migrations..."
php artisan migrate --force || echo "Migration failed, continuing..."

# NOTE: Seeders removed from auto-run
# If you need to seed data, run manually: php artisan db:seed
# Or run specific seeders: php artisan db:seed --class=UserSeeder

# Link storage (for file uploads)
echo "Linking storage..."
php artisan storage:link || echo "Storage link already exists"

# Start supervisor to run nginx + php-fpm
echo "Starting web services..."
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
