/**
 * UnderSec - Security utilities
 * Sanitization and validation functions
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * Escapes all HTML special characters
 */
export function sanitizeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 */
export function sanitizeUrl(url: string): string {
    if (!url) return '';

    const normalized = url.trim().toLowerCase();

    // Block dangerous protocols
    if (
        normalized.startsWith('javascript:') ||
        normalized.startsWith('data:') ||
        normalized.startsWith('vbscript:') ||
        normalized.startsWith('file:')
    ) {
        return '#';
    }

    // Only allow http(s) protocols
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
        return '#';
    }

    return url;
}

/**
 * Validate and sanitize API URL
 */
export function validateApiUrl(url: string): boolean {
    if (!url) return true; // Allow empty for local scoring

    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
        return false;
    }
}

/**
 * Sanitize user input for storage
 */
export function sanitizeInput(input: string, maxLength: number = 200): string {
    if (!input) return '';

    // Remove control characters and trim
    const cleaned = input.replace(/[\x00-\x1F\x7F]/g, '').trim();

    // Limit length
    return cleaned.slice(0, maxLength);
}

/**
 * Create safe HTML element with text content (prevents XSS)
 */
export function createSafeElement(tag: string, text: string, className?: string): HTMLElement {
    const element = document.createElement(tag);
    element.textContent = text; // Use textContent instead of innerHTML
    if (className) {
        element.className = className;
    }
    return element;
}
