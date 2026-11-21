# Patungan Bimbel SKD — Tryout CPNS 2026 Batch 1

Website tryout statis berbasis HTML, CSS, dan JavaScript. Proyek ini dapat dijalankan langsung di hosting statis seperti **GitHub Pages** tanpa Cloudflare, backend, database, atau konfigurasi server.

## Fitur
- Login sederhana menggunakan email terdaftar dan satu password bersama.
- 110 soal TWK, TIU, dan TKP.
- Timer 100 menit, navigasi nomor, penanda ragu-ragu, dan penyimpanan jawaban selama pengerjaan.
- Penilaian otomatis sesuai kunci dan bobot jawaban.
- Pembahasan, review jawaban, analisis hasil, riwayat, dan ekspor data lokal.
- Riwayat peserta dipisahkan berdasarkan email pada browser/perangkat masing-masing.
- Desain responsif untuk HP, tablet, dan desktop.

## Menjalankan website

1. Ekstrak ZIP.
2. Buka `index.html` melalui browser atau unggah seluruh isi folder ke GitHub Pages.
3. Pastikan struktur file dan folder tidak diubah. File `data.js`, `answer-data.js`, `app.js`, `styles.css`, `questions.json`, `answers.json`, `visuals.json`, dan folder `assets/` harus tetap berada di lokasi yang sama seperti paket ini.
4. Login menggunakan salah satu email yang diizinkan dan password bersama yang sudah dibagikan kepada peserta.

## Publikasi ke GitHub Pages

1. Buat repository GitHub. Jika ingin mengurangi paparan daftar email, gunakan repository **Private** dan pilih paket/fitur GitHub Pages yang mendukung publikasi dari repository tersebut.
2. Unggah seluruh isi folder proyek ke root repository.
3. Buka **Settings → Pages**.
4. Pilih **Deploy from a branch**, pilih branch `main` dan folder `/ (root)`, lalu simpan.
5. Tunggu proses publikasi dan buka URL GitHub Pages yang diberikan GitHub.

## Catatan login dan keamanan

Login ini memang dibuat **sederhana sebagai formalitas akses**, sesuai kebutuhan penggunaan internal. Daftar email dan password bersama diperiksa langsung di JavaScript pada browser. Karena itu:

- Daftar email yang diizinkan dan password bersama dapat dilihat oleh orang yang memeriksa source code website.
- Pengguna yang memahami JavaScript dapat melewati pemeriksaan login atau membaca data soal/kunci yang diunduh browser.
- Login ini bukan sistem autentikasi aman dan tidak cocok untuk materi rahasia, ujian berisiko tinggi, atau perlindungan dari pengguna yang sengaja membobol akses.
- Jangan memakai password yang sama dengan akun pribadi atau akun penting lainnya.

## Penyimpanan data peserta

Riwayat nilai dan jawaban disimpan di `localStorage` browser, dipisahkan berdasarkan email. Data hanya tersedia pada browser/perangkat yang sama. Menghapus data browser, memakai mode incognito, atau berpindah perangkat dapat membuat riwayat tidak tersedia. Gunakan fitur ekspor/backup di website untuk menyimpan salinan riwayat.

## Struktur proyek

- `index.html` — halaman utama.
- `styles.css` — desain dan motion UI.
- `app.js` — login formalitas, navigasi, timer, penilaian, riwayat, dan interaksi.
- `data.js` — data soal dan ilustrasi.
- `answer-data.js` — kunci jawaban dan pembahasan.
- `questions.json`, `answers.json`, `visuals.json` — data sumber terstruktur.
- `assets/logo.png` — logo Patungan Bimbel SKD.
