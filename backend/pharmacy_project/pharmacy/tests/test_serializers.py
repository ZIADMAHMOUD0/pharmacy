"""
Test cases for Serializers
Run: python manage.py test pharmacy.tests.test_serializers
"""

from django.test import TestCase
from rest_framework.test import APIRequestFactory
from django.contrib.auth import get_user_model
from decimal import Decimal
from datetime import date, timedelta
from pharmacy.models import (
    Category, Product, ProductBatch, Cart, Order, OrderItem,
    PatientMedicalProfile, Allergy, ChronicCondition, CurrentMedication
)
from pharmacy.serializers import (
    UserSerializer, CategorySerializer, ProductSerializer,
    ProductBatchSerializer, CartSerializer, PatientMedicalProfileSerializer,
    AllergySerializer, ChronicConditionSerializer, CurrentMedicationSerializer,
    OrderSerializer
)

User = get_user_model()


class UserSerializerTest(TestCase):
    """Test cases for UserSerializer"""
    
    def test_serialize_user(self):
        """Test user serialization"""
        user = User.objects.create_user(
            username='serializeuser',
            email='serializeuser@test.com',
            password='pass123',
            role='customer',
            phone='1234567890'
        )
        serializer = UserSerializer(user)
        self.assertEqual(serializer.data['username'], 'serializeuser')
        self.assertEqual(serializer.data['email'], 'serializeuser@test.com')
        self.assertEqual(serializer.data['role'], 'customer')
        self.assertNotIn('password', serializer.data)


class CategorySerializerTest(TestCase):
    """Test cases for CategorySerializer"""
    
    def test_serialize_category(self):
        """Test category serialization"""
        category = Category.objects.create(
            name='Pain Relief',
            description='Pain medications'
        )
        serializer = CategorySerializer(category)
        self.assertEqual(serializer.data['name'], 'Pain Relief')
        self.assertEqual(serializer.data['product_count'], 0)
    
    def test_category_product_count(self):
        """Test product count"""
        category = Category.objects.create(name='Vitamins')
        Product.objects.create(
            name='Vitamin C',
            description='Test',
            price=Decimal('10.00'),
            category=category,
            manufacturer='TestCo'
        )
        Product.objects.create(
            name='Vitamin D',
            description='Test',
            price=Decimal('12.00'),
            category=category,
            manufacturer='TestCo'
        )
        serializer = CategorySerializer(category)
        self.assertEqual(serializer.data['product_count'], 2)


class ProductSerializerTest(TestCase):
    """Test cases for ProductSerializer"""
    
    def setUp(self):
        self.factory = APIRequestFactory()
        self.category = Category.objects.create(name='Antibiotics')
        self.product = Product.objects.create(
            name='Amoxicillin',
            description='Antibiotic',
            price=Decimal('15.99'),
            category=self.category,
            manufacturer='PharmaCo',
            requires_prescription=True
        )
        ProductBatch.objects.create(
            product=self.product,
            batch_number='BATCH001',
            quantity=100,
            expiry_date=date.today() + timedelta(days=365)
        )
    
    def test_serialize_product(self):
        """Test product serialization"""
        serializer = ProductSerializer(self.product)
        self.assertEqual(serializer.data['name'], 'Amoxicillin')
        self.assertEqual(serializer.data['category_name'], 'Antibiotics')
        self.assertEqual(serializer.data['total_stock'], 100)
        self.assertFalse(serializer.data['is_low_stock'])
    
    def test_product_low_stock(self):
        """Test low stock flag"""
        product = Product.objects.create(
            name='Low Stock Item',
            description='Test',
            price=Decimal('5.00'),
            category=self.category,
            manufacturer='TestCo',
            low_stock_threshold=50
        )
        ProductBatch.objects.create(
            product=product,
            batch_number='LOW001',
            quantity=10,
            expiry_date=date.today() + timedelta(days=365)
        )
        serializer = ProductSerializer(product)
        self.assertTrue(serializer.data['is_low_stock'])


class ProductBatchSerializerTest(TestCase):
    """Test cases for ProductBatchSerializer"""
    
    def setUp(self):
        self.category = Category.objects.create(name='Test')
        self.product = Product.objects.create(
            name='Test Product',
            description='Test',
            price=Decimal('10.00'),
            category=self.category,
            manufacturer='TestCo'
        )
    
    def test_serialize_batch(self):
        """Test batch serialization"""
        batch = ProductBatch.objects.create(
            product=self.product,
            batch_number='BATCH001',
            quantity=50,
            expiry_date=date.today() + timedelta(days=180)
        )
        serializer = ProductBatchSerializer(batch)
        self.assertEqual(serializer.data['batch_number'], 'BATCH001')
        self.assertEqual(serializer.data['product_name'], 'Test Product')
        self.assertFalse(serializer.data['is_expired'])
    
    def test_expired_batch(self):
        """Test expired batch flag"""
        batch = ProductBatch.objects.create(
            product=self.product,
            batch_number='EXPIRED001',
            quantity=50,
            expiry_date=date.today() - timedelta(days=1)
        )
        serializer = ProductBatchSerializer(batch)
        self.assertTrue(serializer.data['is_expired'])


class CartSerializerTest(TestCase):
    """Test cases for CartSerializer"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='cartserializer',
            email='cartserializer@test.com',
            password='pass123',
            role='customer'
        )
        self.category = Category.objects.create(name='Test')
        self.product = Product.objects.create(
            name='Cart Item',
            description='Test',
            price=Decimal('25.99'),
            category=self.category,
            manufacturer='TestCo'
        )
    
    def test_serialize_cart_item(self):
        """Test cart serialization"""
        cart = Cart.objects.create(
            customer=self.user,
            product=self.product,
            quantity=3
        )
        serializer = CartSerializer(cart)
        self.assertEqual(serializer.data['product_name'], 'Cart Item')
        self.assertEqual(Decimal(serializer.data['product_price']), Decimal('25.99'))
        self.assertEqual(serializer.data['quantity'], 3)


class OrderSerializerTest(TestCase):
    """Test cases for OrderSerializer"""
    
    def setUp(self):
        self.customer = User.objects.create_user(
            username='orderserializer',
            email='orderserializer@test.com',
            password='pass123',
            role='customer'
        )
        self.category = Category.objects.create(name='Test')
        self.product = Product.objects.create(
            name='Order Item',
            description='Test',
            price=Decimal('29.99'),
            category=self.category,
            manufacturer='TestCo'
        )
    
    def test_serialize_order(self):
        """Test order serialization"""
        order = Order.objects.create(
            customer=self.customer,
            status='pending',
            total_amount=Decimal('59.98'),
            shipping_address='123 Test St',
            payment_method='credit_card'
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2,
            price=Decimal('29.99')
        )
        
        serializer = OrderSerializer(order)
        self.assertEqual(serializer.data['status'], 'pending')
        self.assertEqual(serializer.data['customer_name'], 'orderserializer')
        self.assertEqual(len(serializer.data['items']), 1)


class MedicalProfileSerializerTest(TestCase):
    """Test cases for Medical Profile Serializers"""
    
    def setUp(self):
        self.patient = User.objects.create_user(
            username='profileserializer',
            email='profileserializer@test.com',
            password='pass123',
            role='customer',
            first_name='John',
            last_name='Doe'
        )
        self.profile = PatientMedicalProfile.objects.create(
            patient=self.patient,
            blood_type='A+',
            weight=Decimal('75.5'),
            height=Decimal('180.0'),
            date_of_birth=date(1990, 5, 15)
        )
    
    def test_serialize_medical_profile(self):
        """Test profile serialization"""
        serializer = PatientMedicalProfileSerializer(self.profile)
        self.assertEqual(serializer.data['blood_type'], 'A+')
        self.assertEqual(serializer.data['patient_name'], 'John Doe')
    
    def test_serialize_allergy(self):
        """Test allergy serialization"""
        allergy = Allergy.objects.create(
            patient=self.patient,
            allergen='Penicillin',
            allergy_type='drug',
            severity='severe'
        )
        serializer = AllergySerializer(allergy)
        self.assertEqual(serializer.data['allergen'], 'Penicillin')
        self.assertEqual(serializer.data['severity_display'], 'Severe')
    
    def test_serialize_chronic_condition(self):
        """Test condition serialization"""
        condition = ChronicCondition.objects.create(
            patient=self.patient,
            condition_name='Diabetes Type 2',
            status='managed'
        )
        serializer = ChronicConditionSerializer(condition)
        self.assertEqual(serializer.data['condition_name'], 'Diabetes Type 2')
        self.assertEqual(serializer.data['status_display'], 'Managed')
    
    def test_serialize_current_medication(self):
        """Test medication serialization"""
        medication = CurrentMedication.objects.create(
            patient=self.patient,
            medication_name='Metformin',
            dosage='500mg',
            frequency='twice_daily'
        )
        serializer = CurrentMedicationSerializer(medication)
        self.assertEqual(serializer.data['medication_name'], 'Metformin')
        self.assertEqual(serializer.data['frequency_display'], 'Twice Daily')