# PharmaCare Test Suite

## Overview

This test suite covers the PharmaCare pharmacy management system with comprehensive tests for:
- Django Models
- REST API Endpoints
- Serializers
- React Frontend Components

## Test Structure

```
tests/
├── __init__.py              # Test suite documentation
├── test_models.py           # Django model tests
├── test_api.py              # API endpoint tests
├── test_serializers.py      # Serializer tests
├── frontend_tests.js        # React component tests
└── README.md                # This file
```

---

## Backend Tests (Django)

### Prerequisites

```bash
pip install pytest pytest-django coverage
```

### Running Tests

#### Run All Tests
```bash
python manage.py test pharmacy.tests
```

#### Run Specific Test File
```bash
python manage.py test pharmacy.tests.test_models
python manage.py test pharmacy.tests.test_api
python manage.py test pharmacy.tests.test_serializers
```

#### Run Specific Test Class
```bash
python manage.py test pharmacy.tests.test_models.UserModelTest
python manage.py test pharmacy.tests.test_api.ProductAPITest
```

#### Run Specific Test Method
```bash
python manage.py test pharmacy.tests.test_models.UserModelTest.test_create_customer
```

#### Run with Verbosity
```bash
python manage.py test pharmacy.tests -v 2
```

### Test Coverage

```bash
# Install coverage
pip install coverage

# Run tests with coverage
coverage run --source='pharmacy' manage.py test pharmacy.tests

# View coverage report
coverage report

# Generate HTML report
coverage html
# Open htmlcov/index.html in browser
```

---

## Frontend Tests (React)

### Prerequisites

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

### Setup

1. Copy `frontend_tests.js` to `src/__tests__/`

2. Add to `package.json`:
```json
{
  "scripts": {
    "test": "react-scripts test"
  }
}
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- frontend_tests.js

# Run in watch mode
npm test -- --watchAll
```

---

## Test Categories

### Model Tests (`test_models.py`)

| Test Class | Tests |
|------------|-------|
| `UserModelTest` | User creation (customer, admin, doctor, store_manager) |
| `CategoryModelTest` | Category CRUD, uniqueness |
| `ProductModelTest` | Product creation, stock calculation, low stock |
| `ProductBatchModelTest` | Batch creation, expiry detection |
| `OrderModelTest` | Order creation, status changes |
| `CartModelTest` | Cart operations |
| `PatientMedicalProfileTest` | Medical profile creation |
| `AllergyModelTest` | Allergy records |
| `ChronicConditionModelTest` | Chronic conditions |
| `CurrentMedicationModelTest` | Current medications |
| `MedicalNoteModelTest` | Doctor notes |
| `QuestionModelTest` | Q&A system |

### API Tests (`test_api.py`)

| Test Class | Tests |
|------------|-------|
| `AuthenticationAPITest` | Login, registration, token handling |
| `CategoryAPITest` | CRUD operations |
| `ProductAPITest` | Product listing, search, creation |
| `CartAPITest` | Add, update, remove cart items |
| `OrderAPITest` | Checkout, order management |
| `MedicalProfileAPITest` | Profile viewing/updating |
| `AllergyAPITest` | Allergy CRUD |
| `QuestionAPITest` | Q&A operations |
| `ProductBatchAPITest` | Batch management, expiry tracking |

### Serializer Tests (`test_serializers.py`)

| Test Class | Tests |
|------------|-------|
| `UserSerializerTest` | User serialization |
| `CategorySerializerTest` | Category with product count |
| `ProductSerializerTest` | Product with stock, image URL |
| `ProductBatchSerializerTest` | Batch with expiry flag |
| `CartSerializerTest` | Cart with product details |
| `MedicalProfileSerializerTest` | Full medical history |
| `OrderSerializerTest` | Order with items |

### Frontend Tests (`frontend_tests.js`)

| Test Suite | Tests |
|------------|-------|
| Login Component | Form rendering, validation, authentication |
| Products Component | Listing, search, filtering, add to cart |
| Cart Component | Display, quantity update, removal |
| Medical History | Profile display, allergies, conditions |
| Admin ManageProducts | CRUD operations, modal handling |
| Utility Components | Toast, ConfirmModal |

---

## Test Data

Tests use isolated test databases. Each test class has a `setUp` method that creates necessary test data.

### Example Test Data

```python
# User
user = User.objects.create_user(
    username='testuser',
    email='test@example.com',
    password='testpass123',
    role='customer'
)

# Product
product = Product.objects.create(
    name='Paracetamol',
    description='Pain reliever',
    price=Decimal('9.99'),
    category=category,
    manufacturer='PharmaCo'
)

# Batch
batch = ProductBatch.objects.create(
    product=product,
    batch_number='BATCH001',
    quantity=100,
    expiry_date=date.today() + timedelta(days=365)
)
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install coverage
      - name: Run tests
        run: |
          coverage run --source='pharmacy' manage.py test pharmacy.tests
          coverage report

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test -- --coverage --watchAll=false
```

---

## Troubleshooting

### Common Issues

1. **Database errors**: Make sure test database is properly configured
   ```python
   # settings.py
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.sqlite3',
           'NAME': BASE_DIR / 'db.sqlite3',
           'TEST': {
               'NAME': BASE_DIR / 'test_db.sqlite3',
           }
       }
   }
   ```

2. **Import errors**: Ensure all models are imported in `__init__.py`

3. **Authentication errors**: Use `force_authenticate()` in API tests
   ```python
   self.client.force_authenticate(user=self.admin)
   ```

4. **React test errors**: Make sure mocks are properly set up
   ```javascript
   jest.mock('../services/api', () => ({
     // ... mock implementations
   }));
   ```

---

## Writing New Tests

### Model Test Template

```python
class NewModelTest(TestCase):
    def setUp(self):
        # Create test data
        pass
    
    def test_create(self):
        """Test creating object"""
        pass
    
    def test_validation(self):
        """Test validation rules"""
        pass
    
    def test_relationships(self):
        """Test model relationships"""
        pass
```

### API Test Template

```python
class NewAPITest(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(...)
        self.client.force_authenticate(user=self.user)
    
    def test_list(self):
        """Test list endpoint"""
        response = self.client.get('/api/endpoint/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_create(self):
        """Test create endpoint"""
        response = self.client.post('/api/endpoint/', {...})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
```

### Frontend Test Template

```javascript
describe('NewComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly', () => {
    render(<NewComponent />);
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });

  test('handles user interaction', async () => {
    render(<NewComponent />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(mockFunction).toHaveBeenCalled();
    });
  });
});
```
