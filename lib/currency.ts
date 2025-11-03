export function formatNaira(amount: number): string {
  return `₦${amount.toFixed(2)}`
}

export function formatNairaShort(amount: number): string {
  return `₦${amount.toFixed(0)}`
}
