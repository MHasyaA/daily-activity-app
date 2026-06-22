# Plan Optimasi Sistem Daily Activity App

Dokumen ini berisi high-level planning untuk pengembangan dan optimasi fitur pada Daily Activity App. Implementasi dari task ini disiapkan agar dapat dikerjakan dengan mudah oleh junior programmer atau asisten AI.

## 1. Fitur Employee (Karyawan)

### 1.1. Penyederhanaan Logika Lemburan (Overtime)
- **Tujuan**: Menghitung lemburan (overtime) dengan cara yang lebih mudah dipahami.
- **Logika Baru**: `Overtime = Total Jam Actual - Total Jam Planning`
- **Panduan Implementasi**:
  - Perbarui fungsi perhitungan overtime di Backend (API/Service).
  - Pastikan hasilnya tidak bernilai negatif (jika actual < planning, maka overtime = 0).
  - Update UI untuk mencerminkan nilai perhitungan overtime yang baru ini di seluruh komponen yang membutuhkan.

### 1.2. Dashboard Overview Tahunan (Yearly Overview)
- **Tujuan**: Memberikan ringkasan data aktivitas karyawan dalam satu tahun berjalan.
- **Panduan Implementasi**:
  - Buat endpoint API untuk mengakumulasi data aktivitas (total planning, actual, overtime) per tahun.
  - Buat komponen UI (Frontend) bernama `YearlyOverview`.
  - Letakkan komponen ini di urutan paling atas halaman dashboard employee, persis di atas komponen Overview Bulanan (Monthly).

### 1.3. Persentase Kategori Kegiatan (Pie Chart)
- **Tujuan**: Karyawan dapat melihat distribusi persentase dari kategori kegiatan yang mereka lakukan.
- **Panduan Implementasi**:
  - Hitung total durasi `actual` yang dihabiskan untuk masing-masing kategori kegiatan per bulan/tahun di sisi Backend.
  - Konversi total durasi tersebut menjadi nilai persentase (%).
  - Gunakan library charting (seperti Recharts atau Chart.js) untuk membuat komponen **Pie Chart**.
  - Tampilkan persentase dari setiap kategori secara visual menggunakan Pie Chart tersebut di dalam dashboard.

---

## 2. Fitur Admin & Management (Manager)

### 2.1. Fitur Notes (Catatan Manager)
- **Tujuan**: Manager dapat memberikan feedback atau catatan (notes) terhadap rencana (planning) atau aktual (actual) kegiatan karyawannya.
- **Panduan Implementasi**:
  - **Database Update**: Tambahkan field `notes` atau `managerNotes` (tipe teks) pada tabel/schema database yang menyimpan record aktivitas harian.
  - **Backend API**: Buat endpoint khusus agar role Manager/Admin dapat memperbarui (update) field `notes` tersebut.
  - **Frontend UI**: Tambahkan area text-input atau popup modal di view Manager untuk mengetik catatan. Pastikan data ini ditampilkan (read-only) di dashboard karyawan agar mereka bisa membaca feedback-nya.

### 2.2. Employee-Specific Dashboard (View Detail Team)
- **Tujuan**: Manager bisa melihat dashboard persis seperti yang dilihat karyawan tersebut secara spesifik dan terperinci.
- **Panduan Implementasi**:
  - Pada halaman **Team Dashboard**, buat setiap nama/akun karyawan menjadi tautan yang bisa diklik.
  - Saat diklik, arahkan Manager ke halaman dinamis baru (misal `/team/[employeeId]`).
  - Halaman ini akan me-reuse komponen Dashboard milik employee, tapi difilter hanya untuk `employeeId` terkait dan diatur dalam mode **Read-Only** (hanya bisa dilihat, tidak bisa diubah).
  - Pastikan fitur baru seperti **Overview Tahunan**, **Overtime baru**, dan **Pie Chart Persentase Kategori** juga bisa dilihat oleh Manager di halaman ini.

### 2.3. Pembaruan Fitur Export Data di Manager
- **Tujuan**: Manager dapat mengunduh seluruh history data secara komprehensif.
- **Panduan Implementasi**:
  - Update fungsi generate file export (Excel/CSV) yang sudah ada.
  - Pastikan format file hasil export mencakup semua kolom (fields) terbaru untuk tiap baris/tanggal:
    - Nama Employee
    - Tanggal
    - Rincian Kegiatan
    - Total Jam Planning
    - Total Jam Actual
    - Overtime (berdasarkan logika baru)
    - Kategori Kegiatan
    - **Notes/Catatan Manager**
  - Pastikan query database me-load semua relasi tabel yang dibutuhkan sebelum melakukan export.
