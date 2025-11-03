import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Simple password strength estimator.
 * Returns a score 0..4 and a human label.
 */
export function passwordStrength(password: string) {
  let score = 0
  if (!password) return { score: 0, label: 'Too short' }

  // length
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  let label = 'Weak'
  if (score >= 4) label = 'Very strong'
  else if (score === 3) label = 'Strong'
  else if (score === 2) label = 'Moderate'

  return { score, label }
}

export function passwordsMatch(a: string, b: string) {
  return !!a && a === b
}
