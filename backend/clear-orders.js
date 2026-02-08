const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'tailor_shop.db');

console.log('Clearing only orders-related data from backend database...');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('Connected to database');

    // Check current data counts
    db.get('SELECT COUNT(*) as count FROM orders', [], (err, orderCount) => {
        if (err) {
            console.error('Error counting orders:', err);
            return;
        }
        console.log(`Current orders count: ${orderCount.count}`);

        db.get('SELECT COUNT(*) as count FROM measurements', [], (err, measurementCount) => {
            if (err) {
                console.error('Error counting measurements:', err);
                return;
            }
            console.log(`Current measurements count: ${measurementCount.count}`);

            db.get('SELECT COUNT(*) as count FROM customers', [], (err, customerCount) => {
                if (err) {
                    console.error('Error counting customers:', err);
                    return;
                }
                console.log(`Current customers count: ${customerCount.count}`);

                // Delete measurements first (they reference orders)
                console.log('Deleting measurements...');
                db.run('DELETE FROM measurements', (err) => {
                    if (err) {
                        console.error('Error deleting measurements:', err);
                        return;
                    }
                    console.log('✅ Measurements deleted successfully');

                    // Delete orders
                    console.log('Deleting orders...');
                    db.run('DELETE FROM orders', (err) => {
                        if (err) {
                            console.error('Error deleting orders:', err);
                            return;
                        }
                        console.log('✅ Orders deleted successfully');

                        // Verify the deletion
                        db.get('SELECT COUNT(*) as count FROM orders', [], (err, finalOrderCount) => {
                            if (err) {
                                console.error('Error verifying orders deletion:', err);
                                return;
                            }
                            console.log(`Final orders count: ${finalOrderCount.count}`);

                            db.get('SELECT COUNT(*) as count FROM measurements', [], (err, finalMeasurementCount) => {
                                if (err) {
                                    console.error('Error verifying measurements deletion:', err);
                                    return;
                                }
                                console.log(`Final measurements count: ${finalMeasurementCount.count}`);

                                db.get('SELECT COUNT(*) as count FROM customers', [], (err, finalCustomerCount) => {
                                    if (err) {
                                        console.error('Error verifying customers count:', err);
                                        return;
                                    }
                                    console.log(`Final customers count: ${finalCustomerCount.count}`);

                                    console.log('\n🎉 Orders-related data cleared successfully!');
                                    console.log('✅ All orders and measurements deleted');
                                    console.log('✅ Customer data preserved');
                                    console.log('\nDatabase summary:');
                                    console.log(`- Customers: ${finalCustomerCount.count} (preserved)`);
                                    console.log(`- Orders: ${finalOrderCount.count} (deleted)`);
                                    console.log(`- Measurements: ${finalMeasurementCount.count} (deleted)`);

                                    db.close((err) => {
                                        if (err) {
                                            console.error('Error closing database:', err);
                                        } else {
                                            console.log('\nDatabase connection closed');
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
