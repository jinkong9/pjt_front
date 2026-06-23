import { config } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { beforeEach } from 'vitest'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

config.global.plugins = config.global.plugins ?? []
config.global.plugins.push([
  VueQueryPlugin,
  {
    queryClient,
  },
])

beforeEach(() => {
  queryClient.clear()
})
