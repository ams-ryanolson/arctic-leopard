# =============================================================================
# Real Kink Men - Production Dockerfile
# Multi-stage build with Wayfinder support (requires both PHP + Node)
# =============================================================================

# =============================================================================
# Stage 1: PHP + Node Builder (needed because Wayfinder requires PHP during npm build)
# =============================================================================
FROM php:8.3-cli-bookworm AS builder

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Install system dependencies needed for composer and PHP extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    unzip \
    libzip-dev \
    libicu-dev \
    libonig-dev \
    && rm -rf /var/lib/apt/lists/*

# Install minimal PHP extensions needed for composer/artisan
RUN docker-php-ext-install zip intl mbstring pcntl

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy composer files first for better caching
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install \
    --no-dev \
    --no-scripts \
    --prefer-dist \
    --ignore-platform-reqs

# Copy package files for npm
COPY package.json package-lock.json ./

# Install Node dependencies
RUN npm ci

# Copy all source files
COPY . .

# Run composer scripts (now that we have the full codebase)
RUN composer dump-autoload --optimize --no-dev

# Build arguments for Vite (frontend) environment variables
# These are baked into the JavaScript at build time
ARG VITE_PUSHER_APP_KEY
ARG VITE_PUSHER_APP_CLUSTER
ARG VITE_PUSHER_HOST
ARG VITE_PUSHER_PORT
ARG VITE_PUSHER_SCHEME

# Set them as environment variables for the build
ENV VITE_PUSHER_APP_KEY=${VITE_PUSHER_APP_KEY}
ENV VITE_PUSHER_APP_CLUSTER=${VITE_PUSHER_APP_CLUSTER}
ENV VITE_PUSHER_HOST=${VITE_PUSHER_HOST}
ENV VITE_PUSHER_PORT=${VITE_PUSHER_PORT}
ENV VITE_PUSHER_SCHEME=${VITE_PUSHER_SCHEME}

# Generate Wayfinder routes and build frontend assets
# The wayfinder:generate runs automatically via vite plugin, but needs PHP available
RUN npm run build

# =============================================================================
# Stage 2: Production image - PHP-FPM + Nginx
# =============================================================================
FROM php:8.3-fpm-bookworm AS production

LABEL maintainer="Arctic Media Solutions"
LABEL description="Real Kink Men - Laravel Application"

# =============================================================================
# System Dependencies
# =============================================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Nginx
    nginx \
    # Supervisor (process manager)
    supervisor \
    # FFMPEG for video processing
    ffmpeg \
    # ImageMagick for advanced image processing
    imagemagick \
    libmagickwand-dev \
    # Image libraries for GD
    libpng-dev \
    libjpeg-dev \
    libwebp-dev \
    libfreetype6-dev \
    # Other libraries
    libzip-dev \
    libicu-dev \
    libonig-dev \
    libgmp-dev \
    libxml2-dev \
    libxslt1-dev \
    libsodium-dev \
    libcurl4-openssl-dev \
    # Utilities
    curl \
    unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# =============================================================================
# PHP Extensions
# =============================================================================

# Configure GD with all image format support
RUN docker-php-ext-configure gd \
    --with-freetype \
    --with-jpeg \
    --with-webp

# Install core extensions
RUN docker-php-ext-install -j$(nproc) \
    pdo_mysql \
    mysqli \
    gd \
    intl \
    pcntl \
    bcmath \
    gmp \
    zip \
    mbstring \
    exif \
    soap \
    sockets \
    sodium \
    opcache \
    xml \
    xsl

# Install PECL extensions
RUN pecl install redis igbinary imagick \
    && docker-php-ext-enable redis igbinary imagick

# Configure igbinary as Redis serializer
RUN echo "redis.session.serializer=igbinary" >> /usr/local/etc/php/conf.d/docker-php-ext-redis.ini

# =============================================================================
# Configuration Files
# =============================================================================

# Copy PHP configuration
COPY docker/php/php.ini /usr/local/etc/php/php.ini
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/www.conf

# Copy Nginx configuration
COPY docker/nginx/default.conf /etc/nginx/sites-available/default
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default \
    && rm -f /etc/nginx/sites-enabled/default.bak 2>/dev/null || true

# Copy Supervisor configuration
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# =============================================================================
# Application Setup
# =============================================================================

WORKDIR /var/www/html

# Copy application code (excluding what's in .dockerignore)
COPY --chown=www-data:www-data . .

# Copy built vendor directory from builder stage
COPY --from=builder --chown=www-data:www-data /app/vendor ./vendor

# Copy built frontend assets from builder stage
COPY --from=builder --chown=www-data:www-data /app/public/build ./public/build

# Ensure storage and cache directories exist with correct permissions
RUN mkdir -p \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Create nginx cache directories
RUN mkdir -p /var/cache/nginx \
    && chown -R www-data:www-data /var/cache/nginx

# =============================================================================
# Health Check & Ports
# =============================================================================

# Expose port 8080 (DO App Platform requirement)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# =============================================================================
# Entrypoint
# =============================================================================

# Default command - Supervisor manages nginx + php-fpm
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
