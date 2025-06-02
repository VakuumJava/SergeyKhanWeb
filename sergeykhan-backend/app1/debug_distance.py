import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app1.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from api1.models import Order, CustomUser, Balance
from api1.distancionka import calculate_average_check, calculate_daily_revenue, calculate_net_turnover, check_distance_level, DistanceSettings

# Create test data
master_user = CustomUser.objects.create_user(
    email='debug@test.com',
    password='testpass123',
    role='master'
)
Balance.objects.create(user=master_user, amount=Decimal('0.00'))

# Clear any existing orders
Order.objects.filter(assigned_master=master_user).delete()

# Create orders similar to test
print(f"Current time: {timezone.now()}")
print(f"Yesterday (24h ago): {timezone.now() - timedelta(days=1)}")

for i in range(10):
    order_time = timezone.now() - timedelta(days=2 + i)  # All orders 2+ days ago
    order = Order.objects.create(
        client_name=f'Client {i+1}',
        client_phone=f'+7700000000{i}',
        description=f'Test order {i+1}',
        status='завершен',
        assigned_master=master_user,
        final_cost=Decimal('70000'),
        expenses=Decimal('1000')
    )
    # Manually update created_at after creation (since auto_now_add=True prevents setting it during create)
    Order.objects.filter(id=order.id).update(created_at=order_time)
    order.refresh_from_db()
    print(f"Created order {i+1} at {order.created_at} (days back: {2 + i})")

# Calculate metrics
settings = DistanceSettings()
avg_check = calculate_average_check(master_user.id)
daily_revenue = calculate_daily_revenue(master_user.id)
net_turnover = calculate_net_turnover(master_user.id)
level = check_distance_level(master_user.id)

print(f"\nSettings:")
print(f"Average check threshold: {settings.average_check_threshold}")
print(f"Daily revenue threshold: {settings.daily_order_sum_threshold}")
print(f"Net turnover threshold: {settings.net_turnover_threshold}")

print(f"\nCalculated values:")
print(f"Average check: {avg_check}")
print(f"Daily revenue: {daily_revenue}")
print(f"Net turnover (10 days): {net_turnover}")
print(f"Distance level: {level}")

print(f"\nConditions:")
print(f"avg_check >= threshold: {avg_check >= settings.average_check_threshold}")
print(f"daily_revenue >= threshold: {daily_revenue >= settings.daily_order_sum_threshold}")
print(f"net_turnover >= threshold: {net_turnover >= settings.net_turnover_threshold}")

# Clean up
master_user.delete()
