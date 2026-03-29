from django.db import migrations, models
from django.conf import settings
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('quests', '0002_pointofinterest_poiqrcode_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='UserProgress',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('points', models.IntegerField(default=0, verbose_name='Баллы пользователя')),
                ('collected_cards', models.JSONField(blank=True, default=list, verbose_name='Собранные карточки')),
                ('purchased_rewards', models.JSONField(blank=True, default=list, verbose_name='Купленные награды')),
                ('started_routes', models.JSONField(blank=True, default=list, verbose_name='Начатые маршруты')),
                ('completed_routes', models.JSONField(blank=True, default=list, verbose_name='Завершенные маршруты')),
                ('route_stamps', models.JSONField(blank=True, default=dict, verbose_name='Штампы маршрутов')),
                ('active_route_id', models.CharField(blank=True, default='', max_length=100, verbose_name='Активный маршрут')),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='progress', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Прогресс пользователя',
                'verbose_name_plural': 'Прогресс пользователей',
            },
        ),
    ]
