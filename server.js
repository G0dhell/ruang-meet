// Server signaling WebRTC. Tidak ada timer/batas durasi meeting.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const MAX_PER_ROOM = 12; // mesh P2P: 6-12 orang ideal
const rooms = new Map(); // roomId -> Map(peerId -> ws)

const server = http.createServer((req, res) => {
  const file = req.url.split('?')[0] === '/' || req.url.startsWith('/r/') ? '/index.html' : req.url.split('?')[0];
  const full = path.join(__dirname, 'public', path.normalize(file));
  if (!full.startsWith(path.join(__dirname, 'public'))) { res.writeHead(403); return res.end(); }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': full.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/plain' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });
const uid = () => Math.random().toString(36).slice(2, 10);
const send = (ws, m) => ws.readyState === 1 && ws.send(JSON.stringify(m));

wss.on('connection', (ws) => {
  ws.id = uid();
  ws.isAlive = true;
  ws.on('pong', () => (ws.isAlive = true));

  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.type === 'join') {
      const room = rooms.get(m.room) || new Map();
      if (room.size >= MAX_PER_ROOM) return send(ws, { type: 'full' });
      ws.room = m.room; ws.name = String(m.name || 'Tamu').slice(0, 30);
      const peers = [...room.entries()].map(([id, p]) => ({ id, name: p.name }));
      room.set(ws.id, ws); rooms.set(m.room, room);
      send(ws, { type: 'joined', id: ws.id, peers });
      room.forEach((p, id) => id !== ws.id && send(p, { type: 'peer-joined', id: ws.id, name: ws.name }));
    } else if (['signal', 'chat'].includes(m.type) && ws.room) {
      const room = rooms.get(ws.room);
      if (m.type === 'signal') {
        const t = room.get(m.to);
        t && send(t, { type: 'signal', from: ws.id, data: m.data });
      } else {
        room.forEach((p) => send(p, { type: 'chat', from: ws.name, text: String(m.text).slice(0, 1000) }));
      }
    }
  });

  ws.on('close', () => {
    const room = rooms.get(ws.room);
    if (!room) return;
    room.delete(ws.id);
    room.forEach((p) => send(p, { type: 'peer-left', id: ws.id }));
    if (!room.size) rooms.delete(ws.room);
  });
});

// Buang koneksi mati (bukan pembatas durasi)
setInterval(() => wss.clients.forEach((ws) => {
  if (!ws.isAlive) return ws.terminate();
  ws.isAlive = false; ws.ping();
}), 30000);

server.listen(PORT, () => console.log('Ruang Meet jalan di http://localhost:' + PORT));
