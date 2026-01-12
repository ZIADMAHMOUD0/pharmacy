# Pharmacy Management System

A comprehensive pharmacy management system built with Django REST Framework backend and React frontend. This system supports multiple user roles (Customer, Admin, Store Manager, Doctor) with features for product management, order processing, stock tracking, and patient consultations.

## Features

### Customer Features
- Browse and search products
- Shopping cart management
- Order placement and tracking
- Ask doctor questions
- Chatbot assistance
- Profile management

### Admin Features
- User management
- Product and category management
- Batch tracking with expiry date monitoring
- Order approval/rejection
- Stock request management

### Store Manager Features
- Stock management
- Low stock alerts
- Expiry date tracking

### Doctor Features
- Answer patient questions
- Patient record management

## Tech Stack

### Backend
- Django 4.2.7
- Django REST Framework 3.14.0
- JWT Authentication (djangorestframework-simplejwt)
- SQLite (development) / PostgreSQL (production recommended)
- Pillow for image handling

### Frontend
- React 19.2.0
- React Router DOM 7.9.5
- Axios for API calls
- Tailwind CSS for styling
- React Icons

## Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend/pharmacy_project
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - Windows:
   ```bash
   venv\Scripts\activate
   ```
   - Linux/Mac:
   ```bash
   source venv/bin/activate
   ```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file in `backend/pharmacy_project/`:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOW_ALL_ORIGINS=True
```

6. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

7. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

8. Run the development server:
```bash
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults to localhost:8000):
```env
REACT_APP_API_URL=http://localhost:8000/api
```

4. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## Project Structure

```
pharmacy-system/
├── backend/
│   └── pharmacy_project/
│       ├── pharmacy/          # Main app
│       │   ├── models.py      # Database models
│       │   ├── views.py       # API views
│       │   ├── serializers.py # DRF serializers
│       │   └── urls.py        # URL routing
│       ├── pharmacy_project/  # Project settings
│       │   ├── settings.py    # Django settings
│       │   └── urls.py        # Main URL config
│       └── requirements.txt   # Python dependencies
├── frontend/
│   └── src/
│       ├── components/        # Reusable components
│       ├── pages/             # Page components
│       ├── contexts/          # React contexts
│       ├── services/          # API services
│       └── App.js             # Main app component
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/users/login/` - User login
- `POST /api/users/` - User registration
- `POST /api/token/refresh/` - Refresh JWT token
- `POST /api/users/change_password/` - Change password

### Products
- `GET /api/products/` - List all products
- `GET /api/products/{id}/` - Get product details
- `POST /api/products/` - Create product (admin)
- `PATCH /api/products/{id}/` - Update product (admin)
- `DELETE /api/products/{id}/` - Delete product (admin)
- `GET /api/products/search/?q={query}` - Search products
- `GET /api/products/low_stock/` - Get low stock products

### Orders
- `GET /api/orders/` - List orders
- `POST /api/orders/checkout/` - Create order from cart
- `POST /api/orders/{id}/approve/` - Approve order (admin)
- `POST /api/orders/{id}/reject/` - Reject order (admin)
- `POST /api/orders/{id}/cancel/` - Cancel order

### Cart
- `GET /api/cart/` - Get user's cart
- `POST /api/cart/` - Add item to cart
- `PATCH /api/cart/{id}/` - Update cart item
- `DELETE /api/cart/{id}/` - Remove cart item

## Security Features

- JWT-based authentication
- Password hashing
- CORS configuration
- Environment variable support for sensitive data
- Input validation
- Role-based access control

## Recent Improvements

1. **Security Enhancements**
   - Environment variable support for sensitive settings
   - Improved CORS configuration
   - Security headers for production

2. **Error Handling**
   - Automatic token refresh mechanism
   - Better error messages
   - Input validation

3. **Code Quality**
   - Fixed requirements.txt typo
   - Improved middleware ordering
   - Better error handling in views

## Development

### Running Tests
```bash
# Backend
cd backend/pharmacy_project
python manage.py test

# Frontend
cd frontend
npm test
```

### Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

## Production Deployment

1. Set `DEBUG=False` in `.env`
2. Set a strong `SECRET_KEY`
3. Configure `ALLOWED_HOSTS` with your domain
4. Set `CORS_ALLOW_ALL_ORIGINS=False` and configure `CORS_ALLOWED_ORIGINS`
5. Use PostgreSQL instead of SQLite
6. Set up static file serving
7. Use a production WSGI server (e.g., Gunicorn)
8. Set up reverse proxy (e.g., Nginx)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please open an issue on the repository.






