# Patungan Bimbel SKD — Tryout CPNS 2027 Batch 1

**Rilis final: 2027.1.0**

Website tryout SKD CPNS statis yang dapat dipublikasikan langsung melalui **GitHub Pages**. Tidak memerlukan Cloudflare, backend, database server, Node.js, atau proses build saat website dijalankan.

## Fitur

- Login formalitas menggunakan email yang diizinkan dan satu password bersama.
- 110 soal pilihan ganda A–E: 30 TWK, 35 TIU, dan 45 TKP.
- Timer 100 menit dengan penyimpanan waktu berbasis deadline.
- Navigasi nomor soal, status jawaban, penanda ragu, dan ukuran teks.
- Soal tabel, numerik, dan figural dalam bentuk teks/vektor SVG, bukan screenshot PDF.
- Penilaian otomatis: TWK/TIU 5 poin untuk jawaban benar; TKP menggunakan bobot 5–1 sesuai urutan kunci.
- Passing grade per bagian: TWK 65, TIU 80, TKP 166.
- Pembahasan per nomor, termasuk tabel perhitungan dan diagram jaring-jaring kubus.
- Analisis performa per bagian dan kelompok kemampuan TIU.
- Riwayat nilai tersimpan di browser/perangkat masing-masing peserta.
- Ekspor dan impor riwayat dalam format JSON untuk pencadangan atau pemindahan perangkat.
- Tampilan responsif untuk ponsel, tablet, dan desktop.

## Struktur file

```text
.
├── index.html
├── styles.css
├── app.js
├── data.js
├── answer-data.js
├── questions.json
├── answers.json
├── visuals.json
├── build-data.py
├── validate_project.py
├── AUDIT-REPORT.md
├── assets/
│   └── logo.png
├── .nojekyll
└── README.md
```

`questions.json`, `answers.json`, dan `visuals.json` merupakan data sumber yang dapat diedit. `data.js` dan `answer-data.js` adalah berkas runtime yang dibaca browser. Jika mengubah data sumber, jalankan:

```bash
python build-data.py
```

Python hanya diperlukan untuk membangun ulang berkas runtime setelah data diedit. GitHub Pages menjalankan berkas HTML/CSS/JavaScript yang sudah tersedia tanpa proses build.

## Publikasi ke GitHub Pages

1. Buat repository GitHub baru.
2. Unggah **seluruh isi folder ini** ke root repository, sehingga `index.html` berada langsung di root.
3. Buka **Settings → Pages** pada repository.
4. Pada bagian Build and deployment, pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/ (root)`, lalu simpan.
6. Tunggu proses publikasi selesai. GitHub akan menampilkan alamat website pada bagian Pages.

Semua referensi aset menggunakan path relatif, sehingga proyek dapat dijalankan dari root GitHub Pages maupun URL project repository.

## Login formalitas

Daftar email yang diizinkan dan password bersama dikonfigurasi di `app.js` pada bagian konfigurasi autentikasi. Untuk menambah atau menghapus email, edit daftar tersebut dan unggah ulang file.

**Catatan keamanan:** sistem login ini memang dibuat sebagai pembatas formalitas di sisi browser sesuai permintaan. Karena tidak menggunakan server, daftar email dan password dapat dilihat melalui source code atau DevTools. Jangan gunakan password yang sama dengan akun pribadi atau layanan penting.

## Penyimpanan nilai peserta

Riwayat disimpan pada `localStorage` browser berdasarkan email peserta dan domain website. Konsekuensinya:

- Riwayat tetap tersedia pada browser/perangkat yang sama selama data browser tidak dihapus.
- Riwayat tidak otomatis tersinkron ke perangkat lain atau browser lain.
- Peserta dapat mengekspor file JSON dari menu riwayat dan mengimpornya pada perangkat lain.
- Menghapus data situs/browser dapat menghapus riwayat lokal. Anjurkan peserta melakukan ekspor berkala.

## Materi dan penilaian

Label edisi website diubah menjadi **2027** sesuai permintaan. Materi soal dan pembahasan disusun dari dua PDF yang diberikan dalam percakapan; nama dokumen sumber aslinya memuat edisi 2026. Kunci, pembobotan TKP, dan passing grade mengikuti dokumen kunci/pembahasan tersebut.

## Pemeriksaan proyek

Jalankan pemeriksaan integritas data sebelum mengunggah atau setelah mengubah materi:

```bash
python validate_project.py
node --check app.js
node --check data.js
node --check answer-data.js
```

`validate_project.py` memeriksa jumlah dan urutan soal, kelengkapan opsi A–E, kecocokan kategori soal dengan kunci, urutan bobot TKP, ketersediaan pembahasan dan ilustrasi, sinkronisasi data JSON dengan berkas runtime, konfigurasi 30 email, serta kelengkapan aset.

## Catatan audit

- Data soal: 110 nomor, dengan pembagian TWK 30, TIU 35, dan TKP 45.
- Kunci dan pembahasan: 110 nomor.
- Ilustrasi figural: 8 SVG; tabel soal: 9.
- Bobot TKP diverifikasi sebagai urutan 5, 4, 3, 2, 1 untuk seluruh 45 soal.
- Nilai maksimal 550 dan passing grade TWK 65, TIU 80, TKP 166 mengikuti dokumen kunci/pembahasan yang diberikan.
- Semua dependensi bersifat lokal; tidak ada CDN, backend, Cloudflare, atau layanan eksternal yang dibutuhkan.
- Login merupakan formalitas sisi browser. Daftar email dan password dapat dilihat pada source code, sesuai keputusan menggunakan login sederhana.
- Riwayat nilai disimpan di localStorage pada browser/perangkat yang sama. Gunakan ekspor JSON untuk backup/pindah perangkat.

## Pengembangan lokal

Buka `index.html` melalui server statis lokal, misalnya:

```bash
python -m http.server 8000
```

Kemudian buka `http://localhost:8000` pada browser.
