import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null
  }),
  
  actions: {
    async login(username, password) {
      try {
        const response = await axios.post('/api/users/login', {
          username,
          password
        })
        this.user = response.data
        this.token = response.data.token
        localStorage.setItem('token', response.data.token)
        return true
      } catch (error) {
        console.error('Login error:', error)
        return false
      }
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
    }
  }
}) 