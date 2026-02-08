const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'tailor.db');

console.log('Clearing all data from backend database...');

// Check if database file exists
if (fs.existsSync(dbPath)) {
    console.log('Found existing database file, deleting it...');
    fs.unlinkSync(dbPath);
    console.log('✅ Deleted database file');
} else {
    console.log('No existing database file found');
}

// Create fresh database and let backend create tables
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('Creating fresh database structure...');
    
    // Create tables (same as in backend/index.js)
    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_number TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        contact_number TEXT,
        address TEXT
    )`, (err) => {
        if (err) {
            console.error('Error creating customers table:', err);
        } else {
            console.log('✅ Created customers table');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        customer_id INTEGER,
        garment_types TEXT NOT NULL,
        order_date DATE DEFAULT CURRENT_DATE,
        delivery_date DATE,
        status TEXT DEFAULT 'pending',
        design_image TEXT,
        notes TEXT,
        total_amount REAL,
        advance_amount REAL,
        balance_amount REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
    )`, (err) => {
        if (err) {
            console.error('Error creating orders table:', err);
        } else {
            console.log('✅ Created orders table');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        measurement_type TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT DEFAULT 'inch',
        FOREIGN KEY (order_id) REFERENCES orders (id)
    )`, (err) => {
        if (err) {
            console.error('Error creating measurements table:', err);
        } else {
            console.log('✅ Created measurements table');
        }
    });

    // Verify all tables are empty
    setTimeout(() => {
        db.get('SELECT COUNT(*) as count FROM customers', [], (err, row) => {
            if (!err) console.log(`Customers: ${row.count} records`);
        });

        db.get('SELECT COUNT(*) as count FROM orders', [], (err, row) => {
            if (!err) console.log(`Orders: ${row.count} records`);
        });

        db.get('SELECT COUNT(*) as count FROM measurements', [], (err, row) => {
            if (!err) console.log(`Measurements: ${row.count} records`);
        });

        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            } else {
                console.log('\n🎉 Database reset successfully!');
                console.log('Fresh database created and ready to use.');
                console.log('You can now start the backend with: node index.js');
            }
        });
    }, 1000);
});
