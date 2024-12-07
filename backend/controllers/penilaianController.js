const Penilaian = require('../models/Penilaian');
const Vendor = require('../models/Vendor');
const Kriteria = require('../models/Kriteria');
const { normalizeMatrix, calculatePreference } = require('../utils/sawCalculation');

// @desc    Get all penilaian
// @route   GET /api/penilaian
const getPenilaian = async (req, res) => {
  try {
    const penilaian = await Penilaian.find()
      .populate('vendor')
      .populate('nilai.kriteria');
    res.json(penilaian);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create penilaian
// @route   POST /api/penilaian
const createPenilaian = async (req, res) => {
  try {
    const { periode, vendor, nilai } = req.body;

    const penilaian = await Penilaian.create({
      periode,
      vendor,
      nilai
    });

    // Hitung ulang ranking setelah menambah penilaian baru
    await calculateRanking(periode);

    res.status(201).json(penilaian);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Calculate ranking using SAW
// @route   POST /api/penilaian/calculate-ranking
const calculateRanking = async (periode) => {
  try {
    // Ambil semua penilaian untuk periode tertentu
    const penilaianList = await Penilaian.find({ periode })
      .populate('vendor')
      .populate('nilai.kriteria');

    // Ambil semua kriteria
    const kriteria = await Kriteria.find();

    // Buat decision matrix
    const matrix = penilaianList.map(p => 
      kriteria.map(k => {
        const nilai = p.nilai.find(n => n.kriteria.equals(k._id));
        return nilai ? nilai.nilai : 0;
      })
    );

    // Normalisasi matrix
    const normalizedMatrix = normalizeMatrix(matrix, kriteria);

    // Hitung nilai preferensi
    const weights = kriteria.map(k => k.bobot);
    const preferences = calculatePreference(normalizedMatrix, weights);

    // Update nilai akhir untuk setiap penilaian
    for (let i = 0; i < penilaianList.length; i++) {
      await Penilaian.findByIdAndUpdate(
        penilaianList[i]._id,
        { nilaiAkhir: preferences[i] }
      );
    }

    return preferences;
  } catch (error) {
    throw new Error(error.message);
  }
};

// @desc    Get ranking
// @route   GET /api/penilaian/ranking/:periode
const getRanking = async (req, res) => {
  try {
    const { periode } = req.params;

    const ranking = await Penilaian.find({ periode })
      .populate('vendor')
      .sort({ nilaiAkhir: -1 }); // Sort descending berdasarkan nilai akhir

    res.json(ranking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get report by period
// @route   GET /api/penilaian/report/:periode
const getReport = async (req, res) => {
  try {
    const { periode } = req.params;

    const report = await Penilaian.find({ periode })
      .populate('vendor')
      .populate('nilai.kriteria')
      .sort({ nilaiAkhir: -1 });

    const formattedReport = report.map((p, index) => ({
      rank: index + 1,
      vendorName: p.vendor.nama,
      nilaiPerKriteria: p.nilai.map(n => ({
        kriteria: n.kriteria.nama,
        nilai: n.nilai
      })),
      nilaiAkhir: p.nilaiAkhir
    }));

    res.json(formattedReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPenilaian,
  createPenilaian,
  calculateRanking,
  getRanking,
  getReport
}; 