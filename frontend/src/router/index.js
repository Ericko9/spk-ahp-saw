import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Alternatif from '../views/Alternatif.vue'
import Kriteria from '../views/Kriteria.vue'
import Assessment from '../views/Assessment.vue'
import Laporan from '../views/Laporan.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/alternatif',
    name: 'Alternatif',
    component: Alternatif,
    meta: { requiresAuth: true }
  },
  {
    path: '/kriteria',
    name: 'Kriteria',
    component: Kriteria,
    meta: { requiresAuth: true }
  },
  {
    path: '/assessment',
    name: 'Assessment',
    component: Assessment,
    meta: { requiresAuth: true }
  },
  {
    path: '/laporan',
    name: 'Laporan',
    component: Laporan,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router 