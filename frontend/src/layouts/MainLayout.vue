<template>
  <div class="layout">
    <aside class="sidebar" :class="{ 'collapsed': sidebarCollapsed }">
      <div class="logo">
        <img src="../assets/logo.png" alt="Logo" class="logo-img">
        <span>SPK Vendor</span>
      </div>

      <nav>
        <router-link to="/dashboard">
          <i class="fas fa-home"></i>
          <span>Dashboard</span>
        </router-link>
        <router-link to="/alternatif">
          <i class="fas fa-building"></i>
          <span>Alternatif</span>
        </router-link>
        <router-link to="/kriteria">
          <i class="fas fa-list"></i>
          <span>Kriteria</span>
        </router-link>
        <router-link to="/assessment">
          <i class="fas fa-clipboard-check"></i>
          <span>Assessment</span>
        </router-link>
        <router-link to="/laporan">
          <i class="fas fa-file-alt"></i>
          <span>Laporan</span>
        </router-link>
      </nav>

      <button @click="logout" class="logout-btn">
        <i class="fas fa-sign-out-alt"></i>
        <span>Logout</span>
      </button>
    </aside>

    <div class="main-wrapper">
      <header class="top-header">
        <div class="header-left">
          <button @click="toggleSidebar" class="toggle-btn">
            <i class="fas fa-bars"></i>
          </button>
          <h2>{{ currentPage }}</h2>
        </div>
        <div class="user-profile">
          <img src="../assets/avatar.png" alt="User" class="avatar">
          <div class="user-details">
            <span class="user-name">{{ username }}</span>
            <span class="user-role">Administrator</span>
          </div>
        </div>
      </header>

      <main class="content">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const sidebarCollapsed = ref(false)

const username = computed(() => authStore.user?.username || 'User')
const currentPage = computed(() => {
  return route.name || 'Dashboard'
})

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

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
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 260px;
  background: linear-gradient(180deg, #2c3e50 0%, #3498db 100%);
  color: white;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  z-index: 1000;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
}

.sidebar.collapsed {
  width: 70px;
}

.sidebar.collapsed .logo span,
.sidebar.collapsed nav span,
.sidebar.collapsed .logout-btn span {
  display: none;
}

.logo {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 2rem;
}

.logo-img {
  width: 40px;
  height: 40px;
}

nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

nav a {
  color: white;
  text-decoration: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

nav a i {
  width: 20px;
  text-align: center;
  font-size: 1.1rem;
}

nav a:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

nav a.router-link-active {
  background: rgba(255, 255, 255, 0.2);
  font-weight: bold;
}

.main-wrapper {
  flex: 1;
  margin-left: 260px;
  transition: margin-left 0.3s ease;
}

.sidebar.collapsed + .main-wrapper {
  margin-left: 70px;
}

.top-header {
  height: 70px;
  background: white;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toggle-btn {
  background: none;
  border: none;
  color: #333;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.3s ease;
}

.toggle-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: background 0.3s ease;
  cursor: pointer;
}

.user-profile:hover {
  background: rgba(0, 0, 0, 0.05);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #3498db;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: bold;
  color: #2c3e50;
}

.user-role {
  font-size: 0.8rem;
  color: #666;
}

.logout-btn {
  margin-top: auto;
  background: none;
  border: none;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.content {
  padding: 2rem;
  background: #f8f9fa;
  min-height: calc(100vh - 70px);
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.collapsed {
    transform: translateX(0);
    width: 260px;
  }

  .main-wrapper {
    margin-left: 0;
  }

  .sidebar.collapsed + .main-wrapper {
    margin-left: 0;
  }

  .toggle-btn {
    display: block;
  }
}
</style> 