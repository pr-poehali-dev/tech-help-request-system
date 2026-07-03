import json
import os
import psycopg2


def _row_to_ticket(r):
    return {
        'id': r[0],
        'equipment': r[1],
        'reason': r[2],
        'room': r[3],
        'building': r[4],
        'status': r[5],
        'takenBy': r[6],
        'author': r[7],
        'createdAt': r[8].strftime('%d.%m, %H:%M') if r[8] else '',
    }


def handler(event: dict, context) -> dict:
    '''
    Business: Управление заявками на ремонт оборудования - получение списка, создание, взятие в работу и завершение
    Args: event с httpMethod (GET список, POST создать, PUT изменить статус), body с полями заявки
    Returns: HTTP response со списком заявок или созданной/обновлённой заявкой
    '''
    method = event.get('httpMethod', 'GET')
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    jheaders = {**cors, 'Content-Type': 'application/json'}

    try:
        if method == 'GET':
            cur.execute(
                "SELECT id, equipment, reason, room, building, status, taken_by, author, created_at "
                "FROM tickets WHERE is_demo = FALSE ORDER BY id DESC"
            )
            tickets = [_row_to_ticket(r) for r in cur.fetchall()]
            return {'statusCode': 200, 'headers': jheaders, 'body': json.dumps({'tickets': tickets})}

        body = json.loads(event.get('body') or '{}')

        if method == 'POST':
            equipment = (body.get('equipment') or '').strip()
            reason = (body.get('reason') or '').strip()
            room = (body.get('room') or '').strip()
            building = body.get('building') or 'Корпус А'
            author = body.get('author') or 'Гость'
            if not equipment or not reason or not room:
                return {'statusCode': 400, 'headers': jheaders,
                        'body': json.dumps({'error': 'Заполните все поля'})}
            cur.execute(
                "INSERT INTO tickets (equipment, reason, room, building, author) "
                "VALUES (%s, %s, %s, %s, %s) "
                "RETURNING id, equipment, reason, room, building, status, taken_by, author, created_at",
                (equipment, reason, room, building, author),
            )
            ticket = _row_to_ticket(cur.fetchone())
            conn.commit()
            return {'statusCode': 200, 'headers': jheaders, 'body': json.dumps({'ticket': ticket})}

        if method == 'PUT':
            ticket_id = body.get('id')
            status = body.get('status')
            taken_by = body.get('takenBy')
            if not ticket_id or status not in ('Оформлено', 'В работе', 'Выполнено'):
                return {'statusCode': 400, 'headers': jheaders,
                        'body': json.dumps({'error': 'Некорректные данные'})}
            if taken_by is not None:
                cur.execute(
                    "UPDATE tickets SET status = %s, taken_by = %s WHERE id = %s "
                    "RETURNING id, equipment, reason, room, building, status, taken_by, author, created_at",
                    (status, taken_by, ticket_id),
                )
            else:
                cur.execute(
                    "UPDATE tickets SET status = %s WHERE id = %s "
                    "RETURNING id, equipment, reason, room, building, status, taken_by, author, created_at",
                    (status, ticket_id),
                )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': jheaders,
                        'body': json.dumps({'error': 'Заявка не найдена'})}
            conn.commit()
            return {'statusCode': 200, 'headers': jheaders,
                    'body': json.dumps({'ticket': _row_to_ticket(row)})}

        return {'statusCode': 400, 'headers': jheaders,
                'body': json.dumps({'error': 'Метод не поддерживается'})}
    finally:
        cur.close()
        conn.close()