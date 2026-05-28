FROM python:3.11-slim

# Cài thư viện hệ thống cần cho mysqlclient và cairosvg
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    libcairo2 \
    libcairo2-dev \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Tạo thư mục static và media
RUN mkdir -p /app/staticfiles /app/media

# Collect static files
RUN python manage.py collectstatic --noinput

# Set quyền cho entrypoint
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Tạo user không root
RUN useradd -m -u 1000 django && chown -R django:django /app
USER django

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]