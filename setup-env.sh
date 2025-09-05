#!/bin/bash
# Setup environment for DocApp development

# Add PostgreSQL to PATH
export PATH="/Applications/Postgres.app/Contents/Versions/16/bin:$PATH"

echo "Environment setup complete!"
echo "PostgreSQL path added to PATH"
echo "You can now use psql and other PostgreSQL tools"
echo ""
echo "To start the backend:"
echo "  cd backend && dotnet run"
echo ""
echo "To connect to database:"
echo "  PGPASSWORD='RamMac@2099' psql -h localhost -p 5432 -U postgres -d patient_management_db"
