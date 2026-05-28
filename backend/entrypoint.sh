#!/bin/sh

echo "Waiting for MySQL to be ready..."
while ! nc -z db 3306; do
  sleep 1
done
echo "MySQL is ready."

python manage.py migrate --noinput

exec gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3
