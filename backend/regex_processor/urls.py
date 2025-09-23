from django.urls import path
from . import views

urlpatterns = [
    path('convert-to-regex/', views.convert_to_regex, name='convert_to_regex'),
    path('test-replacement/', views.test_regex_replacement, name='test_replacement'),
    path('analyze-column/', views.analyze_column, name='analyze_column'),
    path('test-regex-pattern/', views.test_regex_pattern, name='test_regex_pattern'),
    path('natural-language-query/', views.natural_language_query, name='natural_language_query'),
    path('demo/', views.demo_page, name='demo_page'),
    path('upload/', views.upload_page, name='upload_page'),
    path('manager/', views.file_manager_page, name='file_manager_page'),
    path('upload-file/', views.upload_file, name='upload_file'),
    path('process-data/', views.process_data, name='process_data'),
]