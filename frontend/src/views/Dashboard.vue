<template>
  <MainLayout>
    <div class="dashboard">
      <div class="header">
        <h2>Dashboard</h2>
        <div class="periode-selector">
          <label>Periode:</label>
          <input type="month" v-model="selectedPeriode">
        </div>
      </div>

      <div class="stats-cards">
        <div class="card">
          <div class="card-content">
            <h3>Total Vendor</h3>
            <p class="number">{{ totalVendor }}</p>
          </div>
          <i class="fas fa-building icon"></i>
        </div>

        <div class="card">
          <div class="card-content">
            <h3>Total Penilaian</h3>
            <p class="number">{{ totalPenilaian }}</p>
          </div>
          <i class="fas fa-clipboard-list icon"></i>
        </div>

        <div class="card">
          <div class="card-content">
            <h3>Vendor Terbaik</h3>
            <p class="text">{{ vendorTerbaik }}</p>
          </div>
          <i class="fas fa-trophy icon"></i>
        </div>

        <div class="card">
          <div class="card-content">
            <h3>Rata-rata Nilai</h3>
            <p class="number">{{ rataRataNilai }}</p>
          </div>
          <i class="fas fa-chart-line icon"></i>
        </div>
      </div>

      <div class="chart-container">
        <canvas id="performanceChart"></canvas>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import axios from 'axios'
import Chart from 'chart.js/auto'

const vendors = ref([])
const penilaian = ref([])
const kriteria = ref([])
const selectedPeriode = ref(new Date().toISOString().slice(0, 7))
let chart = null

const fetchData = async () => {
  try {
    // Parse periode yang dipilih
    const [year, month] = selectedPeriode.value.split('-')
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const [vendorsRes, penilaianRes, kriteriaRes] = await Promise.all([
      axios.get('/api/vendors'),
      axios.get('/api/penilaian', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }),
      axios.get('/api/kriteria')
    ])

    vendors.value = vendorsRes.data
    penilaian.value = penilaianRes.data.sort((a, b) => b.nilaiAkhir - a.nilaiAkhir)
    kriteria.value = kriteriaRes.data

    updateChart()
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

const updateChart = () => {
  if (chart) {
    chart.destroy()
  }

  const ctx = document.getElementById('performanceChart')
  if (!ctx || penilaian.value.length === 0) return

  const labels = penilaian.value.map(p => p.vendor?.nama || 'Unknown')
  const nilaiAkhir = penilaian.value.map(p => p.nilaiAkhir)
  const nilaiKriteria = kriteria.value.map(k => ({
    label: k.nama,
    data: penilaian.value.map(p => {
      const nilai = p.nilai.find(n => n.kriteria._id === k._id)
      return nilai ? nilai.nilai : 0
    })
  }))

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Nilai Akhir',
          data: nilaiAkhir,
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          type: 'line',
          yAxisID: 'y1'
        },
        ...nilaiKriteria.map((k, index) => ({
          label: k.label,
          data: k.data,
          backgroundColor: `hsla(${index * 360 / nilaiKriteria.length}, 70%, 50%, 0.6)`,
          borderColor: `hsla(${index * 360 / nilaiKriteria.length}, 70%, 50%, 1)`,
          borderWidth: 1,
          yAxisID: 'y'
        }))
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          position: 'left',
          title: {
            display: true,
            text: 'Nilai Kriteria'
          },
          max: 5
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          title: {
            display: true,
            text: 'Nilai Akhir'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Performa Vendor'
        }
      }
    }
  })
}

// Statistik untuk cards
const totalVendor = computed(() => vendors.value.length)
const totalPenilaian = computed(() => penilaian.value.length)
const vendorTerbaik = computed(() => {
  if (penilaian.value.length === 0) return '-'
  return penilaian.value[0]?.vendor?.nama || '-'
})
const rataRataNilai = computed(() => {
  if (penilaian.value.length === 0) return 0
  const total = penilaian.value.reduce((sum, p) => sum + p.nilaiAkhir, 0)
  return (total / penilaian.value.length).toFixed(2)
})

// Watch periode changes
watch(selectedPeriode, () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.periode-selector {
  display: flex;
  gap: 10px;
  align-items: center;
}

.periode-selector input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content h3 {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.number {
  font-size: 1.8rem;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

.text {
  font-size: 1.2rem;
  color: #2c3e50;
  margin: 0;
}

.icon {
  font-size: 2rem;
  opacity: 0.2;
}

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 20px;
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style> 