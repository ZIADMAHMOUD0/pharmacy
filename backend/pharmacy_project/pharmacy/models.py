from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from decimal import Decimal

class User(AbstractUser):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('admin', 'Admin'),
        ('store_manager', 'Store Manager'),
        ('doctor', 'Doctor'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    profile_image = models.ImageField(upload_to='profiles/', null=True, blank=True)
    
    class Meta:
        db_table = 'users'


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    manufacturer = models.CharField(max_length=200)
    active_ingredient = models.CharField(max_length=200, blank=True, help_text="Active ingredient(s) in the medication")
    requires_prescription = models.BooleanField(default=False)
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    low_stock_threshold = models.IntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products'
        ordering = ['-created_at']

    def __str__(self):
        return self.name
    
    @property
    def total_stock(self):
        # Only non-expired batches count as available stock. An expired batch
        # may still have quantity > 0 in the database (we keep the row for
        # audit/history) but it must not be sold or shown as purchasable.
        # Iterate over `self.batches.all()` (in-memory if prefetched, one
        # query otherwise) and filter in Python so this stays compatible
        # with both paths.
        from django.utils import timezone
        today = timezone.now().date()
        return sum(
            batch.quantity for batch in self.batches.all()
            if batch.expiry_date >= today
        )

    @property
    def is_low_stock(self):
        return self.total_stock <= self.low_stock_threshold

    @property
    def stock_quantity(self):
        # For backward compatibility
        return self.total_stock


class ProductBatch(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='batches')
    batch_number = models.CharField(max_length=100)
    quantity = models.IntegerField(validators=[MinValueValidator(0)])
    expiry_date = models.DateField()
    received_date = models.DateField(auto_now_add=True)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'product_batches'
        ordering = ['expiry_date']
        unique_together = ('product', 'batch_number')
    
    def __str__(self):
        return f"{self.product.name} - Batch {self.batch_number}"
    
    @property
    def is_expired(self):
        from django.utils import timezone
        return self.expiry_date < timezone.now().date()


class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_address = models.TextField()
    payment_method = models.CharField(max_length=50)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_orders')
    
    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} - {self.customer.username}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    batch = models.ForeignKey(ProductBatch, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        db_table = 'order_items'

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


class Cart(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'cart'
        unique_together = ('customer', 'product')

# ============================================================================
# PATIENT MEDICAL HISTORY MODELS
# ============================================================================

class PatientMedicalProfile(models.Model):
    """Main medical profile for each patient/customer"""
    patient = models.OneToOneField(User, on_delete=models.CASCADE, related_name='medical_profile')
    blood_type = models.CharField(max_length=5, blank=True, choices=[
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    ])
    date_of_birth = models.DateField(null=True, blank=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Weight in kg")
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Height in cm")
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Medical Profile - {self.patient.username}"


class Allergy(models.Model):
    """Patient allergies"""
    SEVERITY_CHOICES = [
        ('mild', 'Mild'),
        ('moderate', 'Moderate'),
        ('severe', 'Severe'),
        ('life_threatening', 'Life Threatening'),
    ]
    
    ALLERGY_TYPE_CHOICES = [
        ('drug', 'Drug/Medication'),
        ('food', 'Food'),
        ('environmental', 'Environmental'),
        ('other', 'Other'),
    ]
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='allergies')
    allergy_type = models.CharField(max_length=20, choices=ALLERGY_TYPE_CHOICES, default='drug')
    allergen = models.CharField(max_length=100, help_text="Name of allergen (e.g., Penicillin, Peanuts)")
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='moderate')
    reaction = models.TextField(blank=True, help_text="Description of allergic reaction")
    diagnosed_date = models.DateField(null=True, blank=True)
    diagnosed_by = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Allergies"
        ordering = ['-severity', 'allergen']
    
    def __str__(self):
        return f"{self.patient.username} - {self.allergen} ({self.severity})"


class ChronicCondition(models.Model):
    """Patient chronic conditions/diseases"""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('managed', 'Managed'),
        ('resolved', 'Resolved'),
    ]
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chronic_conditions')
    condition_name = models.CharField(max_length=100, help_text="e.g., Diabetes, Hypertension, Asthma")
    diagnosis_date = models.DateField(null=True, blank=True)
    diagnosed_by = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_active', 'condition_name']
    
    def __str__(self):
        return f"{self.patient.username} - {self.condition_name}"


class CurrentMedication(models.Model):
    """Medications patient is currently taking"""
    FREQUENCY_CHOICES = [
        ('once_daily', 'Once Daily'),
        ('twice_daily', 'Twice Daily'),
        ('three_daily', 'Three Times Daily'),
        ('four_daily', 'Four Times Daily'),
        ('as_needed', 'As Needed'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('other', 'Other'),
    ]
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='current_medications')
    medication_name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=50, help_text="e.g., 500mg, 10ml")
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='once_daily')
    frequency_notes = models.CharField(max_length=100, blank=True, help_text="Additional frequency info")
    prescribing_doctor = models.CharField(max_length=100, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    reason = models.CharField(max_length=200, blank=True, help_text="Reason for taking this medication")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-is_active', 'medication_name']
    
    def __str__(self):
        return f"{self.patient.username} - {self.medication_name}"


class MedicalNote(models.Model):
    """Doctor's medical notes for patients"""
    NOTE_TYPE_CHOICES = [
        ('consultation', 'Consultation'),
        ('follow_up', 'Follow Up'),
        ('prescription', 'Prescription Note'),
        ('lab_result', 'Lab Result'),
        ('general', 'General Note'),
        ('warning', 'Warning/Alert'),
    ]
    
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='medical_notes')
    doctor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='doctor_notes')
    note_type = models.CharField(max_length=20, choices=NOTE_TYPE_CHOICES, default='general')
    title = models.CharField(max_length=200)
    content = models.TextField()
    is_private = models.BooleanField(default=False, help_text="Private notes only visible to doctors")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.patient.username} - {self.title} ({self.note_type})"

class Question(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='questions')
    title = models.CharField(max_length=200)
    question_text = models.TextField()
    image = models.ImageField(upload_to='questions/', null=True, blank=True, help_text="Optional image attachment (e.g., prescription, symptoms)")
    answer = models.TextField(blank=True)
    answered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='answered_questions')
    is_answered = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    answered_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'questions'
        ordering = ['-created_at']


class PatientRecord(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='medical_records')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patient_records')
    diagnosis = models.TextField()
    prescriptions = models.TextField()
    notes = models.TextField(blank=True)
    visit_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'patient_records'
        ordering = ['-visit_date']


class StockRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    )
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stock_requests')
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reason = models.TextField()
    batch_number = models.CharField(max_length=100, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'stock_requests'
        ordering = ['-created_at']


class ChatMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    message = models.TextField()
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'chat_messages'
        ordering = ['-created_at']