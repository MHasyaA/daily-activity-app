# 📊 Materi Pengenalan & High-Level Plan: Daily Activity App

Dokumen ini berisi dua bagian: **Materi Presentasi (Format PPT)** untuk pengenalan aplikasi kepada Manager baru, dan **High-Level Implementation Plan** yang dapat digunakan sebagai panduan bagi Junior Programmer atau model AI untuk mengimplementasikan dan mengembangkan sistem lebih lanjut.

---

## BAGIAN 1: Materi Presentasi (Outline PPT)

> **Tips Presentasi:** Gunakan desain yang clean, profesional, dengan warna dominan biru tua (`#1e3a5f`) dan aksen biru cerah (`#0ea5e9`). Sertakan screenshot aplikasi (mockup) di setiap slide jika memungkinkan.

### Slide 1: Judul
- **Teks Utama:** Pengenalan Daily Activity App
- **Sub-teks:** Panduan Penggunaan & Manajemen Aktivitas Karyawan
- **Presenter:** [Nama Anda / Admin]
- **Visual:** Logo Perusahaan & Ilustrasi dashboard modern.

### Slide 2: Latar Belakang & Tujuan
- **Masalah:** Sulitnya melacak aktivitas harian, WFH/WFO, dan membandingkan antara rencana kerja (planning) dengan realisasi (actual).
- **Solusi (Aplikasi Ini):** Platform terpusat untuk mencatat kehadiran, merencanakan tugas harian, dan melaporkan eksekusi tugas.
- **Tujuan Utama:** 
  1. Transparansi kinerja karyawan.
  2. Memudahkan pemantauan oleh Manager.
  3. Laporan yang terstruktur dan mudah diekspor.

### Slide 3: Informasi Akses & Akun
- **URL Aplikasi:** `[URL Web Aplikasi]`
- **Kredensial Login (Admin/Manager):**
  - **Username:** `admin@smartek.com`
  - **Password:** `123456`
- **Catatan:** Aplikasi ini menggunakan database terpusat (Neon DB PostgreSQL) sehingga data real-time. Keamanan akses dijamin dengan autentikasi berstandar.

### Slide 4: Peran & Hak Akses (Role-Based Access)
- **👤 Employee:** Hanya bisa melihat, mengisi, dan mengedit aktivitas diri sendiri.
- **👔 Manager (Anda):** Bisa melakukan semua fungsi Employee + **melihat aktivitas tim** + mengekspor laporan tim.
- **🛡️ Admin:** Memiliki semua akses Manager + **mengelola akun pengguna (tambah/nonaktifkan)**.

### Slide 5: Alur Kerja Utama (Workflow)
- **Visual:** Diagram alur sederhana.
- **Langkah 1 (Pagi):** Login & tentukan status hari ini (WFO / WFH / Libur).
- **Langkah 2 (Pagi):** Isi **Planning** (Rencana Kegiatan) beserta estimasi waktu & kategorinya.
- **Langkah 3 (Sore):** Isi **Actual** (Realisasi Kegiatan). Bisa menggunakan fitur "Salin dari Planning" untuk mempercepat proses.
- **Langkah 4:** Manager (Anda) meninjau data di Dashboard Admin.

### Slide 6: Demo - Dashboard Karyawan
- **Visual:** Mockup halaman `/dashboard`.
- **Poin Utama:**
  - Menampilkan ringkasan aktivitas dalam 1 minggu (Senin-Jumat).
  - Terdapat indikator status kehadiran (WFO/WFH) per hari.
  - Ringkasan total jam kerja (Planning vs Actual).

### Slide 7: Demo - Pengisian Aktivitas Harian
- **Visual:** Mockup halaman `/activity/[date]` dengan 2 kolom (Planning di kiri, Actual di kanan).
- **Poin Utama:**
  - Form pencatatan per rentang waktu (misal: 08:00 - 10:00).
  - Kategori tugas yang jelas (Meeting, Task, Review, Training, Lainnya).
  - Kolom catatan/kendala harian.

### Slide 8: 🌟 Fitur Khusus Manager & Admin
- **Visual:** Mockup halaman `/admin/dashboard`.
- **Poin Utama:**
  - **Pemantauan Real-time:** Lihat siapa yang sudah isi plan/actual hari ini.
  - **Tabel Tim:** Menampilkan seluruh anggota tim dan total jam kerja mereka.
  - **Filter Cerdas:** Filter berdasarkan tanggal, nama, divisi, atau status kehadiran.

### Slide 9: Laporan & Export Data
- **Visual:** Mockup halaman `/admin/report` dengan tombol Export.
- **Poin Utama:**
  - Kemudahan menarik rekap mingguan/bulanan.
  - Format export dalam bentuk CSV (bisa dibuka di Excel/Google Sheets).
  - PDF Export (dalam tahap pengembangan/fase selanjutnya).

### Slide 10: Tanya Jawab (Q&A)
- **Teks:** Terima Kasih. Ada pertanyaan?

---

## BAGIAN 2: High-Level Implementation Plan (Untuk Junior Programmer / AI)

Dokumen ini adalah cetak biru teknis. Anda dapat mendelegasikan tugas-tugas di bawah ini kepada Junior Programmer atau model AI (seperti GitHub Copilot / Cursor / Gemini) untuk dieksekusi secara bertahap (sprint).

### 🛠️ Tech Stack yang Digunakan
- **Frontend/Backend:** Next.js 14 (App Router)
- **Database:** Neon PostgreSQL (melalui Prisma ORM)
- **Styling:** Tailwind CSS + Shadcn UI
- **Autentikasi:** NextAuth.js (Credentials Provider)

---

### Fase 1: Setup Lingkungan & Database (Hari 1-2)
**Goal:** Aplikasi bisa di-run lokal dan terhubung ke Neon DB dengan skema yang benar.
1. **Inisialisasi Proyek:**
   - Setup Next.js, Tailwind, dan konfigurasi Shadcn UI.
   - Buat struktur folder standar (`app/`, `components/`, `lib/`, `prisma/`).
2. **Setup Prisma & Neon DB:**
   - Tarik URL Neon DB ke dalam file `.env`.
   - Implementasikan skema database sesuai `prisma/schema.prisma` (Tabel: `User`, `Activity`, `ActivityItem`, `Attachment`).
   - Jalankan `npx prisma db push` atau `prisma migrate dev`.
3. **Seeding Database:**
   - Buat script `prisma/seed.ts` untuk meng-generate user default:
     - Admin: `admin@smartek.com` (pass: `123456`)
     - Manager: `manager@smartek.com`
     - Karyawan: `karyawan@smartek.com`

### Fase 2: Autentikasi & Layouting (Hari 3-4)
**Goal:** User bisa login dan melihat layout dengan sidebar/navbar sesuai Role mereka.
1. **Sistem Login:**
   - Konfigurasi `NextAuth` di `app/api/auth/[...nextauth]/route.ts`.
   - Buat halaman `/login` dengan form email & password.
   - Implementasikan verifikasi password dengan `bcryptjs`.
2. **Proteksi Route (Middleware):**
   - Setup `middleware.ts` untuk me-redirect user yang belum login ke `/login`.
   - Proteksi route `/admin/*` agar hanya bisa diakses oleh role `MANAGER` dan `ADMIN`.
3. **Layout & Komponen Global:**
   - Buat `Sidebar.tsx` (navigasi responsif).
   - Tampilkan menu "Admin Dashboard" di sidebar HANYA jika `session.user.role === 'ADMIN' | 'MANAGER'`.

### Fase 3: Modul Karyawan - Dashboard & Aktivitas (Hari 5-8)
**Goal:** Karyawan bisa melihat jadwal mingguan dan mengisi Planning/Actual.
1. **API Routes:**
   - `GET /api/activity?date=...` -> Ambil data aktivitas di hari tersebut.
   - `POST/PATCH /api/activity` -> Simpan status WFO/WFH dan catatan harian.
   - `POST /api/activity/items` -> Tambah item baru (Planning atau Actual).
2. **Dashboard Mingguan (`/dashboard`):**
   - Tampilkan 5 kotak (Senin-Jumat) menggunakan komponen `WeekGrid.tsx`.
   - Tampilkan ringkasan jam kerja yang diambil dari database.
3. **Halaman Aktivitas Harian (`/activity/[date]`):**
   - Buat layout 2 kolom (Kiri: Planning, Kanan: Actual).
   - Buat komponen modal/dialog (`ActivityItemForm.tsx`) untuk menambah jam dan tugas.
   - **Fitur Kunci:** Tombol "Salin dari Planning" yang men-trigger pemanggilan API untuk menduplikasi seluruh item dari tipe `PLAN` ke tipe `ACTUAL`.

### Fase 4: Modul Manager & Admin (Hari 9-10)
**Goal:** Manager/Admin memiliki visibilitas atas tim dan dapat menarik laporan.
1. **Dashboard Admin (`/admin/dashboard`):**
   - Buat tabel (gunakan Shadcn Data Table) yang menampilkan list karyawan dan status hariannya.
   - Buat API `GET /api/admin/activities` untuk menarik data lintas karyawan.
2. **Laporan & Export (`/admin/report`):**
   - Tambahkan filter berdasarkan rentang waktu (Date Picker).
   - Implementasikan konversi data JSON ke format CSV untuk diunduh (bisa dikerjakan murni di Frontend atau via API `/api/export/csv`).

### Fase 5: QA, Bug Fixing, dan Deployment (Hari 11-12)
**Goal:** Aplikasi siap digunakan tanpa error mayor.
1. **Validasi:** Pastikan input jam logis (Jam Selesai > Jam Mulai).
2. **Testing:** Login menggunakan akun `admin@smartek.com` dan pastikan data tersimpan ke Neon DB dengan benar.
3. **Deployment:** Hubungkan repository ke Vercel, pastikan semua `Environment Variables` (`DATABASE_URL`, `NEXTAUTH_SECRET`, dll) sudah diset di Vercel Dashboard.

---
**Catatan untuk Manager/PIC:** Rencana di atas sangat terstruktur dan dipecah ke dalam unit-unit kecil. Anda cukup memberikan dokumen (Fase 1 hingga Fase 5) ini kepada Junior Programmer atau men-copy paste per fase ke dalam prompt model AI.
