/**
 * UnderSec - Utility Functions
 * Helper functions used across the extension
 */

import { BUSINESS_HOURS } from './constants';

/**
 * Returns current Unix timestamp in seconds
 */
export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Returns current Unix timestamp in milliseconds
 */
export function nowMs(): number {
  return Date.now();
}

/**
 * Checks if current time is outside business hours
 */
export function isOffHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday

  const isBusinessDay = (BUSINESS_HOURS.DAYS as readonly number[]).includes(day);
  const isBusinessHour = hour >= BUSINESS_HOURS.START && hour < BUSINESS_HOURS.END;

  return !(isBusinessDay && isBusinessHour);
}

/**
 * Calculates the start of the current 5-minute window
 */
export function getWindowStart(windowDurationSeconds: number): number {
  const now = nowUnix();
  return now - (now % windowDurationSeconds);
}

/**
 * Calculates the end of the current 5-minute window
 */
export function getWindowEnd(windowDurationSeconds: number): number {
  return getWindowStart(windowDurationSeconds) + windowDurationSeconds;
}

/**
 * Creates a debounced function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Creates a throttled function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Safely escapes HTML for display (prevents XSS)
 */
export function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Generates a unique ID
 */
export function generateId(): string {
  return `us_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clamps a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Formats a Unix timestamp to human-readable string
 */
export function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

/**
 * Calculates time remaining until a timestamp
 */
export function getTimeRemaining(targetTs: number): {
  minutes: number;
  seconds: number;
  expired: boolean;
} {
  const now = nowUnix();
  const diff = targetTs - now;
  
  if (diff <= 0) {
    return { minutes: 0, seconds: 0, expired: true };
  }
  
  return {
    minutes: Math.floor(diff / 60),
    seconds: diff % 60,
    expired: false,
  };
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts - 1) {
        await sleep(baseDelay * Math.pow(2, attempt));
      }
    }
  }
  
  throw lastError;
}
