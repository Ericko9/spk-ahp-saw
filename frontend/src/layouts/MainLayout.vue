<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">SPK Vendor</div>
      <nav>
        <router-link to="/dashboard">Dashboard</router-link>
        <router-link to="/alternatif">Alternatif</router-link>
        <router-link to="/kriteria">Kriteria</router-link>
        <router-link to="/assessment">Assessment</router-link>
        <router-link to="/laporan">Laporan</router-link>
      </nav>
      <button @click="logout" class="logout-btn">Logout</button>
    </aside>
    <main class="content">
      <slot></slot>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  background: #2c3e50;
  color: white;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
  text-align: center;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

nav a:hover {
  background: rgba(255, 255, 255, 0.1);
}

nav a.router-link-active {
  background: rgba(255, 255, 255, 0.2);
}

.content {
  flex: 1;
  padding: 2rem;
}

.logout-btn {
  margin-top: auto;
  padding: 0.5rem;
  background: #e74c3c;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}
</style> 