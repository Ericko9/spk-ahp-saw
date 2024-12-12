<template>
  <MainLayout>
    <div class="assessment">
      <div class="header">
        <div class="title-section">
          <h2>Penilaian Vendor</h2>
          <p>Kelola penilaian kinerja vendor</p>
        </div>
        <div class="button-group-header">
          <div class="periode-selector">
            <label>
              <i class="fas fa-calendar"></i>
              Periode
            </label>
            <input 
              type="month" 
              v-model="selectedPeriode"
              :max="new Date().toISOString().slice(0, 7)"
            >
          </div>
          <button @click="openModal" class="add-button">
            <i class="fas fa-plus"></i>
            Tambah Penilaian
          </button>
        </div>
      </div>

      <div class="content">
        <div class="table-wrapper">
          <div class="table-header">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Cari penilaian..."
              >
            </div>
            <div class="total-info">
              Total Penilaian: {{ filteredPenilaian.length }}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Vendor</th>
                <th v-for="k in kriteria" :key="k._id">{{ k.nama }}</th>
                <th>Total</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, index) in filteredPenilaian" :key="p._id">
                <td>{{ index + 1 }}</td>
                <td>{{ p.vendor?.nama }}</td>
                <td v-for="k in kriteria" :key="k._id">
                  {{ getNilaiKriteria(p, k._id) }}
                </td>
                <td>{{ calculateTotal(p) }}</td>
                <td>
                  <div class="action-buttons">
                    <button class="info-btn" @click="showDetail(p)" title="Lihat Detail">
                      <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="edit-btn" @click="editPenilaian(p)" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" @click="deletePenilaian(p._id)" title="Hapus">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Detail Perhitungan -->
        <div v-if="selectedPenilaian" class="perhitungan-detail">
          <div class="detail-header">
            <h3>Detail Perhitungan SAW - {{ selectedPenilaian.vendor?.nama }}</h3>
            <button class="close-btn" @click="selectedPenilaian = null">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="step-box">
            <h4>1. Nilai Awal</h4>
            <table class="calculation-table">
              <thead>
                <tr>
                  <th>Kriteria</th>
                  <th>Tipe</th>
                  <th>Nilai</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="k in kriteria" :key="k._id">
                  <td>{{ k.nama }}</td>
                  <td>{{ k.tipe }}</td>
                  <td>{{ getNilaiKriteria(selectedPenilaian, k._id) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="step-box">
            <h4>2. Normalisasi SAW</h4>
            <div class="info-text">
              <p>Rumus Normalisasi:</p>
              <ul>
                <li>Benefit: R = X/Xmax</li>
                <li>Cost: R = Xmin/X</li>
              </ul>
            </div>
            <table class="calculation-table">
              <thead>
                <tr>
                  <th>Kriteria</th>
                  <th>Tipe</th>
                  <th>Nilai Awal (X)</th>
                  <th>Nilai Max/Min</th>
                  <th>Hasil Normalisasi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in matrixNormalisasi" :key="item.kriteria">
                  <td>{{ item.kriteria }}</td>
                  <td>{{ item.tipe }}</td>
                  <td>{{ item.nilaiAwal }}</td>
                  <td>{{ item.nilaiMaxMin }}</td>
                  <td>{{ item.nilaiNormalisasi.toFixed(4) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="step-box">
            <h4>3. Perhitungan Nilai Akhir</h4>
            <p>Total = Σ(Normalisasi × Bobot)</p>
            <table class="calculation-table">
              <thead>
                <tr>
                  <th>Kriteria</th>
                  <th>Normalisasi</th>
                  <th>Bobot (AHP)</th>
                  <th>Hasil</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in matrixNormalisasi" :key="item.kriteria">
                  <td>{{ item.kriteria }}</td>
                  <td>{{ item.nilaiNormalisasi.toFixed(4) }}</td>
                  <td>{{ getKriteriaBobot(item.kriteria).toFixed(4) }}</td>
                  <td>{{ (item.nilaiNormalisasi * getKriteriaBobot(item.kriteria)).toFixed(4) }}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="3"><strong>Total Akhir</strong></td>
                  <td><strong>{{ calculateFinalTotal(selectedPenilaian).toFixed(4) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Form -->
      <div v-if="showModal" class="modal" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ editMode ? 'Edit Penilaian' : 'Tambah Penilaian' }}</h3>
            <button class="close-btn" @click="closeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="penilaian-form">
            <div class="form-group">
              <label>
                <i class="fas fa-building"></i>
                Vendor
              </label>
              <select 
                v-model="formData.vendor" 
                required
                :disabled="editMode"
              >
                <option value="">Pilih Vendor</option>
                <option 
                  v-for="v in editMode ? vendors : availableVendors" 
                  :key="v._id" 
                  :value="v._id"
                >
                  {{ v.nama }}
                </option>
              </select>
            </div>

            <div class="kriteria-input">
              <div v-for="k in kriteria" :key="k._id" class="form-group">
                <label>
                  <i :class="k.tipe === 'cost' ? 'fas fa-dollar-sign' : 'fas fa-star'"></i>
                  {{ k.nama }}
                </label>
                <input 
                  type="number" 
                  v-model="formData.nilai[k._id]" 
                  required
                  min="1"
                  max="5"
                  step="1"
                >
                <span class="nilai-hint">Nilai 1-5</span>
              </div>
            </div>

            <div class="button-group">
              <button type="submit" class="submit-btn">
                <i class="fas fa-save"></i>
                {{ editMode ? 'Update' : 'Simpan' }}
              </button>
              <button type="button" class="cancel-btn" @click="closeModal">
                <i class="fas fa-times"></i>
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import axios from 'axios'
import Swal from 'sweetalert2'

const penilaian = ref([])
const kriteria = ref([])
const vendors = ref([])
const showModal = ref(false)
const editMode = ref(false)
const searchQuery = ref('')
const selectedPeriode = ref(new Date().toISOString().slice(0, 7))

const formData = ref({
  vendor: '',
  nilai: {},
  periode: selectedPeriode.value
})

const fetchData = async () => {
  try {
    const [penilaianRes, kriteriaRes, vendorsRes] = await Promise.all([
      axios.get('/api/penilaian'),
      axios.get('/api/kriteria'),
      axios.get('/api/vendors')
    ])
    penilaian.value = penilaianRes.data
    kriteria.value = kriteriaRes.data
    vendors.value = vendorsRes.data
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

const openModal = () => {
  showModal.value = true
  editMode.value = false
  formData.value = {
    vendor: '',
    nilai: {},
    periode: selectedPeriode.value
  }
}

const getNilaiKriteria = (p, kriteriaId) => {
  if (!p || !p.nilai) return '-'
  const nilaiItem = p.nilai.find(n => n.kriteria._id === kriteriaId)
  return nilaiItem ? nilaiItem.nilai : '-'
}

const getVendorNama = (p) => {
  return p && p.vendor ? p.vendor.nama : '-'
}

const editPenilaian = (p) => {
  editMode.value = true
  formData.value = {
    _id: p._id,
    vendor: p.vendor._id,
    nilai: {},
    periode: p.periode
  }
  
  // Set nilai untuk setiap kriteria
  p.nilai.forEach(n => {
    if (n.kriteria && n.kriteria._id) {
      formData.value.nilai[n.kriteria._id] = n.nilai
    }
  })
  
  showModal.value = true
}

const deletePenilaian = async (id) => {
  const result = await Swal.fire({
    title: 'Hapus Penilaian?',
    text: "Data yang dihapus tidak dapat dikembalikan!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  })

  if (result.isConfirmed) {
    try {
      await axios.delete(`/api/penilaian/${id}`)
      await fetchData()
      Swal.fire(
        'Terhapus!',
        'Data penilaian berhasil dihapus.',
        'success'
      )
    } catch (error) {
      console.error('Error deleting penilaian:', error)
      Swal.fire(
        'Error!',
        'Terjadi kesalahan saat menghapus data.',
        'error'
      )
    }
  }
}

// Tambahkan computed property untuk memfilter vendor yang tersedia
const availableVendors = computed(() => {
  if (!vendors.value || !penilaian.value) return []
  
  const currentPeriode = new Date(selectedPeriode.value)
  const startOfMonth = new Date(currentPeriode.getFullYear(), currentPeriode.getMonth(), 1)
  const endOfMonth = new Date(currentPeriode.getFullYear(), currentPeriode.getMonth() + 1, 0)

  // Dapatkan ID vendor yang sudah dinilai pada periode yang dipilih
  const assessedVendorIds = penilaian.value
    .filter(p => {
      const penilaianDate = new Date(p.periode)
      return penilaianDate >= startOfMonth && penilaianDate <= endOfMonth
    })
    .map(p => p.vendor?._id)

  // Filter vendor yang belum dinilai
  return vendors.value.filter(v => !assessedVendorIds.includes(v._id))
})

// Update watch untuk selectedPeriode
watch(selectedPeriode, () => {
  // Reset form data jika modal terbuka
  if (showModal.value && !editMode.value) {
    formData.value.vendor = ''
  }
})

// Tambahkan computed untuk filtered penilaian
const filteredPenilaian = computed(() => {
  const currentPeriode = new Date(selectedPeriode.value)
  return penilaian.value.filter(p => {
    const penilaianDate = new Date(p.periode)
    return penilaianDate.getFullYear() === currentPeriode.getFullYear() &&
           penilaianDate.getMonth() === currentPeriode.getMonth() &&
           (!searchQuery.value || p.vendor?.nama.toLowerCase().includes(searchQuery.value.toLowerCase()))
  })
})

// Tambahkan fungsi untuk menghitung total
const calculateTotal = (p) => {
  if (!p || !p.nilaiAkhir) return '-'
  return p.nilaiAkhir.toFixed(3)
}

const closeModal = () => {
  showModal.value = false
  editMode.value = false
  formData.value = {
    vendor: '',
    nilai: {},
    periode: selectedPeriode.value
  }
}

// Tambahkan ref untuk menyimpan detail perhitungan
const detailPerhitungan = ref(null)

// Update fungsi showDetail
const showDetail = (p) => {
  selectedPenilaian.value = p
  // Detail perhitungan akan otomatis diupdate melalui computed properties
}

// Perbaiki computed property untuk matrix normalisasi
const matrixNormalisasi = computed(() => {
  if (!selectedPenilaian.value) return []

  // Dapatkan semua nilai untuk periode yang sama
  const currentPeriode = new Date(selectedPenilaian.value.periode)
  const penilaianPeriodeIni = penilaian.value.filter(p => {
    const pDate = new Date(p.periode)
    return pDate.getFullYear() === currentPeriode.getFullYear() && 
           pDate.getMonth() === currentPeriode.getMonth()
  })

  return kriteria.value.map(k => {
    // Ambil nilai awal untuk kriteria ini
    const nilaiAwal = parseFloat(getNilaiKriteria(selectedPenilaian.value, k._id))
    
    // Cari nilai max/min dari penilaian di periode yang sama
    const allNilai = penilaianPeriodeIni
      .map(p => parseFloat(getNilaiKriteria(p, k._id)))
      .filter(n => !isNaN(n) && n !== '-')

    const maxNilai = Math.max(...allNilai)
    const minNilai = Math.min(...allNilai)
    
    // Hitung normalisasi
    let nilaiNormalisasi = 0
    if (k.tipe === 'benefit') {
      nilaiNormalisasi = nilaiAwal / maxNilai
    } else { // cost
      nilaiNormalisasi = minNilai / nilaiAwal
    }

    return {
      kriteria: k.nama,
      tipe: k.tipe,
      nilaiAwal: nilaiAwal,
      nilaiMaxMin: k.tipe === 'benefit' ? maxNilai : minNilai,
      nilaiNormalisasi: nilaiNormalisasi
    }
  })
})

// Fungsi untuk mendapatkan bobot kriteria dari data kriteria
const getKriteriaBobot = (namaKriteria) => {
  const k = kriteria.value.find(k => k.nama === namaKriteria)
  return k ? k.bobot : 0
}

// Update fungsi calculateFinalTotal untuk menerima parameter penilaian
const calculateFinalTotal = (penilaian) => {
  // Set selectedPenilaian sementara untuk perhitungan
  selectedPenilaian.value = penilaian
  
  // Hitung menggunakan matrix normalisasi
  const total = matrixNormalisasi.value.reduce((total, item) => {
    const bobot = getKriteriaBobot(item.kriteria)
    return total + (item.nilaiNormalisasi * bobot)
  }, 0)
  
  // Kembalikan selectedPenilaian ke nilai sebelumnya jika berbeda
  if (selectedPenilaian.value !== penilaian) {
    selectedPenilaian.value = null
  }
  
  return total
}

// Update fungsi calculateNilaiAkhir
const calculateNilaiAkhir = (nilai) => {
  try {
    // 1. Dapatkan semua kriteria dan bobotnya
    const kriteriaWithBobot = kriteria.value.map(k => ({
      _id: k._id,
      nama: k.nama,
      tipe: k.tipe,
      bobot: k.bobot
    }))

    // 2. Normalisasi nilai berdasarkan tipe kriteria
    const normalisasiNilai = kriteriaWithBobot.map(k => {
      // Ambil nilai untuk kriteria ini
      const nilaiKriteria = parseFloat(nilai[k._id]) || 0
      
      // Cari nilai max dan min untuk kriteria ini dari semua penilaian
      const allNilaiForKriteria = penilaian.value
        .map(p => {
          const nilai = p.nilai.find(n => n.kriteria._id === k._id)
          return nilai ? parseFloat(nilai.nilai) : 0
        })
        .filter(n => n > 0)

      const maxNilai = Math.max(...allNilaiForKriteria, nilaiKriteria)
      const minNilai = Math.min(...allNilaiForKriteria, nilaiKriteria)

      let nilaiNormalisasi
      if (k.tipe === 'benefit') {
        nilaiNormalisasi = nilaiKriteria / maxNilai
      } else { // cost
        nilaiNormalisasi = minNilai / nilaiKriteria
      }

      return {
        kriteria: k.nama,
        nilaiAwal: nilaiKriteria,
        nilaiNormalisasi: nilaiNormalisasi,
        bobot: k.bobot
      }
    })

    // 3. Hitung nilai akhir (total)
    const nilaiAkhir = normalisasiNilai.reduce((total, item) => {
      return total + (item.nilaiNormalisasi * item.bobot)
    }, 0)

    return {
      detailPerhitungan: normalisasiNilai,
      nilaiAkhir: nilaiAkhir
    }
  } catch (error) {
    console.error('Error calculating nilai akhir:', error)
    return {
      detailPerhitungan: [],
      nilaiAkhir: 0
    }
  }
}

// Update handleSubmit untuk menggunakan perhitungan baru
const handleSubmit = async () => {
  try {
    if (!formData.value.vendor) {
      alert('Pilih vendor terlebih dahulu')
      return
    }

    const nilaiEmpty = Object.values(formData.value.nilai).some(nilai => nilai === '')
    if (nilaiEmpty) {
      alert('Semua nilai kriteria harus diisi')
      return
    }

    // Hitung nilai akhir
    const { detailPerhitungan, nilaiAkhir } = calculateNilaiAkhir(formData.value.nilai)

    const payload = {
      vendor: formData.value.vendor,
      nilai: formData.value.nilai,
      periode: new Date(selectedPeriode.value),
      nilaiAkhir: nilaiAkhir,
      detailPerhitungan: detailPerhitungan
    }

    if (editMode.value && formData.value._id) {
      await axios.put(`/api/penilaian/${formData.value._id}`, payload)
    } else {
      await axios.post('/api/penilaian', payload)
    }
    
    await fetchData()
    closeModal()
  } catch (error) {
    console.error('Error submitting penilaian:', error)
    alert('Terjadi kesalahan saat menyimpan penilaian')
  }
}

onMounted(() => {
  fetchData()
})

// Tambahkan ref untuk selected penilaian
const selectedPenilaian = ref(null)

// Fungsi helper untuk mendapatkan tipe kriteria
const getKriteriaTipe = (namaKriteria) => {
  const k = kriteria.value.find(k => k.nama === namaKriteria)
  return k ? k.tipe : ''
}

// Fungsi untuk mendapatkan nilai maximum suatu kriteria
const getMaxNilai = (namaKriteria) => {
  const k = kriteria.value.find(k => k.nama === namaKriteria)
  if (!k) return 0
  
  return Math.max(...penilaian.value.map(p => {
    const nilai = p.nilai.find(n => n.kriteria._id === k._id)
    return nilai ? nilai.nilai : 0
  }))
}

// Fungsi untuk mendapatkan nilai minimum suatu kriteria
const getMinNilai = (namaKriteria) => {
  const k = kriteria.value.find(k => k.nama === namaKriteria)
  if (!k) return 0
  
  return Math.min(...penilaian.value.map(p => {
    const nilai = p.nilai.find(n => n.kriteria._id === k._id)
    return nilai ? nilai.nilai : 0
  }))
}
</script>

<style scoped>
.assessment {
  padding: 1.5rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.button-group-header {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.periode-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.periode-selector label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
  margin: 0;
}

.periode-selector input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.content {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow-x: auto;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

select, input[type="number"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.button-group {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
}

.button-group button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.button-group button:first-child {
  background: #2c3e50;
  color: white;
}

.button-group button:last-child {
  background: #e74c3c;
  color: white;
}

/* Tambahan untuk input kriteria */
.kriteria-input {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.kriteria-input .form-group {
  margin-bottom: 0.5rem;
}

select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.nilai-hint {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-buttons button {
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-btn {
  background: #3498db;
  color: white;
}

.delete-btn {
  background: #e74c3c;
  color: white;
}

.edit-btn:hover, .delete-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.perhitungan-detail {
  margin-top: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.step-box {
  margin-bottom: 2rem;
}

.step-box h4 {
  color: #2c3e50;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.calculation-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.calculation-table th,
.calculation-table td {
  padding: 0.75rem;
  border: 1px solid #ddd;
  text-align: center;
}

.calculation-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.info-text {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 4px;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.calculation-steps {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
}

.calculation-steps p {
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.total-calculation {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #ddd;
  color: #2c3e50;
}

.info-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.info-btn:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
}

.close-btn:hover {
  color: #e74c3c;
}

.total-row {
  background-color: #f8f9fa;
  font-weight: bold;
}

.total-row td {
  border-top: 2px solid #dee2e6;
}
</style> 