<template>
  <MainLayout>
    <div class="alternatif">
      <div class="header">
        <h2>Data Vendor</h2>
        <button @click="showModal = true">Tambah Vendor</button>
      </div>

      <div class="content">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Vendor</th>
              <th>Alamat</th>
              <th>Kontak</th>
              <th>Email</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(vendor, index) in vendors" :key="vendor._id">
              <td>{{ index + 1 }}</td>
              <td>{{ vendor.nama }}</td>
              <td>{{ vendor.alamat }}</td>
              <td>{{ vendor.kontak }}</td>
              <td>{{ vendor.email }}</td>
              <td>
                <button class="edit-btn" @click="editVendor(vendor)">Edit</button>
                <button class="delete-btn" @click="deleteVendor(vendor._id)">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Form -->
      <div v-if="showModal" class="modal">
        <div class="modal-content">
          <h3>{{ editMode ? 'Edit Vendor' : 'Tambah Vendor' }}</h3>
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>Nama Vendor</label>
              <input type="text" v-model="formData.nama" required>
            </div>
            <div class="form-group">
              <label>Alamat</label>
              <input type="text" v-model="formData.alamat" required>
            </div>
            <div class="form-group">
              <label>Kontak</label>
              <input type="text" v-model="formData.kontak" required>
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" v-model="formData.email" required>
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
import { ref, onMounted } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import axios from 'axios'

const vendors = ref([])
const showModal = ref(false)
const editMode = ref(false)
const formData = ref({
  nama: '',
  alamat: '',
  kontak: '',
  email: ''
})

const fetchVendors = async () => {
  try {
    const response = await axios.get('/api/vendors')
    vendors.value = response.data
  } catch (error) {
    console.error('Error fetching vendors:', error)
  }
}

const handleSubmit = async () => {
  try {
    if (editMode.value) {
      await axios.put(`/api/vendors/${formData.value._id}`, formData.value)
    } else {
      const response = await axios.post('/api/vendors', formData.value)
      console.log('Response from server:', response.data)
    }
    await fetchVendors()
    closeModal()
  } catch (error) {
    console.error('Error submitting vendor:', error)
  }
}

const editVendor = (vendor) => {
  editMode.value = true
  formData.value = { ...vendor }
  showModal.value = true
}

const deleteVendor = async (id) => {
  if (confirm('Apakah Anda yakin ingin menghapus vendor ini?')) {
    try {
      await axios.delete(`/api/vendors/${id}`)
      await fetchVendors()
    } catch (error) {
      console.error('Error deleting vendor:', error)
    }
  }
}

const closeModal = () => {
  showModal.value = false
  editMode.value = false
  formData.value = {
    nama: '',
    alamat: '',
    kontak: '',
    email: ''
  }
}

onMounted(() => {
  fetchVendors()
})
</script>

<style scoped>
.alternatif {
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.content {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
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
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button[type="submit"] {
  background: #2c3e50;
  color: white;
}

.edit-btn {
  background: #3498db;
  color: white;
  margin-right: 0.5rem;
}

.delete-btn {
  background: #e74c3c;
  color: white;
}
</style> 