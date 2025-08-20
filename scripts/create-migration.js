const fs = require('fs');
const path = require('path');

// Get description from command line arguments
const description = process.argv[2];

if (!description) {
    console.log('Usage: node scripts/create-migration.js <description>');
    console.log('Example: node scripts/create-migration.js add_user_preferences');
    process.exit(1);
}

// Get current timestamp in YYYYMMDDHHMMSS format for proper ordering
const now = new Date();
const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');

// Create description (replace spaces with underscores)
const descriptionFormatted = description.replace(/\s+/g, '_');

// Create filename
const filename = `supabase/migrations/${timestamp}_${descriptionFormatted}.sql`;

// Create migrations directory if it doesn't exist
const migrationsDir = path.dirname(filename);
if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
}

// Template content
const template = `-- Migration: ${description}
-- Date: ${new Date().toISOString()}
-- Description: ${description}

-- Add your SQL changes here
-- Example:
-- ALTER TABLE users ADD COLUMN new_field TEXT;
-- CREATE INDEX idx_users_new_field ON users(new_field);

`;

// Write the file
fs.writeFileSync(filename, template);

console.log(`Created migration file: ${filename}`);
console.log('Edit the file to add your SQL changes');
