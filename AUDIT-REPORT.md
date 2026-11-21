# Laporan Crosscheck — Patungan Bimbel SKD 2027.1.0

Tanggal pemeriksaan: 21 November 2026  
Target publikasi: GitHub Pages (static hosting)

## Ringkasan hasil

Pemeriksaan integritas data dan source code statis berhasil. Proyek dapat dipublikasikan sebagai website statis melalui GitHub Pages tanpa backend, Cloudflare, database server, atau proses build saat runtime.

## Hasil pemeriksaan

| Area | Hasil |
|---|---|
| Jumlah dan urutan soal | 110/110, ID 1–110 berurutan |
| Pembagian kategori | TWK 30, TIU 35, TKP 45 |
| Opsi jawaban | A–E lengkap pada seluruh soal |
| Kunci/pembahasan | 110/110 tersedia |
| Pembobotan TKP | 45/45 memiliki ranking A–E dan bobot 5–1 yang konsisten |
| Ilustrasi | 8 SVG tersedia, referensi soal valid |
| Tabel soal | 9 tabel, struktur kolom konsisten |
| Nilai maksimal | 550 |
| Passing grade | TWK 65, TIU 80, TKP 166 |
| Daftar login | 30 email unik, dinormalisasi ke huruf kecil |
| Password formalitas | Dikonfigurasi pada source `app.js` |
| Runtime data | `data.js` dan `answer-data.js` sinkron dengan JSON sumber |
| Aset lokal | Logo dan seluruh file utama tersedia |
| JavaScript syntax | `node --check` lulus untuk `app.js`, `data.js`, `answer-data.js` |
| Validasi otomatis | `python validate_project.py` lulus |

## Pemeriksaan konten khusus

- Soal nomor 97 dibandingkan kembali dengan teks sumber dan kalimat lengkap mengenai benturan dua pekerjaan dipulihkan.
- Soal figural 59–65 dibuat sebagai SVG/vektor, bukan screenshot yang ditempel sebagai soal.
- Soal numerik/tabel 49–58 diperiksa terhadap tabel dan langkah hitung pada materi pembahasan.
- Seluruh 45 ranking TKP diperiksa agar setiap pilihan A–E memiliki tepat satu bobot 5, 4, 3, 2, atau 1.
- Transkripsi dan pembahasan tetap mengikuti dokumen yang diberikan; label edisi website ditampilkan sebagai 2027 sesuai permintaan, sementara metadata sumber mencatat bahwa PDF asal berjudul 2026.

## Catatan batas pemeriksaan

Pemeriksaan ini mencakup integritas data, konsistensi runtime, sintaks JavaScript, konfigurasi login, struktur file, dan kecocokan materi yang telah diperiksa terhadap dokumen sumber. Uji end-to-end melalui browser produksi/GitHub Pages belum dapat dijalankan dari lingkungan kerja ini karena navigasi browser lokal diblokir oleh kebijakan runtime (`ERR_BLOCKED_BY_ADMINISTRATOR`). Karena itu, jangan menafsirkan hasil audit statis sebagai jaminan bahwa semua kombinasi perangkat/browser telah diuji. Lakukan smoke test setelah deployment: login, mulai tryout, pilih jawaban, reload/resume, selesaikan tryout, lihat hasil/pembahasan, buka riwayat, ekspor/impor JSON, dan logout.

## Catatan operasional

- Login email/password berada di sisi browser untuk formalitas, bukan sistem keamanan kuat. Source code publik dapat diperiksa.
- Data peserta disimpan pada `localStorage` perangkat/browser. Data tidak tersinkron otomatis lintas perangkat.
- Bila browser menghapus data situs, riwayat lokal dapat hilang. Peserta sebaiknya mengekspor backup secara berkala.
- Repository GitHub dapat bersifat Public atau Private sesuai kebutuhan, tetapi ingat bahwa login formalitas tidak menyembunyikan data statis dari orang yang memeriksa source code.
