<template>
  <MainLayout>
    <div class="kriteria">
      <div class="header">
        <div class="title-section">
          <h2>Data Kriteria</h2>
          <p>Kelola kriteria penilaian vendor</p>
        </div>
        <div class="button-group-header">
          <button @click="showModal = true" class="add-button">
            <i class="fas fa-plus"></i>
            Tambah Kriteria
          </button>
          <button 
            @click="openAHPModal" 
            :disabled="kriteria.length < 2"
            class="add-button"
          >
            <i class="fas fa-calculator"></i>
            Hitung Bobot AHP
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
                placeholder="Cari kriteria..."
              >
            </div>
            <div class="total-info">
              Total Kriteria: {{ filteredKriteria.length }}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Kriteria</th>
                <th>Tipe</th>
                <th>Bobot</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in filteredKriteria" :key="item._id">
                <td>{{ index + 1 }}</td>
                <td>{{ item.nama }}</td>
                <td>
                  <span :class="['tipe-badge', item.tipe]">
                    {{ item.tipe === 'benefit' ? 'Benefit' : 'Cost' }}
                  </span>
                </td>
                <td>{{ item.bobot.toFixed(3) }}</td>
                <td>
                  <div class="action-buttons">
                    <button class="edit-btn" @click="editKriteria(item)" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" @click="deleteKriteria(item._id)" title="Hapus">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Form Kriteria -->
      <div v-if="showModal" class="modal" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ editMode ? 'Edit Kriteria' : 'Tambah Kriteria' }}</h3>
          </div>

          <form @submit.prevent="handleSubmit" class="kriteria-form">
            <div class="form-group">
              <label>
                <i class="fas fa-tag"></i>
                Nama Kriteria
              </label>
              <input 
                type="text" 
                v-model="formData.nama" 
                required
                placeholder="Masukkan nama kriteria"
              >
            </div>

            <div class="form-group">
              <label>
                <i class="fas fa-sort-amount-up"></i>
                Tipe
              </label>
              <select v-model="formData.tipe" required>
                <option value="">Pilih Tipe</option>
                <option value="benefit">Benefit (Semakin tinggi semakin baik)</option>
                <option value="cost">Cost (Semakin rendah semakin baik)</option>
              </select>
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

      <!-- Modal AHP -->
      <div v-if="showAHPModal" class="modal" @click.self="closeModal">
        <div class="modal-content ahp-modal">
          <div class="modal-header">
            <h3>Perbandingan Berpasangan AHP</h3>
          </div>

          <div class="comparison-matrix">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th v-for="k in kriteria" :key="k._id">{{ k.nama }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in kriteria" :key="row._id">
                  <td>{{ row.nama }}</td>
                  <td v-for="(col, j) in kriteria" :key="col._id">
                    <select 
                      v-if="i < j"
                      v-model="pairwiseMatrix[i][j]"
                      @change="updatePairwiseValue(i, j, $event.target.value)"
                    >
                      <option v-for="(label, value) in comparisonScale" 
                              :key="value" 
                              :value="Number(value)">
                        {{ value }} - {{ label }}
                      </option>
                    </select>
                    <span v-else-if="i === j">1</span>
                    <span v-else>{{ (1/pairwiseMatrix[j][i]).toFixed(2) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="button-group">
            <button @click="calculateAHP" class="submit-btn">
              <i class="fas fa-calculator"></i>
              Hitung Bobot
            </button>
            <button type="button" class="cancel-btn" @click="closeModal">
              <i class="fas fa-times"></i>
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import axios from 'axios'
import Swal from 'sweetalert2'

// State
const kriteria = ref([])
const showModal = ref(false)
const showAHPModal = ref(false)
const editMode = ref(false)
const searchQuery = ref('')

const formData = ref({
  nama: '',
  tipe: '',
  bobot: 0
})

// Computed property untuk filtered kriteria
const filteredKriteria = computed(() => {
  if (!searchQuery.value) return kriteria.value || []  // Pastikan return array kosong jika kriteria.value undefined
  
  return kriteria.value.filter(k => 
    k.nama.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const pairwiseMatrix = ref([])
const comparisonScale = {
  1: 'Sama penting',
  3: 'Sedikit lebih penting',
  5: 'Lebih penting',
  7: 'Sangat lebih penting',
  9: 'Mutlak lebih penting'
}

// Methods
const fetchKriteria = async () => {
  try {
    const response = await axios.get('/api/kriteria')
    kriteria.value = response.data
  } catch (error) {
    console.error('Error fetching kriteria:', error)
    kriteria.value = [] // Set empty array if error
  }
}

const handleSubmit = async () => {
  try {
    if (editMode.value) {
      await axios.put(`/api/kriteria/${formData.value._id}`, formData.value)
    } else {
      await axios.post('/api/kriteria', formData.value)
    }
    await fetchKriteria()
    closeModal()
  } catch (error) {
    console.error('Error submitting kriteria:', error)
  }
}

const editKriteria = (item) => {
  editMode.value = true
  formData.value = { ...item }
  showModal.value = true
}

const deleteKriteria = async (id) => {
  const result = await Swal.fire({
    title: 'Hapus Kriteria?',
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
      await axios.delete(`/api/kriteria/${id}`)
      await fetchKriteria()
      Swal.fire(
        'Terhapus!',
        'Data kriteria berhasil dihapus.',
        'success'
      )
    } catch (error) {
      console.error('Error deleting kriteria:', error)
      Swal.fire(
        'Error!',
        'Terjadi kesalahan saat menghapus data.',
        'error'
      )
    }
  }
}

const closeModal = () => {
  showModal.value = false
  showAHPModal.value = false
  editMode.value = false
  formData.value = {
    nama: '',
    tipe: '',
    bobot: 0
  }
}

const initializePairwiseMatrix = () => {
  const n = kriteria.value.length
  pairwiseMatrix.value = Array(n).fill().map(() => Array(n).fill(1))
  
  for (let i = 0; i < n; i++) {
    pairwiseMatrix.value[i][i] = 1
  }
}

const updatePairwiseValue = (i, j, value) => {
  value = Number(value)
  pairwiseMatrix.value[i][j] = value
  pairwiseMatrix.value[j][i] = 1/value
}

const calculateAHP = async () => {
  try {
    const response = await axios.post('/api/kriteria/hitung-ahp', {
      pairwiseMatrix: pairwiseMatrix.value
    })
    await fetchKriteria()
    closeModal()
  } catch (error) {
    console.error('Error calculating AHP:', error)
  }
}

const openAHPModal = () => {
  if (kriteria.value.length < 2) {
    alert('Minimal harus ada 2 kriteria untuk menghitung bobot AHP')
    return
  }
  initializePairwiseMatrix()
  showAHPModal.value = true
}

// Initialize data on component mount
onMounted(() => {
  fetchKriteria()
})
</script>

<style scoped>
/* Menggunakan style yang sama dengan Alternatif.vue */
.kriteria {
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
}

.title-section h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.title-section p {
  margin: 0.5rem 0 0;
  color: #666;
  font-size: 0.9rem;
}

.add-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #2c3e50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-button:hover {
  background: #34495e;
  transform: translateY(-2px);
}

.add-button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
}

/* Table styling sama dengan Alternatif.vue */
.content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  overflow: hidden;
}

/* Action buttons styling sama dengan Alternatif.vue */
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

/* Tambahan style khusus untuk Kriteria */
.tipe-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.tipe-badge.benefit {
  background: #e1f7e1;
  color: #2ecc71;
}

.tipe-badge.cost {
  background: #ffe9e9;
  color: #e74c3c;
}

select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
}

select:focus {
  border-color: #3498db;
  outline: none;
}

.ahp-modal {
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
}

.comparison-matrix {
  margin: 1rem 0;
  overflow-x: auto;
}

.comparison-matrix table {
  width: 100%;
  border-collapse: collapse;
}

.comparison-matrix th,
.comparison-matrix td {
  padding: 0.5rem;
  border: 1px solid #ddd;
  text-align: center;
}

.comparison-matrix select {
  width: 100%;
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.ahp-button {
  background: #2c3e50;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ahp-button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

/* Perbaikan style untuk modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: modalFadeIn 0.3s ease;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

/* Form styling */
.kriteria-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
  outline: none;
}

/* AHP Modal styling */
.ahp-modal {
  max-width: 800px;
  max-height: 80vh;
}

.comparison-matrix {
  padding: 1.5rem;
  overflow-x: auto;
}

.comparison-matrix table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.comparison-matrix th {
  background: #f8f9fa;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  font-weight: 600;
  color: #2c3e50;
}

.comparison-matrix td {
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  text-align: center;
}

.comparison-matrix select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}

/* Button styling */
.button-group {
  padding: 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.submit-btn,
.cancel-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.submit-btn {
  background: #2c3e50;
  color: white;
}

.submit-btn:hover {
  background: #34495e;
  transform: translateY(-2px);
}

.cancel-btn {
  background: #f1f2f6;
  color: #2c3e50;
}

.cancel-btn:hover {
  background: #dcdde1;
  transform: translateY(-2px);
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 