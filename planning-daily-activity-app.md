# Planning High-Level: Daily Activity Web App
**PT Internal Tool — Next.js + Neon PostgreSQL + Vercel**
**Versi Dokumen:** 1.0 | **Tanggal:** Juni 2026

---

## 1. Ringkasan Proyek

Aplikasi web internal untuk pencatatan aktivitas kerja harian karyawan. Setiap hari kerja, karyawan mengisi status kehadiran, rencana kegiatan (planning), dan realisasi kegiatan (actual). Manager dapat memantau dan menyetujui laporan tim.

**Target Pengguna:** < 50 karyawan internal PT
**Platform:** Web (desktop-first, mobile-friendly)
**Deployment:** Vercel (gratis, Hobby plan)
**Database:** Neon PostgreSQL (gratis, Free tier)

---

## 2. Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR, API Routes, deploy ke Vercel 1-klik |
| UI Library | Shadcn/UI + Tailwind CSS | Komponen siap pakai, mudah dikustomisasi |
| Auth | NextAuth.js (Credentials) | Login email+password, atau SSO Google |
| ORM | Prisma | Query database aman, schema jelas |
| Database | Neon PostgreSQL | Serverless PostgreSQL, gratis s.d. 0.5GB |
| Validasi | Zod | Validasi input di frontend dan backend |
| Tanggal | date-fns | Library tanggal ringan |
| Notifikasi | Resend (opsional) | Email reminder gratis 3000/bulan |

---

## 3. Struktur Halaman (Sitemap)

```
/ (redirect ke /login atau /dashboard)
├── /login                    → Halaman login
├── /dashboard                → Ringkasan mingguan user sendiri
├── /activity
│   ├── /activity/[date]      → Input/edit aktivitas per tanggal
│   └── /activity/history     → Riwayat semua aktivitas user
├── /admin (khusus Manager/Admin)
│   ├── /admin/dashboard      → Ringkasan semua karyawan
│   ├── /admin/team           → Daftar karyawan + status hari ini
│   └── /admin/report         → Export laporan (CSV/PDF)
└── /profile                  → Edit profil & ganti password
```

---

## 4. Fitur Per Halaman

### 4.1 Halaman Login (`/login`)
- Form email + password
- Tombol "Login dengan Google" (opsional)
- Redirect ke `/dashboard` setelah berhasil
- Tampilkan error jika gagal

---

### 4.2 Dashboard Karyawan (`/dashboard`)
- Tampilkan minggu berjalan (Senin s.d. Jumat)
- Setiap hari ditampilkan sebagai card/tile, berisi:
  - Tanggal + nama hari
  - Badge status: `WFO` (biru) / `WFH` (hijau) / `LIBUR` (abu)
  - Jumlah jam planning vs actual
  - Tombol "Isi" / "Edit"
- Navigasi minggu: tombol `< Minggu Lalu` dan `Minggu Ini >`
- Quick stats: total jam minggu ini, rata-rata jam/hari

---

### 4.3 Halaman Aktivitas Per Tanggal (`/activity/[date]`)

Ini adalah **halaman utama dan terpenting**. Layout 2 kolom: kiri = Planning, kanan = Actual.

#### Header Tanggal
- Tampilkan tanggal lengkap, misal: "Kamis, 05 Juni 2026"
- Tombol navigasi ← hari sebelumnya | hari berikutnya →
- Dropdown status kehadiran: **WFO / WFH / LIBUR**
  - Jika LIBUR dipilih, kolom planning & actual disembunyikan
- Tombol **Simpan** (sticky di bawah layar)

#### Kolom Planning
- Header: "🗓 Planning"
- Daftar slot waktu yang sudah diisi
- Tombol **+ Tambah Kegiatan**
- Form tambah/edit kegiatan:
  - Jam mulai (time picker atau input `HH:MM`)
  - Jam selesai (time picker atau input `HH:MM`)
  - Deskripsi kegiatan (textarea, max 200 karakter)
  - Kategori kegiatan (dropdown): Meeting / Pengerjaan Tugas / Review / Training / Lainnya
- Setiap item bisa diedit (klik item) atau dihapus (ikon tong sampah)
- Tampilkan total jam planning di bawah daftar

#### Kolom Actual
- Header: "✅ Actual"
- Struktur sama persis dengan Planning
- Tombol **Salin dari Planning** — prefill actual dengan data planning (hemat waktu)
- Tampilkan total jam actual di bawah daftar

#### Catatan Harian (opsional)
- Textarea satu baris di bawah kedua kolom
- Label: "Catatan / Kendala Hari Ini"
- Max 500 karakter

---

### 4.4 Riwayat Aktivitas (`/activity/history`)
- Tabel/list semua entri aktivitas user
- Filter: bulan, tahun, status kehadiran, kata kunci deskripsi
- Klik baris → buka halaman `/activity/[date]`
- Tombol Export CSV (data milik user sendiri)

---

### 4.5 Dashboard Admin (`/admin/dashboard`)
- Hak akses: role `ADMIN` atau `MANAGER`
- Statistik keseluruhan: total karyawan aktif, % yang sudah isi hari ini
- Tabel: daftar karyawan + status kehadiran hari ini + jam total
- Filter: tanggal, divisi, status

---

### 4.6 Laporan Admin (`/admin/report`)
- Pilih rentang tanggal + filter karyawan/divisi
- Preview tabel laporan
- Tombol Export CSV
- Tombol Export PDF (opsional, fase 2)

---

## 5. Database Schema (Prisma)

```prisma
model User {
  id          String      @id @default(cuid())
  name        String
  email       String      @unique
  password    String      // hashed dengan bcrypt
  role        Role        @default(EMPLOYEE)
  division    String?
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  activities  Activity[]
}

enum Role {
  EMPLOYEE
  MANAGER
  ADMIN
}

model Activity {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime @db.Date    // satu record per user per tanggal
  status    Status
  note      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User           @relation(fields: [userId], references: [id])
  planItems ActivityItem[] @relation("PlanItems")
  actualItems ActivityItem[] @relation("ActualItems")

  @@unique([userId, date])   // 1 user hanya boleh 1 record per hari
}

enum Status {
  WFO
  WFH
  LIBUR
}

model ActivityItem {
  id          String   @id @default(cuid())
  startTime   String   // format "HH:MM", misal "08:00"
  endTime     String   // format "HH:MM", misal "11:00"
  description String
  category    Category @default(OTHER)
  type        ItemType // PLAN atau ACTUAL
  activityId  String

  planActivity   Activity? @relation("PlanItems", fields: [activityId], references: [id])
  actualActivity Activity? @relation("ActualItems", fields: [activityId], references: [id])
}

enum Category {
  MEETING
  TASK
  REVIEW
  TRAINING
  OTHER
}

enum ItemType {
  PLAN
  ACTUAL
}
```

---

## 6. API Endpoints

Semua endpoint berada di dalam `app/api/` (Next.js App Router).

| Method | Endpoint | Fungsi | Auth |
|---|---|---|---|
| POST | `/api/auth/[...nextauth]` | Login/logout (NextAuth) | — |
| GET | `/api/activity?date=YYYY-MM-DD` | Ambil data aktivitas satu hari | User sendiri |
| POST | `/api/activity` | Buat aktivitas baru (header) | User sendiri |
| PATCH | `/api/activity/[id]` | Update status/catatan | User sendiri |
| DELETE | `/api/activity/[id]` | Hapus aktivitas (jarang dipakai) | User sendiri |
| GET | `/api/activity/items?activityId=xxx` | Ambil semua item (plan + actual) | User sendiri |
| POST | `/api/activity/items` | Tambah item baru | User sendiri |
| PATCH | `/api/activity/items/[id]` | Edit satu item | User sendiri |
| DELETE | `/api/activity/items/[id]` | Hapus satu item | User sendiri |
| GET | `/api/admin/activities` | Semua aktivitas semua user | Admin/Manager |
| GET | `/api/admin/users` | Daftar semua user | Admin |
| POST | `/api/admin/users` | Tambah user baru | Admin |
| GET | `/api/export/csv` | Export CSV dengan filter | Admin/Manager |

---

## 7. User Roles & Hak Akses

| Fitur | Employee | Manager | Admin |
|---|---|---|---|
| Isi/edit aktivitas sendiri | ✅ | ✅ | ✅ |
| Lihat riwayat sendiri | ✅ | ✅ | ✅ |
| Lihat aktivitas tim | ❌ | ✅ | ✅ |
| Export laporan semua | ❌ | ✅ | ✅ |
| Kelola user | ❌ | ❌ | ✅ |

---

## 8. UI/UX Guidelines

**Referensi visual:** Jira, Linear, Microsoft Teams — clean, profesional, data-dense tapi tidak ramai.

### Prinsip Desain
- **Warna utama:** Biru tua (`#1e3a5f`) + aksen biru cerah (`#0ea5e9`)
- **Font:** Geist Sans (sudah bundled di Next.js)
- **Background:** Abu sangat terang (`#f8fafc`), card putih dengan shadow tipis
- **Sidebar navigasi** di kiri (fixed), konten di kanan
- **Badge status:** WFO = biru, WFH = hijau toska, LIBUR = abu

### Komponen Utama (gunakan Shadcn/UI)
- `Card` — untuk container planning dan actual
- `Badge` — untuk status WFO/WFH/LIBUR dan kategori
- `Dialog` — untuk form tambah/edit item (bukan halaman baru)
- `Select` — untuk dropdown status dan kategori
- `Input` + `Textarea` — form input waktu dan deskripsi
- `Table` — untuk halaman riwayat dan admin
- `Skeleton` — loading state

### Perilaku UX Penting
- Simpan otomatis (auto-save) setiap 30 detik jika ada perubahan
- Konfirmasi sebelum hapus item
- Validasi: jam selesai harus lebih besar dari jam mulai
- Validasi: item tidak boleh overlap satu sama lain (opsional fase 2)
- Tampilkan "Belum ada aktivitas" jika hari masih kosong
- Navigasi keyboard: Tab antar field, Enter untuk simpan

---

## 9. Fase Pengembangan

### Fase 1 — MVP (Estimasi: 3–4 minggu)
**Tujuan:** Aplikasi bisa dipakai untuk input dan lihat data

- [ ] Setup project Next.js + Tailwind + Shadcn
- [ ] Setup Prisma + Neon database + schema awal
- [ ] Halaman Login dengan NextAuth (email/password)
- [ ] Halaman Dashboard — tampilkan minggu berjalan
- [ ] Halaman Aktivitas — input planning & actual dengan form
- [ ] API: CRUD aktivitas dan activity items
- [ ] Seed data: 2–3 akun dummy untuk testing
- [ ] Deploy ke Vercel

### Fase 2 — Fitur Tambahan (Estimasi: 2–3 minggu)
**Tujuan:** Fitur untuk Manager dan kenyamanan user

- [ ] Halaman Admin Dashboard — lihat semua karyawan
- [ ] Filter dan halaman Riwayat
- [ ] Export CSV
- [ ] Tombol "Salin dari Planning" ke Actual
- [ ] Role-based access (MANAGER bisa lihat tim)
- [ ] Notifikasi email reminder (misal: jam 16.00 jika belum isi actual)

### Fase 3 — Polish & Scale (Estimasi: 1–2 minggu)
**Tujuan:** Siap production, rapi, dan stabil

- [ ] Export PDF laporan
- [ ] Validasi overlap jam otomatis
- [ ] Auto-save / draft mode
- [ ] Halaman kelola user (admin tambah/nonaktifkan karyawan)
- [ ] Login Google SSO (opsional)
- [ ] Unit test untuk API utama

---

## 10. Struktur Folder Project

```
daily-activity-app/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx           ← sidebar + navbar
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── activity/
│   │   │   ├── [date]/
│   │   │   │   └── page.tsx     ← HALAMAN UTAMA
│   │   │   └── history/
│   │   │       └── page.tsx
│   │   └── admin/
│   │       ├── dashboard/
│   │       └── report/
│   └── api/
│       ├── auth/[...nextauth]/
│       │   └── route.ts
│       ├── activity/
│       │   ├── route.ts          ← GET, POST
│       │   ├── [id]/route.ts     ← PATCH, DELETE
│       │   └── items/
│       │       ├── route.ts
│       │       └── [id]/route.ts
│       ├── admin/
│       │   └── activities/route.ts
│       └── export/
│           └── csv/route.ts
├── components/
│   ├── ui/                      ← komponen Shadcn (auto-generated)
│   ├── activity/
│   │   ├── ActivityColumn.tsx   ← kolom planning atau actual
│   │   ├── ActivityItemCard.tsx ← satu baris kegiatan
│   │   └── ActivityItemForm.tsx ← form tambah/edit (dalam Dialog)
│   ├── dashboard/
│   │   └── WeekGrid.tsx         ← grid 5 hari
│   └── layout/
│       ├── Sidebar.tsx
│       └── Topbar.tsx
├── lib/
│   ├── prisma.ts                ← Prisma client singleton
│   ├── auth.ts                  ← NextAuth config
│   └── utils.ts                 ← helper (format jam, hitung durasi)
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                  ← data awal untuk testing
├── types/
│   └── index.ts                 ← TypeScript types/interfaces
├── .env.local                   ← DATABASE_URL, NEXTAUTH_SECRET
└── middleware.ts                ← proteksi route berdasarkan auth
```

---

## 11. Environment Variables yang Dibutuhkan

```bash
# Neon PostgreSQL
DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="random-string-panjang-min-32-karakter"
NEXTAUTH_URL="https://nama-app.vercel.app"

# (Opsional) Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# (Opsional) Resend untuk email
RESEND_API_KEY=""
```

---

## 12. Catatan untuk Developer

1. **Gunakan TypeScript** dari awal — lebih aman dan mengurangi bug
2. **Prisma schema adalah sumber kebenaran** — jangan edit database langsung
3. **Semua API harus cek session** sebelum proses request
4. **Format tanggal konsisten:** gunakan `YYYY-MM-DD` di URL dan database
5. **Format waktu:** simpan sebagai string `HH:MM` bukan DateTime (lebih simpel)
6. **Jangan hardcode userId** — selalu ambil dari session NextAuth
7. **Gunakan `@@unique([userId, date])`** di schema untuk cegah duplikasi
8. **Seed file wajib ada** agar developer lain bisa langsung testing

---

*Dokumen ini adalah panduan high-level. Detail implementasi (kode aktual, styling spesifik, library versi) bisa disesuaikan oleh developer saat eksekusi.*
