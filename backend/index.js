const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your-secret-key';

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

const dbPath = path.join(__dirname, 'tailor_shop.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS tailors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        shop_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_number TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        contact_number TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Check if garment_type column exists and migrate to garment_types
    db.all("PRAGMA table_info(orders)", (err, columns) => {
        if (err) {
            console.error('Error checking table info:', err);
            return;
        }
        
        const hasGarmentType = columns.some(col => col.name === 'garment_type');
        const hasGarmentTypes = columns.some(col => col.name === 'garment_types');
        const hasCreatedAt = columns.some(col => col.name === 'created_at');
        
        console.log('Table columns:', columns.map(col => col.name));
        console.log('hasGarmentType:', hasGarmentType, 'hasGarmentTypes:', hasGarmentTypes, 'hasCreatedAt:', hasCreatedAt);
        
        // Force migration if created_at is missing or if we need to migrate garment_type
        if (!hasCreatedAt || hasGarmentType) {
            console.log('Running migration to fix table schema...');
            
            // Drop any existing orders_new table first
            db.run(`DROP TABLE IF EXISTS orders_new`, (err) => {
                if (err) {
                    console.error('Error dropping existing orders_new table:', err);
                    return;
                }
                
                console.log('Dropped existing orders_new table');
                
                // Create new table with updated schema
                db.run(`CREATE TABLE orders_new (
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
                        console.error('Error creating orders_new table:', err);
                        return;
                    }
                    
                    console.log('Created orders_new table');
                    
                    // Copy data from old table to new table
                    let copyQuery;
                    if (hasGarmentType && !hasGarmentTypes) {
                        // Migrate from garment_type to garment_types
                        copyQuery = `INSERT INTO orders_new 
                            SELECT id, order_number, customer_id, 
                                   JSON_ARRAY(garment_type) as garment_types,
                                   order_date, delivery_date, status, 
                                   design_image, notes, total_amount, 
                                   advance_amount, balance_amount,
                                   datetime('now') as created_at
                            FROM orders`;
                    } else {
                        // Copy existing data
                        copyQuery = `INSERT INTO orders_new 
                            SELECT id, order_number, customer_id, garment_types,
                                   order_date, delivery_date, status, 
                                   design_image, notes, total_amount, 
                                   advance_amount, balance_amount,
                                   datetime('now') as created_at
                            FROM orders`;
                    }
                    
                    // Check if orders table exists before copying
                    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='orders'", [], (err, row) => {
                        if (err) {
                            console.error('Error checking orders table:', err);
                            return;
                        }
                        
                        if (row) {
                            // Orders table exists, copy data
                            db.run(copyQuery, (err) => {
                                if (err) {
                                    console.error('Error copying data to orders_new:', err);
                                    return;
                                }
                                
                                console.log('Copied data to orders_new');
                                continueMigration();
                            });
                        } else {
                            // No orders table exists, just continue with new table
                            console.log('No existing orders table found, using fresh table');
                            continueMigration();
                        }
                    });
                    
                    function continueMigration() {
                        // Drop old table and rename new table
                        db.run(`DROP TABLE IF EXISTS orders`, (err) => {
                            if (err) {
                                console.error('Error dropping old orders table:', err);
                                return;
                            }
                            
                            db.run(`ALTER TABLE orders_new RENAME TO orders`, (err) => {
                                if (err) {
                                    console.error('Error renaming orders_new to orders:', err);
                                } else {
                                    console.log('Successfully migrated orders table with correct schema');
                                    
                                    // Now fix customer_id issues by matching customer_number to customer.id
                                    fixCustomerIds();
                                }
                            });
                        });
                    }
                });
            });
        } else {
            console.log('Orders table schema is correct');
            // Still need to fix customer_id issues
            fixCustomerIds();
        }
    });

    // Function to fix customer_id issues by matching customer_number
    function fixCustomerIds() {
        console.log('Checking for customer_id issues...');
        
        // Find orders with customer_id that don't match any customer.id
        db.all(`
            SELECT o.id, o.customer_id, o.order_number, c.id as real_customer_id, c.customer_number
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.id
            WHERE c.id IS NULL
        `, [], (err, mismatchedOrders) => {
            if (err) {
                console.error('Error finding mismatched orders:', err);
                return;
            }
            
            if (mismatchedOrders.length > 0) {
                console.log(`Found ${mismatchedOrders.length} orders with mismatched customer_id`);
                
                mismatchedOrders.forEach(order => {
                    console.log(`Order ${order.id}: customer_id=${order.customer_id}, trying to match with customer_number`);
                    
                    // Try to find customer by customer_number
                    db.get('SELECT id FROM customers WHERE customer_number = ?', [order.customer_id.toString()], (err, customer) => {
                        if (err) {
                            console.error('Error finding customer:', err);
                            return;
                        }
                        
                        if (customer) {
                            console.log(`Found matching customer: ${customer.id} for order ${order.id}`);
                            
                            // Update the order with correct customer_id
                            db.run('UPDATE orders SET customer_id = ? WHERE id = ?', [customer.id, order.id], (err) => {
                                if (err) {
                                    console.error('Error updating order:', err);
                                } else {
                                    console.log(`Fixed order ${order.id} customer_id from ${order.customer_id} to ${customer.id}`);
                                }
                            });
                        } else {
                            console.log(`No matching customer found for order ${order.id} with customer_id ${order.customer_id}`);
                        }
                    });
                });
            } else {
                console.log('No customer_id issues found');
            }
        });
    }

    db.run(`CREATE TABLE IF NOT EXISTS measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        measurement_type TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT DEFAULT 'inch',
        FOREIGN KEY (order_id) REFERENCES orders (id)
    )`);

    const defaultTailor = {
        username: 'admin',
        password: 'admin123',
        shop_name: 'Default Tailor Shop'
    };

    bcrypt.hash(defaultTailor.password, 10, (err, hash) => {
        if (!err) {
            db.run('INSERT OR IGNORE INTO tailors (username, password, shop_name) VALUES (?, ?, ?)', 
                [defaultTailor.username, hash, defaultTailor.shop_name]);
        }
    });
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

app.get('/', (req, res) => {
    res.json({ 
        message: 'Tailor Shop API is running',
        timestamp: new Date().toISOString(),
        status: 'OK'
    });
});

app.get('/test', (req, res) => {
    res.json({ 
        message: 'Backend connection test successful',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM tailors WHERE username = ?', [username], (err, tailor) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!tailor) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        bcrypt.compare(password, tailor.password, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error comparing passwords' });
            }

            if (result) {
                const token = jwt.sign(
                    { id: tailor.id, username: tailor.username },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                res.json({
                    token,
                    tailor: {
                        id: tailor.id,
                        username: tailor.username,
                        shop_name: tailor.shop_name
                    }
                });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        });
    });
});

app.post('/api/customers', authenticateToken, (req, res) => {
    const { name, contact_number, address } = req.body;
    
    // Auto-generate customer number
    db.get('SELECT MAX(CAST(customer_number AS INTEGER)) as max_number FROM customers', [], (err, row) => {
        if (err) {
            console.error('Error getting max customer number:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        let nextNumber = 1;
        if (row.max_number) {
            nextNumber = parseInt(row.max_number) + 1;
        }
        
        const customer_number = nextNumber.toString();
        
        db.run('INSERT INTO customers (customer_number, name, contact_number, address) VALUES (?, ?, ?, ?)',
            [customer_number, name, contact_number, address],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Customer number already exists' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                console.log(`Created customer with auto-generated number: ${customer_number}`);
                res.json({ id: this.lastID, customer_number, name, contact_number, address });
            }
        );
    });
});

app.get('/api/customers', authenticateToken, (req, res) => {
    const { search } = req.query;
    console.log('GET /api/customers called with search:', search);
    
    let query = 'SELECT * FROM customers';
    let params = [];

    if (search) {
        query += ' WHERE customer_number LIKE ? OR name LIKE ? OR contact_number LIKE ?';
        params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    console.log('Executing customers query:', query);
    console.log('With params:', params);

    db.all(query, params, (err, customers) => {
        if (err) {
            console.error('Database error in GET customers:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        console.log('Found customers:', customers.length);
        if (customers.length > 0) {
            console.log('Sample customer:', customers[0]);
        }
        res.json(customers);
    });
});

app.get('/api/customers/:id', authenticateToken, (req, res) => {
    const customerId = req.params.id;
    console.log('GET /api/customers/:id called with customerId:', customerId);

    db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, customer) => {
        if (err) {
            console.error('Database error in GET customer by ID:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!customer) {
            console.log('Customer not found for ID:', customerId);
            return res.status(404).json({ error: 'Customer not found' });
        }

        console.log('Found customer:', customer);
        res.json(customer);
    });
});

app.put('/api/customers/:id', authenticateToken, (req, res) => {
    const customerId = req.params.id;
    const { name, contact_number, address } = req.body;
    
    console.log('PUT /api/customers/:id called with customerId:', customerId);
    console.log('Update data:', { name, contact_number, address });

    db.run('UPDATE customers SET name = ?, contact_number = ?, address = ? WHERE id = ?',
        [name, contact_number, address, customerId],
        function(err) {
            if (err) {
                console.error('Database error updating customer:', err);
                return res.status(500).json({ error: 'Database error: ' + err.message });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            
            console.log('Customer updated successfully');
            res.json({ 
                id: parseInt(customerId), 
                name, 
                contact_number, 
                address,
                message: 'Customer updated successfully' 
            });
        }
    );
});

app.delete('/api/customers/:id', authenticateToken, (req, res) => {
    const customerId = req.params.id;
    console.log('DELETE /api/customers/:id called with customerId:', customerId);

    // Check if customer has orders before deleting
    db.get('SELECT COUNT(*) as orderCount FROM orders WHERE customer_id = ?', [customerId], (err, result) => {
        if (err) {
            console.error('Database error checking customer orders:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.orderCount > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete customer with existing orders. Please delete all orders first.' 
            });
        }

        // Delete the customer
        db.run('DELETE FROM customers WHERE id = ?', [customerId], function(err) {
            if (err) {
                console.error('Database error deleting customer:', err);
                return res.status(500).json({ error: 'Database error: ' + err.message });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            
            console.log('Customer deleted successfully');
            res.json({ message: 'Customer deleted successfully' });
        });
    });
});

app.post('/api/orders', authenticateToken, upload.single('design_image'), (req, res) => {
    const { customer_id, garment_types, delivery_date, notes, total_amount, advance_amount, measurements } = req.body;
    const design_image = req.file ? req.file.filename : null;
    const balance_amount = total_amount - advance_amount;

    console.log('=== ORDER CREATION DEBUG ===');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request file:', req.file);
    console.log('Request file details:', req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
    } : 'No file');
    console.log('Design image filename:', design_image);
    console.log('Customer ID received:', customer_id);
    console.log('Customer ID type:', typeof customer_id);

    const order_number = 'ORD' + Date.now();

    console.log('Creating order with data:', {
        customer_id,
        customer_id_type: typeof customer_id,
        garment_types,
        delivery_date,
        notes,
        total_amount,
        advance_amount,
        balance_amount,
        design_image
    });

    // Ensure customer_id is an integer
    console.log('Before parseInt - customer_id:', customer_id);
    const customerIdInt = parseInt(customer_id);
    console.log('After parseInt - customerIdInt:', customerIdInt);
    console.log('isNaN check:', isNaN(customerIdInt));
    
    if (isNaN(customerIdInt) || customerIdInt <= 0) {
        console.log('Customer ID validation failed');
        return res.status(400).json({ error: 'Invalid customer_id format' });
    }
    
    console.log('Customer ID validation passed:', customerIdInt);

    // Ensure garment_types is properly handled
    let garmentTypesJson;
    try {
        if (typeof garment_types === 'string') {
            garmentTypesJson = garment_types;
        } else {
            garmentTypesJson = JSON.stringify(garment_types);
        }
    } catch (error) {
        console.error('Error parsing garment_types:', error);
        return res.status(400).json({ error: 'Invalid garment_types format' });
    }

    db.run('INSERT INTO orders (order_number, customer_id, garment_types, delivery_date, design_image, notes, total_amount, advance_amount, balance_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [order_number, customerIdInt, garmentTypesJson, delivery_date, design_image, notes, total_amount, advance_amount, balance_amount],
        function(err) {
            if (err) {
                console.error('Database error inserting order:', err);
                return res.status(500).json({ error: 'Database error: ' + err.message });
            }

            const orderId = this.lastID;
            console.log('Order created with ID:', orderId);

            if (measurements) {
                try {
                    const measurementsArray = JSON.parse(measurements);
                    console.log('Saving measurements:', measurementsArray);
                    
                    const stmt = db.prepare('INSERT INTO measurements (order_id, measurement_type, value) VALUES (?, ?, ?)');
                    
                    measurementsArray.forEach(measurement => {
                        stmt.run([orderId, measurement.measurement_type, measurement.value]);
                    });
                    
                    stmt.finalize((err) => {
                        if (err) {
                            console.error('Error saving measurements:', err);
                        } else {
                            console.log('Measurements saved successfully');
                        }
                    });
                } catch (error) {
                    console.error('Error parsing measurements:', error);
                }
            }

            res.json({ 
                id: orderId, 
                order_number, 
                customer_id, 
                garment_types: JSON.parse(garmentTypesJson), 
                delivery_date, 
                design_image, 
                notes, 
                total_amount, 
                advance_amount, 
                balance_amount 
            });
        }
    );
});

app.get('/api/orders', authenticateToken, (req, res) => {
    const { search } = req.query;
    console.log('GET /api/orders called with search:', search);
    
    // First check if created_at column exists
    db.all("PRAGMA table_info(orders)", (err, columns) => {
        if (err) {
            console.error('Error checking table info in GET orders:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        const hasCreatedAt = columns.some(col => col.name === 'created_at');
        console.log('GET orders - hasCreatedAt:', hasCreatedAt);
        
        // First, let's try to get orders without JOIN to see if they exist
        db.all('SELECT * FROM orders', [], (err, ordersWithoutJoin) => {
            if (err) {
                console.error('Error getting orders without join:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            console.log('Orders without JOIN:', ordersWithoutJoin.length);
            if (ordersWithoutJoin.length > 0) {
                console.log('Sample order:', ordersWithoutJoin[0]);
                console.log('Customer ID type:', typeof ordersWithoutJoin[0].customer_id);
                console.log('Customer ID value:', ordersWithoutJoin[0].customer_id);
            }
            
            let query = `
                SELECT o.*, c.name as customer_name, c.contact_number, c.customer_number 
                FROM orders o 
                JOIN customers c ON o.customer_id = c.id
            `;
            let params = [];

            if (search) {
                query += ' WHERE o.order_number LIKE ? OR c.name LIKE ? OR c.contact_number LIKE ? OR c.customer_number LIKE ?';
                params = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
            }

            // Use order_date if created_at doesn't exist
            if (hasCreatedAt) {
                query += ' ORDER BY o.created_at DESC';
            } else {
                query += ' ORDER BY o.order_date DESC';
            }

            console.log('Executing query:', query);
            console.log('With params:', params);

            db.all(query, params, (err, orders) => {
                if (err) {
                    console.error('Database error in GET orders:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                console.log('Found orders with JOIN:', orders.length);
                
                // Handle backward compatibility for garment_type vs garment_types
                const processedOrders = orders.map(order => {
                    if (order.garment_type && !order.garment_types) {
                        // Old format - convert to new format
                        order.garment_types = JSON.stringify([order.garment_type]);
                    } else if (order.garment_types && typeof order.garment_types === 'string') {
                        // New format - ensure it's valid JSON
                        try {
                            order.garment_types = JSON.parse(order.garment_types);
                        } catch (e) {
                            // If parsing fails, treat as single garment type
                            order.garment_types = [order.garment_types];
                        }
                    }
                    return order;
                });
                
                res.json(processedOrders);
            });
        });
    });
});

app.get('/api/orders/:id', authenticateToken, (req, res) => {
    const orderId = req.params.id;
    console.log('GET /api/orders/:id called with orderId:', orderId);

    db.get(`
        SELECT o.*, c.name as customer_name, c.contact_number, c.customer_number, c.address 
        FROM orders o 
        JOIN customers c ON o.customer_id = c.id 
        WHERE o.id = ?
    `, [orderId], (err, order) => {
        if (err) {
            console.error('Database error in GET order by ID:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!order) {
            console.log('Order not found for ID:', orderId);
            
            // Try to find the order without JOIN to see if it exists
            db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, orderWithoutJoin) => {
                if (err) {
                    console.error('Error checking order without join:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (orderWithoutJoin) {
                    console.log('Order exists but JOIN failed. Order data:', orderWithoutJoin);
                    console.log('Customer ID type:', typeof orderWithoutJoin.customer_id);
                    console.log('Customer ID value:', orderWithoutJoin.customer_id);
                    
                    // Check if customer exists
                    db.get('SELECT * FROM customers WHERE id = ?', [orderWithoutJoin.customer_id], (err, customer) => {
                        if (err) {
                            console.error('Error checking customer:', err);
                            return res.status(500).json({ error: 'Database error' });
                        }
                        
                        if (customer) {
                            console.log('Customer exists:', customer);
                        } else {
                            console.log('Customer not found for ID:', orderWithoutJoin.customer_id);
                        }
                    });
                } else {
                    console.log('Order does not exist at all for ID:', orderId);
                }
            });
            
            return res.status(404).json({ error: 'Order not found' });
        }

        console.log('Found order:', order);

        // Handle backward compatibility for garment_type vs garment_types
        if (order.garment_type && !order.garment_types) {
            // Old format - convert to new format
            order.garment_types = JSON.stringify([order.garment_type]);
        } else if (order.garment_types && typeof order.garment_types === 'string') {
            // New format - ensure it's valid JSON
            try {
                order.garment_types = JSON.parse(order.garment_types);
            } catch (e) {
                // If parsing fails, treat as single garment type
                order.garment_types = [order.garment_types];
            }
        }

        // Fetch measurements for this order
        db.all('SELECT * FROM measurements WHERE order_id = ?', [orderId], (err, measurements) => {
            if (err) {
                console.error('Error fetching measurements:', err);
                measurements = [];
            }
            
            console.log('Found measurements:', measurements.length);
            order.measurements = measurements;
            
            res.json(order);
        });
    });
});

app.put('/api/orders/:id', authenticateToken, upload.single('design_image'), (req, res) => {
    const orderId = req.params.id;
    const { customer_id, garment_types, delivery_date, notes, total_amount, advance_amount, status, measurements } = req.body;
    const design_image = req.file ? req.file.filename : null;
    const balance_amount = total_amount - advance_amount;

    console.log('=== ORDER UPDATE DEBUG ===');
    console.log('Order ID:', orderId);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body:', req.body);
    console.log('customer_id raw:', customer_id);
    console.log('customer_id type:', typeof customer_id);
    console.log('Request file:', req.file);
    console.log('Design image filename:', design_image);

    // Ensure customer_id is an integer (only if provided)
    let customerIdInt = null;
    if (customer_id !== undefined) {
        console.log('Before parseInt - customer_id:', customer_id);
        customerIdInt = parseInt(customer_id);
        console.log('After parseInt - customerIdInt:', customerIdInt);
        console.log('isNaN check:', isNaN(customerIdInt));
        
        if (isNaN(customerIdInt) || customerIdInt <= 0) {
            console.log('Customer ID validation failed');
            return res.status(400).json({ error: 'Invalid customer_id format' });
        }
        
        console.log('Customer ID validation passed:', customerIdInt);
    } else {
        console.log('Customer ID not provided - this is a partial update');
    }

    // Ensure garment_types is properly handled (only if provided)
    let garmentTypesJson = null;
    if (garment_types !== undefined) {
        try {
            if (typeof garment_types === 'string') {
                garmentTypesJson = garment_types;
            } else {
                garmentTypesJson = JSON.stringify(garment_types);
            }
        } catch (error) {
            console.error('Error parsing garment_types:', error);
            return res.status(400).json({ error: 'Invalid garment_types format' });
        }
    }

    // Build the update query dynamically based on what's provided
    let updateFields = [];
    let updateValues = [];

    // Only add fields that are provided
    if (customerIdInt !== null) {
        updateFields.push('customer_id = ?');
        updateValues.push(customerIdInt);
    }
    if (garmentTypesJson !== null) {
        updateFields.push('garment_types = ?');
        updateValues.push(garmentTypesJson);
    }
    if (delivery_date !== undefined) {
        updateFields.push('delivery_date = ?');
        updateValues.push(delivery_date);
    }
    if (notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(notes);
    }
    if (total_amount !== undefined) {
        updateFields.push('total_amount = ?');
        updateValues.push(total_amount);
    }
    if (advance_amount !== undefined) {
        updateFields.push('advance_amount = ?');
        updateValues.push(advance_amount);
    }
    if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
    }

    // Calculate balance_amount if total_amount or advance_amount is provided
    if (total_amount !== undefined && advance_amount !== undefined) {
        const balance_amount = total_amount - advance_amount;
        updateFields.push('balance_amount = ?');
        updateValues.push(balance_amount);
    } else if (total_amount !== undefined && advance_amount === undefined) {
        // Need to get current advance_amount from database to calculate balance
        db.get('SELECT advance_amount FROM orders WHERE id = ?', [orderId], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch current order data' });
            }
            const balance_amount = total_amount - (row?.advance_amount || 0);
            updateFields.push('balance_amount = ?');
            updateValues.push(balance_amount);
            
            // Continue with the update...
            executeUpdate();
        });
        return; // Exit early, we'll continue in the callback
    } else if (advance_amount !== undefined && total_amount === undefined) {
        // Need to get current total_amount from database to calculate balance
        db.get('SELECT total_amount FROM orders WHERE id = ?', [orderId], (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch current order data' });
            }
            const balance_amount = (row?.total_amount || 0) - advance_amount;
            updateFields.push('balance_amount = ?');
            updateValues.push(balance_amount);
            
            // Continue with the update...
            executeUpdate();
        });
        return; // Exit early, we'll continue in the callback
    }

    // Only update design_image if a new one is provided
    if (design_image) {
        updateFields.push('design_image = ?');
        updateValues.push(design_image);
    }

    // Function to execute the update
    function executeUpdate() {
        // Add the WHERE clause
        updateValues.push(orderId);

        const updateQuery = `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`;
        
        console.log('Update query:', updateQuery);
        console.log('Update values:', updateValues);
        
        db.run(updateQuery, updateValues, function(err) {
            if (err) {
                console.error('Error updating order:', err);
                return res.status(500).json({ error: 'Failed to update order' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Order not found' });
            }

            console.log('Order updated successfully');

            // Update measurements if provided
            if (measurements) {
                try {
                    const measurementsArray = JSON.parse(measurements);
                    console.log('Updating measurements:', measurementsArray);
                
                // Delete existing measurements
                db.run('DELETE FROM measurements WHERE order_id = ?', [orderId], (err) => {
                    if (err) {
                        console.error('Error deleting existing measurements:', err);
                        return;
                    }
                    
                    // Insert new measurements
                    const stmt = db.prepare('INSERT INTO measurements (order_id, measurement_type, value) VALUES (?, ?, ?)');
                    
                    measurementsArray.forEach(measurement => {
                        stmt.run([orderId, measurement.measurement_type, measurement.value]);
                    });
                    
                    stmt.finalize((err) => {
                        if (err) {
                            console.error('Error saving measurements:', err);
                        } else {
                            console.log('Measurements updated successfully');
                        }
                    });
                });
            } catch (error) {
                console.error('Error parsing measurements:', error);
            }
        }

        // Send appropriate response based on what data was updated
        if (customerIdInt && garmentTypesJson && total_amount !== undefined && advance_amount !== undefined) {
            res.json({ 
                id: parseInt(orderId),
                customer_id: customerIdInt, 
                garment_types: JSON.parse(garmentTypesJson), 
                delivery_date, 
                design_image, 
                notes, 
                total_amount, 
                advance_amount, 
                balance_amount,
                status,
                message: 'Order updated successfully' 
            });
        } else {
            // For partial updates, just return success
            res.json({ 
                id: parseInt(orderId),
                message: 'Order updated successfully' 
            });
        }
        });
    }

    // Call executeUpdate if we're not waiting for balance calculation
    if (!updateFields.includes('balance_amount')) {
        executeUpdate();
    }
});

app.delete('/api/orders/:id', authenticateToken, (req, res) => {
    const orderId = req.params.id;
    console.log('DELETE /api/orders/:id called with orderId:', orderId);

    // First delete associated measurements
    db.run('DELETE FROM measurements WHERE order_id = ?', [orderId], (err) => {
        if (err) {
            console.error('Database error deleting order measurements:', err);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }

        // Then get the order to check for design image
        db.get('SELECT design_image FROM orders WHERE id = ?', [orderId], (err, order) => {
            if (err) {
                console.error('Database error getting order for deletion:', err);
                return res.status(500).json({ error: 'Database error: ' + err.message });
            }

            // Delete the order
            db.run('DELETE FROM orders WHERE id = ?', [orderId], function(err) {
                if (err) {
                    console.error('Database error deleting order:', err);
                    return res.status(500).json({ error: 'Database error: ' + err.message });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Order not found' });
                }

                // Delete the design image file if it exists
                if (order && order.design_image) {
                    const imagePath = path.join(__dirname, 'uploads', order.design_image);
                    try {
                        if (fs.existsSync(imagePath)) {
                            fs.unlinkSync(imagePath);
                            console.log('Deleted design image:', imagePath);
                        }
                    } catch (fileErr) {
                        console.error('Error deleting design image:', fileErr);
                        // Don't fail the request if file deletion fails
                    }
                }
                
                console.log('Order deleted successfully');
                res.json({ message: 'Order deleted successfully' });
            });
        });
    });
});

app.post('/api/orders/:id/measurements', authenticateToken, (req, res) => {
    const orderId = req.params.id;
    const { measurements } = req.body;

    db.run('DELETE FROM measurements WHERE order_id = ?', [orderId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        const stmt = db.prepare('INSERT INTO measurements (order_id, measurement_type, value) VALUES (?, ?, ?)');
        
        measurements.forEach(measurement => {
            stmt.run([orderId, measurement.type, measurement.value]);
        });
        
        stmt.finalize((err) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Measurements saved successfully' });
        });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend running on port ${PORT}`);
});
