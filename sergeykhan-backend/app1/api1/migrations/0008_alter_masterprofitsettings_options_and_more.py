# Generated by Django 5.2 on 2025-06-14 08:33

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api1', '0007_merge_20250614_0710'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='masterprofitsettings',
            options={
                'ordering': [
                    'master__first_name',
                    'master__last_name'],
                'verbose_name': 'Настройки распределения прибыли мастера',
                'verbose_name_plural': 'Настройки распределения прибыли мастеров'},
        ),
        migrations.AddField(
            model_name='masterprofitsettings',
            name='created_by',
            field=models.ForeignKey(
                blank=True,
                limit_choices_to={
                    'role__in': ['super-admin']},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='created_master_profit_settings',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Создал'),
        ),
        migrations.AddField(
            model_name='masterprofitsettings',
            name='is_active',
            field=models.BooleanField(
                default=True,
                help_text='Использовать индивидуальные настройки или глобальные',
                verbose_name='Активно'),
        ),
        migrations.AddField(
            model_name='order',
            name='age',
            field=models.PositiveIntegerField(
                blank=True, null=True, verbose_name='Возраст клиента'),
        ),
        migrations.AddField(
            model_name='order',
            name='payment_method',
            field=models.CharField(
                choices=[
                    ('наличные',
                     'Наличные'),
                    ('карта',
                     'Банковская карта'),
                    ('перевод',
                     'Банковский перевод'),
                    ('элсом',
                     'Элсом'),
                    ('mbанк',
                     'МБанк')],
                default='наличные',
                max_length=20,
                verbose_name='Способ оплаты'),
        ),
        migrations.AddField(
            model_name='order',
            name='priority',
            field=models.CharField(
                choices=[
                    ('низкий',
                     'Низкий'),
                    ('обычный',
                     'Обычный'),
                    ('высокий',
                     'Высокий'),
                    ('срочный',
                     'Срочный')],
                default='обычный',
                max_length=20,
                verbose_name='Приоритет'),
        ),
        migrations.AddField(
            model_name='profitdistributionsettings',
            name='created_by',
            field=models.ForeignKey(
                blank=True,
                help_text='Кто создал настройки',
                limit_choices_to={
                    'role__in': [
                        'super-admin',
                        'admin']},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='created_profit_settings',
                to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='profitdistributionsettings',
            name='is_active',
            field=models.BooleanField(
                default=True, help_text='Активность настроек'),
        ),
        migrations.AlterField(
            model_name='masterprofitsettings',
            name='company_percent',
            field=models.PositiveIntegerField(
                default=35,
                help_text='Процент в кассу компании',
                verbose_name='Процент компании (%)'),
        ),
        migrations.AlterField(
            model_name='masterprofitsettings',
            name='created_at',
            field=models.DateTimeField(
                auto_now_add=True, verbose_name='Дата создания'),
        ),
        migrations.AlterField(
            model_name='masterprofitsettings',
            name='curator_percent',
            field=models.PositiveIntegerField(
                default=5,
                help_text='Процент куратору на баланс',
                verbose_name='Процент куратору (%)'),
        ),
        migrations.AlterField(
            model_name='masterprofitsettings',
            name='master',
            field=models.OneToOneField(
                limit_choices_to={
                    'role': 'master'},
                on_delete=django.db.models.deletion.CASCADE,
                related_name='profit_settings',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Мастер'),
        ),
        migrations.AlterField(
            model_name='masterprofitsettings',
            name='master_balance_percent',
            field=models.PositiveIntegerField(
                default=30,
                help_text='Процент мастеру на баланс',
                verbose_name='Процент на баланс (%)'),
        ),
        migrations.AlterField(
            model_name='masterprofitsettings',
            name='master_paid_percent',
            field=models.PositiveIntegerField(
                default=30,
                help_text='Процент мастеру сразу в выплачено',
                verbose_name='Процент на выплату (%)'),
        ),
        migrations.AlterField(
            model_name='masterprofitsettings',
            name='updated_at',
            field=models.DateTimeField(
                auto_now=True, verbose_name='Дата обновления'),
        ),
        migrations.AlterField(
            model_name='masterprofitsettings',
            name='updated_by',
            field=models.ForeignKey(
                blank=True,
                limit_choices_to={
                    'role__in': ['super-admin']},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='updated_master_profit_settings',
                to=settings.AUTH_USER_MODEL,
                verbose_name='Обновил'),
        ),
        migrations.AlterField(
            model_name='profitdistributionsettings',
            name='updated_by',
            field=models.ForeignKey(
                blank=True,
                help_text='Кто последний раз обновил настройки',
                limit_choices_to={
                    'role__in': [
                        'super-admin',
                        'admin']},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='updated_profit_settings',
                to=settings.AUTH_USER_MODEL),
        ),
    ]
