<template>
  <MainLayout>
    <div class="laporan">
      <div class="header">
        <h2>Laporan Penilaian Vendor</h2>
        <div class="filter-section">
          <div class="periode-selector">
            <label>Pilih Periode:</label>
            <input type="month" v-model="selectedPeriode">
          </div>
          <button @click="fetchLaporan">Tampilkan Laporan</button>
        </div>
      </div>

      <div v-if="detailPerhitungan" class="perhitungan-section">
        <!-- AHP Section -->
        <div class="calculation-box">
          <h3>Perhitungan Bobot Kriteria (AHP)</h3>
          <div class="step-box">
            <h4>Hasil Perhitungan Bobot</h4>
            <table class="result-table">
              <thead>
                <tr>
                  <th>Kriteria</th>
                  <th>Bobot</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in detailPerhitungan.ahp.bobotKriteria" :key="item.kriteria">
                  <td>{{ item.kriteria }}</td>
                  <td>{{ item.bobot.toFixed(4) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SAW Section -->
        <div class="calculation-box">
          <h3>Perhitungan SAW</h3>
          <div class="step-box">
            <h4>1. Matrix Awal</h4>
            <table class="matrix-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th v-for="nilai in detailPerhitungan.saw.matrixAwal[0].nilai" :key="nilai.kriteria">
                    {{ nilai.kriteria }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in detailPerhitungan.saw.matrixAwal" :key="row.vendor">
                  <td>{{ row.vendor }}</td>
                  <td v-for="nilai in row.nilai" :key="nilai.kriteria">
                    {{ nilai.nilai.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="step-box">
            <h4>2. Matrix Normalisasi</h4>
            <table class="matrix-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th v-for="nilai in detailPerhitungan.saw.matrixNormalisasi[0].nilai" :key="nilai.kriteria">
                    {{ nilai.kriteria }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in detailPerhitungan.saw.matrixNormalisasi" :key="row.vendor">
                  <td>{{ row.vendor }}</td>
                  <td v-for="nilai in row.nilai" :key="nilai.kriteria">
                    {{ nilai.nilai.toFixed(4) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="step-box">
            <h4>3. Hasil Akhir</h4>
            <table class="result-table">
              <thead>
                <tr>
                  <th>Ranking</th>
                  <th>Vendor</th>
                  <th>Nilai Akhir</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(hasil, index) in detailPerhitungan.hasilAkhir" :key="hasil.vendor">
                  <td>{{ hasil.ranking }}</td>
                  <td>{{ hasil.vendor }}</td>
                  <td>{{ hasil.nilaiAkhir.toFixed(4) }}</td>
                  <td>
                    <span :class="['status', {
                      'status-tinggi': index === 0,
                      'status-sedang': index === 1,
                      'status-rendah': index > 1
                    }]">
                      {{ hasil.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="action-buttons">
          <button @click="exportToExcel" class="excel-button">
            <i class="fas fa-file-excel"></i> Export Excel
          </button>
          <button @click="printLaporan" class="print-button">
            <i class="fas fa-print"></i> Cetak PDF
          </button>
        </div>
      </div>

      <div v-else-if="showLaporan && !detailPerhitungan" class="no-data">
        <p>Tidak ada data penilaian untuk periode yang dipilih</p>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import axios from 'axios'
import * as XLSX from 'xlsx'

const selectedPeriode = ref(new Date().toISOString().slice(0, 7))
const showLaporan = ref(false)
const detailPerhitungan = ref(null)

const fetchLaporan = async () => {
  try {
    // Ambil data kriteria untuk mendapatkan bobot
    const kriteriaResponse = await axios.get('/api/kriteria')
    const kriteriaData = kriteriaResponse.data

    // Ambil data perhitungan penilaian
    const penilaianResponse = await axios.get(`/api/penilaian/perhitungan/${selectedPeriode.value}`)
    const penilaianData = penilaianResponse.data

    // Update detailPerhitungan hanya dengan bobot kriteria
    detailPerhitungan.value = {
      ...penilaianData,
      ahp: {
        bobotKriteria: kriteriaData.map(k => ({
          kriteria: k.nama,
          bobot: k.bobot
        }))
      }
    }

    showLaporan.value = true
  } catch (error) {
    console.error('Error fetching laporan:', error)
    alert('Gagal mengambil data laporan')
  }
}

const exportToExcel = async () => {
  try {
    // Siapkan data untuk export
    const workbook = XLSX.utils.book_new()

    // 1. Sheet Bobot Kriteria
    const bobotKriteriaData = detailPerhitungan.value.ahp.bobotKriteria.map(item => ({
      'Kriteria': item.kriteria,
      'Bobot': item.bobot.toFixed(4)
    }))
    const bobotWS = XLSX.utils.json_to_sheet(bobotKriteriaData)
    XLSX.utils.book_append_sheet(workbook, bobotWS, 'Bobot Kriteria')

    // 2. Sheet Matrix Awal
    const matrixAwalData = detailPerhitungan.value.saw.matrixAwal.map(row => {
      const data = { 'Vendor': row.vendor }
      row.nilai.forEach(n => {
        data[n.kriteria] = n.nilai.toFixed(2)
      })
      return data
    })
    const matrixAwalWS = XLSX.utils.json_to_sheet(matrixAwalData)
    XLSX.utils.book_append_sheet(workbook, matrixAwalWS, 'Matrix Awal')

    // 3. Sheet Matrix Normalisasi
    const matrixNormalisasiData = detailPerhitungan.value.saw.matrixNormalisasi.map(row => {
      const data = { 'Vendor': row.vendor }
      row.nilai.forEach(n => {
        data[n.kriteria] = n.nilai.toFixed(4)
      })
      return data
    })
    const matrixNormalisasiWS = XLSX.utils.json_to_sheet(matrixNormalisasiData)
    XLSX.utils.book_append_sheet(workbook, matrixNormalisasiWS, 'Matrix Normalisasi')

    // 4. Sheet Hasil Akhir
    const hasilAkhirData = detailPerhitungan.value.hasilAkhir.map(row => ({
      'Ranking': row.ranking,
      'Vendor': row.vendor,
      'Nilai Akhir': row.nilaiAkhir.toFixed(4),
      'Status': row.status
    }))
    const hasilAkhirWS = XLSX.utils.json_to_sheet(hasilAkhirData)
    XLSX.utils.book_append_sheet(workbook, hasilAkhirWS, 'Hasil Akhir')

    // Export file
    XLSX.writeFile(workbook, `Laporan_Penilaian_${selectedPeriode.value}.xlsx`)
  } catch (error) {
    console.error('Error exporting to excel:', error)
    alert('Gagal mengexport data ke Excel')
  }
}

const printLaporan = () => {
  window.print()
}
</script>

<style scoped>
.laporan {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.filter-section {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
}

.periode-selector {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.periode-selector input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 0.5rem 1rem;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.laporan-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.laporan-header {
  text-align: center;
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.status-tinggi {
  background-color: #4caf50;
  color: white;
}

.status-sedang {
  background-color: #2196f3;
  color: white;
}

.status-rendah {
  background-color: #ff9800;
  color: white;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 20px;
}

.print-button,
.excel-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
  font-weight: 500;
}

.print-button {
  background-color: #4caf50;
}

.excel-button {
  background-color: #217346; /* Warna Microsoft Excel */
}

.print-button:hover,
.excel-button:hover {
  opacity: 0.9;
}

/* Sembunyikan tombol saat print */
@media print {
  .action-buttons {
    display: none;
  }
}

.no-data {
  text-align: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

@media print {
  .filter-section,
  .print-button,
  nav {
    display: none;
  }

  .laporan-content {
    box-shadow: none;
  }
}

.perhitungan-section {
  margin-top: 2rem;
}

.calculation-box {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.step-box {
  margin-bottom: 2rem;
}

.matrix-table, .result-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.matrix-table th,
.matrix-table td,
.result-table th,
.result-table td {
  padding: 0.75rem;
  border: 1px solid #ddd;
  text-align: center;
}

.matrix-table th,
.result-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.matrix-table td:first-child,
.result-table td:first-child {
  font-weight: 500;
}

h3 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

h4 {
  color: #34495e;
  margin-bottom: 1rem;
}

@media print {
  .filter-section,
  .action-buttons {
    display: none;
  }

  .calculation-box {
    box-shadow: none;
    break-inside: avoid;
  }

  .matrix-table,
  .result-table {
    font-size: 10pt;
  }
}
</style> 