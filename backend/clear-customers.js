const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'tailor_shop.db');

console.log('Clearing only customers-related data from backend database...');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('Connected to database');

    // Check current data counts
    db.get('SELECT COUNT(*) as count FROM customers', [], (err, customerCount) => {
        if (err) {
            console.error('Error counting customers:', err);
            return;
        }
        console.log(`Current customers count: ${customerCount.count}`);

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

                // WARNING: Deleting customers will affect orders that reference them
                console.log('\n⚠️  WARNING: Deleting customers will affect orders that reference them!');
                console.log('Orders with deleted customers will show "Customer not found" in the app.');
                console.log('Consider if you want to delete orders first, or keep customers for reference.\n');

                // Delete customers (this will break foreign key constraints)
                console.log('Deleting customers...');
                db.run('DELETE FROM customers', (err) => {
                    if (err) {
                        console.error('Error deleting customers:', err);
                        return;
                    }
                    console.log('✅ Customers deleted successfully');

                    // Verify the deletion
                    db.get('SELECT COUNT(*) as count FROM customers', [], (err, finalCustomerCount) => {
                        if (err) {
                            console.error('Error verifying customers deletion:', err);
                            return;
                        }
                        console.log(`Final customers count: ${finalCustomerCount.count}`);

                        db.get('SELECT COUNT(*) as count FROM orders', [], (err, finalOrderCount) => {
                            if (err) {
                                console.error('Error verifying orders count:', err);
                                return;
                            }
                            console.log(`Final orders count: ${finalOrderCount.count}`);

                            db.get('SELECT COUNT(*) as count FROM measurements', [], (err, finalMeasurementCount) => {
                                if (err) {
                                    console.error('Error verifying measurements count:', err);
                                    return;
                                }
                                console.log(`Final measurements count: ${finalMeasurementCount.count}`);

                                console.log('\n🎉 Customers-related data cleared successfully!');
                                console.log('✅ All customers deleted');
                                console.log('⚠️  Orders preserved (but may reference deleted customers)');
                                console.log('✅ Measurements preserved');
                                console.log('\nDatabase summary:');
                                console.log(`- Customers: ${finalCustomerCount.count} (deleted)`);
                                console.log(`- Orders: ${finalOrderCount.count} (preserved)`);
                                console.log(`- Measurements: ${finalMeasurementCount.count} (preserved)`);

                                console.log('\n⚠️  IMPORTANT:');
                                console.log('- Existing orders may show "Customer not found" errors');
                                console.log('- Consider creating new customers before adding orders');
                                console.log('- Or run clear-orders.js to remove orphaned orders');

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
