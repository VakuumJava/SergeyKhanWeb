from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'role', 'dist', 'is_staff', 'is_active')  # Добавлено dist
    list_filter = ('role', 'dist', 'is_staff', 'is_active')  # Добавлен фильтр по dist

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('role', 'dist')}),  # Добавлено dist
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role', 'dist', 'is_staff', 'is_active')}
        ),  # Добавлено dist в форму создания
    )

    search_fields = ('email',)  # Search by email instead of username
    ordering = ('email',)  # Order by email instead of username

# Register the CustomUser model with the custom admin
admin.site.register(CustomUser, CustomUserAdmin)
