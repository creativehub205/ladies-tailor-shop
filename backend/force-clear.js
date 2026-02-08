const fs = require('fs');
const path = require('path');

// Backend uses tailor_shop.db, not tailor.db
const dbPath = path.join(__dirname, 'tailor_shop.db');
const dbPath2 = path.join(__dirname, 'tailor.db');

console.log('Force clearing database...');

// Delete both database files completely
const dbFiles = [dbPath, dbPath2];
dbFiles.forEach((filePath, index) => {
    const fileName = path.basename(filePath);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`✅ Database file ${fileName} deleted successfully`);
        } catch (error) {
            console.error(`❌ Error deleting database file ${fileName}:`, error);
        }
    } else {
        console.log(`ℹ️  No database file ${fileName} found`);
    }
});

// Also delete any backup/journal files
const journalFiles = [
    path.join(__dirname, 'tailor_shop.db-journal'),
    path.join(__dirname, 'tailor.db-journal')
];

journalFiles.forEach((filePath) => {
    const fileName = path.basename(filePath);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`✅ Database journal file ${fileName} deleted`);
        } catch (error) {
            console.error(`❌ Error deleting journal file ${fileName}:`, error);
        }
    }
});

console.log('\n🎉 Database completely cleared!');
console.log('Start the backend with: node index.js');
console.log('It will create a fresh empty database.');
