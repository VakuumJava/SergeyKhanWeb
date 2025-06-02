from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal, InvalidOperation
from django.db import transaction

from .models import CustomUser, Balance, BalanceLog, TransactionLog
from .serializers import BalanceLogSerializer


def check_permissions(user, target_user):
    """
    Проверяет права доступа для изменения баланса.
    Куратор может изменять баланс мастеру.
    Супер админ может изменять баланс мастеру, оператору и куратору.
    """
    if user.role == 'super-admin':
        return target_user.role in ['master', 'operator', 'curator']
    elif user.role == 'curator':
        return target_user.role == 'master'
    return False


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_user_balance_detailed(request, user_id):
    """
    Получить детальную информацию о балансе пользователя
    """
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    balance_obj, _ = Balance.objects.get_or_create(
        user=user, 
        defaults={'amount': Decimal('0.00'), 'paid_amount': Decimal('0.00')}
    )
    
    return Response({
        'user_id': user.id,
        'user_email': user.email,
        'user_role': user.role,
        'current_balance': balance_obj.amount,
        'paid_amount': balance_obj.paid_amount
    })


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def modify_balance(request, user_id):
    """
    Модифицировать баланс пользователя.
    Поддерживает изменение текущего баланса и выплаченной суммы.
    
    Параметры:
    - balance_type: 'current' или 'paid'
    - action_type: 'top_up' или 'deduct'
    - amount: сумма
    - reason: причина изменения
    """
    try:
        target_user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Проверяем права доступа
    if not check_permissions(request.user, target_user):
        return Response({
            'error': 'Permission denied. You cannot modify this user\'s balance.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Валидация входных данных
    balance_type = request.data.get('balance_type')
    action_type = request.data.get('action_type')
    amount_raw = request.data.get('amount')
    reason = request.data.get('reason', '')
    
    if balance_type not in ['current', 'paid']:
        return Response({'error': 'balance_type must be "current" or "paid"'}, status=status.HTTP_400_BAD_REQUEST)
    
    if action_type not in ['top_up', 'deduct']:
        return Response({'error': 'action_type must be "top_up" or "deduct"'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not amount_raw:
        return Response({'error': 'amount is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not reason:
        return Response({'error': 'reason is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        amount = Decimal(str(amount_raw))
        if amount <= 0:
            return Response({'error': 'Amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)
    except (InvalidOperation, TypeError, ValueError):
        return Response({'error': 'Invalid amount format'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Получаем или создаем баланс
    balance_obj, _ = Balance.objects.get_or_create(
        user=target_user, 
        defaults={'amount': Decimal('0.00'), 'paid_amount': Decimal('0.00')}
    )
    
    with transaction.atomic():
        # Сохраняем старые значения
        old_current_balance = balance_obj.amount
        old_paid_amount = balance_obj.paid_amount
        
        # Определяем какое поле изменяем
        if balance_type == 'current':
            old_value = old_current_balance
            if action_type == 'top_up':
                balance_obj.amount += amount
            else:  # deduct
                if balance_obj.amount < amount:
                    return Response({
                        'error': 'Insufficient current balance'
                    }, status=status.HTTP_400_BAD_REQUEST)
                balance_obj.amount -= amount
            new_value = balance_obj.amount
        else:  # paid
            old_value = old_paid_amount
            if action_type == 'top_up':
                balance_obj.paid_amount += amount
            else:  # deduct
                if balance_obj.paid_amount < amount:
                    return Response({
                        'error': 'Insufficient paid amount'
                    }, status=status.HTTP_400_BAD_REQUEST)
                balance_obj.paid_amount -= amount
            new_value = balance_obj.paid_amount
        
        balance_obj.save()
        
        # Логируем в BalanceLog
        BalanceLog.objects.create(
            user=target_user,
            balance_type=balance_type,
            action_type=action_type,
            amount=amount if action_type == 'top_up' else -amount,
            reason=reason,
            performed_by=request.user,
            old_value=old_value,
            new_value=new_value
        )
        
        # Логируем в TransactionLog
        transaction_type = f"{balance_type}_balance_{action_type}" if balance_type == 'current' else f"paid_amount_{action_type}"
        
        TransactionLog.objects.create(
            user=target_user,
            transaction_type=transaction_type,
            amount=amount if action_type == 'top_up' else -amount,
            description=f'{action_type.title()} {balance_type} balance for {target_user.email}: {reason}. {old_value} → {new_value}',
            performed_by=request.user
        )
    
    return Response({
        'message': f'Balance successfully modified',
        'balance_type': balance_type,
        'action_type': action_type,
        'amount': amount,
        'old_value': old_value,
        'new_value': new_value,
        'current_balance': balance_obj.amount,
        'paid_amount': balance_obj.paid_amount
    })


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_balance_logs_detailed(request, user_id):
    """
    Получить детальные логи изменений баланса
    """
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    logs = BalanceLog.objects.filter(user=user).order_by('-created_at')
    serializer = BalanceLogSerializer(logs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_user_permissions(request, user_id):
    """
    Проверить права текущего пользователя на изменение баланса целевого пользователя
    """
    try:
        target_user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    can_modify = check_permissions(request.user, target_user)
    
    return Response({
        'can_modify_balance': can_modify,
        'current_user_role': request.user.role,
        'target_user_role': target_user.role,
        'permissions': {
            'super-admin': 'Can modify balance for master, operator, curator',
            'curator': 'Can modify balance for master only',
            'others': 'No balance modification permissions'
        }
    })


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_all_balances(request):
    """
    Получить балансы всех пользователей (только для супер админа)
    """
    if request.user.role != 'super-admin':
        return Response({
            'error': 'Permission denied. Only super-admin can view all balances.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    balances = Balance.objects.select_related('user').all()
    
    result = []
    for balance in balances:
        result.append({
            'user_id': balance.user.id,
            'user_email': balance.user.email,
            'user_role': balance.user.role,
            'current_balance': balance.amount,
            'paid_amount': balance.paid_amount
        })
    
    return Response(result)
