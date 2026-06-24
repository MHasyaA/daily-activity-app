# Planning Update Fitur Daily Activity App

Dokumen ini berisi high-level planning untuk implementasi fitur-fitur baru pada aplikasi Daily Activity. Dokumen ini ditujukan sebagai panduan (guideline) untuk eksekusi oleh junior programmer atau AI coding assistant.

## 1. Pemotongan Jam Istirahat Otomatis (12:00 - 13:00)

**Tujuan:** Memotong durasi jam kerja secara otomatis sebesar 1 jam apabila waktu kerja (atau *activity item*) melewati rentang jam 12:00 hingga 13:00.

**Detail Implementasi:**
- **Lokasi Kode:** Fungsi utility untuk menghitung durasi jam kerja, kemungkinan besar akan digunakan di halaman laporan (`app/(dashboard)/admin/report/page.tsx`) atau di API kalkulasi.
- **Logika Kalkulasi:**
  - Buat sebuah helper function `calculateDuration(startTime, endTime)`.
  - Ubah string waktu (misal "08:00") menjadi menit atau objek Date untuk mempermudah perhitungan selisih.
  - Cek irisan (overlap) waktu kerja dengan waktu istirahat (12:00 - 13:00).
  - Jika waktu kerja sepenuhnya mencakup 12:00 - 13:00, kurangi durasi total sebanyak 60 menit.
  - *Contoh Kasus:* 
    - `08:00 - 17:00` (9 jam), karena melewati 12:00-13:00, dikurangi 1 jam = 8 jam kerja.
    - `08:00 - 12:00` (4 jam), tidak melewati masa istirahat = 4 jam kerja.
    - `12:30 - 17:00` (4.5 jam), overlap dengan istirahat selama 30 menit (12:30-13:00), maka dikurangi 30 menit = 4 jam kerja.

## 2. Fitur Attachment (Gambar) pada Catatan Harian

**Tujuan:** Memungkinkan *employee* untuk mengunggah screenshot/foto pada Catatan Harian. Gambar akan dikompres secara otomatis di frontend, di-encode menjadi text (Base64), lalu disimpan ke Neon DB agar menghemat biaya dan *storage* tanpa menggunakan cloud bucket terpisah.

**Detail Implementasi:**
- **Update Schema Database (`prisma/schema.prisma`):**
  - Tambahkan *field* baru pada model `Activity` (atau tempat penyimpanan `note`).
  - Contoh: `attachmentBase64 String? @db.Text` (gunakan `@db.Text` agar dapat menyimpan string panjang di PostgreSQL).
  - Lakukan `npx prisma generate` dan sinkronisasi DB (misal: `npx prisma db push`).
- **Frontend Form (Employee Dashboard):**
  - Tambahkan input file `<input type="file" accept="image/*" />` pada form laporan harian.
  - **Auto Compress:** Gunakan library seperti `browser-image-compression` untuk mengecilkan ukuran gambar di sisi klien *sebelum* diubah ke format teks. Hal ini sangat krusial agar Neon DB tidak cepat penuh.
  - **Base64 Encode:** Ubah file hasil kompresi menjadi string Base64 menggunakan `FileReader`.
  - Kirim payload (JSON) yang mengandung `attachmentBase64` ke API endpoint (`POST /api/activity`).
- **Backend API Update (`app/api/activity/route.ts`):**
  - Modifikasi endpoint agar menerima dan menyimpan data `attachmentBase64` ke database melalui Prisma.
- **Dashboard Report (Manager/Admin View):**
  - Saat me-render detail laporan harian, periksa apakah ada `attachmentBase64`.
  - Jika ada, decode/tampilkan langsung dengan tag image: `<img src={activity.attachmentBase64} alt="Bukti Kerja" />`.

## 3. Penambahan Kategori Kegiatan Baru

**Tujuan:** Menambahkan 3 kategori spesifik untuk memudahkan *employee* dalam mengkategorikan kegiatan.

**Detail Implementasi:**
- **Update Enum Database (`prisma/schema.prisma`):**
  - Tambahkan nilai baru pada `enum Category`:
    ```prisma
    enum Category {
      MEETING
      TASK
      REVIEW
      TRAINING
      OTHER
      FINANCE    // Finance / Rekap Dana
      MARKETING  // Marketing / Edit Content
      LOGISTICS  // Logistik / Belanja Barang
    }
    ```
  - Lakukan `npx prisma generate` dan sinkronisasi DB (`npx prisma db push`).
- **Frontend Dropdown Update (`components/activity/ActivityItemForm.tsx` atau sejenisnya):**
  - Perbarui opsi dropdown/select agar memuat label yang sesuai untuk *employee*:
    - `FINANCE` akan dirender sebagai "Finance / Rekap Dana"
    - `MARKETING` akan dirender sebagai "Marketing / Edit Content"
    - `LOGISTICS` akan dirender sebagai "Logistik / Belanja Barang"

---
*Catatan Tambahan untuk Developer/AI:*
Untuk fitur attachment Base64, pastikan batas limit body parser di Next.js API route sudah disesuaikan jika gambar base64 ukurannya melebihi batas default (misal 1MB), atau buat kompresinya cukup agresif sehingga ukurannya di bawah 1MB.
