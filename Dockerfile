# Render.com compatible Dockerfile
FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    unzip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install PHP extensions for PostgreSQL
RUN docker-php-ext-install pdo_pgsql pgsql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Set Composer memory limit and disable timeout
ENV COMPOSER_MEMORY_LIMIT=-1
ENV COMPOSER_PROCESS_TIMEOUT=0

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Install PHP dependencies with increased memory and no scripts
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm ci --production=false

# Copy application files
COPY . .

# Build frontend assets
RUN npm run build

# Generate application key
RUN php artisan key:generate --force

# Set permissions
RUN chmod -R 755 storage bootstrap/cache

# Expose port for Render
EXPOSE $PORT

# Start the application
CMD php artisan serve --host=0.0.0.0 --port=$PORT
