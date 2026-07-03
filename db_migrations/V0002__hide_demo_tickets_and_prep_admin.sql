ALTER TABLE tickets ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE tickets SET is_demo = TRUE;

ALTER TABLE users ADD COLUMN password_visible VARCHAR(255);
UPDATE users SET password_visible = password;