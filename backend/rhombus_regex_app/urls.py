from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect

def home_redirect(request):
    return redirect('/api/')


urlpatterns = [
    path('', home_redirect, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('regex_processor.urls')),
]
1