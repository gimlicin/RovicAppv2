# Use official PHP 8.2 FPM image (more stable for production)
FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    libzip-dev \
    zip \
    unzip \
    nginx \
    supervisor \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 (required by Vite)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install PHP extensions
RUN docker-php-ext-install pdo_pgsql pgsql mbstring exif pcntl bcmath gd zip

# Install Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Set Composer environment
ENV COMPOSER_ALLOW_SUPERUSER=1
ENV COMPOSER_NO_INTERACTION=1
ENV COMPOSER_MEMORY_LIMIT=-1

# Copy composer files
COPY composer.json composer.lock ./

# Install PHP dependencies (skip scripts to avoid errors)
RUN composer install --no-dev --no-scripts --optimize-autoloader

# Copy package files
COPY package*.json ./

# Install Node dependencies  
RUN npm ci --production=false

# Copy application files
COPY . .

# Build frontend assets
RUN npm run build

# Set up Laravel
# Don't copy .env.example - Render uses environment variables
RUN php artisan key:generate --force --no-interaction

# Create database setup script
RUN echo '#!/bin/bash\n\
echo "Setting up database..."\n\
php artisan migrate --force || echo "Migration failed, continuing..."\n\
php artisan db:seed --force || echo "Seeding failed, continuing..."\n\
php artisan storage:link || echo "Storage link failed, continuing..."\n\
php artisan config:clear || echo "Config clear failed, continuing..."\n\
php artisan config:cache || echo "Config cache failed, continuing..."\n\
echo "Database setup completed"\n\
' > /var/www/html/setup-db.sh && chmod +x /var/www/html/setup-db.sh

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Create nginx config template
RUN echo 'server { \
    listen 80 default_server; \
    root /var/www/html/public; \
    index index.php; \
    location / { \
        try_files $uri $uri/ /index.php?$query_string; \
    } \
    location ~ \.php$ { \
        fastcgi_pass 127.0.0.1:9000; \
        fastcgi_index index.php; \
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name; \
        include fastcgi_params; \
    } \
}' > /etc/nginx/sites-available/default

# Create supervisor config
RUN echo '[supervisord] \n\
nodaemon=true \n\
[program:php-fpm] \n\
command=php-fpm \n\
autostart=true \n\
autorestart=true \n\
[program:nginx] \n\
command=nginx -g "daemon off;" \n\
autostart=true \n\
autorestart=true' > /etc/supervisor/conf.d/supervisord.conf

# Expose port
EXPOSE $PORT

# Copy and set up startup script
COPY start.sh /var/www/html/start.sh
RUN chmod +x /var/www/html/start.sh

# Start with our custom startup script
CMD ["/var/www/html/start.sh"]
