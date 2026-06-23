import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

export function createVueQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  })
}

export { VueQueryPlugin }
