# Sistem Penilaian Vendor dengan Metode AHP-SAW

Sistem informasi untuk mengelola dan menilai vendor menggunakan kombinasi metode AHP (Analytical Hierarchy Process) dan SAW (Simple Additive Weighting).

## Fitur Utama

- Manajemen Data Vendor
- Manajemen Kriteria Penilaian
- Perhitungan Bobot dengan AHP
- Penilaian Vendor dengan SAW
- Laporan Penilaian (PDF & Excel)
- Dashboard Analitik

## Tech Stack

### Frontend
- Vue.js 3
- Vite
- Chart.js
- PrimeVue
- Axios

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication

## Cara Instalasi

1. Clone repository
git clone https://github.com/Ericko9/spk-ahp-saw.git

2. Install dependencies Frontend
cd spk-ahp-saw
cd frontend
npm install

3. Install dependencies Backend
cd backend
npm install

4. Setup environment variables
env
Backend (.env)
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
Frontend (.env)
VITE_API_URL=http://localhost:5000

5. Jalankan aplikasi
Terminal 1 - Frontend
cd frontend
npm run dev
Terminal 2 - Backend
cd backend
npm run dev


## Pengembang

- [Ericko](https://github.com/Ericko9)

## Lisensi

MIT License