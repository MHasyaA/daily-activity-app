# Issue: Update Logika dan Tampilan Data Lembur (Overtime)

## Deskripsi Singkat
Terdapat dua kebutuhan utama terkait pembaruan fitur lembur (overtime) pada aplikasi aktivitas harian:
1. **Penyesuaian Logika Perhitungan Jam Lembur:** Perubahan perhitungan jam lembur khusus untuk pengerjaan di hari libur (weekend dan libur nasional).
2. **Pembaruan Tampilan Card Data Lembur:** Penambahan informasi estimasi jumlah hari lembur berdasarkan total jam lembur pada Card.

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

## Catatan Tambahan
- Usahakan untuk memisahkan fungsi perhitungan konversi *day* maupun pengecekan *weekend* di luar komponen UI (buat file utilitas) agar *clean code* dan mudah dites.
- Untuk pengecekan libur nasional, implementator dapat menggunakan asumsi sementara jika daftar/API libur nasional belum tersedia, namun harus diberikan komentar `// TODO:` agar mudah ditindaklanjuti.
