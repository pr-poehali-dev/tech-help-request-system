CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    login VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('master', 'admin', 'teacher', 'student')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    equipment VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    room VARCHAR(50) NOT NULL,
    building VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Оформлено' CHECK (status IN ('Оформлено', 'В работе', 'Выполнено')),
    taken_by VARCHAR(255),
    author VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (full_name, login, password, role) VALUES
('Иванов Сергей', 'master', 'demo', 'master'),
('Петрова Ольга', 'admin', 'demo', 'admin'),
('Смирнов Андрей', 'teacher', 'demo', 'teacher');

INSERT INTO tickets (equipment, reason, room, building, status, taken_by, author) VALUES
('Проектор Epson EB-X05', 'Не включается, индикатор мигает красным', '312', 'Корпус А', 'В работе', 'Иванов Сергей', 'Смирнов Андрей'),
('Компьютер Dell OptiPlex', 'Не загружается ОС, чёрный экран', '204', 'Корпус Б', 'Оформлено', NULL, 'Смирнов Андрей'),
('Интерактивная доска SMART', 'Не реагирует на касания в левом углу', '118', 'Корпус А', 'Выполнено', 'Петрова Ольга', 'Смирнов Андрей');