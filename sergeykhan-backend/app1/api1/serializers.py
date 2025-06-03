from rest_framework import serializers
from .models import Order, CustomUser, Balance, BalanceLog, CalendarEvent, Contact, OrderLog, TransactionLog, MasterAvailability, MasterAvailability


class OrderSerializer(serializers.ModelSerializer):
    """Основной сериализатор заказов - возвращает все поля"""
    full_address = serializers.CharField(source='get_full_address', read_only=True)
    public_address = serializers.CharField(source='get_public_address', read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'


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
    
    class Meta:
        model = Order
        fields = '__all__'


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
        read_only_fields = ('created_at', 'updated_at')


class MasterWorkloadSerializer(serializers.Serializer):
    """Serializer for master workload data combining availability and orders"""
    master_id = serializers.IntegerField()
    master_email = serializers.CharField()
    availability_slots = MasterAvailabilitySerializer(many=True)
    orders_count_by_date = serializers.DictField()
    next_available_slot = serializers.DictField(allow_null=True)
    total_orders_today = serializers.IntegerField()