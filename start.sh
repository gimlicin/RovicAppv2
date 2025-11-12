#!/bin/bash

echo "Starting RovicApp with database setup..."

# Wait a moment for services to be ready
sleep 5

# Run database setup if DATABASE_URL is available
if [ ! -z "$DATABASE_URL" ]; then
    echo "Database URL found, running setup..."
    php artisan migrate --force || echo "Migration skipped"
    php artisan db:seed --force || echo "Seeding skipped" 
    php artisan storage:link || echo "Storage link skipped"
    php artisan config:cache || echo "Config cache skipped"
    echo "Database setup completed"
else
    echo "No DATABASE_URL found, skipping database setup"
fi

# Start supervisor to run nginx + php-fpm
echo "Starting web services..."
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
