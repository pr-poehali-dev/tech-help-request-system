import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    '''
    Business: Авторизация пользователей (мастер, админ, преподаватель, студент) и регистрация студентов администратором
    Args: event с httpMethod, body (action: login|register, login, password, full_name, role)
    Returns: HTTP response с данными пользователя или списком студентов
    '''
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    try:
        body = json.loads(event.get('body') or '{}')
        action = body.get('action', 'login')

        if method == 'POST' and action == 'login':
            login = (body.get('login') or '').strip()
            password = body.get('password') or ''
            cur.execute(
                "SELECT id, full_name, role FROM users WHERE login = %s AND password = %s",
                (login, password),
            )
            row = cur.fetchone()
            if not row:
                return {
                    'statusCode': 401,
                    'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Неверный логин или пароль'}),
                }
            user = {'id': row[0], 'name': row[1], 'role': row[2]}
            return {
                'statusCode': 200,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'user': user}),
            }

        if method == 'POST' and action == 'register':
            full_name = (body.get('full_name') or '').strip()
            login = (body.get('login') or '').strip()
            password = body.get('password') or 'student'
            if not full_name or not login:
                return {
                    'statusCode': 400,
                    'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Укажите ФИО и логин'}),
                }
            cur.execute("SELECT id FROM users WHERE login = %s", (login,))
            if cur.fetchone():
                return {
                    'statusCode': 409,
                    'headers': {**cors, 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Логин уже занят'}),
                }
            cur.execute(
                "INSERT INTO users (full_name, login, password, role) VALUES (%s, %s, %s, 'student') RETURNING id",
                (full_name, login, password),
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return {
                'statusCode': 200,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'id': new_id, 'full_name': full_name, 'login': login}),
            }

        if method == 'GET':
            cur.execute(
                "SELECT id, full_name, login FROM users WHERE role = 'student' ORDER BY id DESC"
            )
            students = [{'id': r[0], 'full_name': r[1], 'login': r[2]} for r in cur.fetchall()]
            return {
                'statusCode': 200,
                'headers': {**cors, 'Content-Type': 'application/json'},
                'body': json.dumps({'students': students}),
            }

        return {
            'statusCode': 400,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Неизвестное действие'}),
        }
    finally:
        cur.close()
        conn.close()
