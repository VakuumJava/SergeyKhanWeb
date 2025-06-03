from django.contrib.auth.models import AbstractUser, BaseUserManager, Permission
from django.db import models
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers, viewsets, permissions
import uuid


# Custom User Manager
class CustomUserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifiers
    for authentication instead of usernames.
    """
    def create_user(self, email, password, **extra_fields):
        """
        Create and save a user with the given email and password.
        """
        if not email:
            raise ValueError(_("The Email must be set"))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        """
        Create and save a SuperUser with the given email and password.
        """
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))
        return self.create_user(email, password, **extra_fields)


# Custom User Model
class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('master', 'Мастер'),
        ('operator', 'Оператор'),
        ('warrant-master', 'Гарантийный мастер'),
        ('super-admin', 'Супер админ'),
        ('curator', 'Куратор'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='master')
    # Уровень дистанционки: 0 - нет, 1 - 4 часа, 2 - 24 часа
    dist = models.PositiveSmallIntegerField(default=0)
    # Флаг ручной установки дистанционки (не пересчитывать автоматически)
    distance_manual_override = models.BooleanField(default=False)
    username = None
    email = models.EmailField(_("email address"), unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = CustomUserManager()

    def __str__(self):
        return f"{self.username} ({self.role})"


class Balance(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='balance')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)  # Текущий баланс
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)  # Выплаченная сумма за все время

    def __str__(self):
        return f"Balance: {self.user.email} - Current: {self.amount}, Paid: {self.paid_amount}"


# Order Model
class Order(models.Model):
    STATUS_CHOICES = (
        ('новый', 'Новый'),
        ('в обработке', 'В обработке'),
        ('назначен', 'Назначен мастеру'),
        ('выполняется', 'Выполняется'),
        ('завершен', 'Завершен'),
    )

    client_name = models.CharField(max_length=255)
    client_phone = models.CharField(max_length=20)
    description = models.TextField()
    
    # Раздельные поля адреса
    street = models.CharField(max_length=255, null=True, blank=True, verbose_name='Улица')
    house_number = models.CharField(max_length=50, null=True, blank=True, verbose_name='Номер дома')
    apartment = models.CharField(max_length=50, null=True, blank=True, verbose_name='Квартира')
    entrance = models.CharField(max_length=50, null=True, blank=True, verbose_name='Подъезд')
    
    # Объединенный адрес для обратной совместимости
    address = models.CharField(max_length=255, null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='новый')
    is_test = models.BooleanField(default=False)  # Поле для указания тестового заказа

    operator = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        limit_choices_to={'role': 'operator'},
        related_name='processed_orders'
    )

    curator = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        limit_choices_to={'role': 'curator'},
        related_name='assigned_orders'
    )

    assigned_master = models.ForeignKey(
        CustomUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        limit_choices_to={'role': 'master'},
        related_name='orders'
    )
    transferred_to = models.ForeignKey(
        CustomUser,
        related_name='transferred_orders',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )    # Scheduling fields
    scheduled_date = models.DateField(null=True, blank=True, verbose_name='Дата выполнения')
    scheduled_time = models.TimeField(null=True, blank=True, verbose_name='Время выполнения')
    
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    final_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    expenses = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id} - {self.client_name} ({self.status})"
    
    def get_full_address(self):
        """Возвращает полный адрес со всеми деталями"""
        parts = []
        if self.street:
            parts.append(self.street)
        if self.house_number:
            parts.append(self.house_number)
        if self.apartment:
            parts.append(f"кв. {self.apartment}")
        if self.entrance:
            parts.append(f"подъезд {self.entrance}")
        return ", ".join(parts) if parts else self.address or ""
    
    def get_public_address(self):
        """Возвращает публичный адрес без квартиры и подъезда (для мастеров до взятия заказа)"""
        parts = []
        if self.street:
            parts.append(self.street)
        if self.house_number:
            parts.append(self.house_number)
        return ", ".join(parts) if parts else ""
    
    def save(self, *args, **kwargs):
        """Автоматически обновляем поле address при сохранении"""
        if not self.address:
            self.address = self.get_full_address()
        super().save(*args, **kwargs)


class IsCurator(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'curator'

class IsOperator(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'operator'

class IsMaster(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'master'



class BalanceLog(models.Model):
    BALANCE_TYPE_CHOICES = (
        ('current', 'Текущий баланс'),
        ('paid', 'Выплаченная сумма'),
    )
    
    ACTION_TYPE_CHOICES = (
        ('top_up', 'Пополнение'),
        ('deduct', 'Списание'),
    )
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='logs')
    balance_type = models.CharField(max_length=10, choices=BALANCE_TYPE_CHOICES, default='current')
    action_type = models.CharField(max_length=10, choices=ACTION_TYPE_CHOICES, default='top_up')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.TextField(default='')  # Причина изменения
    performed_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='balance_changes_performed'
    )
    old_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    new_value = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Сохраняем старые поля для совместимости
    action = models.CharField(max_length=100, default='legacy')  # старое поле для совместимости
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.get_balance_type_display()} - {self.get_action_type_display()} - {self.amount}"

# Распределение прибыли
class ProfitDistribution(models.Model):
    master_percent = models.PositiveIntegerField(default=60)
    curator_percent = models.PositiveIntegerField(default=5)
    operator_percent = models.PositiveIntegerField(default=5)
    kassa = models.PositiveIntegerField(default=30)

    def __str__(self):
        return "Profit Distribution Settings"


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('email', 'role')



class CalendarEvent(models.Model):
    master = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='calendar_events')
    title = models.CharField(max_length=255)
    start = models.DateTimeField()
    end = models.DateTimeField()
    color = models.CharField(max_length=7, default='#6366F1')

    def __str__(self):
        return f'{self.title} ({self.start} - {self.end})'



class Contact(models.Model):
    STATUS_CHOICES = (
        ('обзвонен', 'Обзвонен'),
        ('не обзвонен', 'Не обзвонен'),
    )
    name = models.CharField(max_length=255)
    number = models.CharField(max_length=50)
    date = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='не обзвонен'
    )

    def __str__(self):
        return f"{self.name} ({self.number}) - {self.status}"




class CompanyBalance(models.Model):
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Company Kassa: {self.amount}"

    @staticmethod
    def get_instance():
        instance, _ = CompanyBalance.objects.get_or_create(id=1)
        return instance


class DistanceSettingsModel(models.Model):
    """Модель для хранения настроек дистанционки в базе данных"""
    
    # Обычная дистанционка
    average_check_threshold = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=65000,
        help_text="Пороговое значение среднего чека для обычной дистанционки"
    )
    visible_period_standard = models.PositiveIntegerField(
        default=28,
        help_text="Количество часов видимости для обычной дистанционки"
    )
    
    # Суточная дистанционка
    daily_order_sum_threshold = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=350000,
        help_text="Пороговое значение суммы заказов в сутки для суточной дистанционки"
    )
    net_turnover_threshold = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=1500000,
        help_text="Пороговое значение чистого вала за 10 дней для суточной дистанционки"
    )
    visible_period_daily = models.PositiveIntegerField(
        default=48,
        help_text="Количество часов видимости для суточной дистанционки"
    )
    
    # Метаданные
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        limit_choices_to={'role': 'super-admin'}
    )
    
    class Meta:
        verbose_name = "Настройки дистанционки"
        verbose_name_plural = "Настройки дистанционки"
    
    def __str__(self):
        return f"Настройки дистанционки (обновлено: {self.updated_at})"
    
    @staticmethod
    def get_settings():
        """Получить текущие настройки (создать если не существуют)"""
        settings, created = DistanceSettingsModel.objects.get_or_create(
            id=1,
            defaults={
                'average_check_threshold': 65000,
                'visible_period_standard': 28,
                'daily_order_sum_threshold': 350000,
                'net_turnover_threshold': 1500000,
                'visible_period_daily': 48
            }
        )
        return settings

# Модель для логирования изменений заказов
class OrderLog(models.Model):
    ACTION_CHOICES = (
        ('created', 'Заказ создан'),
        ('status_changed', 'Статус изменен'),
        ('master_assigned', 'Мастер назначен'),
        ('master_removed', 'Мастер снят'),
        ('transferred', 'Переведен на гарантию'),
        ('completed', 'Завершен'),
        ('deleted', 'Удален'),
        ('updated', 'Обновлен'),
        ('cost_updated', 'Стоимость обновлена'),
        ('approved', 'Одобрен'),
    )
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    performed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    description = models.TextField()
    old_value = models.TextField(null=True, blank=True)  # Старое значение
    new_value = models.TextField(null=True, blank=True)  # Новое значение
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Order {self.order.id} - {self.action} by {self.performed_by}"


# Модель для логирования транзакций
class TransactionLog(models.Model):
    TRANSACTION_TYPES = (
        ('balance_top_up', 'Пополнение баланса'),
        ('balance_deduct', 'Списание с баланса'),
        ('paid_amount_top_up', 'Пополнение выплаченной суммы'),
        ('paid_amount_deduct', 'Списание с выплаченной суммы'),
        ('profit_distribution', 'Распределение прибыли'),
        ('master_payment', 'Выплата мастеру'),
        ('curator_salary', 'Зарплата куратору'),
        ('company_income', 'Доход компании'),
    )
    
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField()
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True)  # Связь с заказом, если применимо
    performed_by = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='performed_transactions'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.transaction_type} - {self.amount} - {self.user}"


# Master Availability Model for scheduling
class MasterAvailability(models.Model):
    master = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        limit_choices_to={'role': 'master'},
        related_name='availability_slots'
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['date', 'start_time']
        constraints = [
            models.UniqueConstraint(
                fields=['master', 'date', 'start_time'], 
                name='unique_master_availability'
            )
        ]
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time")
        
        # Check for overlapping availability slots
        if self.pk:
            overlapping = MasterAvailability.objects.filter(
                master=self.master,
                date=self.date,
            ).exclude(pk=self.pk).filter(
                models.Q(start_time__lt=self.end_time) & 
                models.Q(end_time__gt=self.start_time)
            )
        else:
            overlapping = MasterAvailability.objects.filter(
                master=self.master,
                date=self.date,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time
            )
        
        if overlapping.exists():
            raise ValidationError("This time slot overlaps with existing availability")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.master.email} - {self.date} ({self.start_time}-{self.end_time})"
