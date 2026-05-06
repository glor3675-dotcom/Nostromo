const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);

// WebSocket сервер
const wss = new WebSocket.Server({ server });

// Хранилище комнат
const rooms = new Map();

wss.on('connection', (ws) => {
  console.log('Новое WebSocket подключение');

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw);
      const { type, room, payload } = data;

      if (!rooms.has(room)) {
        rooms.set(room, new Set());
      }
      rooms.get(room).add(ws);

      switch (type) {
        case 'join':
          console.log(`Участник в комнате ${room}. Всего: ${rooms.get(room).size}`);
          ws.send(JSON.stringify({ type: 'joined', room }));

          // Если двое — сообщаем обоим
          if (rooms.get(room).size >= 2) {
            for (const client of rooms.get(room)) {
              client.send(JSON.stringify({ type: 'ready', room }));
            }
          }
          break;

        case 'signal':
          // Пересылаем сигнал всем в комнате, кроме отправителя
          for (const client of rooms.get(room)) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'signal', payload }));
            }
          }
          break;

        case 'leave':
          if (rooms.has(room)) {
            rooms.get(room).delete(ws);
            if (rooms.get(room).size === 0) rooms.delete(room);
          }
          break;
      }
    } catch (e) {
      console.error('Ошибка:', e);
    }
  });

  ws.on('close', () => {
    for (const [room, clients] of rooms) {
      clients.delete(ws);
      if (clients.size === 0) rooms.delete(room);
    }
  });
});

// Обычный HTTP (для проверки)
app.get('/', (req, res) => {
  res.send('Call server with WSS is running!');
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
