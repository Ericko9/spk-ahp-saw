<template>
  <MainLayout>
    <div class="alternatif">
      <div class="header">
        <div class="title-section">
          <h2>Data Vendor</h2>
          <p>Kelola data vendor untuk penilaian</p>
        </div>
        <button @click="showModal = true" class="add-button">
          <i class="fas fa-plus"></i>
          Tambah Vendor
        </button>
      </div>

      <div class="content">
        <div class="table-wrapper">
          <div class="table-header">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Cari vendor..."
              >
            </div>
            <div class="total-info">
              Total Vendor: {{ filteredVendors.length }}
            </div>
          </div>

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
              <tr v-for="(vendor, index) in filteredVendors" :key="vendor._id">
                <td>{{ index + 1 }}</td>
                <td>
                  <div class="vendor-info">
                    <span class="vendor-name">{{ vendor.nama }}</span>
                  </div>
                </td>
                <td>{{ vendor.alamat }}</td>
                <td>
                  <a :href="'tel:' + vendor.kontak" class="contact-link">
                    <i class="fas fa-phone"></i>
                    {{ vendor.kontak }}
                  </a>
                </td>
                <td>
                  <a :href="'mailto:' + vendor.email" class="contact-link">
                    <i class="fas fa-envelope"></i>
                    {{ vendor.email }}
                  </a>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="edit-btn" @click="editVendor(vendor)" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" @click="deleteVendor(vendor._id)" title="Hapus">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Form -->
      <div v-if="showModal" class="modal" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ editMode ? 'Edit Vendor' : 'Tambah Vendor Baru' }}</h3>
            <button class="close-btn" @click="closeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="vendor-form">
            <div class="form-group">
              <label>
                <i class="fas fa-building"></i>
                Nama Vendor
              </label>
              <input 
                type="text" 
                v-model="formData.nama" 
                required
                placeholder="Masukkan nama vendor"
              >
            </div>

            <div class="form-group">
              <label>
                <i class="fas fa-map-marker-alt"></i>
                Alamat
              </label>
              <input 
                type="text" 
                v-model="formData.alamat" 
                required
                placeholder="Masukkan alamat vendor"
              >
            </div>

            <div class="form-group">
              <label>
                <i class="fas fa-phone"></i>
                Kontak
              </label>
              <input 
                type="text" 
                v-model="formData.kontak" 
                required
                placeholder="Masukkan nomor kontak"
              >
            </div>

            <div class="form-group">
              <label>
                <i class="fas fa-envelope"></i>
                Email
              </label>
              <input 
                type="email" 
                v-model="formData.email" 
                required
                placeholder="Masukkan email vendor"
              >
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
import { ref, onMounted, computed } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import axios from 'axios'
import Swal from 'sweetalert2'

const vendors = ref([])
const showModal = ref(false)
const editMode = ref(false)
const searchQuery = ref('')

const formData = ref({
  nama: '',
  alamat: '',
  kontak: '',
  email: ''
})

// Computed property untuk filtered vendors
const filteredVendors = computed(() => {
  if (!searchQuery.value) return vendors.value
  
  return vendors.value.filter(vendor => 
    vendor.nama.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    vendor.alamat.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    vendor.kontak.includes(searchQuery.value)
  )
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
      await axios.post('/api/vendors', formData.value)
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
  const result = await Swal.fire({
    title: 'Hapus Vendor?',
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
      await axios.delete(`/api/vendors/${id}`)
      await fetchVendors()
      Swal.fire(
        'Terhapus!',
        'Data vendor berhasil dihapus.',
        'success'
      )
    } catch (error) {
      console.error('Error deleting vendor:', error)
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
  padding: 1.5rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
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

.content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.search-box input {
  border: none;
  outline: none;
  width: 200px;
}

.search-box i {
  color: #666;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.vendor-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.vendor-name {
  font-weight: 500;
  color: #2c3e50;
}

.contact-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  text-decoration: none;
}

.contact-link:hover {
  color: #3498db;
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

/* Modal Styles */
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
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #666;
}

.vendor-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  border-color: #3498db;
  outline: none;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.submit-btn, .cancel-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.submit-btn {
  background: #2c3e50;
  color: white;
  flex: 1;
}

.cancel-btn {
  background: #e74c3c;
  color: white;
}

.submit-btn:hover, .cancel-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .search-box {
    width: 100%;
  }
  
  .search-box input {
    width: 100%;
  }
  
  th, td {
    padding: 0.75rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style> 