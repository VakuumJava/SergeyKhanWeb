# Generated by Django 5.2 on 2025-06-05 08:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api1', '0002_alter_order_status_ordercompletion_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='profitdistributionsettings',
            name='company_percent',
            field=models.PositiveIntegerField(
                default=35, help_text='Процент в кассу компании'),
        ),
        migrations.AddField(
            model_name='profitdistributionsettings',
            name='master_balance_percent',
            field=models.PositiveIntegerField(
                default=30, help_text='Процент мастеру на баланс'),
        ),
        migrations.AddField(
            model_name='profitdistributionsettings',
            name='master_paid_percent',
            field=models.PositiveIntegerField(
                default=30, help_text='Процент мастеру сразу в выплачено'),
        ),
        migrations.AlterField(
            model_name='profitdistributionsettings',
            name='advance_percent',
            field=models.PositiveIntegerField(
                default=30, help_text='Устарело'),
        ),
        migrations.AlterField(
            model_name='profitdistributionsettings',
            name='balance_percent',
            field=models.PositiveIntegerField(
                default=30, help_text='Устарело'),
        ),
        migrations.AlterField(
            model_name='profitdistributionsettings',
            name='cash_percent',
            field=models.PositiveIntegerField(
                default=30, help_text='Устарело'),
        ),
        migrations.AlterField(
            model_name='profitdistributionsettings',
            name='curator_percent',
            field=models.PositiveIntegerField(
                default=5, help_text='Процент куратору на баланс'),
        ),
        migrations.AlterField(
            model_name='profitdistributionsettings',
            name='final_kassa_percent',
            field=models.PositiveIntegerField(
                default=35, help_text='Устарело'),
        ),
        migrations.AlterField(
            model_name='profitdistributionsettings',
            name='initial_kassa_percent',
            field=models.PositiveIntegerField(
                default=70, help_text='Устарело'),
        ),
    ]
