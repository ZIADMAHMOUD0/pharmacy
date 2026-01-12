from rest_framework import serializers
from .models import *

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'address', 'date_of_birth', 'profile_image']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'product_count', 'created_at']
    
    def get_product_count(self, obj):
        return obj.products.count()


class ProductBatchSerializer(serializers.ModelSerializer):
    is_expired = serializers.ReadOnlyField()
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = ProductBatch
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    batches = ProductBatchSerializer(many=True, read_only=True)
    total_stock = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'category', 'category_name',
            'manufacturer', 'requires_prescription', 'low_stock_threshold',
            'total_stock', 'is_low_stock', 'batches', 'image', 'image_url',
            'created_at', 'updated_at'
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True, allow_null=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'batch', 'batch_number', 'quantity', 'price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'


class PatientMedicalProfileSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_username = serializers.CharField(source='patient.username', read_only=True)
    age = serializers.SerializerMethodField()
    allergies_count = serializers.SerializerMethodField()
    conditions_count = serializers.SerializerMethodField()
    medications_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PatientMedicalProfile
        fields = [
            'id', 'patient', 'patient_name', 'patient_username',
            'blood_type', 'date_of_birth', 'age', 'weight', 'height',
            'emergency_contact_name', 'emergency_contact_phone',
            'allergies_count', 'conditions_count', 'medications_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['patient']
    
    def get_age(self, obj):
        if obj.date_of_birth:
            from datetime import date
            today = date.today()
            return today.year - obj.date_of_birth.year - (
                (today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day)
            )
        return None
    
    def get_allergies_count(self, obj):
        return obj.patient.allergies.filter(is_active=True).count()
    
    def get_conditions_count(self, obj):
        return obj.patient.chronic_conditions.filter(is_active=True).count()
    
    def get_medications_count(self, obj):
        return obj.patient.current_medications.filter(is_active=True).count()


class AllergySerializer(serializers.ModelSerializer):
    # Declared field - MUST also be in Meta.fields!
    patient_name = serializers.CharField(source='patient.username', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    allergy_type_display = serializers.CharField(source='get_allergy_type_display', read_only=True)
    
    class Meta:
        model = Allergy
        fields = [
            'id', 
            'patient',           # ForeignKey
            'patient_name',      # <-- THIS WAS MISSING! Declared field MUST be in fields list
            'allergen', 
            'allergy_type', 
            'allergy_type_display',
            'severity', 
            'severity_display', 
            'reaction',
            'created_at'
        ]
        read_only_fields = ['id', 'patient', 'patient_name', 'created_at', 'severity_display', 'allergy_type_display']

class ChronicConditionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ChronicCondition
        fields = [
            'id', 'patient', 'patient_name', 'condition_name',
            'diagnosis_date', 'diagnosed_by', 'status', 'status_display',
            'notes', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['patient']


class CurrentMedicationSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    
    class Meta:
        model = CurrentMedication
        fields = [
            'id', 'patient', 'patient_name', 'medication_name', 'dosage',
            'frequency', 'frequency_display', 'frequency_notes',
            'prescribing_doctor', 'start_date', 'end_date', 'reason',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['patient']


class MedicalNoteSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    note_type_display = serializers.CharField(source='get_note_type_display', read_only=True)
    
    class Meta:
        model = MedicalNote
        fields = [
            'id', 'patient', 'patient_name', 'doctor', 'doctor_name',
            'note_type', 'note_type_display', 'title', 'content',
            'is_private', 'created_at', 'updated_at'
        ]
        read_only_fields = ['doctor']


class FullMedicalHistorySerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.get_full_name', read_only=True)
    patient_email = serializers.CharField(source='patient.email', read_only=True)
    age = serializers.SerializerMethodField()
    allergies = serializers.SerializerMethodField()
    chronic_conditions = serializers.SerializerMethodField()
    current_medications = serializers.SerializerMethodField()
    medical_notes = serializers.SerializerMethodField()
    
    class Meta:
        model = PatientMedicalProfile
        fields = [
            'id', 'patient', 'patient_name', 'patient_email',
            'blood_type', 'date_of_birth', 'age', 'weight', 'height',
            'emergency_contact_name', 'emergency_contact_phone',
            'allergies', 'chronic_conditions', 'current_medications', 'medical_notes',
            'created_at', 'updated_at'
        ]
    
    def get_age(self, obj):
        if obj.date_of_birth:
            from datetime import date
            today = date.today()
            return today.year - obj.date_of_birth.year - (
                (today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day)
            )
        return None
    
    def get_allergies(self, obj):
        allergies = obj.patient.allergies.filter(is_active=True)
        return AllergySerializer(allergies, many=True).data
    
    def get_chronic_conditions(self, obj):
        conditions = obj.patient.chronic_conditions.filter(is_active=True)
        return ChronicConditionSerializer(conditions, many=True).data
    
    def get_current_medications(self, obj):
        medications = obj.patient.current_medications.filter(is_active=True)
        return CurrentMedicationSerializer(medications, many=True).data
    
    def get_medical_notes(self, obj):
        request = self.context.get('request')
        notes = obj.patient.medical_notes.all()
        
        if request and request.user.role != 'doctor':
            notes = notes.filter(is_private=False)
        
        return MedicalNoteSerializer(notes[:10], many=True).data


class CartSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    product_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['id', 'product', 'product_name', 'product_price', 'product_image', 'product_image_url', 'quantity', 'added_at']
    
    def get_product_image_url(self, obj):
        if obj.product.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return None


class QuestionSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    answered_by_name = serializers.CharField(source='answered_by.username', read_only=True)
    
    class Meta:
        model = Question
        fields = '__all__'


class PatientRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.username', read_only=True)
    doctor_name = serializers.CharField(source='doctor.username', read_only=True)
    
    class Meta:
        model = PatientRecord
        fields = '__all__'


class StockRequestSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.username', read_only=True)
    
    class Meta:
        model = StockRequest
        fields = '__all__'


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'