import DOMPurify from 'dompurify'
/**
 * Sanitizes HTML content to prevent XSS attacks
 * Uses DOMPurify if available, otherwise falls back to basic sanitization
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side rendering - return empty string
    return ''
  }

  try {
    const config = {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'span', 'div',
        'a', 'img', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'style',
        'target', 'rel'
      ],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      SANITIZE_DOM: true,
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false,
      SANITIZE_NAMED_PROPS: true,
      ADD_ATTR: ['target', 'rel'],
      ADD_TAGS: [],
      ADD_URI_SAFE_ATTR: []
    }
    
    return DOMPurify.sanitize(html, config)
  } catch (error) {
    // Fallback to basic sanitization if DOMPurify is not available
    console.warn('DOMPurify not available, using basic sanitization')
    return basicSanitizeHTML(html)
  }
}

/**
 * Sanitizes HTML content for rich text editors
 * Allows more tags and attributes for formatting
 */
export function sanitizeRichText(html: string): string {
  if (typeof window === 'undefined') {
    return ''
  }

  try {
    const DOMPurify = require('dompurify')
    
    const richTextConfig = {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'span', 'div',
        'a', 'img', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'tr', 'td', 'th',
        'thead', 'tbody', 'tfoot'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'style',
        'target', 'rel', 'colspan', 'rowspan', 'align', 'valign'
      ],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      SANITIZE_DOM: true,
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false,
      SANITIZE_NAMED_PROPS: true,
      ADD_ATTR: ['target', 'rel'],
      ADD_TAGS: [],
      ADD_URI_SAFE_ATTR: []
    }

    return DOMPurify.sanitize(html, richTextConfig)
  } catch (error) {
    console.warn('DOMPurify not available, using basic sanitization for rich text')
    return basicSanitizeRichText(html)
  }
}

/**
 * Sanitizes plain text by escaping HTML characters
 * Use this when you want to display user input as plain text
 */
export function sanitizePlainText(text: string): string {
  if (typeof window === 'undefined') {
    return text
  }
  
  try {
    const DOMPurify = require('dompurify')
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })
  } catch (error) {
    // Fallback to basic HTML escaping
    return escapeHTML(text)
  }
}

/**
 * Basic HTML sanitization fallback
 * Removes dangerous tags and attributes
 */
function basicSanitizeHTML(html: string): string {
  // Remove script tags and their content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove dangerous event handlers
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  
  // Remove javascript: protocols
  html = html.replace(/javascript:/gi, '')
  
  // Remove data: protocols except for images
  html = html.replace(/data:(?!image\/)/gi, '')
  
  // Remove dangerous tags
  const dangerousTags = ['script', 'object', 'embed', 'applet', 'form', 'input', 'button', 'iframe', 'frame', 'frameset']
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi')
    html = html.replace(regex, '')
  })
  
  return html
}

/**
 * Basic rich text sanitization fallback
 * Allows more formatting tags but still removes dangerous content
 */
function basicSanitizeRichText(html: string): string {
  // Remove script tags and their content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove dangerous event handlers
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  
  // Remove javascript: protocols
  html = html.replace(/javascript:/gi, '')
  
  // Remove data: protocols except for images
  html = html.replace(/data:(?!image\/)/gi, '')
  
  // Remove dangerous tags (but keep formatting tags)
  const dangerousTags = ['script', 'object', 'embed', 'applet', 'form', 'input', 'button', 'iframe', 'frame', 'frameset']
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi')
    html = html.replace(regex, '')
  })
  
  return html
}

/**
 * Escapes HTML characters in plain text
 */
function escapeHTML(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
