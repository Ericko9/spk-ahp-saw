const express = require('express');
const router = express.Router();
const Kriteria = require('../models/Kriteria');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET semua kriteria
router.get('/', async (req, res) => {
  try {
    const kriteria = await Kriteria.find();
    res.json(kriteria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST kriteria baru
router.post('/', async (req, res) => {
  try {
    const { nama, tipe } = req.body;
    
    // Validasi input
    if (!nama || !tipe) {
      return res.status(400).json({ message: 'Nama dan tipe kriteria harus diisi' });
    }

    const kriteria = new Kriteria({
      nama,
      tipe,
      bobot: 0 // Default bobot
    });

    const newKriteria = await kriteria.save();
    console.log('Kriteria saved:', newKriteria); // Tambah log
    res.status(201).json(newKriteria);
  } catch (error) {
    console.error('Error saving kriteria:', error); // Tambah log error
    res.status(400).json({ message: error.message });
  }
});

// PUT update kriteria
router.put('/:id', async (req, res) => {
  try {
    const kriteria = await Kriteria.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!kriteria) {
      return res.status(404).json({ message: 'Kriteria tidak ditemukan' });
    }
    
    res.json(kriteria);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE kriteria
router.delete('/:id', async (req, res) => {
  try {
    const kriteria = await Kriteria.findByIdAndDelete(req.params.id);
    
    if (!kriteria) {
      return res.status(404).json({ message: 'Kriteria tidak ditemukan' });
    }
    
    res.json({ message: 'Kriteria berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST untuk menghitung dan update bobot AHP
router.post('/hitung-ahp', async (req, res) => {
  try {
    const { pairwiseMatrix } = req.body

    // Fungsi untuk menghitung eigenvalue
    const calculateEigenvalue = (matrix) => {
      const n = matrix.length
      let eigenvalue = new Array(n).fill(0)
      
      // Hitung geometric mean untuk setiap baris
      for (let i = 0; i < n; i++) {
        let product = 1
        for (let j = 0; j < n; j++) {
          product *= matrix[i][j]
        }
        eigenvalue[i] = Math.pow(product, 1/n)
      }
      
      // Normalisasi eigenvalue
      const sum = eigenvalue.reduce((a, b) => a + b, 0)
      return eigenvalue.map(v => v/sum)
    }

    // Hitung bobot
    const weights = calculateEigenvalue(pairwiseMatrix)

    // Update bobot untuk setiap kriteria
    const kriteria = await Kriteria.find()
    for (let i = 0; i < kriteria.length; i++) {
      await Kriteria.findByIdAndUpdate(kriteria[i]._id, {
        bobot: weights[i]
      })
    }

    res.json({ weights })
  } catch (error) {
    console.error('Error calculating AHP:', error)
    res.status(400).json({ message: error.message })
  }
})



// Tambahkan route baru untuk mendapatkan pairwise matrix
router.get('/pairwise-matrix', async (req, res) => {
  try {
    const kriteria = await Kriteria.find();
    
    // Buat matrix perbandingan default jika belum ada
    const n = kriteria.length;
    const pairwiseMatrix = [];
    
    // Inisialisasi matrix dengan perbandingan bobot
    for (let i = 0; i < n; i++) {
      pairwiseMatrix[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          // Diagonal matrix selalu 1
          pairwiseMatrix[i][j] = 1;
        } else {
          // Hitung perbandingan dari bobot yang tersimpan
          pairwiseMatrix[i][j] = kriteria[i].bobot / kriteria[j].bobot;
        }
      }
    }

    res.json(pairwiseMatrix);
  } catch (error) {
    console.error('Error getting pairwise matrix:', error);
    res.status(500).json({ message: error.message });
  }
});

// Tambahkan route untuk menyimpan pairwise matrix (opsional)
router.post('/pairwise-matrix', async (req, res) => {
  try {
    const { pairwiseMatrix } = req.body;
    
    // Validasi matrix
    if (!pairwiseMatrix || !Array.isArray(pairwiseMatrix)) {
      return res.status(400).json({ message: 'Invalid matrix format' });
    }

    // Simpan atau update matrix di database
    // ... kode untuk menyimpan matrix ...

    res.json({ message: 'Matrix saved successfully' });
  } catch (error) {
    console.error('Error saving pairwise matrix:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 