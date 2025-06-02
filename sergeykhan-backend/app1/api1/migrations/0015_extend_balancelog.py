# Generated manually for BalanceLog extension

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api1', '0014_alter_calendarevent_options_alter_orderlog_options_and_more'),
    ]

    operations = [
        # Добавляем поле paid_amount в Balance
        migrations.AddField(
            model_name='balance',
            name='paid_amount',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=12),
        ),
        
        # Добавляем новые поля в BalanceLog
        migrations.AddField(
            model_name='balancelog',
            name='balance_type',
            field=models.CharField(choices=[('current', 'Текущий баланс'), ('paid', 'Выплаченная сумма')], default='current', max_length=10),
        ),
        migrations.AddField(
            model_name='balancelog',
            name='action_type',
            field=models.CharField(choices=[('top_up', 'Пополнение'), ('deduct', 'Списание')], default='top_up', max_length=10),
        ),
        migrations.AddField(
            model_name='balancelog',
            name='reason',
            field=models.TextField(default=''),
        ),
        migrations.AddField(
            model_name='balancelog',
            name='performed_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='balance_changes_performed', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='balancelog',
            name='old_value',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=12),
        ),
        migrations.AddField(
            model_name='balancelog',
            name='new_value',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=12),
        ),
        
        # Обновляем типы транзакций
        migrations.AlterField(
            model_name='transactionlog',
            name='transaction_type',
            field=models.CharField(choices=[('balance_top_up', 'Пополнение баланса'), ('balance_deduct', 'Списание с баланса'), ('paid_amount_top_up', 'Пополнение выплаченной суммы'), ('paid_amount_deduct', 'Списание с выплаченной суммы'), ('profit_distribution', 'Распределение прибыли'), ('master_payment', 'Выплата мастеру'), ('curator_salary', 'Зарплата куратору'), ('company_income', 'Доход компании')], max_length=20),
        ),
    ]
