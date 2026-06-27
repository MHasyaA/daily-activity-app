# Issue: Update Logika dan Tampilan Data Lembur (Overtime)

## Deskripsi Singkat
Terdapat beberapa kebutuhan terkait pembaruan fitur lembur (overtime) pada aplikasi aktivitas harian:
1. **Penyesuaian Logika Perhitungan Jam Lembur:** Perubahan perhitungan jam lembur khusus untuk pengerjaan di hari libur (weekend dan libur nasional).
2. **Pembaruan Tampilan Card Data Lembur:** Penambahan informasi estimasi jumlah hari lembur berdasarkan total jam lembur pada Card.
3. **Update Logika Jam Planning:** Jam planning diabaikan dalam total bulanan jika jam actual belum diisi (mencegah pengurangan total lembur prematur).
4. **Penambahan Card Overview Lembur:** Menampilkan leaderboard lembur tahunan di Admin Dashboard.

Dokumen ini ditulis secara *high-level* sebagai acuan implementasi oleh programmer atau model AI *coding assistant*.

---

## 1. Penyesuaian Logika Jam Lembur

### Kondisi Saat Ini (Current Behavior)
Perhitungan jam lembur saat ini menggunakan rumus dasar:
`Jam Lembur = Jam Actual - Jam Planning`

### Ekspektasi Perubahan (Expected Behavior)
Perlu ditambahkan logika khusus untuk menangani jam kerja di hari libur. Meskipun ada planning kerja di hari libur, waktu kerja aktual harus dihargai lebih karena masuk ke dalam lembur. 

**Aturan Baru:**
- **JIKA** hari kerja adalah **Sabtu** atau **Minggu** (Weekend), **ATAU** hari kerja biasa (Weekday) yang merupakan **Libur Nasional**.
- **MAKA** `Jam Actual` harus dikalikan 2 terlebih dahulu (`Jam Actual * 2`).
- **SEHINGGA** rumus perhitungan di kondisi tersebut menjadi:
  `Jam Lembur = (Jam Actual * 2) - Jam Planning`

### Task Checklist (Untuk Implementator)
- [ ] Buat fungsi utilitas (helper) untuk mengecek apakah suatu tanggal adalah *Weekend* (Sabtu/Minggu).
- [ ] Buat mekanisme pengecekan **Libur Nasional** (misal: mengambil dari tabel database master hari libur, API eksternal, atau array daftar tanggal libur terpusat).
- [ ] Modifikasi *business logic* (service / controller) yang menangani kalkulasi akumulasi jam lembur. Terapkan percabangan (IF) untuk mengalikan jam aktual dengan 2 jika kondisinya memenuhi.
- [ ] Pastikan perubahan ini tidak merusak perhitungan jam kerja dan lembur pada hari kerja normal (weekday yang bukan hari libur).

---

## 2. Pembaruan Tampilan Card Data Lembur

### Kondisi Saat Ini (Current Behavior)
Pada UI/Card Data Lembur, teks saat ini hanya menampilkan total jam.
Format: `+X.X jam` (contoh: `+0.0 jam`)

### Ekspektasi Perubahan (Expected Behavior)
Card data lembur perlu dimodifikasi agar turut menampilkan estimasi jumlah hari yang setara dengan total jam lembur tersebut, dengan asumsi standar **1 hari = 8 jam kerja**.

**Format Baru yang Diinginkan:**
`+X.X jam / Y day` (contoh: `+16.0 jam / 2 day`)

**Logika Perhitungan Y (day):**
`Y = Total Jam Lembur / 8`

### Task Checklist (Untuk Implementator)
- [ ] Temukan komponen UI (React/Next.js/HTML) yang melakukan render text `+X.X jam` pada *Card Data Lembur*.
- [ ] Modifikasi komponen tersebut: tambahkan logika pembagian `Total Jam Lembur / 8`.
- [ ] Format hasil pembagian agar sesuai (misalnya, tentukan apakah pecahan seperti `1.5 day` diperbolehkan, dan batasi angka desimal di belakang koma agar rapi).
- [ ] Sisipkan ke dalam string template atau teks render UI menjadi `<Total_Jam> jam / <Hasil_Bagi_Hari> day`.
- [ ] Lakukan verifikasi UI secara visual. Pastikan layout *Card* tidak rusak atau teksnya *overflow* saat nilai jam lembur atau harinya cukup panjang.

---

## 3. Update Logika Jam Planning pada Total Lembur Bulanan

### Kondisi Saat Ini (Current Behavior)
Jam planning selalu ditambahkan ke total bulanan, meskipun user merencanakan untuk 1-2 minggu ke depan. Hal ini menyebabkan total jam lembur (Actual - Plan) menjadi turun secara prematur.

### Ekspektasi Perubahan (Expected Behavior)
Jam planning hanya akan dihitung masuk ke total bulanan **jika** jam actual pada hari tersebut sudah terisi (minimal ada 1 log *Actual*).

### Task Checklist (Untuk Implementator)
- [ ] Modifikasi loop kalkulasi metrik bulanan (contoh di `app/(dashboard)/dashboard/page.tsx`).
- [ ] Tambahkan pengecekan kondisi `hasActualItems` (misal array `actualItems` memiliki `length > 0`).
- [ ] Pastikan `monthPlanHours` hanya ditambahkan dengan `totalPlanHours` jika pengecekan di atas bernilai `true` (tidak kosong).

---

## 4. Penambahan Card Overview: Jumlah Hari Lembur per Tahun

### Kondisi Saat Ini (Current Behavior)
Belum ada visualisasi total hari lembur akumulatif selama satu tahun per karyawan di dashboard Admin.

### Ekspektasi Perubahan (Expected Behavior)
Menampilkan daftar karyawan dengan jumlah hari lembur tertinggi dalam setahun (diurutkan menurun) pada halaman Admin/Manager. 

- **Visualisasi (Horizontal Bar):**
   - Menampilkan nama karyawan dan divisi.
   - Bar persentase berdasarkan nilai tertinggi (untuk visualisasi bar width).
   - Teks jumlah: `X Hari Y Jam` atau `X.X Hari`.
   - Data difilter hanya yang nilainya `> 1 hari` (atau `> 8 jam`).
   - **Penting:** Pastikan desain card *matching* dengan view utama (terutama card statistik yang ada di atasnya) sehingga tidak mengganggu estetika. Gunakan style yang konsisten seperti `bg-white p-6 rounded-2xl border border-slate-200 shadow-sm`.

### Task Checklist (Untuk Implementator)
- [ ] Buat API endpoint baru (misal `app/api/admin/yearly-overtime/route.ts`) untuk mengambil seluruh aktivitas tahun berjalan dan mengakumulasi selisih `Effective Actual Hours - Plan Hours`.
- [ ] Di sisi UI `app/(dashboard)/admin/overview/page.tsx`, buat komponen list bar chart horizontal.
- [ ] Hitung konversi hari dari total jam (standar: 1 hari kerja = 8 jam lembur).
- [ ] Filter hasil agar hanya memunculkan karyawan dengan total akumulasi lembur > 8 jam.

---

## Catatan Tambahan
- Usahakan untuk memisahkan fungsi perhitungan konversi *day* maupun pengecekan *weekend* di luar komponen UI (buat file utilitas) agar *clean code* dan mudah dites.
- Untuk pengecekan libur nasional, implementator dapat menggunakan asumsi sementara jika daftar/API libur nasional belum tersedia, namun harus diberikan komentar `// TODO:` agar mudah ditindaklanjuti.
- **Konfirmasi Asumsi Khusus Poin 3 & 4:**
  - Standar 1 hari kerja = 8 jam lembur.
  - Jam plan diabaikan dari total bulanan jika jam actual pada hari tersebut masih kosong.
