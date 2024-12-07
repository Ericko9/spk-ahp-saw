<template>
  <MainLayout>
    <div class="kriteria">
      <div class="header">
        <h2>Data Kriteria</h2>
        <div class="button-group">
          <button @click="showModal = true">Tambah Kriteria</button>
          <button @click="openAHPModal" :disabled="kriteria.length < 2">
            Hitung Bobot AHP
          </button>
        </div>
      </div>

      <div class="content">
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
            <tr v-for="(item, index) in kriteria" :key="item._id">
              <td>{{ index + 1 }}</td>
              <td>{{ item.nama }}</td>
              <td>{{ item.tipe }}</td>
              <td>{{ item.bobot.toFixed(3) }}</td>
              <td>
                <button class="edit-btn" @click="editKriteria(item)">Edit</button>
                <button class="delete-btn" @click="deleteKriteria(item._id)">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Form -->
      <div v-if="showModal" class="modal">
        <div class="modal-content">
          <h3>{{ editMode ? 'Edit Kriteria' : 'Tambah Kriteria' }}</h3>
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>Nama Kriteria</label>
              <input type="text" v-model="formData.nama" required>
            </div>
            <div class="form-group">
              <label>Tipe</label>
              <select v-model="formData.tipe" required>
                <option value="">Pilih Tipe</option>
                <option value="benefit">Benefit</option>
                <option value="cost">Cost</option>
              </select>
            </div>
            <div class="button-group">
              <button type="submit">{{ editMode ? 'Update' : 'Simpan' }}</button>
              <button type="button" @click="closeModal">Batal</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal AHP -->
      <div v-if="showAHPModal" class="modal">
        <div class="modal-content ahp-modal">
          <h3>Perbandingan Berpasangan AHP</h3>
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
            <button @click="calculateAHP">Hitung Bobot</button>
            <button @click="showAHPModal = false">Batal</button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import axios from 'axios'

const kriteria = ref([])
const showModal = ref(false)
const showAHPModal = ref(false)
const editMode = ref(false)
const formData = ref({
  nama: '',
  tipe: '',
  bobot: 0
})

const pairwiseMatrix = ref([])
const comparisonScale = {
  1: 'Sama penting',
  3: 'Sedikit lebih penting',
  5: 'Lebih penting',
  7: 'Sangat lebih penting',
  9: 'Mutlak lebih penting'
}

const fetchKriteria = async () => {
  try {
    const response = await axios.get('/api/kriteria')
    console.log('Fetched kriteria:', response.data)
    kriteria.value = response.data
  } catch (error) {
    console.error('Error fetching kriteria:', error)
  }
}

const handleSubmit = async () => {
  try {
    if (editMode.value) {
      const response = await axios.put(`/api/kriteria/${formData.value._id}`, formData.value)
      console.log('Updated kriteria:', response.data)
    } else {
      const response = await axios.post('/api/kriteria', formData.value)
      console.log('Created kriteria:', response.data)
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
  if (confirm('Apakah Anda yakin ingin menghapus kriteria ini?')) {
    try {
      await axios.delete(`/api/kriteria/${id}`)
      await fetchKriteria()
    } catch (error) {
      console.error('Error deleting kriteria:', error)
    }
  }
}

const closeModal = () => {
  showModal.value = false
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
  
  // Isi diagonal dengan 1
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
    console.log('Calculating AHP with matrix:', pairwiseMatrix.value)
    const response = await axios.post('/api/kriteria/hitung-ahp', {
      pairwiseMatrix: pairwiseMatrix.value
    })
    console.log('AHP Results:', response.data)
    await fetchKriteria()
    showAHPModal.value = false
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

onMounted(() => {
  fetchKriteria()
})
</script>

<style scoped>
.ahp-matrix table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.ahp-matrix input {
  width: 60px;
  text-align: center;
}

.ahp-matrix input:disabled {
  background: #f5f5f5;
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
  max-width: 400px;
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

input, select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.button-group button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button-group button:first-child {
  background: #2c3e50;
  color: white;
}

.button-group button:last-child {
  background: #e74c3c;
  color: white;
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

.comparison-matrix span {
  display: block;
  padding: 0.25rem;
  background: #f5f5f5;
}
</style> 