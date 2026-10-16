# Ruang Meet

Meeting video tanpa batas durasi. Fitur: video/audio, chat, berbagi layar, tautan ruangan, tanpa akun.

## Menjalankan di komputer sendiri
    npm install
    npm start
Buka http://localhost:3000 di dua tab untuk mencoba.

## Agar bisa dipakai orang lain
1. Taruh di VPS (mis. Ubuntu) lalu jalankan `npm start` (pakai `pm2` agar terus hidup).
2. Pasang HTTPS (wajib untuk kamera di browser selain localhost), mis. Nginx + Let's Encrypt,
   dan teruskan WebSocket (header Upgrade).
3. Pasang server TURN (coturn) lalu isi di bagian ICE pada public/index.html,
   supaya peserta di jaringan ketat tetap tersambung.

## Catatan
Memakai topologi mesh P2P: nyaman untuk 4-8 orang (maks. diset 12). Untuk puluhan peserta
butuh SFU seperti mediasoup atau LiveKit.
