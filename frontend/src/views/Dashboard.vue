<template>
  <MainLayout>
    <div class="dashboard">
      <div class="header">
        <div class="title-section">
          <h2>Dashboard Overview</h2>
          <p>Ringkasan performa vendor periode {{ formatPeriode(selectedPeriode) }}</p>
        </div>
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
          <i class="fas fa-clipboard-check icon"></i>
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

      <div class="charts-container">
        <div class="chart-card">
          <div class="chart-header">
            <h3>Performa Vendor Bulan Ini</h3>
            <div class="chart-actions">
              <select v-model="selectedChartType">
                <option value="bar">Bar Chart</option>
                <option value="radar">Radar Chart</option>
              </select>
            </div>
          </div>
          <canvas id="performanceChart"></canvas>
        </div>

        <div class="chart-card">
          <div class="chart-header">
            <h3>Trend Performa 6 Bulan Terakhir</h3>
          </div>
          <canvas id="trendChart"></canvas>
        </div>
      </div>

      <div class="ranking-table">
        <h3>Top 5 Vendor</h3>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Vendor</th>
              <th>Nilai Akhir</th>
              <th>Status</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(vendor, index) in topVendors" :key="vendor._id">
              <td class="rank">{{ index + 1 }}</td>
              <td>{{ vendor.vendor?.nama }}</td>
              <td>{{ vendor.nilaiAkhir.toFixed(2) }}</td>
              <td>
                <span :class="getStatusClass(index)">
                  {{ getStatusText(index) }}
                </span>
              </td>
              <td>
                <i :class="getTrendIcon(vendor.trend)" :style="getTrendColor(vendor.trend)"></i>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import axios from 'axios'
import Chart from 'chart.js/auto'

// State
const selectedPeriode = ref(new Date().toISOString().slice(0, 7))
const selectedChartType = ref('bar')
const vendors = ref([])
const penilaian = ref([])
const kriteria = ref([])
const chart = ref(null)
const trendChart = ref(null)

// Computed
const topVendors = computed(() => {
  const [year, month] = selectedPeriode.value.split('-')
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const filteredPenilaian = penilaian.value.filter(p => {
    const penilaianDate = new Date(p.periode)
    return penilaianDate >= startDate && penilaianDate <= endDate
  })

  return filteredPenilaian
    .sort((a, b) => b.nilaiAkhir - a.nilaiAkhir)
    .slice(0, 5)
    .map(p => ({
      ...p,
      trend: calculateTrend(p.vendor?._id)
    }))
})

const totalVendor = computed(() => vendors.value.length)

const totalPenilaian = computed(() => {
  const [year, month] = selectedPeriode.value.split('-')
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  
  return penilaian.value.filter(p => {
    const penilaianDate = new Date(p.periode)
    return penilaianDate >= startDate && penilaianDate <= endDate
  }).length
})

const vendorTerbaik = computed(() => {
  const currentPenilaian = penilaian.value.filter(p => {
    const [year, month] = selectedPeriode.value.split('-')
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    const penilaianDate = new Date(p.periode)
    return penilaianDate >= startDate && penilaianDate <= endDate
  })
  
  if (currentPenilaian.length === 0) return '-'
  
  const best = currentPenilaian.reduce((prev, current) => 
    prev.nilaiAkhir > current.nilaiAkhir ? prev : current
  )
  
  return best.vendor?.nama || '-'
})

const rataRataNilai = computed(() => {
  const currentPenilaian = penilaian.value.filter(p => {
    const [year, month] = selectedPeriode.value.split('-')
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    const penilaianDate = new Date(p.periode)
    return penilaianDate >= startDate && penilaianDate <= endDate
  })
  
  if (currentPenilaian.length === 0) return '0.00'
  
  const total = currentPenilaian.reduce((sum, p) => sum + p.nilaiAkhir, 0)
  return (total / currentPenilaian.length).toFixed(2)
})

// Methods
const formatPeriode = (date) => {
  const [year, month] = date.split('-')
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                     'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return `${monthNames[parseInt(month) - 1]} ${year}`
}

const getStatusClass = (index) => {
  const classes = ['status']
  if (index === 0) classes.push('status-excellent')
  else if (index === 1) classes.push('status-good')
  else classes.push('status-average')
  return classes
}

const getStatusText = (index) => {
  if (index === 0) return 'Excellent'
  if (index === 1) return 'Good'
  return 'Average'
}

const getTrendIcon = (trend) => {
  if (trend > 0) return 'fas fa-arrow-up'
  if (trend < 0) return 'fas fa-arrow-down'
  return 'fas fa-minus'
}

const getTrendColor = (trend) => {
  if (trend > 0) return 'color: #2ecc71'
  if (trend < 0) return 'color: #e74c3c'
  return 'color: #95a5a6'
}

const getHistoricalData = async (vendorId) => {
  try {
    const currentDate = new Date(selectedPeriode.value)
    const startDate = new Date(currentDate)
    startDate.setMonth(startDate.getMonth() - 5) // 6 bulan terakhir termasuk bulan ini

    const response = await axios.get('/api/penilaian/history', {
      params: {
        vendorId,
        startDate: startDate.toISOString(),
        endDate: currentDate.toISOString()
      }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching historical data:', error)
    return []
  }
}

const calculateTrend = (vendorId) => {
  // Filter penilaian untuk vendor tertentu
  const vendorPenilaian = penilaian.value.filter(p => p.vendor?._id === vendorId)
  
  if (vendorPenilaian.length < 2) return 0

  // Urutkan berdasarkan periode
  vendorPenilaian.sort((a, b) => new Date(a.periode) - new Date(b.periode))
  
  // Ambil 2 penilaian terakhir
  const lastTwo = vendorPenilaian.slice(-2)
  const previousScore = lastTwo[0].nilaiAkhir
  const currentScore = lastTwo[1].nilaiAkhir
  
  if (currentScore > previousScore) return 1
  if (currentScore < previousScore) return -1
  return 0
}

// Chart functions
const updateChart = () => {
  if (chart.value) {
    chart.value.destroy()
  }

  const ctx = document.getElementById('performanceChart')
  if (!ctx) return

  // Filter penilaian berdasarkan periode yang dipilih
  const [year, month] = selectedPeriode.value.split('-')
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  
  const filteredPenilaian = penilaian.value.filter(p => {
    const penilaianDate = new Date(p.periode)
    return penilaianDate >= startDate && penilaianDate <= endDate
  })

  const labels = filteredPenilaian.map(p => p.vendor?.nama || 'Unknown')
  const nilaiAkhir = filteredPenilaian.map(p => p.nilaiAkhir)
  const nilaiKriteria = kriteria.value.map(k => ({
    label: k.nama,
    data: filteredPenilaian.map(p => {
      const nilai = p.nilai.find(n => n.kriteria._id === k._id)
      return nilai ? nilai.nilai : 0
    })
  }))

  const chartConfig = {
    type: selectedChartType.value,
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Nilai Akhir',
          data: nilaiAkhir,
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
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
  }

  chart.value = new Chart(ctx, chartConfig)
}

const updateTrendChart = async () => {
  if (trendChart.value) {
    trendChart.value.destroy()
  }

  const ctx = document.getElementById('trendChart')
  if (!ctx) return

  // Ambil data 6 bulan terakhir untuk top 3 vendor
  const months = []
  const datasets = []
  
  // Generate labels untuk 6 bulan terakhir
  for (let i = 5; i >= 0; i--) {
    const date = new Date(selectedPeriode.value)
    date.setMonth(date.getMonth() - i)
    months.push(date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }))
  }

  // Update cara mengambil top 3 vendor
  const topThreeVendors = topVendors.value.slice(0, 3)
  
  for (const [index, vendor] of topThreeVendors.entries()) {
    const historicalData = await getHistoricalData(vendor.vendor?._id)
    const vendorName = vendor.vendor?.nama || 'Unknown'

    const dataPoints = months.map(month => {
      const matchingData = historicalData.find(data => {
        const dataMonth = new Date(data.periode).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
        return dataMonth === month
      })
      return matchingData ? matchingData.nilaiAkhir : null
    })

    datasets.push({
      label: vendorName,
      data: dataPoints,
      borderColor: `hsla(${index * 120}, 70%, 50%, 1)`,
      tension: 0.4,
      fill: false
    })
  }

  trendChart.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: datasets
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              // Tampilkan nilai asli dengan 3 desimal
              return `${context.dataset.label}: ${context.raw?.toFixed(3) || 'N/A'}`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 1,
          title: {
            display: true,
            text: 'Nilai Performa'
          },
          ticks: {
            callback: function(value) {
              // Tampilkan nilai asli dengan 2 desimal
              return value.toFixed(2)
            }
          }
        }
      }
    }
  })
}

// Lifecycle hooks
onMounted(() => {
  fetchData()
})

watch(selectedPeriode, () => {
  fetchData()
})

watch(selectedChartType, () => {
  updateChart()
})

// Data fetching
const fetchData = async () => {
  try {
    const [year, month] = selectedPeriode.value.split('-')
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    // Ambil data 3 bulan terakhir untuk perhitungan trend
    const threeMonthsAgo = new Date(startDate)
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2)

    const [vendorsRes, penilaianRes, kriteriaRes] = await Promise.all([
      axios.get('/api/vendors'),
      axios.get('/api/penilaian', {
        params: {
          startDate: threeMonthsAgo.toISOString(),
          endDate: endDate.toISOString()
        }
      }),
      axios.get('/api/kriteria')
    ])

    vendors.value = vendorsRes.data
    penilaian.value = penilaianRes.data
    kriteria.value = kriteriaRes.data

    updateChart()
    updateTrendChart()
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.title-section h2 {
  margin: 0;
  color: #2c3e50;
}

.title-section p {
  margin: 5px 0 0;
  color: #7f8c8d;
}

.periode-selector {
  display: flex;
  gap: 10px;
  align-items: center;
}

.periode-selector input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
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
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
}

.card-content h3 {
  color: #7f8c8d;
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

.charts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0;
  color: #2c3e50;
}

.chart-actions select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
}

.ranking-table {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.ranking-table h3 {
  margin: 0 0 20px;
  color: #2c3e50;
}

.ranking-table table {
  width: 100%;
  border-collapse: collapse;
}

.ranking-table th,
.ranking-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.rank {
  font-weight: bold;
  color: #2c3e50;
}

.status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-excellent {
  background: #2ecc71;
  color: white;
}

.status-good {
  background: #3498db;
  color: white;
}

.status-average {
  background: #f1c40f;
  color: white;
}

@media (max-width: 768px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}
</style> 