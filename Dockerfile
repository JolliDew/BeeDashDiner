FROM php:8.2-apache

# PDO drivers for PostgreSQL (Supabase) and MySQL/MariaDB, plus Apache modules
# needed by the .htaccess rules.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql pdo_mysql \
    && a2enmod rewrite headers \
    && sed -ri 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf \
    && rm -rf /var/lib/apt/lists/*

COPY gamefile/ /var/www/html/
COPY docker/render-entrypoint.sh /usr/local/bin/render-entrypoint.sh

RUN cp /var/www/html/db.container.php /var/www/html/db.php \
    && chmod +x /usr/local/bin/render-entrypoint.sh \
    && chown -R www-data:www-data /var/www/html/uploads \
    && chmod 775 /var/www/html/uploads

EXPOSE 80
CMD ["/usr/local/bin/render-entrypoint.sh"]
