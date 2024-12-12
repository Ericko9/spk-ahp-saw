const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getAHPSteps, getSAWSteps } = require('../utils/calculationSteps');
const Penilaian = require('../models/Penilaian');
const Kriteria = require('../models/Kriteria');

router.use(protect);

// Fungsi normalisasi nilai berdasarkan tipe kriteria
const normalisasiNilai = (nilai, tipeKriteria, nilaiMax, nilaiMin) => {
  if (tipeKriteria === 'benefit') {
    return nilai / nilaiMax // Normalisasi benefit
  } else if (tipeKriteria === 'cost') {
    return nilaiMin / nilai // Normalisasi cost
  }
  return 0
}

// Fungsi untuk menghitung nilai akhir untuk satu vendor
const hitungNilaiAkhir = async (nilaiVendor, semuaNilai) => {
  try {
    const kriteria = await Kriteria.find()
    let nilaiAkhir = 0

    // Kelompokkan nilai berdasarkan kriteria
    const nilaiPerKriteria = {}
    kriteria.forEach(k => {
      const nilaiKriteria = semuaNilai.filter(n => 
        n.kriteria.toString() === k._id.toString()
      ).map(n => n.nilai)

      nilaiPerKriteria[k._id] = {
        max: Math.max(...nilaiKriteria),
        min: Math.min(...nilaiKriteria)
      }
    })

    // Hitung nilai akhir hanya untuk nilai vendor ini
    nilaiVendor.forEach(nilai => {
      const kriteriaItem = kriteria.find(k => 
        k._id.toString() === nilai.kriteria.toString()
      )
      if (kriteriaItem) {
        const nilaiNormal = normalisasiNilai(
          nilai.nilai,
          kriteriaItem.tipe,
          nilaiPerKriteria[kriteriaItem._id].max,
          nilaiPerKriteria[kriteriaItem._id].min
        )
        nilaiAkhir += (nilaiNormal * kriteriaItem.bobot)
      }
    })

    return nilaiAkhir
  } catch (error) {
    console.error('Error dalam perhitungan nilai akhir:', error)
    throw error
  }
}

// GET semua penilaian
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    let query = {}

    if (startDate && endDate) {
      query.periode = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }

    const penilaian = await Penilaian.find(query)
      .populate('vendor')
      .populate('nilai.kriteria')
      .sort({ nilaiAkhir: -1 })

    res.json(penilaian)
  } catch (error) {
    console.error('Error getting penilaian:', error)
    res.status(500).json({ message: error.message })
  }
})

// POST penilaian baru
router.post('/', async (req, res) => {
  try {
    const { vendor, nilai, periode } = req.body
    
    // Format nilai ke bentuk array
    const nilaiArray = Object.entries(nilai).map(([kriteria, nilai]) => ({
      kriteria,
      nilai: Number(nilai)
    }))

    // Dapatkan semua penilaian untuk periode yang sama
    const startOfMonth = new Date(new Date(periode).setDate(1))
    const endOfMonth = new Date(new Date(periode).setMonth(new Date(periode).getMonth() + 1, 0))
    
    const penilaianPeriode = await Penilaian.find({
      periode: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    })

    // Gabungkan semua nilai untuk normalisasi
    const semuaNilai = [...penilaianPeriode.flatMap(p => p.nilai), ...nilaiArray]

    // Hitung nilai akhir untuk vendor baru
    const nilaiAkhir = await hitungNilaiAkhir(nilaiArray, semuaNilai)

    const penilaian = new Penilaian({
      vendor,
      periode: new Date(periode),
      nilai: nilaiArray,
      nilaiAkhir
    })

    const newPenilaian = await penilaian.save()
    await newPenilaian.populate(['vendor', 'nilai.kriteria'])
    
    // Update nilai akhir untuk penilaian yang sudah ada
    await Promise.all(penilaianPeriode.map(async (p) => {
      const nilaiAkhirUpdate = await hitungNilaiAkhir(p.nilai, semuaNilai)
      await Penilaian.findByIdAndUpdate(p._id, { nilaiAkhir: nilaiAkhirUpdate })
    }))

    res.status(201).json(newPenilaian)
  } catch (error) {
    console.error('Error saving penilaian:', error)
    res.status(400).json({ message: error.message })
  }
})

// PUT update penilaian
router.put('/:id', async (req, res) => {
  try {
    const { vendor, nilai, periode } = req.body

    const nilaiArray = Object.entries(nilai).map(([kriteria, nilai]) => ({
      kriteria,
      nilai: Number(nilai)
    }))

    // Dapatkan semua penilaian untuk periode yang sama
    const startOfMonth = new Date(new Date(periode).setDate(1))
    const endOfMonth = new Date(new Date(periode).setMonth(new Date(periode).getMonth() + 1, 0))
    
    const penilaianPeriode = await Penilaian.find({
      periode: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    })

    // Gabungkan semua nilai untuk normalisasi
    const semuaNilai = [...penilaianPeriode.flatMap(p => p.nilai), ...nilaiArray]

    // Hitung nilai akhir untuk penilaian yang diupdate
    const nilaiAkhir = await hitungNilaiAkhir(nilaiArray, semuaNilai)

    const penilaian = await Penilaian.findByIdAndUpdate(
      req.params.id,
      {
        vendor,
        periode: new Date(periode),
        nilai: nilaiArray,
        nilaiAkhir
      },
      { new: true }
    ).populate(['vendor', 'nilai.kriteria'])

    if (!penilaian) {
      return res.status(404).json({ message: 'Penilaian tidak ditemukan' })
    }

    // Update nilai akhir untuk penilaian lain dalam periode yang sama
    await Promise.all(penilaianPeriode
      .filter(p => p._id.toString() !== req.params.id)
      .map(async (p) => {
        const nilaiAkhirUpdate = await hitungNilaiAkhir(p.nilai, semuaNilai)
        await Penilaian.findByIdAndUpdate(p._id, { nilaiAkhir: nilaiAkhirUpdate })
      })
    )

    res.json(penilaian)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// DELETE penilaian
router.delete('/:id', async (req, res) => {
  try {
    const penilaian = await Penilaian.findByIdAndDelete(req.params.id)
    
    if (!penilaian) {
      return res.status(404).json({ message: 'Penilaian tidak ditemukan' })
    }
    
    res.json({ message: 'Penilaian berhasil dihapus' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// GET historical data
router.get('/history', async (req, res) => {
  try {
    const { vendorId, startDate, endDate } = req.query
    
    const historicalData = await Penilaian.find({
      vendor: vendorId,
      periode: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ periode: 1 })
    
    res.json(historicalData)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

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

    if (penilaianList.length === 0) {
      return res.status(404).json({ message: 'Data tidak ditemukan untuk periode ini' });
    }

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

    // Buat matrix perbandingan AHP default jika tidak ada
    const defaultAHPMatrix = kriteria.map(() => 
      kriteria.map(() => 1)
    );

    // Hitung langkah-langkah
    const ahpSteps = getAHPSteps(defaultAHPMatrix, kriteria);
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

// Export to Excel endpoint
router.get('/export/:periode', async (req, res) => {
  try {
    const { periode } = req.params;
    const data = await exportToExcel(periode);
    res.json(data);
  } catch (error) {
    console.error('Error exporting to excel:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 