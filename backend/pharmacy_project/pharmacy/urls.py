# pyrefly: ignore [missing-import]
from django.urls import path, include
# pyrefly: ignore [missing-import]
from rest_framework.routers import DefaultRouter
from .views import *
# pyrefly: ignore [missing-import]
from django.conf import settings
# pyrefly: ignore [missing-import]
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
router.register(r'medical-profiles', PatientMedicalProfileViewSet)
router.register(r'allergies', AllergyViewSet, basename='allergy')
router.register(r'chronic-conditions', ChronicConditionViewSet)
router.register(r'current-medications', CurrentMedicationViewSet)
router.register(r'medical-notes', MedicalNoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('chat/', ChatView.as_view(), name='chat'),
    path('chat/history/', ChatHistoryView.as_view(), name='chat-history'),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)