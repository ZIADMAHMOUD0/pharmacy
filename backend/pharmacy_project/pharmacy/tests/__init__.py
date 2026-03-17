# pharmacy/tests/__init__.py
"""
PharmaCare Test Suite

Run all tests:
    python manage.py test pharmacy.tests

Run specific test file:
    python manage.py test pharmacy.tests.test_models
    python manage.py test pharmacy.tests.test_api
    python manage.py test pharmacy.tests.test_serializers

Run specific test class:
    python manage.py test pharmacy.tests.test_models.UserModelTest

Run specific test method:
    python manage.py test pharmacy.tests.test_models.UserModelTest.test_create_customer

Run with verbosity:
    python manage.py test pharmacy.tests -v 2

Run with coverage:
    pip install coverage
    coverage run --source='pharmacy' manage.py test pharmacy.tests
    coverage report
    coverage html
"""
