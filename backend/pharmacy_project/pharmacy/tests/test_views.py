"""
Additional test cases for Views to improve coverage
Run: python manage.py test pharmacy.tests.test_views
"""

from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from decimal import Decimal
from datetime import date, timedelta
from pharmacy.models import (
    Category, Product, ProductBatch, Order, OrderItem, Cart,
    PatientMedicalProfile, Allergy, ChronicCondition, CurrentMedication,
    MedicalNote, Question, StockRequest, PatientRecord
)

User = get_user_model()


class UserViewSetTest(APITestCase):
    """Test cases for UserViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='useradmin',
            email='useradmin@test.com',
            password='admin123',
            role='admin'
        )
        self.customer = User.objects.create_user(
            username='usercustomer',
            email='usercustomer@test.com',
            password='customer123',
            role='customer'
        )
    
    def test_get_all_users_as_admin(self):
        """Test admin can get all users"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_user_profile(self):
        """Test get user profile"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.get(f'/api/users/{self.customer.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'usercustomer')
    
    def test_update_user_profile(self):
        """Test update user profile"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.patch(f'/api/users/{self.customer.id}/', {
            'phone': '1234567890',
            'address': '123 Test Street'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_change_password(self):
        """Test change password"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.post('/api/users/change_password/', {
            'old_password': 'customer123',
            'new_password': 'newpassword123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_change_password_wrong_old(self):
        """Test change password with wrong old password"""
        self.client.force_authenticate(user=self.customer)
        response = self.client.post('/api/users/change_password/', {
            'old_password': 'wrongpassword',
            'new_password': 'newpassword123'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ProductViewSetExtendedTest(APITestCase):
    """Extended test cases for ProductViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='productadmin2',
            email='productadmin2@test.com',
            password='admin123',
            role='admin'
        )
        self.category = Category.objects.create(name='Extended Test')
        self.product = Product.objects.create(
            name='Extended Product',
            description='Test description',
            price=Decimal('25.99'),
            category=self.category,
            manufacturer='TestCo',
            low_stock_threshold=20
        )
        self.client.force_authenticate(user=self.admin)
    
    def test_get_low_stock_products(self):
        """Test get low stock products"""
        # Create low stock batch
        ProductBatch.objects.create(
            product=self.product,
            batch_number='LOW001',
            quantity=5,
            expiry_date=date.today() + timedelta(days=365)
        )
        response = self.client.get('/api/products/low_stock/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_update_product(self):
        """Test update product"""
        response = self.client.patch(f'/api/products/{self.product.id}/', {
            'name': 'Updated Product Name',
            'price': '29.99'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_delete_product(self):
        """Test delete product"""
        response = self.client.delete(f'/api/products/{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class ProductBatchViewSetTest(APITestCase):
    """Test cases for ProductBatchViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='batchadmin2',
            email='batchadmin2@test.com',
            password='admin123',
            role='admin'
        )
        self.category = Category.objects.create(name='Batch Test')
        self.product = Product.objects.create(
            name='Batch Product',
            description='Test',
            price=Decimal('15.99'),
            category=self.category,
            manufacturer='TestCo'
        )
        self.client.force_authenticate(user=self.admin)
    
    def test_list_batches(self):
        """Test list all batches"""
        ProductBatch.objects.create(
            product=self.product,
            batch_number='LIST001',
            quantity=100,
            expiry_date=date.today() + timedelta(days=365)
        )
        response = self.client.get('/api/product-batches/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_batches_by_product(self):
        """Test get batches by product"""
        ProductBatch.objects.create(
            product=self.product,
            batch_number='PROD001',
            quantity=50,
            expiry_date=date.today() + timedelta(days=180)
        )
        response = self.client.get(f'/api/product-batches/?product={self.product.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_expiring_soon(self):
        """Test get batches expiring soon"""
        ProductBatch.objects.create(
            product=self.product,
            batch_number='EXPIRING001',
            quantity=30,
            expiry_date=date.today() + timedelta(days=15)
        )
        response = self.client.get('/api/product-batches/expiring_soon/?days=30')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_update_batch(self):
        """Test update batch"""
        batch = ProductBatch.objects.create(
            product=self.product,
            batch_number='UPDATE001',
            quantity=100,
            expiry_date=date.today() + timedelta(days=365)
        )
        response = self.client.patch(f'/api/product-batches/{batch.id}/', {
            'quantity': 80
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_delete_batch(self):
        """Test delete batch"""
        batch = ProductBatch.objects.create(
            product=self.product,
            batch_number='DELETE001',
            quantity=50,
            expiry_date=date.today() + timedelta(days=365)
        )
        response = self.client.delete(f'/api/product-batches/{batch.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class OrderViewSetExtendedTest(APITestCase):
    """Extended test cases for OrderViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='orderadmin2',
            email='orderadmin2@test.com',
            password='admin123',
            role='admin'
        )
        self.customer = User.objects.create_user(
            username='ordercustomer2',
            email='ordercustomer2@test.com',
            password='customer123',
            role='customer'
        )
        self.category = Category.objects.create(name='Order Test')
        self.product = Product.objects.create(
            name='Order Product',
            description='Test',
            price=Decimal('19.99'),
            category=self.category,
            manufacturer='TestCo'
        )
        ProductBatch.objects.create(
            product=self.product,
            batch_number='ORD001',
            quantity=100,
            expiry_date=date.today() + timedelta(days=365)
        )
    
    def test_get_order_detail(self):
        """Test get order detail"""
        self.client.force_authenticate(user=self.customer)
        order = Order.objects.create(
            customer=self.customer,
            status='pending',
            total_amount=Decimal('39.98'),
            shipping_address='123 Test St',
            payment_method='cash'
        )
        response = self.client.get(f'/api/orders/{order.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_cancel_order(self):
        """Test cancel order"""
        self.client.force_authenticate(user=self.customer)
        order = Order.objects.create(
            customer=self.customer,
            status='pending',
            total_amount=Decimal('19.99'),
            shipping_address='123 Test St',
            payment_method='cash'
        )
        response = self.client.post(f'/api/orders/{order.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_reject_order(self):
        """Test reject order"""
        self.client.force_authenticate(user=self.admin)
        order = Order.objects.create(
            customer=self.customer,
            status='pending',
            total_amount=Decimal('19.99'),
            shipping_address='123 Test St',
            payment_method='cash'
        )
        response = self.client.post(f'/api/orders/{order.id}/reject/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_update_order_status(self):
        """Test update order status"""
        self.client.force_authenticate(user=self.admin)
        order = Order.objects.create(
            customer=self.customer,
            status='approved',
            total_amount=Decimal('19.99'),
            shipping_address='123 Test St',
            payment_method='cash'
        )
        response = self.client.patch(f'/api/orders/{order.id}/', {
            'status': 'shipped'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ChronicConditionViewSetTest(APITestCase):
    """Test cases for ChronicConditionViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.patient = User.objects.create_user(
            username='conditionpatient',
            email='conditionpatient@test.com',
            password='patient123',
            role='customer'
        )
        self.client.force_authenticate(user=self.patient)
    
    def test_create_condition(self):
        """Test create chronic condition"""
        response = self.client.post('/api/chronic-conditions/', {
            'condition_name': 'Hypertension',
            'status': 'active',
            'notes': 'Monitoring required'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_list_conditions(self):
        """Test list conditions"""
        ChronicCondition.objects.create(
            patient=self.patient,
            condition_name='Diabetes',
            status='managed'
        )
        response = self.client.get('/api/chronic-conditions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_update_condition(self):
        """Test update condition"""
        condition = ChronicCondition.objects.create(
            patient=self.patient,
            condition_name='Asthma',
            status='active'
        )
        response = self.client.patch(f'/api/chronic-conditions/{condition.id}/', {
            'status': 'managed'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_delete_condition(self):
        """Test delete condition"""
        condition = ChronicCondition.objects.create(
            patient=self.patient,
            condition_name='Test Condition',
            status='active'
        )
        response = self.client.delete(f'/api/chronic-conditions/{condition.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class CurrentMedicationViewSetTest(APITestCase):
    """Test cases for CurrentMedicationViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.patient = User.objects.create_user(
            username='medicationpatient2',
            email='medicationpatient2@test.com',
            password='patient123',
            role='customer'
        )
        self.client.force_authenticate(user=self.patient)
    
    def test_create_medication(self):
        """Test create medication"""
        response = self.client.post('/api/current-medications/', {
            'medication_name': 'Lisinopril',
            'dosage': '10mg',
            'frequency': 'once_daily',
            'reason': 'Blood pressure control'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_list_medications(self):
        """Test list medications"""
        CurrentMedication.objects.create(
            patient=self.patient,
            medication_name='Aspirin',
            dosage='81mg',
            frequency='once_daily'
        )
        response = self.client.get('/api/current-medications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_update_medication(self):
        """Test update medication"""
        medication = CurrentMedication.objects.create(
            patient=self.patient,
            medication_name='Metformin',
            dosage='500mg',
            frequency='twice_daily'
        )
        response = self.client.patch(f'/api/current-medications/{medication.id}/', {
            'dosage': '1000mg'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_delete_medication(self):
        """Test delete medication"""
        medication = CurrentMedication.objects.create(
            patient=self.patient,
            medication_name='Test Med',
            dosage='50mg',
            frequency='once_daily'
        )
        response = self.client.delete(f'/api/current-medications/{medication.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class MedicalNoteViewSetTest(APITestCase):
    """Test cases for MedicalNoteViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.doctor = User.objects.create_user(
            username='notedoctor2',
            email='notedoctor2@test.com',
            password='doctor123',
            role='doctor'
        )
        self.patient = User.objects.create_user(
            username='notepatient2',
            email='notepatient2@test.com',
            password='patient123',
            role='customer'
        )
    
    def test_create_note_as_doctor(self):
        """Test doctor creates note"""
        self.client.force_authenticate(user=self.doctor)
        response = self.client.post('/api/medical-notes/', {
            'patient': self.patient.id,
            'note_type': 'consultation',
            'title': 'Follow-up Visit',
            'content': 'Patient condition improved.',
            'is_private': False
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_list_notes(self):
        """Test list notes"""
        self.client.force_authenticate(user=self.doctor)
        MedicalNote.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            note_type='general',
            title='Test Note',
            content='Test content'
        )
        response = self.client.get('/api/medical-notes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_update_note(self):
        """Test update note"""
        self.client.force_authenticate(user=self.doctor)
        note = MedicalNote.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            note_type='general',
            title='Original Title',
            content='Original content'
        )
        response = self.client.patch(f'/api/medical-notes/{note.id}/', {
            'title': 'Updated Title'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_delete_note(self):
        """Test delete note"""
        self.client.force_authenticate(user=self.doctor)
        note = MedicalNote.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            note_type='general',
            title='Delete Note',
            content='To be deleted'
        )
        response = self.client.delete(f'/api/medical-notes/{note.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class StockRequestViewSetTest(APITestCase):
    """Test cases for StockRequestViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='stockadmin',
            email='stockadmin@test.com',
            password='admin123',
            role='admin'
        )
        self.manager = User.objects.create_user(
            username='stockmanager',
            email='stockmanager@test.com',
            password='manager123',
            role='store_manager'
        )
        self.category = Category.objects.create(name='Stock Test')
        self.product = Product.objects.create(
            name='Stock Product',
            description='Test',
            price=Decimal('10.00'),
            category=self.category,
            manufacturer='TestCo'
        )
    
    def test_create_stock_request(self):
        """Test create stock request"""
        self.client.force_authenticate(user=self.manager)
        response = self.client.post('/api/stock-requests/', {
            'product': self.product.id,
            'quantity': 100,
            'reason': 'Low stock replenishment'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_list_stock_requests(self):
        """Test list stock requests"""
        self.client.force_authenticate(user=self.admin)
        StockRequest.objects.create(
            product=self.product,
            requested_by=self.manager,
            quantity=50,
            reason='Restock needed'
        )
        response = self.client.get('/api/stock-requests/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_approve_stock_request(self):
        """Test approve stock request"""
        self.client.force_authenticate(user=self.admin)
        request = StockRequest.objects.create(
            product=self.product,
            requested_by=self.manager,
            quantity=50,
            reason='Restock'
        )
        response = self.client.post(f'/api/stock-requests/{request.id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_reject_stock_request(self):
        """Test reject stock request"""
        self.client.force_authenticate(user=self.admin)
        request = StockRequest.objects.create(
            product=self.product,
            requested_by=self.manager,
            quantity=50,
            reason='Restock'
        )
        response = self.client.post(f'/api/stock-requests/{request.id}/reject/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class QuestionViewSetExtendedTest(APITestCase):
    """Extended test cases for QuestionViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            username='questioncustomer2',
            email='questioncustomer2@test.com',
            password='customer123',
            role='customer'
        )
        self.doctor = User.objects.create_user(
            username='questiondoctor2',
            email='questiondoctor2@test.com',
            password='doctor123',
            role='doctor'
        )
    
    def test_list_questions(self):
        """Test list questions"""
        self.client.force_authenticate(user=self.doctor)
        Question.objects.create(
            customer=self.customer,
            title='Test Question',
            question_text='What is this?'
        )
        response = self.client.get('/api/questions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_update_question(self):
        """Test update question"""
        self.client.force_authenticate(user=self.customer)
        question = Question.objects.create(
            customer=self.customer,
            title='Original Question',
            question_text='Original text'
        )
        response = self.client.patch(f'/api/questions/{question.id}/', {
            'title': 'Updated Question'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_delete_question(self):
        """Test delete question"""
        self.client.force_authenticate(user=self.customer)
        question = Question.objects.create(
            customer=self.customer,
            title='Delete Question',
            question_text='To be deleted'
        )
        response = self.client.delete(f'/api/questions/{question.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class PatientRecordViewSetTest(APITestCase):
    """Test cases for PatientRecordViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.doctor = User.objects.create_user(
            username='recorddoctor',
            email='recorddoctor@test.com',
            password='doctor123',
            role='doctor'
        )
        self.patient = User.objects.create_user(
            username='recordpatient',
            email='recordpatient@test.com',
            password='patient123',
            role='customer'
        )
        self.client.force_authenticate(user=self.doctor)
    
    def test_create_patient_record(self):
        """Test create patient record"""
        response = self.client.post('/api/patient-records/', {
            'patient': self.patient.id,
            'doctor': self.doctor.id,
            'diagnosis': 'Common cold',
            'prescriptions': 'Rest and fluids',
            'notes': 'Follow up in 1 week',
            'visit_date': date.today().isoformat()
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    def test_list_patient_records(self):
        """Test list patient records"""
        PatientRecord.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            diagnosis='Flu',
            prescriptions='Tamiflu',
            visit_date=date.today()
        )
        response = self.client.get('/api/patient-records/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class AllergyViewSetExtendedTest(APITestCase):
    """Extended test cases for AllergyViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.patient = User.objects.create_user(
            username='allergypatient3',
            email='allergypatient3@test.com',
            password='patient123',
            role='customer'
        )
        self.client.force_authenticate(user=self.patient)
    
    def test_update_allergy(self):
        """Test update allergy"""
        allergy = Allergy.objects.create(
            patient=self.patient,
            allergen='Dust',
            allergy_type='environmental',
            severity='mild'
        )
        response = self.client.patch(f'/api/allergies/{allergy.id}/', {
            'severity': 'moderate'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_delete_allergy(self):
        """Test delete allergy"""
        allergy = Allergy.objects.create(
            patient=self.patient,
            allergen='Test Allergen',
            allergy_type='other',
            severity='mild'
        )
        response = self.client.delete(f'/api/allergies/{allergy.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    def test_check_drug_allergy(self):
        """Test check drug allergy"""
        Allergy.objects.create(
            patient=self.patient,
            allergen='Penicillin',
            allergy_type='drug',
            severity='severe'
        )
        response = self.client.get('/api/allergies/check_drug/?drug=Penicillin')
        self.assertEqual(response.status_code, status.HTTP_200_OK)