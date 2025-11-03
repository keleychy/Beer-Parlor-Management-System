import { describe, it, expect } from 'vitest'
import { passwordStrength, passwordsMatch } from '@/lib/utils'

describe('passwordStrength', () => {
  it('returns 0 for empty', () => {
    const r = passwordStrength('')
    expect(r.score).toBe(0)
  })

  it('detects weak and strong passwords', () => {
    expect(passwordStrength('abc').label).toMatch(/Weak|Too short/)
    expect(passwordStrength('abcdefgh').score).toBeGreaterThanOrEqual(1)
    expect(passwordStrength('Abcdef12').score).toBeGreaterThanOrEqual(3)
    expect(passwordStrength('Abcdef12!').score).toBe(4)
  })
})

describe('passwordsMatch', () => {
  it('matches identical strings', () => {
    expect(passwordsMatch('a', 'a')).toBe(true)
    expect(passwordsMatch('a', '')).toBe(false)
  })
})
