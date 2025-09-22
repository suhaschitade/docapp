#!/bin/bash

# Start services script
set -e

systemctl restart docapp-api
systemctl reload nginx

echo "Services restarted successfully."
