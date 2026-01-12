# pharmacy/tests/test_api.py
"""
Test cases for API Views
Run: python manage.py test pharmacy.tests.test_api
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from decimal import Decimal
from datetime import date, timedelta
from pharmacy.models import (
    Category, Product, ProductBatch, Order, OrderItem, Cart,
    PatientMedicalProfile, Allergy, ChronicCondition, CurrentMedication,
    MedicalNote, Question
)

User = get_user_model()


class AuthenticationAPITest(APITestCase):
    """Test cases for Authentication API"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='customer'
        )
    
    def test_login_success(self):
        """Test successful login"""
        response = self.client.post('/api/users/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = self.client.post('/api/users/login/', {
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_register_user(self):
        """Test user registration"""
        response = self.client.post('/api/users/', {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'role': 'customer'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 2)


class CategoryAPITest(APITestCase):
    """Test cases for Category API"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='admin123',
            role='admin'
        )
        self.client.force_authenticate(user=self.admin)
        
        self.category = Category.objects.create(
            name='Pain Relief',
            description='Pain medications'
        )
    
    def test_list_categories(self):
        """Test listing categories"""
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_create_category(self):
        """Test creating category"""
        response = self.client.post('/api/categories/', {
            'name': 'Vitamins',
            'description': 'Vitamin supplements'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Category.objects.count(), 2)
    
    def test_update_category(self):
        """Test updating category"""
        response = self.client.patch(f'/api/categories/{self.category.id}/', {
            'name': 'Pain Relief Updated'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.category.refresh_from_db()
        self.assertEqual(self.category.name, 'Pain Relief Updated')
    
    def test_delete_category(self):
        """Test deleting category"""
        response = self.client.delete(f'/api/categories/{self.category.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Category.objects.count(), 0)


class ProductAPITest(APITestCase):
    """Test cases for Product API"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='admin123',
            role='admin'
        )
        self.customer = User.objects.create_user(
            username='customer',
            email='customer@example.com',
            password='customer123',
            role='customer'
        )
        
        self.category = Category.objects.create(name='Antibiotics')
        self.product = Product.objects.create(
            name='Amoxicillin 500mg',
            description='Antibiotic medication',
            price=Decimal('15.99'),
            category=self.category,
            manufacturer='PharmaCo',
            requires_prescription=True,
            low_stock_threshold=10
        )
        ProductBatch.objects.create(
            product=self.product,
            batch_number='AMX001',
            quantity=100,
            expiry_date=date.today() + timedelta(days=365)
        )
    
    def test_list_products_authenticated(self):
        """Test listing products (authenticated)"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_list_products_unauthenticated(self):
        """Test listing products (unauthenticated)"""
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_product_admin(self):
        """Test creating product as admin"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/products/', {
            'name': 'Ibuprofen 400mg',
            'description': 'Pain reliever',
            'price': '12.99',
            'category': self.category.id,
            'manufacturer': 'MedCorp',
            'requires_prescription': False,
            'low_stock_threshold': 15
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 2)
    
    def test_search_products(self):
        """Test product search"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/products/search/?q=Amox')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_low_stock_products(self):
        """Test low stock products endpoint"""
        self.client.force_authenticate(user=self.admin)
        # Create low stock product
        low_stock_product = Product.objects.create(
            name='Low Stock Item',
            description='Almost out',
            price=Decimal('9.99'),
            category=self.category,
            manufacturer='Test',
            low_stock_threshold=20
        )
        ProductBatch.objects.create(
            product=low_stock_product,
            batch_number='LOW001',
            quantity=5,
            expiry_date=date.today() + timedelta(days=365)
        )
        
        response = self.client.get('/api/products/low_stock/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)


class CartAPITest(APITestCase):
    """Test cases for Cart API"""
    
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username='shopper',
            email='shopper@example.com',
            password='shop123',
            role='customer'
        )
        self.category = Category.objects.create(name='Vitamins')
        self.product = Product.objects.create(
            name='Vitamin C',
            description='Immune booster',
            price=Decimal('19.99'),
            category=self.category,
            manufacturer='VitaCo'
        )
        ProductBatch.objects.create(
            product=self.product,
            batch_number='VIT001',
            quantity=50,
            expiry_date=date.today() + timedelta(days=365)
        )
        self.client.force_authenticate(user=self.customer)
    
    def test_add_to_cart(self):
        """Test adding item to cart"""
        response = self.client.post('/api/cart/', {
            'product': self.product.id,
            'quantity': 2
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Cart.objects.count(), 1)
    
    def test_get_cart(self):
        """Test getting cart items"""
        Cart.objects.create(
            customer=self.customer,
            product=self.product,
            quantity=3
        )
        response = self.client.get('/api/cart/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['quantity'], 3)
    
    def test_update_cart_item(self):
        """Test updating cart item quantity"""
        cart_item = Cart.objects.create(
            customer=self.customer,
            product=self.product,
            quantity=1
        )
        response = self.client.patch(f'/api/cart/{cart_item.id}/', {
            'quantity': 5
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cart_item.refresh_from_db()
        self.assertEqual(cart_item.quantity, 5)
    
    def test_remove_from_cart(self):
        """Test removing item from cart"""
        cart_item = Cart.objects.create(
            customer=self.customer,
            product=self.product,
            quantity=1
        )
        response = self.client.delete(f'/api/cart/{cart_item.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Cart.objects.count(), 0)


class OrderAPITest(APITestCase):
    """Test cases for Order API"""
    
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username='buyer',
            email='buyer@example.com',
            password='buy123',
            role='customer'
        )
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='admin123',
            role='admin'
        )
        self.category = Category.objects.create(name='General')
        self.product = Product.objects.create(
            name='Bandages',
            description='First aid bandages',
            price=Decimal('5.99'),
            category=self.category,
            manufacturer='MedSupply'
        )
        ProductBatch.objects.create(
            product=self.product,
            batch_number='BAN001',
            quantity=200,
            expiry_date=date.today() + timedelta(days=730)
        )
    
    def test_checkout(self):
        """Test checkout process"""
        self.client.force_authenticate(user=self.customer)
        # Add to cart first
        Cart.objects.create(
            customer=self.customer,
            product=self.product,
            quantity=2
        )
        response = self.client.post('/api/orders/checkout/', {
            'shipping_address': '123 Test Street',
            'payment_method': 'credit_card'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(Cart.objects.filter(customer=self.customer).count(), 0)
    
    def test_list_orders_customer(self):
        """Test customer can only see their orders"""
        self.client.force_authenticate(user=self.customer)
        Order.objects.create(
            customer=self.customer,
            status='pending',
            total_amount=Decimal('11.98'),
            shipping_address='123 Test St',
            payment_method='cash'
        )
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_approve_order(self):
        """Test admin approving order"""
        self.client.force_authenticate(user=self.admin)
        order = Order.objects.create(
            customer=self.customer,
            status='pending',
            total_amount=Decimal('11.98'),
            shipping_address='123 Test St',
            payment_method='cash'
        )
        response = self.client.post(f'/api/orders/{order.id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'approved')
    
    def test_reject_order(self):
        """Test admin rejecting order"""
        self.client.force_authenticate(user=self.admin)
        order = Order.objects.create(
            customer=self.customer,
            status='pending',
            total_amount=Decimal('11.98'),
            shipping_address='123 Test St',
            payment_method='cash'
        )
        response = self.client.post(f'/api/orders/{order.id}/reject/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status, 'rejected')


class MedicalProfileAPITest(APITestCase):
    """Test cases for Medical Profile API"""
    
    def setUp(self):
        self.client = APIClient()
        self.patient = User.objects.create_user(
            username='patient',
            email='patient@example.com',
            password='patient123',
            role='customer'
        )
        self.doctor = User.objects.create_user(
            username='doctor',
            email='doctor@example.com',
            password='doctor123',
            role='doctor'
        )
    
    def test_get_my_profile(self):
        """Test getting own medical profile"""
        self.client.force_authenticate(user=self.patient)
        response = self.client.get('/api/medical-profiles/my_profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_update_my_profile(self):
        """Test updating own medical profile"""
        self.client.force_authenticate(user=self.patient)
        PatientMedicalProfile.objects.create(patient=self.patient)
        response = self.client.patch('/api/medical-profiles/my_profile/', {
            'blood_type': 'O+',
            'weight': '75.5'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_doctor_view_patient_history(self):
        """Test doctor viewing patient medical history"""
        self.client.force_authenticate(user=self.doctor)
        PatientMedicalProfile.objects.create(
            patient=self.patient,
            blood_type='A+'
        )
        response = self.client.get(f'/api/medical-profiles/patient/{self.patient.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['blood_type'], 'A+')


class AllergyAPITest(APITestCase):
    """Test cases for Allergy API"""
    
    def setUp(self):
        self.client = APIClient()
        self.patient = User.objects.create_user(
            username='allergic',
            email='allergic@example.com',
            password='allergy123',
            role='customer'
        )
        self.client.force_authenticate(user=self.patient)
    
    def test_create_allergy(self):
        """Test creating allergy record"""
        response = self.client.post('/api/allergies/', {
            'allergen': 'Penicillin',
            'allergy_type': 'drug',
            'severity': 'severe',
            'reaction': 'Anaphylaxis'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_list_allergies(self):
        """Test listing allergies"""
        Allergy.objects.create(
            patient=self.patient,
            allergen='Peanuts',
            allergy_type='food',
            severity='moderate'
        )
        response = self.client.get('/api/allergies/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class QuestionAPITest(APITestCase):
    """Test cases for Question API"""
    
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username='asker',
            email='asker@example.com',
            password='ask123',
            role='customer'
        )
        self.doctor = User.objects.create_user(
            username='answerer',
            email='answerer@example.com',
            password='answer123',
            role='doctor'
        )
    
    def test_create_question(self):
        """Test creating a question"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.post('/api/questions/', {
            'title': 'Medication Query',
            'question_text': 'How should I take this medicine?'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_answer_question(self):
        """Test doctor answering question"""
        question = Question.objects.create(
            customer=self.customer,
            title='Dosage Question',
            question_text='What is the correct dosage?'
        )
        self.client.force_authenticate(user=self.doctor)
        response = self.client.post(f'/api/questions/{question.id}/answer/', {
            'answer': 'Take one tablet twice daily with food.'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        question.refresh_from_db()
        self.assertTrue(question.is_answered)


class ProductBatchAPITest(APITestCase):
    """Test cases for ProductBatch API"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='admin123',
            role='admin'
        )
        self.category = Category.objects.create(name='Test Category')
        self.product = Product.objects.create(
            name='Test Product',
            description='Test',
            price=Decimal('10.00'),
            category=self.category,
            manufacturer='TestCo'
        )
        self.client.force_authenticate(user=self.admin)
    
    def test_create_batch(self):
        """Test creating product batch"""
        response = self.client.post('/api/product-batches/', {
            'product': self.product.id,
            'batch_number': 'BATCH001',
            'quantity': 100,
            'expiry_date': (date.today() + timedelta(days=365)).isoformat()
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_get_expired_batches(self):
        """Test getting expired batches"""
        ProductBatch.objects.create(
            product=self.product,
            batch_number='EXPIRED001',
            quantity=50,
            expiry_date=date.today() - timedelta(days=30)
        )
        response = self.client.get('/api/product-batches/expired/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
    
    def test_get_expiring_soon(self):
        """Test getting batches expiring soon"""
        ProductBatch.objects.create(
            product=self.product,
            batch_number='EXPIRING001',
            quantity=50,
            expiry_date=date.today() + timedelta(days=15)
        )
        response = self.client.get('/api/product-batches/expiring_soon/?days=30')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
