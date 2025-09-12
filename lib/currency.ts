import { z } from "zod";

// Format number as currency for display
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format as user types (with commas but no dollar sign in input)
export function formatCurrencyInput(value: string): string {
  // Remove all non-digits and non-decimal points
  const cleaned = value.replace(/[^0-9.]/g, '');
  
  // Handle decimal points
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    // More than one decimal point, keep only first
    parts.length = 2;
  }
  
  // Format the integer part with commas
  if (parts[0]) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  // Rejoin with decimal if present
  return parts.join('.');
}

// Parse currency string to number
export function parseCurrency(value: string): number {
  // Remove all non-digits and non-decimal points
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Zod schema for currency validation
export const currencySchema = z
  .union([
    z.string(),
    z.number(),
  ])
  .transform((val) => {
    if (typeof val === 'string') {
      return parseCurrency(val);
    }
    return val;
  })
  .refine(
    (val) => val >= 0,
    { message: "Amount must be positive" }
  )
  .refine(
    (val) => val <= 999999999,
    { message: "Amount is too large" }
  );

// Format for display in tables/cards (compact)
export function formatCompactCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 10000) {
    return `$${(amount / 1000).toFixed(0)}k`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return formatCurrency(amount);
}