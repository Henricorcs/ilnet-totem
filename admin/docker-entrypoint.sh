#!/bin/sh
cat > /usr/share/nginx/html/config.js << EOF
window.__API_URL__ = "${API_URL:-http://localhost:3001}";
EOF
exec nginx -g "daemon off;"
