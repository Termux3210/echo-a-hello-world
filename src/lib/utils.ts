
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Define the OrderStatus type
export type OrderStatus = "pending" | "processing" | "delivering" | "completed" | "cancelled";

// Convert a string to a valid OrderStatus
export function toOrderStatus(status: string): OrderStatus {
  switch (status) {
    case "pending":
      return "pending";
    case "processing":
      return "processing";
    case "delivering":
      return "delivering";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "pending"; // Default fallback
  }
}

// Function to format date for display
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(amount);
}
