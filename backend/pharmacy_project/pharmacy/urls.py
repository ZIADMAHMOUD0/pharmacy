from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

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

urlpatterns = [
    path('', include(router.urls)),
]