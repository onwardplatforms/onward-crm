import { z } from "zod";

// Format phone number for display
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as US phone number if it's 10 or 11 digits
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Return original if not a standard US format
  return phone;
}

// Clean phone number for storage (keep only digits)
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

// Zod schema for phone validation
export const phoneSchema = z
  .string()
  .optional()
  .transform((val) => val?.replace(/\D/g, ''))
  .refine(
    (val) => !val || val.length === 0 || (val.length >= 10 && val.length <= 15),
    { message: "Phone number must be between 10 and 15 digits" }
  );

// Format as user types
export function formatPhoneOnChange(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else if (cleaned.length <= 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return value;
}