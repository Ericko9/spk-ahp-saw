// Normalisasi bobot (w/Σw)
const normalizeWeights = (weights) => {
  const sumWeights = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => w / sumWeights);
};

// Hitung vektor S
const calculateVectorS = (matrix, weights, kriteria) => {
  return matrix.map(row => {
    return row.reduce((acc, value, index) => {
      // Pangkat positif untuk benefit, negatif untuk cost
      const power = kriteria[index].tipe === 'benefit' ? weights[index] : -weights[index];
      return acc * Math.pow(value, power);
    }, 1);
  });
};

// Hitung vektor V (preferensi relatif)
const calculateVectorV = (vectorS) => {
  const sumVectorS = vectorS.reduce((a, b) => a + b, 0);
  return vectorS.map(s => s / sumVectorS);
};

// Fungsi utama WP
const calculateWP = (matrix, weights, kriteria) => {
  const normalizedWeights = normalizeWeights(weights);
  const vectorS = calculateVectorS(matrix, normalizedWeights, kriteria);
  const vectorV = calculateVectorV(vectorS);
  return vectorV;
};

module.exports = {
  calculateWP,
  normalizeWeights,
  calculateVectorS,
  calculateVectorV
};