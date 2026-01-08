from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register('users', UserViewSet)
router.register('categories', CategoryViewSet)
router.register('products', ProductViewSet)
router.register('product-batches', ProductBatchViewSet)
router.register('orders', OrderViewSet)
router.register('cart', CartViewSet, basename='cart')
router.register('questions', QuestionViewSet)
router.register('patient-records', PatientRecordViewSet)
router.register('stock-requests', StockRequestViewSet)
router.register('chat', ChatMessageViewSet, basename='chat')
router.register(r'medical-profiles', PatientMedicalProfileViewSet)
router.register(r'allergies', AllergyViewSet)
router.register(r'chronic-conditions', ChronicConditionViewSet)
router.register(r'current-medications', CurrentMedicationViewSet)
router.register(r'medical-notes', MedicalNoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)