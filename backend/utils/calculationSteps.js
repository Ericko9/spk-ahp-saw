const { normalizeMatrix, calculatePreference } = require('./sawCalculation');

// Fungsi untuk mendapatkan langkah perhitungan AHP
const getAHPSteps = (pairwiseMatrix, kriteria) => {
  const n = pairwiseMatrix.length;
  let steps = {
    matrixPerbandingan: pairwiseMatrix.map((row, i) => ({
      kriteria: kriteria[i].nama,
      nilai: row
    })),
    geometricMean: [],
    bobotKriteria: []
  };

  // Hitung geometric mean
  for (let i = 0; i < n; i++) {
    let product = 1;
    for (let j = 0; j < n; j++) {
      product *= pairwiseMatrix[i][j];
    }
    steps.geometricMean[i] = Math.pow(product, 1/n);
  }

  // Hitung bobot
  const sumGeometricMean = steps.geometricMean.reduce((a, b) => a + b, 0);
  steps.bobotKriteria = steps.geometricMean.map((gm, i) => ({
    kriteria: kriteria[i].nama,
    bobot: gm/sumGeometricMean
  }));

  return steps;
};

// Fungsi untuk mendapatkan langkah perhitungan SAW
const getSAWSteps = (matrix, weights, kriteria, vendors) => {
  const normalizedMatrix = normalizeMatrix(matrix, kriteria);
  const preferences = calculatePreference(normalizedMatrix, weights);

  return {
    matrixAwal: matrix.map((row, i) => ({
      vendor: vendors[i].nama,
      nilai: row.map((n, j) => ({
        kriteria: kriteria[j].nama,
        nilai: n
      }))
    })),
    matrixNormalisasi: normalizedMatrix.map((row, i) => ({
      vendor: vendors[i].nama,
      nilai: row.map((n, j) => ({
        kriteria: kriteria[j].nama,
        nilai: n
      }))
    })),
    bobotKriteria: kriteria.map(k => ({
      nama: k.nama,
      bobot: k.bobot
    })),
    nilaiAkhir: preferences.map((p, i) => ({
      vendor: vendors[i].nama,
      nilai: p
    }))
  };
};

// Tambahkan fungsi untuk mendapatkan detail perhitungan
const getDetailPerhitungan = (penilaian, kriteria) => {
  return {
    ahp: {
      matrixPerbandingan: kriteria.map(k1 => ({
        kriteria: k1.nama,
        nilai: kriteria.map(k2 => k1.bobot/k2.bobot)
      })),
      bobotAkhir: kriteria.map(k => ({
        nama: k.nama,
        bobot: k.bobot,
        tipe: k.tipe
      }))
    },
    saw: {
      nilaiAwal: penilaian.map(p => ({
        vendor: p.vendor.nama,
        nilai: p.nilai.map(n => ({
          kriteria: n.kriteria.nama,
          nilai: n.nilai
        }))
      })),
      nilaiNormalisasi: penilaian.map(p => ({
        vendor: p.vendor.nama,
        nilai: p.nilai.map(n => ({
          kriteria: n.kriteria.nama,
          nilai: n.nilai,
          normalisasi: n.normalisasi
        }))
      })),
      nilaiAkhir: penilaian.map(p => ({
        vendor: p.vendor.nama,
        total: p.nilaiAkhir
      }))
    }
  }
}

module.exports = {
  getAHPSteps,
  getSAWSteps,
  getDetailPerhitungan
};