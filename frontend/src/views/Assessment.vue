<template>
  <MainLayout>
    <div class="assessment">
      <div class="header">
        <h2>Penilaian Vendor</h2>
        <div class="periode-selector">
          <input type="month" v-model="selectedPeriode">
          <button @click="openModal">Tambah Penilaian</button>
        </div>
      </div>

      <div class="content">
        <table v-if="kriteria.length > 0">
          <thead>
            <tr>
              <th>No</th>
              <th>Vendor</th>
              <th v-for="k in kriteria" :key="k._id">{{ k.nama }}</th>
              <th>Nilai Akhir</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, index) in penilaian" :key="p._id">
              <td>{{ index + 1 }}</td>
              <td>{{ getVendorNama(p) }}</td>
              <td v-for="k in kriteria" :key="k._id">
                {{ getNilaiKriteria(p, k._id) }}
              </td>
              <td>{{ p.nilaiAkhir ? p.nilaiAkhir.toFixed(3) : '-' }}</td>
              <td>
                <button class="edit-btn" @click="editPenilaian(p)">Edit</button>
                <button class="delete-btn" @click="deletePenilaian(p._id)">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else>Loading...</div>
      </div>

      <!-- Modal Form -->
      <div v-if="showModal" class="modal">
        <div class="modal-content">
          <h3>{{ editMode ? 'Edit Penilaian' : 'Tambah Penilaian' }}</h3>
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>Vendor</label>
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
                <label>{{ k.nama }}</label>
                <input 
                  type="number" 
                  v-model="formData.nilai[k._id]" 
                  required
                  min="1"
                  max="5"
                  step="1"
                >
              </div>
            </div>

            <div class="button-group">
              <button type="submit">{{ editMode ? 'Update' : 'Simpan' }}</button>
              <button type="button" @click="closeModal">Batal</button>
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

const vendors = ref([])
const kriteria = ref([])
const penilaian = ref([])
const showModal = ref(false)
const editMode = ref(false)
const selectedPeriode = ref(new Date().toISOString().slice(0, 7))

const formData = ref({
  vendor: '',
  nilai: {}
})

const fetchData = async () => {
  try {
    const [vendorsRes, kriteriaRes, penilaianRes] = await Promise.all([
      axios.get('/api/vendors'),
      axios.get('/api/kriteria'),
      axios.get('/api/penilaian')
    ])
    
    vendors.value = vendorsRes.data || []
    kriteria.value = kriteriaRes.data || []
    penilaian.value = penilaianRes.data || []
    
    initializeFormData()
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

const initializeFormData = () => {
  formData.value = {
    vendor: '',
    nilai: {}
  }
  if (kriteria.value && kriteria.value.length > 0) {
    kriteria.value.forEach(k => {
      if (k && k._id) {
        formData.value.nilai[k._id] = ''
      }
    })
  }
}

const getNilaiKriteria = (p, kriteriaId) => {
  if (!p || !p.nilai) return '-'
  const nilaiItem = p.nilai.find(n => n && n.kriteria && n.kriteria._id === kriteriaId)
  return nilaiItem ? nilaiItem.nilai : '-'
}

const getVendorNama = (p) => {
  return p && p.vendor ? p.vendor.nama : '-'
}

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

    const payload = {
      vendor: formData.value.vendor,
      nilai: formData.value.nilai,
      periode: new Date(selectedPeriode.value)
    }

    console.log('Sending payload:', payload)

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

const openModal = () => {
  if (availableVendors.value.length === 0) {
    alert('Semua vendor sudah dinilai untuk periode ini')
    return
  }
  
  showModal.value = true
  editMode.value = false
  initializeFormData()
}

const closeModal = () => {
  showModal.value = false
  editMode.value = false
  initializeFormData()
}

const editPenilaian = (p) => {
  editMode.value = true
  formData.value = {
    _id: p._id,
    vendor: p.vendor._id,
    nilai: {}
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
  if (confirm('Apakah Anda yakin ingin menghapus penilaian ini?')) {
    try {
      await axios.delete(`/api/penilaian/${id}`)
      await fetchData()
    } catch (error) {
      console.error('Error deleting penilaian:', error)
      alert('Terjadi kesalahan saat menghapus penilaian')
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

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.assessment {
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.periode-selector {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.periode-selector input[type="month"] {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
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
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.kriteria-input .form-group {
  margin-bottom: 0.5rem;
}

select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}
</style> 