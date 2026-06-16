import { describe, expect, it } from 'vitest'

import { safeRedirect } from './safeRedirect'

describe('safeRedirect', () => {
  it('accepts an internal path with a query string', () => {
    expect(safeRedirect('/prices?mode=search')).toBe('/prices?mode=search')
  })

  it.each(['https://evil.example', '//evil.example', '', undefined, null])(
    'returns the fallback for an unsafe or empty value: %s',
    (value) => {
      expect(safeRedirect(value)).toBe('/home')
    },
  )
})
