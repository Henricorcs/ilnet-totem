#!/bin/sh
cat > /usr/share/nginx/html/config.js << EOF
window.__API_URL__ = "${API_URL:-https://api.totem.ilnet.com.br}";
EOF
exec nginx -g "daemon off;"
