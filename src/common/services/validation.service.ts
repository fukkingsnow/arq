import { Injectable, BadRequestException } from '@nestjs/common';

interface ValidationRule {
  type: string;
  value?: any;
  message?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

@Injectable()
export class ValidationService {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  isValidPassword(password: string): {
    valid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    feedback: string[];
  } {
    const feedback: string[] = [];
    const minLength = 8;

    if (password.length < minLength) {
      feedback.push(`Password must be at least ${minLength} characters long`);
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      feedback.push('Password must contain at least one digit');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    }

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (feedback.length === 0) {
      strength = 'strong';
    } else if (feedback.length <= 2) {
      strength = 'medium';
    }

    return {
      valid: feedback.length === 0,
      strength,
      feedback
    };
  }

  /**
   * Validate URL format
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate phone number (international format)
   */
  isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-().]/g, ''));
  }

  /**
   * Validate UUID
   */
  isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate IPv4 address
   */
  isValidIPv4(ip: string): boolean {
    const ipRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
    return ipRegex.test(ip);
  }

  /**
   * Validate object against schema
   */
  validate(
    data: Record<string, any>,
    schema: Record<string, ValidationRule[]>
  ): ValidationResult {
    const errors: Record<string, string[]> = {};
    let isValid = true;

    Object.entries(schema).forEach(([field, rules]) => {
      const value = data[field];
      const fieldErrors: string[] = [];

      rules.forEach(rule => {
        if (!this.validateRule(value, rule)) {
          fieldErrors.push(
            rule.message || `Field '${field}' failed '${rule.type}' validation`
          );
          isValid = false;
        }
      });

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    });

    return { isValid, errors };
  }

  /**
   * Validate single rule
   */
  private validateRule(value: any, rule: ValidationRule): boolean {
    switch (rule.type) {
      case 'required':
        return value !== null && value !== undefined && value !== '';

      case 'email':
        return this.isValidEmail(value);

      case 'url':
        return this.isValidUrl(value);

      case 'phone':
        return this.isValidPhoneNumber(value);

      case 'uuid':
        return this.isValidUUID(value);

      case 'ipv4':
        return this.isValidIPv4(value);

      case 'minLength':
        return value?.length >= rule.value;

      case 'maxLength':
        return value?.length <= rule.value;

      case 'min':
        return value >= rule.value;

      case 'max':
        return value <= rule.value;

      case 'pattern':
        return new RegExp(rule.value).test(value);

      case 'enum':
        return rule.value.includes(value);

      case 'type':
        return typeof value === rule.value;

      case 'array':
        return Array.isArray(value);

      case 'object':
        return typeof value === 'object' && value !== null;

      default:
        return true;
    }
  }

  /**
   * Validate credit card number
   */
  isValidCreditCard(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate date format (ISO 8601)
   */
  isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Validate JSON string
   */
  isValidJSON(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize HTML/XSS
   */
  sanitizeHtml(html: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return html.replace(/[&<>"']/g, char => map[char]);
  }

  /**
   * Validate string length
   */
  isValidStringLength(str: string, minLength: number, maxLength: number): boolean {
    const length = str?.length || 0;
    return length >= minLength && length <= maxLength;
  }

  /**
   * Validate username format
   */
  isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(username);
  }

  /**
   * Validate slug format
   */
  isValidSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
  }

  /**
   * Throw validation error
   */
  throwValidationError(message: string, errors?: Record<string, any>): never {
    throw new BadRequestException({
      message,
      errors,
      statusCode: 400
    });
  }
}
