const Kriteria = require('../models/Kriteria');

// @desc    Get all kriteria
// @route   GET /api/kriteria
const getKriteria = async (req, res) => {
  try {
    const kriteria = await Kriteria.find();
    res.json(kriteria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create kriteria
// @route   POST /api/kriteria
const createKriteria = async (req, res) => {
  try {
    const { nama, tipe } = req.body;
    const kriteria = await Kriteria.create({
      nama,
      tipe,
      bobot: 0 // bobot awal 0, akan diupdate setelah perhitungan AHP
    });
    res.status(201).json(kriteria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update kriteria
// @route   PUT /api/kriteria/:id
const updateKriteria = async (req, res) => {
  try {
    const kriteria = await Kriteria.findById(req.params.id);
    if (!kriteria) {
      return res.status(404).json({ message: 'Kriteria tidak ditemukan' });
    }

    const updatedKriteria = await Kriteria.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedKriteria);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete kriteria
// @route   DELETE /api/kriteria/:id
const deleteKriteria = async (req, res) => {
  try {
    const kriteria = await Kriteria.findById(req.params.id);
    if (!kriteria) {
      return res.status(404).json({ message: 'Kriteria tidak ditemukan' });
    }

    await kriteria.remove();
    res.json({ message: 'Kriteria berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Calculate AHP weights
// @route   POST /api/kriteria/calculate-ahp
const calculateAHPWeights = async (req, res) => {
  try {
    const { pairwiseMatrix } = req.body;
    
    // Fungsi untuk menghitung eigenvalue
    const calculateEigenvalue = (matrix) => {
      const n = matrix.length;
      let rowProducts = new Array(n).fill(1);
      
      // Hitung product tiap baris
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          rowProducts[i] *= matrix[i][j];
        }
        rowProducts[i] = Math.pow(rowProducts[i], 1/n);
      }
      
      // Hitung total
      const total = rowProducts.reduce((a, b) => a + b, 0);
      
      // Normalisasi untuk mendapatkan bobot
      return rowProducts.map(value => value/total);
    };

    // Hitung bobot
    const weights = calculateEigenvalue(pairwiseMatrix);
    
    // Update bobot untuk setiap kriteria
    const kriteria = await Kriteria.find();
    for (let i = 0; i < kriteria.length; i++) {
      await Kriteria.findByIdAndUpdate(
        kriteria[i]._id,
        { bobot: weights[i] }
      );
    }

    res.json({ weights });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getKriteria,
  createKriteria,
  updateKriteria,
  deleteKriteria,
  calculateAHPWeights
}; 