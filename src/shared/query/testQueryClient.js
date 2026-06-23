import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

export function createTestQueryPlugin() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return [VueQueryPlugin, { queryClient }]
}
