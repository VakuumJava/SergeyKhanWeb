"""
Утилиты и константы для API
"""

from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation

from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (api_view, authentication_classes,
                                       permission_classes)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..middleware import RolePermission, role_required
from ..models import (Balance, BalanceLog, CalendarEvent, CompanyBalance,
                      CompanyBalanceLog, Contact, CustomUser,
                      FinancialTransaction, MasterAvailability, Order,
                      OrderCompletion, OrderLog, ProfitDistribution,
                      ProfitDistributionSettings, TransactionLog)
from ..serializers import (BalanceLogSerializer, BalanceSerializer,
                           CalendarEventSerializer, ContactSerializer,
                           CustomUserSerializer,
                           FinancialTransactionSerializer,
                           OrderCompletionCreateSerializer,
                           OrderCompletionDistributionSerializer,
                           OrderCompletionReviewSerializer,
                           OrderCompletionSerializer, OrderDetailSerializer,
                           OrderLogSerializer, OrderPublicSerializer,
                           OrderSerializer, TransactionLogSerializer)

# Константы ролей
ROLES = {
    "MASTER": "master",
    "OPERATOR": "operator",
    "WARRANT_MASTER": "warrant-master",
    "SUPER_ADMIN": "super-admin",
    "CURATOR": "curator",
}


# ----------------------------------------
#  Вспомогательные функции логирования
# ----------------------------------------


def log_order_action(
    order, action, performed_by, description, old_value=None, new_value=None
):
    """
    Логирует действие с заказом
    """
    OrderLog.objects.create(
        order=order,
        action=action,
        performed_by=performed_by,
        description=description,
        old_value=old_value,
        new_value=new_value,
    )


def log_system_action(
    action, performed_by, description, old_value=None, new_value=None, metadata=None
):
    """
    Логирует системное действие (не связанное с конкретным заказом)
    """
    from ..models import SystemLog

    SystemLog.objects.create(
        action=action,
        performed_by=performed_by,
        description=description,
        old_value=old_value,
        new_value=new_value,
        metadata=metadata or {},
    )


def log_transaction(
    user, transaction_type, amount, description, order=None, performed_by=None
):
    """
    Логирует финансовую транзакцию
    """
    TransactionLog.objects.create(
        user=user,
        transaction_type=transaction_type,
        amount=amount,
        description=description,
        order=order,
        performed_by=performed_by,
    )
