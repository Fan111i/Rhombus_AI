from django.urls import path
from . import views

urlpatterns = [
    path('convert-to-regex/', views.convert_to_regex, name='convert_to_regex'),
    path('test-replacement/', views.test_regex_replacement, name='test_replacement'),
    path('demo/', views.demo_page, name='demo_page'),
    path('upload/', views.upload_page, name='upload_page'),
    path('manager/', views.file_manager_page, name='file_manager_page'),
    path('upload-file/', views.upload_file, name='upload_file'),
    path('process-data/', views.process_data, name='process_data'),
]