# Ladies Tailor Shop App

A comprehensive React Native mobile application for managing ladies tailor shop operations with customer management, order tracking, and detailed measurement forms for Indian garments.

## Features

### 🔐 Authentication
- Secure login system for tailors
- Default credentials: Username: `admin`, Password: `admin123`
- JWT-based authentication with secure token storage

### 👥 Customer Management
- Add new customers with details
- Search customers by name, customer number, or contact
- View customer information and order history
- Edit customer details

### 📋 Order Management
- Create and manage customer orders
- Track order status (Pending, In Progress, Ready, Delivered, Completed, Cancelled)
- Search orders by order number, customer name, or contact
- View detailed order information
- Update order status and details

### 📏 Comprehensive Measurement System
Supports all major Indian garment types with specific measurements:

#### 1. General Body Measurements
- Bust/Chest, Waist, Hip, Shoulder Width
- Neck measurements, Armhole, Sleeve measurements
- Front/Back measurements

#### 2. Kurti / Kameez / Top
- Length, Bust, Waist, Hip measurements
- Neck depth and width
- Side slit and bottom opening

#### 3. Salwar / Pant / Churidar
- Waist, Hip, Thigh measurements
- Inseam/Outseam length
- Salwar belt height and ghera

#### 4. Blouse (Saree Blouse)
- Bust, Underbust, Waist
- Neck measurements, Armhole
- Back opening and dori length

#### 5. Lehenga / Skirt
- Waist, Hip, Length
- Bottom ghera, can-can requirements

#### 6. Gown / Anarkali
- Full length, body measurements
- Yoke length, flare measurements

#### 7. Additional Optional Measurements
- Torso length, waist position
- Body height, maternity ease
- Custom measurements

### 📸 Design Image Upload
- Upload design reference images for orders
- View design images in order details
- Image storage and management

### 🔍 Advanced Search
- Search customers by name, customer number, or contact
- Search orders by order number, customer name, or contact
- Real-time search results

## Technology Stack

### Frontend (React Native)
- **Expo** - Development platform
- **React Navigation** - Navigation and routing
- **Expo Secure Store** - Secure token storage
- **Expo Image Picker** - Image upload functionality
- **Axios** - HTTP client for API calls
- **React Native Paper** - UI components

### Backend (Node.js)
- **Express.js** - Web framework
- **SQLite** - Database for data storage
- **Multer** - File upload handling
- **bcryptjs** - Password hashing
- **JWT** - Authentication tokens
- **CORS** - Cross-origin resource sharing

## Installation & Setup

### Prerequisites
- Node.js installed on your system
- Expo CLI installed globally (`npm install -g expo-cli`)
- Mobile device or emulator for testing

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   node index.js
   ```
   The server will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the project root directory:
   ```bash
   cd mobile-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run the app on your device/emulator:
   - For Android: `npm run android`
   - For iOS: `npm run ios`
   - For Web: `npm run web`

## Database Schema

The app uses SQLite with the following tables:

### tailors
- Authentication and shop information
- Default admin user created automatically

### customers
- Customer details and contact information
- Unique customer numbers

### orders
- Order information with customer relationships
- Status tracking and payment details
- Design image references

### measurements
- Detailed measurements for each order
- Supports all garment types

## API Endpoints

### Authentication
- `POST /api/login` - User login

### Customers
- `GET /api/customers` - Get all customers (with search)
- `POST /api/customers` - Add new customer

### Orders
- `GET /api/orders` - Get all orders (with search)
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `POST /api/orders/:id/measurements` - Save measurements

## Usage

1. **Login**: Use default credentials (admin/admin123) or create new tailor accounts
2. **Add Customers**: Create customer profiles with contact details
3. **Create Orders**: Add orders for customers with garment type selection
4. **Upload Designs**: Add design reference images for orders
5. **Add Measurements**: Record detailed measurements based on garment type
6. **Track Orders**: Monitor order status and update progress
7. **Search**: Quickly find customers or orders using search functionality

## Project Structure

```
mobile-app/
├── src/
│   ├── components/     # Reusable components
│   ├── screens/        # App screens
│   │   ├── LoginScreen.js
│   │   ├── HomeScreen.js
│   │   ├── CustomerListScreen.js
│   │   ├── AddCustomerScreen.js
│   │   ├── OrderListScreen.js
│   │   ├── AddOrderScreen.js
│   │   ├── OrderDetailScreen.js
│   │   └── MeasurementScreen.js
│   ├── services/       # API services
│   │   └── api.js
│   └── utils/          # Utility functions
│       └── measurements.js
├── backend/
│   ├── index.js        # Main server file
│   ├── uploads/        # Uploaded images
│   └── tailor_shop.db  # SQLite database
└── App.js              # Main app component
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For any issues or questions, please create an issue in the repository or contact the development team.
