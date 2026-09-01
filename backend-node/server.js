import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import { query } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

// REST API
app.get('/api/rooms', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT 
        r.*, 
        (SELECT text FROM messages WHERE room_id = r.id ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT COUNT(*)::int FROM messages WHERE room_id = r.id AND sender = 'client') AS unread_count
      FROM rooms r 
      WHERE EXISTS (
        SELECT 1 FROM messages WHERE room_id = r.id AND sender = 'client'
      )
      ORDER BY r.last_message_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rooms/:id/messages', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM messages WHERE room_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удаление комнаты и оповещение клиентов
app.delete('/api/rooms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM rooms WHERE id = $1 RETURNING id', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Диалог не найден' });
    }

    // Уведомляем админку и клиента об удалении
    io.emit('room_deleted', { roomId: id });
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.IO
io.on('connection', (socket) => {
  socket.on('join_room', ({ roomId, userName, role }) => {
    socket.join(roomId);
  });

  socket.on('send_message', async ({ roomId, sender, text, userName }) => {
    const trimmed = text?.trim();
    if (!trimmed || !roomId) return;

    try {
      if (sender === 'client') {
        const clientRoomId = roomId;
        const clientUserName = userName || 'Гость';
        await query(
          `INSERT INTO rooms (id, user_name)
           VALUES ($1, $2)
           ON CONFLICT (id) DO NOTHING`,
          [clientRoomId, clientUserName]
        );
      }

      const { rows } = await query(
        `INSERT INTO messages (room_id, sender, text) 
         VALUES ($1, $2, $3) RETURNING *`,
        [roomId, sender, trimmed]
      );
      const savedMsg = rows[0];

      await query(
        'UPDATE rooms SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
        [roomId]
      );

      io.to(roomId).emit('new_message', savedMsg);
      io.emit('room_updated', { roomId, lastMessage: trimmed });

      // Python AI / Bot response
      if (sender === 'client') {
        try {
          const response = await fetch(`${PYTHON_SERVICE_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_id: roomId, text: trimmed, sender }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.auto_reply) {
              setTimeout(async () => {
                const botRes = await query(
                  `INSERT INTO messages (room_id, sender, text) 
                   VALUES ($1, 'bot', $2) RETURNING *`,
                  [roomId, data.auto_reply]
                );
                io.to(roomId).emit('new_message', botRes.rows[0]);
                io.emit('room_updated', { roomId, lastMessage: data.auto_reply });
              }, 400);
            }
          }
        } catch (botErr) {
          console.warn('Python AI service offline:', botErr.message);
        }
      }
    } catch (err) {
      console.error('Send message error:', err);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Node.js ESM Server running on http://localhost:${PORT}`);
});
