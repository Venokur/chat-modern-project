# Modern Realtime Support Platform

Микросервисная платформа для онлайн-чата службы поддержки и панели оператора с функциями AI/NLP-автоответов в режиме реального времени.

## Архитектура и компоненты

1. **Frontend (`/frontend`) — Клиентский интерфейс и панель оператора:**
   - **Стек:** Vue 3.5, Vite 6, Socket.IO Client.
   - **Виджет чата (`ChatWidget.vue`)**: Плавающий интерфейс чата для посетителей сайта, позволяющий вводить имя, отправлять сообщения и получать ответы в реальном времени.
   - **Админ-панель (`AdminPanel.vue`)**: Рабочее место оператора поддержки — список активных диалогов (комнат), счётчик сообщений, переключение между чатами, отправка ответов и удаление диалогов.

2. **Backend Node.js (`/backend-node`) — Realtime-сервер и бизнес-логика:**
   - **Стек:** Node.js (ESM), Express 5, Socket.IO 4.8, клиент PostgreSQL (`pg`).
   - Управляет WebSocket-соединениями (`join_room`, `send_message`, `room_updated`, `room_deleted`).
   - Предоставляет REST API (`/api/rooms`, `/api/rooms/:id/messages`, `DELETE /api/rooms/:id`).
   - Сохраняет историю сообщений и комнат в PostgreSQL.
   - Делегирует клиентские сообщения в Python-микросервис для анализа намерений и автоответов.

3. **Backend Python (`/backend-python`) — AI / NLP микросервис:**
   - **Стек:** FastAPI, Uvicorn, Pydantic.
   - Эндпоинт `POST /analyze`: анализирует входящий текст от клиента (распознавание интентов: приветствие, запрос цен/тарифов и др.) и генерирует текст автоответа для бота.

4. **База данных (`docker-compose.yml`, `init.sql`):**
   - **PostgreSQL 16** в Docker-контейнере.
   - Таблицы: `rooms` (комнаты/диалоги пользователей) и `messages` (сообщения с типами отправителя: `client`, `admin`, `bot`).

## Основной сценарий работы

1. Посетитель открывает виджет чата и отправляет вопрос.
2. Сообщение сохраняется в PostgreSQL и передается через Socket.IO в админ-панель оператора.
3. Node.js backend параллельно опрашивает Python AI-сервис:
   - Если срабатывает автоответчик (бот), бот отправляет ответ пользователю.
4. Оператор в панели администратора видит диалог в реальном времени и может подключиться к беседе.

## Инструкция по запуску

1. **Запуск базы данных PostgreSQL:**
   ```bash
   docker compose up -d
   ```

2. **Запуск Python микросервиса (AI / NLP автоответчик):**
   ```bash
   cd backend-python
   python -m venv venv
   # Windows: venv\Scripts\activate
   # Linux/macOS: source venv/bin/activate
   pip install -r requirements.txt
   python main.py
   ```
   Сервис запустится на `http://localhost:8000`.

3. **Запуск Node.js Backend (ESM + Express 5 + Socket.IO 4.8):**
   ```bash
   cd backend-node
   npm install
   npm run dev
   ```
   Сервер запустится на `http://localhost:3001`.

4. **Запуск Frontend (Vite 8 + Vue 3.5):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Интерфейс откроется на `http://localhost:5173`.
