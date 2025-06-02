from rest_framework import serializers
from .models import Order, CustomUser, Balance, BalanceLog, CalendarEvent, Contact, OrderLog, TransactionLog


class OrderSerializer(serializers.ModelSerializer):
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


class OrderDetailSerializer(serializers.ModelSerializer):
    assigned_master_email = serializers.CharField(source='assigned_master.email', read_only=True)
    operator_email = serializers.CharField(source='operator.email', read_only=True)
    curator_email = serializers.CharField(source='curator.email', read_only=True)
    transferred_to_email = serializers.CharField(source='transferred_to.email', read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'