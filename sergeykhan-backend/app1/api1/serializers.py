from rest_framework import serializers
from django.utils import timezone
from .models import Order, CustomUser, Balance, BalanceLog, CalendarEvent, Contact, OrderLog, TransactionLog, MasterAvailability, MasterAvailability, CompanyBalance, CompanyBalanceLog, OrderCompletion, FinancialTransaction, OrderCompletion, FinancialTransaction, SystemLog


class OrderSerializer(serializers.ModelSerializer):
    """Основной сериализатор заказов - возвращает все поля"""
    full_address = serializers.CharField(source='get_full_address', read_only=True)
    public_address = serializers.CharField(source='get_public_address', read_only=True)
    completion = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = '__all__'
    
    def get_completion(self, obj):
        """Возвращает информацию о завершении заказа, если она есть"""
        try:
            if hasattr(obj, 'completion') and obj.completion:
                return {
                    'id': obj.completion.id,
                    'status': obj.completion.status,
                    'created_at': obj.completion.created_at
                }
        except:
            pass
        return None


class OrderPublicSerializer(serializers.ModelSerializer):
    """Публичный сериализатор для мастеров до взятия заказа - скрывает приватную информацию"""
    public_address = serializers.CharField(source='get_public_address', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'description', 'status', 'estimated_cost', 'final_cost', 
            'created_at', 'client_name', 'street', 'house_number', 'public_address'
        ]
        # Исключаем квартиру, подъезд и телефон клиента


class OrderDetailSerializer(serializers.ModelSerializer):
    """Детальный сериализатор для взятых заказов - показывает всю информацию включая email-адреса"""
    full_address = serializers.CharField(source='get_full_address', read_only=True)
    public_address = serializers.CharField(source='get_public_address', read_only=True)
    assigned_master_email = serializers.CharField(source='assigned_master.email', read_only=True)
    operator_email = serializers.CharField(source='operator.email', read_only=True)
    curator_email = serializers.CharField(source='curator.email', read_only=True)
    transferred_to_email = serializers.CharField(source='transferred_to.email', read_only=True)
    completion = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = '__all__'
    
    def get_completion(self, obj):
        """Возвращает информацию о завершении заказа, если она есть"""
        try:
            if hasattr(obj, 'completion') and obj.completion:
                return {
                    'id': obj.completion.id,
                    'status': obj.completion.status,
                    'created_at': obj.completion.created_at
                }
        except:
            pass
        return None


class CustomUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'role', 'password']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            password=password,
            role=validated_data.get('role', 'master')
        )
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance



class BalanceSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    
    class Meta:
        model = Balance
        fields = ['user', 'user_email', 'user_role', 'amount', 'paid_amount']


class BalanceLogSerializer(serializers.ModelSerializer):
    performed_by_email = serializers.CharField(source='performed_by.email', read_only=True)
    balance_type_display = serializers.CharField(source='get_balance_type_display', read_only=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    
    class Meta:
        model = BalanceLog
        fields = ['id', 'balance_type', 'balance_type_display', 'action_type', 'action_type_display', 
                 'amount', 'reason', 'performed_by', 'performed_by_email', 'old_value', 'new_value', 'created_at']


class CalendarEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarEvent
        fields = ['id', 'title', 'start', 'end', 'color']


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'


class OrderLogSerializer(serializers.ModelSerializer):
    performed_by_email = serializers.CharField(source='performed_by.email', read_only=True)
    
    class Meta:
        model = OrderLog
        fields = ['id', 'order', 'action', 'performed_by', 'performed_by_email', 'description', 'old_value', 'new_value', 'created_at']


class TransactionLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    performed_by_email = serializers.CharField(source='performed_by.email', read_only=True)
    
    class Meta:
        model = TransactionLog
        fields = ['id', 'user', 'user_email', 'transaction_type', 'amount', 'description', 'order', 'performed_by', 'performed_by_email', 'created_at']


class MasterAvailabilitySerializer(serializers.ModelSerializer):
    master_email = serializers.CharField(source='master.email', read_only=True)
    
    class Meta:
        model = MasterAvailability
        fields = '__all__'


class CompanyBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyBalance
        fields = ['amount']


class CompanyBalanceLogSerializer(serializers.ModelSerializer):
    performed_by_email = serializers.CharField(source='performed_by.email', read_only=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    
    class Meta:
        model = CompanyBalanceLog
        fields = ['id', 'action_type', 'action_type_display', 'amount', 'reason', 
                 'performed_by', 'performed_by_email', 'old_value', 'new_value', 'created_at']
        read_only_fields = ('created_at',)


class MasterWorkloadSerializer(serializers.Serializer):
    """Serializer for master workload data combining availability and orders"""
    master_id = serializers.IntegerField()
    master_email = serializers.CharField()
    availability_slots = MasterAvailabilitySerializer(many=True)
    orders_count_by_date = serializers.DictField()
    next_available_slot = serializers.DictField(allow_null=True)
    total_orders_today = serializers.IntegerField()


class OrderCompletionSerializer(serializers.ModelSerializer):
    """Сериализатор для завершения заказов мастерами"""
    master_email = serializers.CharField(source='master.email', read_only=True)
    curator_email = serializers.CharField(source='curator.email', read_only=True)
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_description = serializers.CharField(source='order.description', read_only=True)
    total_expenses = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    net_profit = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderCompletion
        fields = [
            'id', 'order', 'order_id', 'order_description', 'master', 'master_email',
            'work_description', 'completion_photos', 'parts_expenses', 'transport_costs',
            'total_received', 'total_expenses', 'net_profit', 'completion_date',
            'status', 'curator', 'curator_email', 'review_date', 'curator_notes',
            'is_distributed', 'created_at', 'updated_at'
        ]
        read_only_fields = ('master', 'total_expenses', 'net_profit', 'is_distributed', 'created_at', 'updated_at')


class OrderCompletionCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания завершения заказа мастером"""
    completion_photos = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = OrderCompletion
        fields = [
            'order', 'work_description', 'completion_photos', 'parts_expenses',
            'transport_costs', 'total_received', 'completion_date'
        ]
    
    def validate_order(self, value):
        """Проверяем, что заказ можно завершить"""
        if not hasattr(value, 'assigned_master') or not value.assigned_master:
            raise serializers.ValidationError("Заказ не назначен мастеру")
        
        if value.status not in ['выполняется', 'назначен']:
            raise serializers.ValidationError("Заказ должен быть в статусе 'выполняется' или 'назначен'")
        
        if hasattr(value, 'completion'):
            raise serializers.ValidationError("Заказ уже имеет запись о завершении")
        
        return value
    
    def create(self, validated_data):
        """Создаем завершение заказа и обновляем статус заказа"""
        request = self.context.get('request')
        validated_data['master'] = request.user
        
        # Обрабатываем загружаемые фотографии
        completion_photos = validated_data.pop('completion_photos', [])
        
        completion = super().create(validated_data)
        
        # Сохраняем фотографии (если есть)
        if completion_photos:
            photo_paths = []
            for photo in completion_photos:
                # Здесь можно добавить логику сохранения файлов
                # Пока просто сохраняем имена файлов
                photo_paths.append(photo.name)
            completion.completion_photos = photo_paths
            completion.save()
        
        # Обновляем статус заказа
        completion.order.status = 'ожидает_подтверждения'
        completion.order.save()
        
        return completion


class OrderCompletionReviewSerializer(serializers.ModelSerializer):
    """Сериализатор для проверки завершения заказа куратором"""
    action = serializers.CharField(write_only=True)
    comment = serializers.CharField(required=False, allow_blank=True, write_only=True)
    
    class Meta:
        model = OrderCompletion
        fields = ['status', 'curator_notes', 'action', 'comment']
        read_only_fields = ['status', 'curator_notes']
    
    def validate_action(self, value):
        """Проверяем корректность действия"""
        if value not in ['approve', 'reject']:
            raise serializers.ValidationError("Действие должно быть 'approve' или 'reject'")
        return value
    
    def update(self, instance, validated_data):
        """Обновляем статус и устанавливаем куратора"""
        request = self.context.get('request')
        
        # Устанавливаем статус в зависимости от action
        action = validated_data.pop('action')
        if action == 'approve':
            validated_data['status'] = 'одобрен'
        else:
            validated_data['status'] = 'отклонен'
            
        # Устанавливаем комментарий
        comment = validated_data.pop('comment', None)
        if comment:
            validated_data['curator_notes'] = comment
            
        validated_data['curator'] = request.user
        validated_data['review_date'] = timezone.now()
        
        completion = super().update(instance, validated_data)
        
        # Обновляем статус заказа
        if completion.status == 'одобрен':
            completion.order.status = 'завершен'
        else:
            # Если отклонен, возвращаем в "в процессе"
            completion.order.status = 'в процессе'
        
        completion.order.save()
        
        return completion


class FinancialTransactionSerializer(serializers.ModelSerializer):
    """Сериализатор для финансовых транзакций"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    order_id = serializers.IntegerField(source='order_completion.order.id', read_only=True)
    
    class Meta:
        model = FinancialTransaction
        fields = [
            'id', 'user', 'user_email', 'order_completion', 'order_id',
            'transaction_type', 'transaction_type_display', 'amount',
            'description', 'created_at'
        ]
        read_only_fields = ('created_at',)


class OrderCompletionDistributionSerializer(serializers.Serializer):
    """Сериализатор для отображения расчета распределения средств"""
    master_immediate = serializers.DecimalField(max_digits=10, decimal_places=2)
    master_deferred = serializers.DecimalField(max_digits=10, decimal_places=2)
    master_total = serializers.DecimalField(max_digits=10, decimal_places=2)
    company_share = serializers.DecimalField(max_digits=10, decimal_places=2)
    curator_share = serializers.DecimalField(max_digits=10, decimal_places=2)
    net_profit = serializers.DecimalField(max_digits=10, decimal_places=2)
