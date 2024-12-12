const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/users', require('./routes/userRoutes'));
const vendorRoutes = require('./routes/vendorRoutes')
app.use('/api/vendors', vendorRoutes)
const kriteriaRoutes = require('./routes/kriteriaRoutes')
app.use('/api/kriteria', kriteriaRoutes)
const penilaianRoutes = require('./routes/penilaianRoutes')
app.use('/api/penilaian', penilaianRoutes)

// Routes akan ditambahkan di sini
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Menghitung nilai akhir vendor menggunakan metode SAW
const calculateTotal = (p) => {
  if (!p || !p.nilaiAkhir) return '-'
  return p.nilaiAkhir.toFixed(3)
}

// Menghitung bobot kriteria menggunakan metode AHP
const calculateAHP = async () => {
  try {
    const response = await axios.post('/api/kriteria/hitung-ahp', {
      pairwiseMatrix: pairwiseMatrix.value
    })
    await fetchKriteria()
    closeModal()
  } catch (error) {
    console.error('Error calculating AHP:', error)
  }
}
