# Database Migrations

This folder contains database migration scripts for updating your Railway database schema.

## Running Migrations

### Add User Settings Table

This migration adds the `user_settings` table to store user preferences and settings.

**Run the migration:**

```bash
cd Backend
node migrations/add-user-settings-table.js
```

**What it does:**
- Creates `user_settings` table with all preference fields
- Adds foreign key relationship to `users` table
- Creates indexes for performance
- Automatically creates default settings for all existing users

**Fields added:**
- Notification Settings: `push_notifications`, `email_notifications`, `course_updates`, `live_class_reminders`
- App Preferences: `dark_mode`, `auto_play_videos`, `download_quality`, `language`
- Timestamps: `created_at`, `updated_at`

## Migration Status

- ✅ **add-user-settings-table.js** - Adds user_settings table for preferences

## Important Notes

1. **Always backup your database before running migrations**
2. Migrations use Railway credentials from your environment variables or hardcoded fallbacks
3. If a migration fails, check the error message and fix any issues before retrying
4. Some migrations may drop and recreate tables - data may be lost in those tables

## Environment Variables

Migrations use the following environment variables (with fallbacks):
- `DB_HOST` - Railway database host
- `DB_PORT` - Railway database port
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_DATABASE` - Database name

## Railway Database Connection

Your Railway database is permanently connected. The migration script will:
1. Connect to Railway using SSL
2. Check if the table exists
3. Create or update the table structure
4. Verify the changes
5. Close the connection

## Troubleshooting

**Connection Issues:**
- Verify Railway database credentials in `config.env` or `database.js`
- Check that your Railway database is running
- Ensure SSL is properly configured

**Table Already Exists:**
- The migration will drop and recreate the table
- Existing data in `user_settings` will be lost
- User data in other tables is preserved

**Foreign Key Errors:**
- Ensure the `users` table exists before running this migration
- Check that user IDs are properly formatted (VARCHAR(36))

