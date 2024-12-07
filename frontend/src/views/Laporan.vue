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

      <div v-if="showLaporan" class="laporan-content">
        <div class="laporan-header">
          <h3>Laporan Penilaian Vendor</h3>
          <p>Periode: {{ formatDate(selectedPeriode) }}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Ranking</th>
              <th>Vendor</th>
              <th>Nilai Akhir</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in penilaian" :key="item._id">
              <td>{{ index + 1 }}</td>
              <td>{{ item.vendor?.nama }}</td>
              <td>{{ item.nilaiAkhir.toFixed(3) }}</td>
              <td>
                <span :class="['status', {
                  'status-tinggi': index === 0,
                  'status-sedang': index === 1,
                  'status-rendah': index > 1
                }]">
                  {{ index === 0 ? 'Sangat Baik' : index === 1 ? 'Baik' : 'Cukup' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="action-buttons">
          <button @click="printLaporan" class="print-button">
            <i class="fas fa-print"></i> Cetak PDF
          </button>
          <button @click="exportToExcel" class="excel-button">
            <i class="fas fa-file-excel"></i> Export Excel
          </button>
        </div>
      </div>

      <div v-else-if="penilaian.length === 0 && showLaporan" class="no-data">
        <p>Tidak ada data penilaian untuk periode yang dipilih</p>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import axios from 'axios'
import * as XLSX from 'xlsx'

const selectedPeriode = ref(new Date().toISOString().slice(0, 7))
const penilaian = ref([])
const showLaporan = ref(false)

const fetchLaporan = async () => {
  try {
    // Parse periode yang dipilih
    const [year, month] = selectedPeriode.value.split('-')
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const response = await axios.get('/api/penilaian', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    })

    // Sort penilaian berdasarkan nilai akhir (descending)
    penilaian.value = response.data.sort((a, b) => b.nilaiAkhir - a.nilaiAkhir)
    showLaporan.value = true
  } catch (error) {
    console.error('Error fetching laporan:', error)
    alert('Gagal mengambil data laporan')
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long'
  })
}

const printLaporan = () => {
  window.print()
}

const exportToExcel = () => {
  try {
    // Siapkan data untuk excel
    const excelData = penilaian.value.map((item, index) => {
      const baseData = {
        'Ranking': index + 1,
        'Vendor': item.vendor?.nama || '',
      }

      // Tambahkan nilai per kriteria
      const nilaiKriteria = {}
      item.nilai.forEach(n => {
        nilaiKriteria[n.kriteria.nama] = n.nilai
      })

      return {
        ...baseData,
        ...nilaiKriteria,
        'Nilai Akhir': Number(item.nilaiAkhir.toFixed(3)),
        'Status': index === 0 ? 'Sangat Baik' : index === 1 ? 'Baik' : 'Cukup'
      }
    })

    // Buat workbook baru
    const wb = XLSX.utils.book_new()
    
    // Buat worksheet
    const ws = XLSX.utils.json_to_sheet(excelData)

    // Atur lebar kolom
    const colWidths = [
      { wch: 10 }, // Ranking
      { wch: 20 }, // Vendor
      ...penilaian.value[0]?.nilai.map(() => ({ wch: 15 })), // Kriteria
      { wch: 15 }, // Nilai Akhir
      { wch: 15 }  // Status
    ]
    ws['!cols'] = colWidths

    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Penilaian')

    // Generate nama file dengan periode
    const fileName = `Laporan_Penilaian_${selectedPeriode.value}.xlsx`

    // Simpan file
    XLSX.writeFile(wb, fileName)
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    alert('Gagal mengexport ke Excel: ' + error.message)
  }
}

onMounted(() => {
  // Reset tampilan laporan saat komponen dimuat
  showLaporan.value = false
})
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
</style> 