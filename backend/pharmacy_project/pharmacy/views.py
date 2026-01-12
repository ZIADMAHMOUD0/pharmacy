# pharmacy/views.py - WITH SIMPLE AI CHATBOT (Gemini/OpenAI/Ollama)

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.db.models import Q
from .models import *
from .serializers import *
from datetime import datetime, timedelta
import logging
from rest_framework.views import APIView
from django.http import StreamingHttpResponse
import json
import logging
from .chatbot_ai_simple import get_chatbot_instance

logger = logging.getLogger(__name__)


# ============================================================================
# ALL YOUR EXISTING VIEWSETS (unchanged)
# ============================================================================

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'login']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not username or not email or not password:
            return Response({'error': 'Username, email, and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.create_user(
                username=username, email=email, password=password,
                first_name=request.data.get('first_name', ''),
                last_name=request.data.get('last_name', ''),
                phone=request.data.get('phone', ''),
                address=request.data.get('address', ''),
                role=request.data.get('role', 'customer')
            )
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not user.check_password(old_password):
            return Response({'error': 'Invalid old password'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password changed successfully'})


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Handle image - if empty string or 'null', don't update it
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if 'image' in data and (data['image'] == '' or data['image'] == 'null' or data['image'] is None):
            del data['image']
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'])
    def remove_image(self, request, pk=None):
        """Remove product image"""
        product = self.get_object()
        if product.image:
            product.image.delete()
            product.save()
            return Response({'message': 'Image removed successfully'})
        return Response({'error': 'No image to remove'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        products = Product.objects.filter(name__icontains=query)
        return Response(self.get_serializer(products, many=True).data)
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        products = [p for p in Product.objects.all() if p.is_low_stock]
        return Response(self.get_serializer(products, many=True).data)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'customer':
            return Order.objects.filter(customer=user)
        return Order.objects.all()
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        order = self.get_object()
        order.status = 'approved'
        order.approved_by = request.user
        order.save()
        return Response({'message': 'Order approved', 'order_id': order.id})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        order = self.get_object()
        if order.status != 'pending':
            return Response({'error': 'Only pending orders can be rejected'}, status=status.HTTP_400_BAD_REQUEST)
        
        for item in order.items.all():
            if item.batch:
                item.batch.quantity += item.quantity
                item.batch.save()
        
        order.status = 'rejected'
        order.approved_by = request.user
        order.save()
        return Response({'message': 'Order rejected', 'order_id': order.id})
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status != 'pending':
            return Response({'error': 'Only pending orders can be cancelled'}, status=status.HTTP_400_BAD_REQUEST)
        if order.customer != request.user:
            return Response({'error': 'You can only cancel your own orders'}, status=status.HTTP_403_FORBIDDEN)
        
        for item in order.items.all():
            if item.batch:
                item.batch.quantity += item.quantity
                item.batch.save()
        
        order.status = 'cancelled'
        order.save()
        return Response({'message': 'Order cancelled', 'order_id': order.id})
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        order = self.get_object()
        if order.status != 'pending':
            return Response({'error': 'Only pending orders can be edited'}, status=status.HTTP_400_BAD_REQUEST)
        if order.customer != request.user:
            return Response({'error': 'You can only edit your own orders'}, status=status.HTTP_403_FORBIDDEN)
        
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            product = Product.objects.get(id=product_id)
            if product.total_stock < quantity:
                return Response({'error': f'Insufficient stock'}, status=status.HTTP_400_BAD_REQUEST)
            
            for batch in product.batches.filter(quantity__gt=0).order_by('expiry_date'):
                if quantity <= 0:
                    break
                qty = min(batch.quantity, quantity)
                batch.quantity -= qty
                batch.save()
                
                item, created = OrderItem.objects.get_or_create(
                    order=order, product=product, batch=batch,
                    defaults={'quantity': qty, 'price': product.price}
                )
                if not created:
                    item.quantity += qty
                    item.save()
                quantity -= qty
            
            order.total_amount = sum(i.price * i.quantity for i in order.items.all())
            order.save()
            return Response(OrderSerializer(order).data)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def remove_item(self, request, pk=None):
        order = self.get_object()
        if order.status != 'pending':
            return Response({'error': 'Only pending orders can be edited'}, status=status.HTTP_400_BAD_REQUEST)
        if order.customer != request.user:
            return Response({'error': 'You can only edit your own orders'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            item = OrderItem.objects.get(id=request.data.get('item_id'), order=order)
            if item.batch:
                item.batch.quantity += item.quantity
                item.batch.save()
            item.delete()
            
            if order.items.exists():
                order.total_amount = sum(i.price * i.quantity for i in order.items.all())
                order.save()
                return Response(OrderSerializer(order).data)
            else:
                order.status = 'cancelled'
                order.save()
                return Response({'message': 'Order cancelled - no items'})
        except OrderItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['patch'])
    def update_item_quantity(self, request, pk=None):
        order = self.get_object()
        if order.status != 'pending':
            return Response({'error': 'Only pending orders can be edited'}, status=status.HTTP_400_BAD_REQUEST)
        if order.customer != request.user:
            return Response({'error': 'You can only edit your own orders'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            item = OrderItem.objects.get(id=request.data.get('item_id'), order=order)
            new_qty = int(request.data.get('quantity'))
            diff = new_qty - item.quantity
            
            if item.batch:
                if diff > 0 and item.batch.quantity < diff:
                    return Response({'error': 'Insufficient stock'}, status=status.HTTP_400_BAD_REQUEST)
                item.batch.quantity -= diff
                item.batch.save()
            
            item.quantity = new_qty
            item.save()
            order.total_amount = sum(i.price * i.quantity for i in order.items.all())
            order.save()
            return Response(OrderSerializer(order).data)
        except OrderItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def checkout(self, request):
        user = request.user
        cart_items = Cart.objects.filter(customer=user)
        
        if not cart_items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
        
        total = sum(item.product.price * item.quantity for item in cart_items)
        order = Order.objects.create(
            customer=user, total_amount=total,
            shipping_address=request.data.get('shipping_address', user.address),
            payment_method=request.data.get('payment_method', 'cash'),
            notes=request.data.get('notes', '')
        )
        
        for item in cart_items:
            remaining = item.quantity
            for batch in item.product.batches.filter(quantity__gt=0).order_by('expiry_date'):
                if remaining <= 0:
                    break
                qty = min(batch.quantity, remaining)
                OrderItem.objects.create(order=order, product=item.product, batch=batch, quantity=qty, price=item.product.price)
                batch.quantity -= qty
                batch.save()
                remaining -= qty
            
            if remaining > 0:
                order.delete()
                return Response({'error': f'Insufficient stock for {item.product.name}'}, status=status.HTTP_400_BAD_REQUEST)
        
        cart_items.delete()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]


class ProductBatchViewSet(viewsets.ModelViewSet):
    queryset = ProductBatch.objects.all()
    serializer_class = ProductBatchSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        product_id = self.request.query_params.get('product')
        if product_id:
            return ProductBatch.objects.filter(product_id=product_id)
        return ProductBatch.objects.all()
    
    @action(detail=False, methods=['get'])
    def expired(self, request):
        batches = ProductBatch.objects.filter(expiry_date__lt=timezone.now().date())
        return Response(self.get_serializer(batches, many=True).data)
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        days = int(request.query_params.get('days', 30))
        cutoff = timezone.now().date() + timedelta(days=days)
        batches = ProductBatch.objects.filter(
            expiry_date__lte=cutoff,
            expiry_date__gte=timezone.now().date()
        )
        return Response(self.get_serializer(batches, many=True).data)


class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Cart.objects.filter(customer=self.request.user)
    
    def create(self, request):
        product_id = request.data.get('product')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if product.total_stock < quantity:
            return Response({'error': 'Insufficient stock'}, status=status.HTTP_400_BAD_REQUEST)
        
        cart_item, created = Cart.objects.get_or_create(
            customer=request.user, product=product,
            defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        return Response(CartSerializer(cart_item).data, status=status.HTTP_201_CREATED)


# ============================================================================
# PATIENT MEDICAL HISTORY VIEWSETS - FIXED VERSION
# ============================================================================

class PatientMedicalProfileViewSet(viewsets.ModelViewSet):
    """
    Patient Medical Profile
    - Customers can view/edit their own profile
    - Doctors can view all patient profiles
    """
    queryset = PatientMedicalProfile.objects.all()
    serializer_class = PatientMedicalProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor' or user.role == 'admin':
            return PatientMedicalProfile.objects.all()
        return PatientMedicalProfile.objects.filter(patient=user)
    
    def get_serializer_class(self):
        if self.action in ['full_history', 'my_profile', 'patient_history']:
            return FullMedicalHistorySerializer
        return PatientMedicalProfileSerializer
    
    @action(detail=False, methods=['get', 'post', 'patch'])
    def my_profile(self, request):
        """Get or create/update current user's medical profile"""
        profile, created = PatientMedicalProfile.objects.get_or_create(patient=request.user)
        
        if request.method == 'GET':
            serializer = FullMedicalHistorySerializer(profile, context={'request': request})
            return Response(serializer.data)
        
        # POST or PATCH - update profile
        serializer = PatientMedicalProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Return full history after update
            full_serializer = FullMedicalHistorySerializer(profile, context={'request': request})
            return Response(full_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='patient/(?P<user_id>[^/.]+)')
    def patient_history(self, request, user_id=None):
        """
        Get full medical history for a patient BY USER ID (for doctors)
        URL: /api/medical-profiles/patient/{user_id}/
        """
        if request.user.role not in ['doctor', 'admin']:
            return Response({'error': 'Only doctors can view patient history'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            patient = User.objects.get(id=user_id)
            profile, created = PatientMedicalProfile.objects.get_or_create(patient=patient)
            
            serializer = FullMedicalHistorySerializer(profile, context={'request': request})
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def full_history(self, request, pk=None):
        """Get full medical history by PROFILE ID (legacy support)"""
        if request.user.role not in ['doctor', 'admin']:
            return Response({'error': 'Only doctors can view full history'}, status=status.HTTP_403_FORBIDDEN)
        
        profile = self.get_object()
        serializer = FullMedicalHistorySerializer(profile, context={'request': request})
        return Response(serializer.data)


class AllergyViewSet(viewsets.ModelViewSet):
    """ViewSet for managing patient allergies"""
    queryset = Allergy.objects.all()  # <-- ADD THIS LINE!
    serializer_class = AllergySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter allergies based on user role"""
        user = self.request.user
        # Start with base queryset
        qs = Allergy.objects.all()
        
        # Filter based on role
        if hasattr(user, 'role') and user.role in ['doctor', 'admin', 'pharmacist']:
            patient_id = self.request.query_params.get('patient')
            if patient_id:
                return qs.filter(patient_id=patient_id)
            return qs
        
        # Regular users only see their own allergies
        return qs.filter(patient=user)
    
    def perform_create(self, serializer):
        """Automatically set the patient to the current user"""
        serializer.save(patient=self.request.user)
    
    @action(detail=False, methods=['get'])
    def check_drug(self, request):
        """Check if user has allergy to a specific drug"""
        drug = request.query_params.get('drug', '')
        if not drug:
            return Response({'error': 'Drug parameter required'}, status=400)
        
        allergies = Allergy.objects.filter(
            patient=request.user,
            allergy_type='drug',
            allergen__icontains=drug
        )
        
        return Response({
            'has_allergy': allergies.exists(),
            'allergies': AllergySerializer(allergies, many=True).data
        })


class ChronicConditionViewSet(viewsets.ModelViewSet):
    """Patient Chronic Conditions"""
    queryset = ChronicCondition.objects.all()
    serializer_class = ChronicConditionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor' or user.role == 'admin':
            patient_id = self.request.query_params.get('patient')
            if patient_id:
                return ChronicCondition.objects.filter(patient_id=patient_id)
            return ChronicCondition.objects.all()
        return ChronicCondition.objects.filter(patient=user)
    
    def perform_create(self, serializer):
        if self.request.user.role == 'doctor':
            patient_id = self.request.data.get('patient')
            if patient_id:
                serializer.save(patient_id=patient_id)
                return
        serializer.save(patient=self.request.user)


class CurrentMedicationViewSet(viewsets.ModelViewSet):
    """Patient Current Medications"""
    queryset = CurrentMedication.objects.all()
    serializer_class = CurrentMedicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor' or user.role == 'admin':
            patient_id = self.request.query_params.get('patient')
            if patient_id:
                return CurrentMedication.objects.filter(patient_id=patient_id)
            return CurrentMedication.objects.all()
        return CurrentMedication.objects.filter(patient=user)
    
    def perform_create(self, serializer):
        if self.request.user.role == 'doctor':
            patient_id = self.request.data.get('patient')
            if patient_id:
                serializer.save(patient_id=patient_id)
                return
        serializer.save(patient=self.request.user)


class MedicalNoteViewSet(viewsets.ModelViewSet):
    """Medical Notes (Doctors only can create, edit, delete)"""
    queryset = MedicalNote.objects.all()
    serializer_class = MedicalNoteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor' or user.role == 'admin':
            patient_id = self.request.query_params.get('patient')
            if patient_id:
                return MedicalNote.objects.filter(patient_id=patient_id)
            return MedicalNote.objects.all()
        return MedicalNote.objects.filter(patient=user, is_private=False)
    
    def create(self, request, *args, **kwargs):
        if request.user.role != 'doctor':
            return Response({'error': 'Only doctors can create medical notes'}, status=status.HTTP_403_FORBIDDEN)
        
        patient_id = request.data.get('patient')
        if not patient_id:
            return Response({'error': 'Patient ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        note = MedicalNote.objects.create(
            patient_id=patient_id,
            doctor=request.user,
            note_type=request.data.get('note_type', 'general'),
            title=request.data.get('title'),
            content=request.data.get('content'),
            is_private=request.data.get('is_private', False)
        )
        return Response(MedicalNoteSerializer(note).data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Update a medical note (only the doctor who created it)"""
        note = self.get_object()
        
        if request.user.role != 'doctor':
            return Response({'error': 'Only doctors can edit medical notes'}, status=status.HTTP_403_FORBIDDEN)
        
        # Optional: Only allow the doctor who created the note to edit it
        # if note.doctor != request.user:
        #     return Response({'error': 'You can only edit your own notes'}, status=status.HTTP_403_FORBIDDEN)
        
        note.note_type = request.data.get('note_type', note.note_type)
        note.title = request.data.get('title', note.title)
        note.content = request.data.get('content', note.content)
        note.is_private = request.data.get('is_private', note.is_private)
        note.save()
        
        return Response(MedicalNoteSerializer(note).data)
    
    def partial_update(self, request, *args, **kwargs):
        """PATCH - Partial update"""
        return self.update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a medical note (only doctors)"""
        note = self.get_object()
        
        if request.user.role != 'doctor':
            return Response({'error': 'Only doctors can delete medical notes'}, status=status.HTTP_403_FORBIDDEN)
        
        # Optional: Only allow the doctor who created the note to delete it
        # if note.doctor != request.user:
        #     return Response({'error': 'You can only delete your own notes'}, status=status.HTTP_403_FORBIDDEN)
        
        note.delete()
        return Response({'message': 'Note deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'customer':
            return Question.objects.filter(customer=user).order_by('-created_at')
        elif user.role == 'doctor':
            return Question.objects.all().order_by('-created_at')
        return Question.objects.none()
    
    def create(self, request, *args, **kwargs):
        question = Question.objects.create(
            customer=request.user,
            title=request.data.get('title'),
            question_text=request.data.get('question_text')
        )
        return Response(QuestionSerializer(question).data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        question = self.get_object()
        if question.customer != request.user:
            return Response({'error': 'You can only edit your own questions'}, status=status.HTTP_403_FORBIDDEN)
        if question.is_answered:
            return Response({'error': 'Cannot edit an answered question'}, status=status.HTTP_400_BAD_REQUEST)
        
        question.title = request.data.get('title', question.title)
        question.question_text = request.data.get('question_text', question.question_text)
        question.save()
        return Response(QuestionSerializer(question).data)
    
    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        question = self.get_object()
        if question.customer != request.user:
            return Response({'error': 'You can only delete your own questions'}, status=status.HTTP_403_FORBIDDEN)
        if question.is_answered:
            return Response({'error': 'Cannot delete an answered question'}, status=status.HTTP_400_BAD_REQUEST)
        
        question.delete()
        return Response({'message': 'Question deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def answer(self, request, pk=None):
        question = self.get_object()
        if request.user.role != 'doctor':
            return Response({'error': 'Only doctors can answer questions'}, status=status.HTTP_403_FORBIDDEN)
        
        question.answer = request.data.get('answer')
        question.answered_by = request.user
        question.is_answered = True
        question.answered_at = timezone.now()
        question.save()
        return Response(QuestionSerializer(question).data)


class PatientRecordViewSet(viewsets.ModelViewSet):
    queryset = PatientRecord.objects.all()
    serializer_class = PatientRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor':
            return PatientRecord.objects.all()
        return PatientRecord.objects.filter(patient=user)


class StockRequestViewSet(viewsets.ModelViewSet):
    queryset = StockRequest.objects.all()
    serializer_class = StockRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'store_manager':
            return StockRequest.objects.filter(requested_by=user)
        elif user.role == 'admin':
            return StockRequest.objects.all()
        return StockRequest.objects.none()
    
    def create(self, request, *args, **kwargs):
        stock_request = StockRequest.objects.create(
            product_id=request.data.get('product'),
            requested_by=request.user,
            quantity=request.data.get('quantity'),
            reason=request.data.get('reason', ''),
            batch_number=request.data.get('batch_number', ''),
            expiry_date=request.data.get('expiry_date')
        )
        return Response(StockRequestSerializer(stock_request).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        from datetime import date
        stock_request = self.get_object()
        
        if stock_request.status != 'pending':
            return Response({'error': 'Only pending requests can be approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        batch_number = request.data.get('batch_number') or stock_request.batch_number or f"AUTO-{stock_request.id}-{date.today().strftime('%Y%m%d')}"
        expiry_date = request.data.get('expiry_date') or stock_request.expiry_date or (date.today() + timedelta(days=365))
        
        batch, created = ProductBatch.objects.get_or_create(
            product=stock_request.product, batch_number=batch_number,
            defaults={'quantity': 0, 'expiry_date': expiry_date}
        )
        batch.quantity += stock_request.quantity
        batch.save()
        
        stock_request.status = 'approved'
        stock_request.batch_number = batch_number
        stock_request.expiry_date = expiry_date
        stock_request.save()
        
        return Response({'message': 'Approved', 'batch_number': batch_number})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        stock_request = self.get_object()
        if stock_request.status != 'pending':
            return Response({'error': 'Only pending requests can be rejected'}, status=status.HTTP_400_BAD_REQUEST)
        stock_request.status = 'rejected'
        stock_request.save()
        return Response({'message': 'Rejected'})


# ============================================================================
# AI CHATBOT VIEWSET - Uses Gemini/OpenAI/Ollama
# ============================================================================

class ChatView(APIView):
    """
    AI Chatbot endpoint - OPTIMIZED for slow models like phi3:mini
    
    POST /api/chat/
    Body: {"message": "your question"}
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        import threading
        import time
        
        user = request.user
        message = request.data.get('message', '').strip()
        
        if not message:
            return Response(
                {'error': 'Message is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Chat request from {user.username}: {message[:50]}...")
        user_name = user.first_name or user.username
        
        # Result container for thread
        result = {'response': None, 'error': None}
        
        def generate_in_thread():
            try:
                chatbot = get_chatbot_instance()
                result['response'] = chatbot.generate_response(
                    user_message=message,
                    user_id=user.id,
                    user_name=user_name,
                    context=None
                )
            except Exception as e:
                result['error'] = str(e)
        
        # Run in thread with timeout
        thread = threading.Thread(target=generate_in_thread)
        thread.start()
        thread.join(timeout=30)  # Wait max 30 seconds
        
        if thread.is_alive():
            # Thread still running - return fallback
            logger.warning("Chat generation timed out")
            response_text = self._get_fallback_response(message, user_name)
        elif result['error']:
            logger.error(f"Chat error: {result['error']}")
            response_text = self._get_fallback_response(message, user_name)
        else:
            response_text = result['response'] or self._get_fallback_response(message, user_name)
        
        # Save to database (async)
        try:
            ChatMessage.objects.create(user=user, message=message, response=response_text)
        except:
            pass
        
        return Response({
            'response': response_text,
            'user': user.username
        })
    
    def _get_fallback_response(self, message: str, name: str) -> str:
        """Quick fallback responses"""
        msg = message.lower()
        
        if any(w in msg for w in ['hello', 'hi', 'hey']):
            return f"Hello {name}! 👋 How can I help you today?"
        if any(w in msg for w in ['order', 'track']):
            return f"📦 Check your orders in 'My Orders' section, {name}!"
        if any(w in msg for w in ['medicine', 'drug', 'headache', 'pain', 'fever']):
            return f"💊 Check our Products page for medicines. For serious symptoms, consult a doctor, {name}!"
        if any(w in msg for w in ['thank', 'thanks']):
            return f"You're welcome, {name}! 😊"
        if any(w in msg for w in ['bye', 'goodbye']):
            return f"Goodbye {name}! Take care! 👋"
        
        return f"I can help with medicines, orders, and health advice, {name}! 💊"


class ChatHistoryView(APIView):
    """
    Get and clear chat history
    
    GET /api/chat/history/ - Get chat history
    DELETE /api/chat/history/ - Clear chat history
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user's chat history"""
        messages = ChatMessage.objects.filter(user=request.user).order_by('-created_at')[:50]
        return Response([
            {
                'id': m.id,
                'message': m.message,
                'response': m.response,
                'created_at': m.created_at
            }
            for m in messages
        ])
    
    def delete(self, request):
        """Clear user's chat history"""
        try:
            chatbot = get_chatbot_instance()
            chatbot.clear_history(request.user.id)
        except:
            pass
        ChatMessage.objects.filter(user=request.user).delete()
        return Response({'message': 'History cleared'})