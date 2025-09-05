#!/bin/bash
# DocApp Database Browser Script

export PATH="/Applications/Postgres.app/Contents/Versions/16/bin:$PATH"
DB_CMD="PGPASSWORD='RamMac@2099' psql -h localhost -p 5432 -U postgres -d patient_management_db"

echo "🏥 DocApp Database Browser"
echo "=========================="
echo ""

while true; do
    echo "Choose what to view:"
    echo "1. 📋 List all tables"
    echo "2. 👥 View patients" 
    echo "3. 📅 View appointments"
    echo "4. 💉 View treatments"
    echo "5. 🔬 View investigations"
    echo "6. 🔔 View notifications"
    echo "7. 👤 View users & roles"
    echo "8. 📊 Database statistics"
    echo "9. 🔍 Custom SQL query"
    echo "10. 💻 Open interactive psql"
    echo "0. Exit"
    echo ""
    read -p "Enter choice (0-10): " choice
    
    case $choice in
        1)
            echo "📋 All Tables:"
            $DB_CMD -c "\dt"
            ;;
        2) 
            echo "👥 Patients:"
            $DB_CMD -c "SELECT patient_id, first_name, last_name, primary_cancer_site, current_status, mobile_number FROM patients ORDER BY patient_id;"
            ;;
        3)
            echo "📅 Appointments:"
            $DB_CMD -c "SELECT a.appointment_date, a.appointment_time, a.status, p.first_name, p.last_name, p.mobile_number FROM appointments a JOIN patients p ON a.patient_id = p.id ORDER BY a.appointment_date DESC;"
            ;;
        4)
            echo "💉 Treatments:"
            $DB_CMD -c "SELECT t.treatment_type, t.status, t.start_date, p.first_name, p.last_name FROM treatments t JOIN patients p ON t.patient_id = p.id ORDER BY t.start_date DESC;"
            ;;
        5)
            echo "🔬 Investigations:"
            $DB_CMD -c "SELECT i.investigation_type, i.status, i.ordered_date, p.first_name, p.last_name FROM investigations i JOIN patients p ON i.patient_id = p.id ORDER BY i.ordered_date DESC;"
            ;;
        6)
            echo "🔔 Notifications:"
            $DB_CMD -c "SELECT notification_type, title, message, priority, created_at FROM notifications ORDER BY created_at DESC;"
            ;;
        7)
            echo "👤 Users & Roles:"
            $DB_CMD -c "SELECT u.\"Email\", u.\"FirstName\", u.\"LastName\", r.\"Name\" as Role FROM \"AspNetUsers\" u JOIN \"AspNetUserRoles\" ur ON u.\"Id\" = ur.\"UserId\" JOIN \"AspNetRoles\" r ON ur.\"RoleId\" = r.\"Id\";"
            ;;
        8)
            echo "📊 Database Statistics:"
            echo "Table record counts:"
            $DB_CMD -c "SELECT 'patients' as table_name, COUNT(*) as count FROM patients UNION SELECT 'appointments', COUNT(*) FROM appointments UNION SELECT 'treatments', COUNT(*) FROM treatments UNION SELECT 'investigations', COUNT(*) FROM investigations UNION SELECT 'notifications', COUNT(*) FROM notifications UNION SELECT 'AspNetUsers', COUNT(*) FROM \"AspNetUsers\" ORDER BY table_name;"
            ;;
        9)
            echo "🔍 Enter your SQL query (end with semicolon):"
            read -p "SQL> " sql_query
            if [ ! -z "$sql_query" ]; then
                $DB_CMD -c "$sql_query"
            fi
            ;;
        10)
            echo "💻 Opening interactive psql session..."
            echo "Type \q to exit back to this menu"
            $DB_CMD
            ;;
        0)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please try again."
            ;;
    esac
    echo ""
    echo "Press Enter to continue..."
    read
    clear
done
