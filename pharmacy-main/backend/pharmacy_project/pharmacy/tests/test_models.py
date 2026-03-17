# pharmacy/tests/test_models.py
"""
Test cases for Django Models
Run: python manage.py test pharmacy.tests.test_models
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import date, timedelta
from pharmacy.models import (
    Category, Product, ProductBatch, Order, OrderItem, Cart,
    PatientMedicalProfile, Allergy, ChronicCondition, CurrentMedication,
    MedicalNote, Question, PatientRecord, StockRequest
)

User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for User model"""
    
    def setUp(self):
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'role': 'customer',
            'phone': '1234567890'
        }
    
    def test_create_customer(self):
        """Test creating a customer user"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.role, 'customer')
        self.assertTrue(user.check_password('testpass123'))
    
    def test_create_admin(self):
        """Test creating an admin user"""
        self.user_data['role'] = 'admin'
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.role, 'admin')
    
    def test_create_doctor(self):
        """Test creating a doctor user"""
        self.user_data['role'] = 'doctor'
        self.user_data['username'] = 'doctor1'
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.role, 'doctor')
    
    def test_create_store_manager(self):
        """Test creating a store manager user"""
        self.user_data['role'] = 'store_manager'
        self.user_data['username'] = 'manager1'
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(user.role, 'store_manager')
    
    def test_user_str(self):
        """Test user string representation"""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(str(user), 'testuser')


class CategoryModelTest(TestCase):
    """Test cases for Category model"""
    
    def test_create_category(self):
        """Test creating a category"""
        category = Category.objects.create(
            name='Pain Relief',
            description='Medicines for pain relief'
        )
        self.assertEqual(category.name, 'Pain Relief')
        self.assertEqual(str(category), 'Pain Relief')
    
    def test_category_unique_name(self):
        """Test category name uniqueness"""
        Category.objects.create(name='Vitamins')
        with self.assertRaises(Exception):
            Category.objects.create(name='Vitamins')


class ProductModelTest(TestCase):
    """Test cases for Product model"""
    
    def setUp(self):
        self.category = Category.objects.create(name='Pain Relief')
    
    def test_create_product(self):
        """Test creating a product"""
        product = Product.objects.create(
            name='Paracetamol 500mg',
            description='Pain reliever',
            price=Decimal('9.99'),
            category=self.category,
            manufacturer='PharmaCo',
            requires_prescription=False,
            low_stock_threshold=10
        )
        self.assertEqual(product.name, 'Paracetamol 500mg')
        self.assertEqual(product.price, Decimal('9.99'))
        self.assertEqual(str(product), 'Paracetamol 500mg')
    
    def test_product_total_stock(self):
        """Test product total stock calculation"""
        product = Product.objects.create(
            name='Ibuprofen',
            description='Anti-inflammatory',
            price=Decimal('12.99'),
            category=self.category,
            manufacturer='MedCorp'
        )
        # Create batches
        ProductBatch.objects.create(
            product=product,
            batch_number='BATCH001',
            quantity=50,
            expiry_date=date.today() + timedelta(days=365)
        )
        ProductBatch.objects.create(
            product=product,
            batch_number='BATCH002',
            quantity=30,
            expiry_date=date.today() + timedelta(days=180)
        )
        self.assertEqual(product.total_stock, 80)
    
    def test_product_is_low_stock(self):
        """Test low stock detection"""
        product = Product.objects.create(
            name='Aspirin',
            description='Blood thinner',
            price=Decimal('7.99'),
            category=self.category,
            manufacturer='HealthCo',
            low_stock_threshold=20
        )
        ProductBatch.objects.create(
            product=product,
            batch_number='BATCH001',
            quantity=15,
            expiry_date=date.today() + timedelta(days=365)
        )
        self.assertTrue(product.is_low_stock)
    
    def test_product_price_validation(self):
        """Test product price must be positive"""
        with self.assertRaises(ValidationError):
            product = Product(
                name='Invalid Product',
                description='Test',
                price=Decimal('-5.00'),
                manufacturer='Test'
            )
            product.full_clean()


class ProductBatchModelTest(TestCase):
    """Test cases for ProductBatch model"""
    
    def setUp(self):
        self.category = Category.objects.create(name='Antibiotics')
        self.product = Product.objects.create(
            name='Amoxicillin',
            description='Antibiotic',
            price=Decimal('15.99'),
            category=self.category,
            manufacturer='MedCorp'
        )
    
    def test_create_batch(self):
        """Test creating a product batch"""
        batch = ProductBatch.objects.create(
            product=self.product,
            batch_number='AMX-2024-001',
            quantity=100,
            expiry_date=date.today() + timedelta(days=365)
        )
        self.assertEqual(batch.batch_number, 'AMX-2024-001')
        self.assertEqual(batch.quantity, 100)
    
    def test_batch_is_expired(self):
        """Test expired batch detection"""
        expired_batch = ProductBatch.objects.create(
            product=self.product,
            batch_number='AMX-2023-001',
            quantity=50,
            expiry_date=date.today() - timedelta(days=1)
        )
        self.assertTrue(expired_batch.is_expired)
    
    def test_batch_not_expired(self):
        """Test non-expired batch"""
        valid_batch = ProductBatch.objects.create(
            product=self.product,
            batch_number='AMX-2025-001',
            quantity=50,
            expiry_date=date.today() + timedelta(days=365)
        )
        self.assertFalse(valid_batch.is_expired)
    
    def test_batch_unique_together(self):
        """Test batch number uniqueness per product"""
        ProductBatch.objects.create(
            product=self.product,
            batch_number='UNIQUE001',
            quantity=50,
            expiry_date=date.today() + timedelta(days=365)
        )
        with self.assertRaises(Exception):
            ProductBatch.objects.create(
                product=self.product,
                batch_number='UNIQUE001',
                quantity=30,
                expiry_date=date.today() + timedelta(days=180)
            )


class OrderModelTest(TestCase):
    """Test cases for Order model"""
    
    def setUp(self):
        self.customer = User.objects.create_user(
            username='customer1',
            email='customer@test.com',
            password='pass123',
            role='customer'
        )
        self.category = Category.objects.create(name='General')
        self.product = Product.objects.create(
            name='Vitamin C',
            description='Vitamin supplement',
            price=Decimal('19.99'),
            category=self.category,
            manufacturer='VitaCo'
        )
    
    def test_create_order(self):
        """Test creating an order"""
        order = Order.objects.create(
            customer=self.customer,
            status='pending',
            total_amount=Decimal('39.98'),
            shipping_address='123 Main St',
            payment_method='credit_card'
        )
        self.assertEqual(order.status, 'pending')
        self.assertEqual(order.customer, self.customer)
    
    def test_order_status_choices(self):
        """Test order status transitions"""
        order = Order.objects.create(
            customer=self.customer,
            status='pending',
            total_amount=Decimal('19.99'),
            shipping_address='123 Main St',
            payment_method='cash'
        )
        
        # Test valid status values
        valid_statuses = ['pending', 'approved', 'rejected', 'processing', 'shipped', 'delivered', 'cancelled']
        for status in valid_statuses:
            order.status = status
            order.save()
            self.assertEqual(order.status, status)


class CartModelTest(TestCase):
    """Test cases for Cart model"""
    
    def setUp(self):
        self.customer = User.objects.create_user(
            username='shopper',
            email='shopper@test.com',
            password='pass123',
            role='customer'
        )
        self.category = Category.objects.create(name='Supplements')
        self.product = Product.objects.create(
            name='Omega-3',
            description='Fish oil supplement',
            price=Decimal('24.99'),
            category=self.category,
            manufacturer='HealthPlus'
        )
    
    def test_add_to_cart(self):
        """Test adding item to cart"""
        cart_item = Cart.objects.create(
            customer=self.customer,
            product=self.product,
            quantity=2
        )
        self.assertEqual(cart_item.quantity, 2)
        self.assertEqual(cart_item.product, self.product)
    
    def test_cart_unique_together(self):
        """Test cart item uniqueness per customer-product"""
        Cart.objects.create(
            customer=self.customer,
            product=self.product,
            quantity=1
        )
        with self.assertRaises(Exception):
            Cart.objects.create(
                customer=self.customer,
                product=self.product,
                quantity=2
            )


class PatientMedicalProfileTest(TestCase):
    """Test cases for PatientMedicalProfile model"""
    
    def setUp(self):
        self.patient = User.objects.create_user(
            username='patient1',
            email='patient@test.com',
            password='pass123',
            role='customer'
        )
    
    def test_create_medical_profile(self):
        """Test creating medical profile"""
        profile = PatientMedicalProfile.objects.create(
            patient=self.patient,
            blood_type='A+',
            weight=Decimal('70.5'),
            height=Decimal('175.0'),
            emergency_contact_name='John Doe',
            emergency_contact_phone='9876543210'
        )
        self.assertEqual(profile.blood_type, 'A+')
        self.assertEqual(profile.patient, self.patient)
    
    def test_one_profile_per_patient(self):
        """Test only one profile per patient"""
        PatientMedicalProfile.objects.create(patient=self.patient)
        with self.assertRaises(Exception):
            PatientMedicalProfile.objects.create(patient=self.patient)


class AllergyModelTest(TestCase):
    """Test cases for Allergy model"""
    
    def setUp(self):
        self.patient = User.objects.create_user(
            username='allergic_patient',
            email='allergic@test.com',
            password='pass123',
            role='customer'
        )
    
    def test_create_allergy(self):
        """Test creating allergy record"""
        allergy = Allergy.objects.create(
            patient=self.patient,
            allergy_type='drug',
            allergen='Penicillin',
            severity='severe',
            reaction='Anaphylaxis'
        )
        self.assertEqual(allergy.allergen, 'Penicillin')
        self.assertEqual(allergy.severity, 'severe')
    
    def test_allergy_severity_choices(self):
        """Test allergy severity levels"""
        severities = ['mild', 'moderate', 'severe', 'life_threatening']
        for severity in severities:
            allergy = Allergy.objects.create(
                patient=self.patient,
                allergen=f'Test-{severity}',
                severity=severity
            )
            self.assertEqual(allergy.severity, severity)


class ChronicConditionModelTest(TestCase):
    """Test cases for ChronicCondition model"""
    
    def setUp(self):
        self.patient = User.objects.create_user(
            username='chronic_patient',
            email='chronic@test.com',
            password='pass123',
            role='customer'
        )
    
    def test_create_chronic_condition(self):
        """Test creating chronic condition"""
        condition = ChronicCondition.objects.create(
            patient=self.patient,
            condition_name='Diabetes Type 2',
            status='managed',
            notes='Controlled with medication'
        )
        self.assertEqual(condition.condition_name, 'Diabetes Type 2')
        self.assertEqual(condition.status, 'managed')


class CurrentMedicationModelTest(TestCase):
    """Test cases for CurrentMedication model"""
    
    def setUp(self):
        self.patient = User.objects.create_user(
            username='medicated_patient',
            email='medicated@test.com',
            password='pass123',
            role='customer'
        )
    
    def test_create_current_medication(self):
        """Test creating current medication"""
        medication = CurrentMedication.objects.create(
            patient=self.patient,
            medication_name='Metformin',
            dosage='500mg',
            frequency='twice_daily',
            reason='Diabetes management'
        )
        self.assertEqual(medication.medication_name, 'Metformin')
        self.assertEqual(medication.frequency, 'twice_daily')


class MedicalNoteModelTest(TestCase):
    """Test cases for MedicalNote model"""
    
    def setUp(self):
        self.patient = User.objects.create_user(
            username='note_patient',
            email='note_patient@test.com',
            password='pass123',
            role='customer'
        )
        self.doctor = User.objects.create_user(
            username='dr_smith',
            email='dr_smith@test.com',
            password='pass123',
            role='doctor'
        )
    
    def test_create_medical_note(self):
        """Test creating medical note"""
        note = MedicalNote.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            note_type='consultation',
            title='Initial Consultation',
            content='Patient presents with mild headaches.',
            is_private=False
        )
        self.assertEqual(note.title, 'Initial Consultation')
        self.assertEqual(note.doctor, self.doctor)
    
    def test_private_note(self):
        """Test private medical note"""
        note = MedicalNote.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            note_type='warning',
            title='Drug Interaction Warning',
            content='Watch for interactions with new medication.',
            is_private=True
        )
        self.assertTrue(note.is_private)


class QuestionModelTest(TestCase):
    """Test cases for Question model"""
    
    def setUp(self):
        self.customer = User.objects.create_user(
            username='questioner',
            email='questioner@test.com',
            password='pass123',
            role='customer'
        )
        self.doctor = User.objects.create_user(
            username='dr_answer',
            email='dr_answer@test.com',
            password='pass123',
            role='doctor'
        )
    
    def test_create_question(self):
        """Test creating a question"""
        question = Question.objects.create(
            customer=self.customer,
            title='Medication Dosage',
            question_text='How often should I take this medicine?'
        )
        self.assertEqual(question.title, 'Medication Dosage')
        self.assertFalse(question.is_answered)
    
    def test_answer_question(self):
        """Test answering a question"""
        question = Question.objects.create(
            customer=self.customer,
            title='Side Effects',
            question_text='What are the side effects?'
        )
        question.answer = 'Common side effects include...'
        question.answered_by = self.doctor
        question.is_answered = True
        question.save()
        
        self.assertTrue(question.is_answered)
        self.assertEqual(question.answered_by, self.doctor)
