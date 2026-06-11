import { defineStore } from 'pinia'
import { api } from '@/shared/api/client'

export const useMemberStore = defineStore('member', {
  state: () => ({
    current: null,
    loaded: false,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.current),
  },
  actions: {
    async fetchMe() {
      try {
        const { data } = await api.get('/members/me')
        this.current = data
      } catch {
        this.current = null
      } finally {
        this.loaded = true
      }
    },
    async login(payload) {
      const { data } = await api.post('/members/login', payload)
      this.current = data
      this.loaded = true
      return data
    },
    async register(payload) {
      const { data } = await api.post('/members/register', payload)
      return data
    },
    async update(payload) {
      const { data } = await api.put('/members/me', payload)
      this.current = data
      return data
    },
    async logout() {
      try {
        await api.post('/members/logout')
      } catch {
        // Local session state should still clear if the backend session is already gone.
      }
      this.current = null
      this.loaded = true
    },
  },
})

