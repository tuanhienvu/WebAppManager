# WebApp Manager Database SQL Files for phpMyAdmin

This directory contains MySQL-compatible SQL scripts ready to import into phpMyAdmin.

## 📁 Available Files

### 1. `webapp-manager-complete.sql` ⭐ **Recommended**
Complete database setup with schema and sample data:
- ✅ All tables, indexes, foreign keys
- ✅ Sample users (3 users with hashed passwords)
- ✅ Sample settings (company info, contact, social links)
- ✅ Sample software, versions, tokens, audit logs
- ✅ User permissions

**Use this file if:** You want a complete working database with sample data for testing.

### 2. `webapp-manager-schema-only.sql`
Database schema only (no sample data):
- ✅ All tables, indexes, foreign keys
- ✅ No sample data

**Use this file if:** You want to set up an empty database structure.

## 🚀 How to Import into phpMyAdmin

### Method 1: Using phpMyAdmin Import (Recommended)

1. **Open phpMyAdmin** in your web browser
2. **Select your database** from the left sidebar (or create a new one first)
3. Click on the **"Import"** tab at the top
4. Click **"Choose File"** button
5. Select the SQL file (`webapp-manager-complete.sql` or `webapp-manager-schema-only.sql`)
6. Leave default settings:
   - Format: SQL
   - Character set: utf8mb4
   - Partial import: unchecked
7. Click **"Go"** button at the bottom
8. Wait for the import to complete
9. You should see a success message with the number of queries executed

### Method 2: Using phpMyAdmin SQL Tab

1. **Open phpMyAdmin** in your web browser
2. **Select your database** from the left sidebar
3. Click on the **"SQL"** tab at the top
4. **Copy the entire contents** of the SQL file
5. **Paste** into the SQL textarea
6. Click **"Go"** button
7. Wait for execution to complete

### Method 3: Creating Database First

If you need to create the database first:

1. In phpMyAdmin, click **"New"** in the left sidebar
2. Enter database name: `webapp_manager`
3. Select collation: `utf8mb4_unicode_ci`
4. Click **"Create"**
5. Select the newly created database
6. Follow **Method 1** or **Method 2** above to import the SQL file

## 📊 What's Included

### Database Schema

- **Settings** - Application settings (company info, contact, social links)
- **User** - User accounts with roles (ADMIN, MANAGER, USER)
- **UserPermission** - Custom permissions for users
- **Software** - Software applications
- **Version** - Software versions
- **AccessToken** - API access tokens
- **AuditLog** - Audit trail for token operations

### Sample Data (in complete.sql)

**Users:**
- Admin: `vuleitsolution@gmail.com` / Password: `@5801507746#VULEITS`
- Manager: `manager1@webappmanager.com` / Password: `manager123`
- User: `user1@webappmanager.com` / Password: `user123`

**Settings:**
- Company name, slogan, address
- Contact email, phone, mobile
- Social links (Facebook, Twitter, LinkedIn, GitHub)

**Sample Data:**
- 3 software entries
- 6 versions
- 6 access tokens
- 8 audit log entries
- User permissions for each role

## 🔐 Password Security

All passwords in the SQL files are **bcrypt hashed** for security:
- Passwords are never stored in plain text
- Uses bcrypt with 10 salt rounds
- Compatible with the application's password verification system

## ⚠️ Important Notes

1. **Foreign Key Checks**: The script temporarily disables foreign key checks during table creation to avoid dependency issues
2. **UUID()**: Uses MySQL's `UUID()` function for generating unique IDs
3. **Character Set**: All tables use `utf8mb4` character set for full Unicode support
4. **JSON**: Uses MySQL's native JSON type for storing permissions array
5. **ENUM**: Uses MySQL ENUM types for status and role fields

## 🛠️ Troubleshooting

### Error: "Table already exists"
- The script includes `DROP TABLE IF EXISTS` statements
- Make sure you're running the complete script, not just parts of it

### Error: "Foreign key constraint fails"
- Make sure you're importing the complete script
- The script handles foreign key dependencies correctly

### Error: "Unknown database"
- Create the database first (see Method 3 above)
- Or uncomment the `CREATE DATABASE` line at the top of the SQL file

### Error: "Incorrect string value"
- Make sure your MySQL server supports utf8mb4
- Check that the database collation is set to `utf8mb4_unicode_ci`

## 📝 After Import

After successfully importing:

1. **Verify tables**: Check that all 7 tables are created
2. **Check data**: Verify sample data is inserted correctly
3. **Test login**: Try logging in with the sample users
4. **Configure database**: Update your `.env` file with your database credentials

## 🔄 Reset Database

To reset the database, simply import the SQL file again. It will:
- Drop all existing tables
- Recreate them fresh
- Insert all sample data




