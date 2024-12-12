const Penilaian = require('../models/Penilaian');
const Vendor = require('../models/Vendor');
const Kriteria = require('../models/Kriteria');
const { normalizeMatrix, calculatePreference } = require('../utils/sawCalculation');
const { getAHPSteps, getSAWSteps } = require('../utils/calculationSteps');

// Fungsi untuk menghitung nilai akhir berdasarkan metode yang dipilih
const hitungNilaiAkhir = async (nilaiVendor, semuaNilai, metode = 'saw') => {
  try {
    const kriteria = await Kriteria.find()
    const weights = kriteria.map(k => k.bobot)
    
    // Siapkan matrix untuk perhitungan
    const matrix = kriteria.map(k => {
      const nilai = nilaiVendor.find(n => n.kriteria.toString() === k._id.toString())
      return nilai ? nilai.nilai : 0
    })

    let nilaiAkhir = 0

    if (metode === 'wp') {
      // Gunakan metode WP
      const vectorV = calculateWP([matrix], weights, kriteria)
      nilaiAkhir = vectorV[0]
    } else {
      // Gunakan metode SAW (default)
      const normalizedMatrix = normalizeMatrix([matrix], kriteria)
      const preferences = calculatePreference(normalizedMatrix, weights)
      nilaiAkhir = preferences[0]
    }

    return nilaiAkhir
  } catch (error) {
    console.error('Error dalam perhitungan nilai akhir:', error)
    throw error
  }
}

// @desc    Get all penilaian
// @route   GET /api/penilaian
const getPenilaian = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.periode = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const penilaian = await Penilaian.find(query)
      .populate('vendor')
      .populate('nilai.kriteria')
      .select('vendor nilai nilaiAkhir periode metode')
      .sort({ periode: -1, nilaiAkhir: -1 });

    res.json(penilaian);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create penilaian
// @route   POST /api/penilaian
const createPenilaian = async (req, res) => {
  try {
    const { periode, vendor, nilai, metode = 'saw' } = req.body;

    const nilaiArray = Object.entries(nilai).map(([kriteria, nilai]) => ({
      kriteria,
      nilai: Number(nilai)
    }))

    const nilaiAkhir = await hitungNilaiAkhir(nilaiArray, [], metode)

    const penilaian = await Penilaian.create({
      periode,
      vendor,
      nilai: nilaiArray,
      nilaiAkhir,
      metode
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

// @desc    Get metode yang tersedia
// @route   GET /api/penilaian/metode
const getMetode = async (req, res) => {
  try {
    const metode = [
      { 
        id: 'saw', 
        nama: 'Simple Additive Weighting (SAW)',
        deskripsi: 'Metode penjumlahan terbobot dari rating kinerja pada setiap alternatif pada semua kriteria'
      },
      { 
        id: 'wp', 
        nama: 'Weighted Product (WP)',
        deskripsi: 'Metode perkalian untuk menghubungkan rating atribut, dimana rating setiap atribut harus dipangkatkan dulu dengan bobot atribut yang bersangkutan'
      }
    ];
    res.json(metode);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Middleware validasi metode
const validateMetode = (req, res, next) => {
  const { metode } = req.body;
  const validMetode = ['saw', 'wp'];
  
  if (metode && !validMetode.includes(metode)) {
    return res.status(400).json({ 
      message: 'Metode tidak valid. Gunakan SAW atau WP' 
    });
  }
  
  next();
};

// Gunakan middleware di route yang relevan
router.post('/', validateMetode, async (req, res) => {
  // ... kode existing ...
});

router.put('/:id', validateMetode, async (req, res) => {
  // ... kode existing ...
});

// GET detail perhitungan
router.get('/perhitungan/:periode', async (req, res) => {
  try {
    const { periode } = req.params;
    const [year, month] = periode.split('-');
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Ambil data penilaian periode tersebut
    const penilaianList = await Penilaian.find({
      periode: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate(['vendor', 'nilai.kriteria'])
    .sort({ nilaiAkhir: -1 });

    // Ambil kriteria
    const kriteria = await Kriteria.find();
    
    // Siapkan data untuk perhitungan
    const vendors = penilaianList.map(p => p.vendor);
    const matrix = penilaianList.map(p => 
      kriteria.map(k => {
        const nilai = p.nilai.find(n => n.kriteria.equals(k._id));
        return nilai ? nilai.nilai : 0;
      })
    );
    const weights = kriteria.map(k => k.bobot);

    // Ambil matrix perbandingan AHP terakhir dari database atau gunakan default
    const lastAHPMatrix = [/* ambil dari database */] || kriteria.map(() => 
      kriteria.map(() => 1)
    );

    // Hitung langkah-langkah
    const ahpSteps = getAHPSteps(lastAHPMatrix, kriteria);
    const sawSteps = getSAWSteps(matrix, weights, kriteria, vendors);

    res.json({
      periode: {
        start: startDate,
        end: endDate
      },
      ahp: ahpSteps,
      saw: sawSteps,
      hasilAkhir: penilaianList.map((p, index) => ({
        ranking: index + 1,
        vendor: p.vendor.nama,
        nilaiAkhir: p.nilaiAkhir,
        status: index === 0 ? 'Sangat Baik' : index === 1 ? 'Baik' : 'Cukup'
      }))
    });
  } catch (error) {
    console.error('Error getting perhitungan:', error);
    res.status(500).json({ message: error.message });
  }
});

// Modifikasi fungsi export Excel
const exportToExcel = async (periode) => {
  const [year, month] = periode.split('-');
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const penilaianList = await Penilaian.find({
    periode: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate(['vendor', 'nilai.kriteria'])
  .sort({ nilaiAkhir: -1 });

  const kriteria = await Kriteria.find();

  // Sheet 1: Hasil Akhir
  const hasilAkhir = penilaianList.map((p, index) => ({
    'Ranking': index + 1,
    'Vendor': p.vendor.nama,
    'Nilai Akhir': p.nilaiAkhir.toFixed(4),
    'Status': index === 0 ? 'Sangat Baik' : index === 1 ? 'Baik' : 'Cukup'
  }));

  // Sheet 2: Detail Nilai Per Kriteria
  const detailNilai = penilaianList.map(p => {
    const base = {
      'Vendor': p.vendor.nama
    };
    kriteria.forEach(k => {
      const nilai = p.nilai.find(n => n.kriteria.equals(k._id));
      base[k.nama] = nilai ? nilai.nilai : '-';
    });
    return base;
  });

  // Sheet 3: Bobot Kriteria (Hasil AHP)
  const bobotKriteria = kriteria.map(k => ({
    'Kriteria': k.nama,
    'Tipe': k.tipe,
    'Bobot': k.bobot.toFixed(4)
  }));

  return {
    'Hasil Akhir': hasilAkhir,
    'Detail Nilai': detailNilai,
    'Bobot Kriteria': bobotKriteria
  };
};

module.exports = {
  getPenilaian,
  createPenilaian,
  calculateRanking,
  getRanking,
  getReport,
  getMetode,
  exportToExcel
}; 