from django.urls import path
from . import views

urlpatterns = [
    path('convert-to-regex/', views.convert_to_regex, name='convert_to_regex'),
    path('test-replacement/', views.test_regex_replacement, name='test_replacement'),
    path('demo/', views.demo_page, name='demo_page'),
]