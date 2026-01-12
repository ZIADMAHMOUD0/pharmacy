
from django.contrib import admin
from .models import Product, Category


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'active_ingredient',
        'price',
        'requires_prescription',
        'created_at',
    )
    search_fields = ('name', 'active_ingredient')
    list_filter = ('requires_prescription', 'created_at')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)