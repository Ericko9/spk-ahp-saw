// Normalisasi matrix keputusan
const normalizeMatrix = (matrix, kriteria) => {
  const normalizedMatrix = [];
  const rows = matrix.length;
  const cols = matrix[0].length;

  for (let i = 0; i < rows; i++) {
    normalizedMatrix[i] = [];
    for (let j = 0; j < cols; j++) {
      if (kriteria[j].tipe === 'benefit') {
        // Untuk kriteria benefit
        const max = Math.max(...matrix.map(row => row[j]));
        normalizedMatrix[i][j] = matrix[i][j] / max;
      } else {
        // Untuk kriteria cost
        const min = Math.min(...matrix.map(row => row[j]));
        normalizedMatrix[i][j] = min / matrix[i][j];
      }
    }
  }
  return normalizedMatrix;
};

// Hitung nilai preferensi
const calculatePreference = (normalizedMatrix, weights) => {
  return normalizedMatrix.map(row => {
    return row.reduce((sum, value, index) => {
      return sum + (value * weights[index]);
    }, 0);
  });
};

module.exports = {
  normalizeMatrix,
  calculatePreference
}; 