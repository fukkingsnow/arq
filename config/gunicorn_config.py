# Gunicorn configuration for ARQ application
# Variant A deployment on Beget hosting (Python 2.7 compatible)

import os
import multiprocessing

# Server socket
bind = '127.0.0.1:8000'
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'
worker_connections = 1000
timeout = 60
keepalive = 2

# Logging
accesslog = '/home/romasaw4/logs/gunicorn_access.log'
errorlog = '/home/romasaw4/logs/gunicorn_error.log'
loglevel = 'info'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'arq_gunicorn'

# Server mechanics
daemon = False
pidfile = '/home/romasaw4/run/gunicorn.pid'
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (if needed, configure later)
# keyfile = '/path/to/keyfile'
# certfile = '/path/to/certfile'
# ssl_version = 'TLSv1_2'

# Application behavior
preload_app = False
max_requests = 1000
max_requests_jitter = 50

# Server hooks
def on_starting(server):
    print("Gunicorn server is starting...")

def when_ready(server):
    print("Gunicorn server is ready. Spawning workers")

def on_exit(server):
    print("Gunicorn server has exited")

# Environment
raw_env = [
    'ENVIRONMENT=production',
    'LOG_LEVEL=info'
]
