#!/bin/sh

# Health check script for diboas application
# Returns 0 if healthy, 1 if unhealthy

HEALTH_URL="http://localhost/health"
TIMEOUT=5

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "ERROR: nginx is not running"
    exit 1
fi

# Check if health endpoint responds
response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$HEALTH_URL" 2>/dev/null)

if [ "$response" = "200" ]; then
    echo "OK: Application is healthy"
    exit 0
else
    echo "ERROR: Health check failed with status $response"
    exit 1
fi