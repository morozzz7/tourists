# Tourism Django

## Требования
- Python 3.11+ (желательно)
- PostgreSQL 13+

## Быстрый старт
1. Создать и активировать виртуальное окружение
```bash
python -m venv venv
source venv/bin/activate
```

2. Установить зависимости
```bash
pip install -r requirements.txt
```

3. Создать `.env`
```bash
cp .env.example .env
```
Заполни переменные в `.env` (минимум `SECRET_KEY` и данные PostgreSQL).

4. Подготовить PostgreSQL
```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres createdb -O postgres tourism
```
Если у тебя другие `DB_USER/DB_PASSWORD/DB_NAME`, поправь команды и `.env`.

5. Применить миграции
```bash
python manage.py migrate
```

6. Запустить сервер
```bash
python manage.py runserver
```

## Полезные команды
- Открыть psql через Django:
```bash
python manage.py dbshell
```
- Создать админа:
```bash
python manage.py createsuperuser
```
