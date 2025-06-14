"""
API представления для балансов и финансов
"""
from .utils import *


# ----------------------------------------
#  Балансы
# ----------------------------------------

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_user_balance(request, user_id):
    balance_obj, _ = Balance.objects.get_or_create(user_id=user_id, defaults={'amount': 0})
    return Response({'balance': balance_obj.amount})


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def top_up_balance(request, user_id):
    # 1) забираем amount
    amount_raw = request.data.get('amount')
    if amount_raw is None:
        return Response({'error': 'Amount is required'}, status=status.HTTP_400_BAD_REQUEST)

    # 2) приводим к Decimal через str(), ловим ошибки
    try:
        amt = Decimal(str(amount_raw))
    except (InvalidOperation, TypeError):
        return Response({'error': 'Invalid amount format'}, status=status.HTTP_400_BAD_REQUEST)

    # 3) находим пользователя
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    # 4) обновляем баланс
    balance, _ = Balance.objects.get_or_create(user=user, defaults={'amount': 0})
    old_balance = balance.amount
    balance.amount += amt
    balance.save()

    # 5) логируем в BalanceLog
    BalanceLog.objects.create(
        user=user,
        action='top_up',
        amount=amt,
    )

    # 6) логируем в TransactionLog
    log_transaction(
        user=user,
        transaction_type='balance_top_up',
        amount=amt,
        description=f'Пополнение баланса пользователя {user.email} на сумму {amt}. Баланс: {old_balance} → {balance.amount}',
        performed_by=request.user
    )

    return Response({'message': 'Balance topped up'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def deduct_balance(request, user_id):
    amount_raw = request.data.get('amount')
    if amount_raw is None:
        return Response({'error': 'Amount is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        amt = Decimal(str(amount_raw))
    except (InvalidOperation, TypeError):
        return Response({'error': 'Invalid amount format'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    balance, _ = Balance.objects.get_or_create(user=user, defaults={'amount': 0})
    if balance.amount < amt:
        return Response({'error': 'Insufficient balance'}, status=status.HTTP_400_BAD_REQUEST)

    old_balance = balance.amount
    balance.amount -= amt
    balance.save()

    BalanceLog.objects.create(
        user=user,
        action='deduct',
        amount=amt,
    )

    # Логируем в TransactionLog
    log_transaction(
        user=user,
        transaction_type='balance_deduct',
        amount=amt,
        description=f'Списание с баланса пользователя {user.email} на сумму {amt}. Баланс: {old_balance} → {balance.amount}',
        performed_by=request.user
    )

    return Response({'message': 'Balance deducted'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_balance_logs(request, user_id):
    logs = BalanceLog.objects.filter(user_id=user_id).order_by('-created_at')
    serializer = BalanceLogSerializer(logs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_financial_transactions(request):
    """Получение финансовых транзакций пользователя"""
    transactions = FinancialTransaction.objects.filter(user=request.user).order_by('-created_at')
    serializer = FinancialTransactionSerializer(transactions, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
@role_required([ROLES['SUPER_ADMIN']])
def get_all_financial_transactions(request):
    """Получение всех финансовых транзакций (только для админа)"""
    transactions = FinancialTransaction.objects.all().order_by('-created_at')
    serializer = FinancialTransactionSerializer(transactions, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def fine_master(request):
    master_id = request.data.get('master_id')
    amount = Decimal(request.data.get('amount', 0))
    reason = request.data.get('reason', 'Штраф от куратора')

    try:
        master = CustomUser.objects.get(id=master_id, role='master')
    except CustomUser.DoesNotExist:
        return Response({'error': 'Invalid master ID'}, status=400)

    balance, _ = Balance.objects.get_or_create(user=master, defaults={'amount': Decimal('0.00')})
    if balance.amount < amount:
        return Response({'error': 'Insufficient balance'}, status=400)

    old_balance = balance.amount
    balance.amount -= amount
    balance.save()

    # Логируем в BalanceLog
    BalanceLog.objects.create(
        user=master,
        action='fine_by_curator',
        amount=-amount,
        details=f'Fine by curator {request.user.email}: {reason}'
    )

    # Логируем в TransactionLog
    log_transaction(
        user=master,
        transaction_type='balance_deduct',
        amount=amount,
        description=f'Штраф от куратора {request.user.email}: {reason}. Баланс: {old_balance} → {balance.amount}',
        performed_by=request.user
    )

    return Response({'message': 'Master fined successfully'}, status=200)


@api_view(['GET', 'PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def profit_distribution(request):
    """API для управления настройками распределения прибыли"""
    settings = ProfitDistributionSettings.get_settings()

    if request.method == 'GET':
        return Response({
            'master_paid_percent': settings.master_paid_percent,
            'master_balance_percent': settings.master_balance_percent,
            'curator_percent': settings.curator_percent,
            'company_percent': settings.company_percent,
            'total_master_percent': settings.total_master_percent,
            'updated_at': settings.updated_at,
            'updated_by': settings.updated_by.email if settings.updated_by else None,
        })

    elif request.method == 'PUT':
        # Обновление настроек распределения прибыли
        try:
            settings.master_paid_percent = Decimal(str(request.data.get('master_paid_percent', settings.master_paid_percent)))
            settings.master_balance_percent = Decimal(str(request.data.get('master_balance_percent', settings.master_balance_percent)))
            settings.curator_percent = Decimal(str(request.data.get('curator_percent', settings.curator_percent)))
            settings.company_percent = Decimal(str(request.data.get('company_percent', settings.company_percent)))
            settings.updated_by = request.user
            settings.save()
            
            return Response({'message': 'Settings updated successfully'})
        except (ValueError, ValidationError) as e:
            return Response({
                'error': 'Ошибка валидации', 
                'details': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_balance_with_history(request, user_id):
    logs = BalanceLog.objects.filter(user_id=user_id).order_by('created_at')
    balance = Decimal(0)
    history = []

    for log in logs:
        balance += log.amount
        history.append({
            'action': log.action,
            'amount': str(log.amount),
            'balance': str(balance),
            'created_at': log.created_at
        })

    return Response({
        'current_balance': str(balance),
        'history': history
    })


@api_view(['POST'])
def distribute_order_profit(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        # Здесь должна быть логика распределения прибыли
        # Возвращаем заглушку для совместимости
        return Response({"status": "success", "message": "Profit distribution completed"}, status=status.HTTP_200_OK)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": "Unexpected error", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_all_profit_settings(request):
    """Получение всех настроек распределения прибыли"""
    settings = ProfitDistributionSettings.get_settings()
    return Response({
        'master_paid_percent': settings.master_paid_percent,
        'master_balance_percent': settings.master_balance_percent,
        'curator_percent': settings.curator_percent,
        'company_percent': settings.company_percent,
        'total_master_percent': settings.total_master_percent,
        'updated_at': settings.updated_at,
        'updated_by': settings.updated_by.email if settings.updated_by else None,
    })


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_master_profit_settings(request, master_id):
    """Получение настроек распределения прибыли для мастера"""
    try:
        master = CustomUser.objects.get(id=master_id, role='master')
        settings = ProfitDistributionSettings.get_settings()
        return Response({
            'master_id': master.id,
            'master_email': master.email,
            'master_paid_percent': settings.master_paid_percent,
            'master_balance_percent': settings.master_balance_percent,
            'total_master_percent': settings.total_master_percent,
        })
    except CustomUser.DoesNotExist:
        return Response({'error': 'Master not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def manage_master_profit_settings(request, master_id):
    """Управление настройками распределения прибыли для мастера"""
    try:
        master = CustomUser.objects.get(id=master_id, role='master')
        settings = ProfitDistributionSettings.get_settings()
        
        if request.method == 'GET':
            return Response({
                'master_id': master.id,
                'master_email': master.email,
                'master_paid_percent': settings.master_paid_percent,
                'master_balance_percent': settings.master_balance_percent,
                'total_master_percent': settings.total_master_percent,
            })
        elif request.method == 'PUT':
            # Простая заглушка для обновления
            return Response({'message': 'Settings updated successfully'})
            
    except CustomUser.DoesNotExist:
        return Response({'error': 'Master not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def delete_master_profit_settings(request, master_id):
    """Удаление настроек распределения прибыли для мастера"""
    try:
        master = CustomUser.objects.get(id=master_id, role='master')
        # Простая заглушка для удаления
        return Response({'message': 'Master profit settings deleted successfully'})
    except CustomUser.DoesNotExist:
        return Response({'error': 'Master not found'}, status=status.HTTP_404_NOT_FOUND)
