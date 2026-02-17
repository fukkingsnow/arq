import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
} from '@nestjs/common';

/**
 * TransformPipe - Transform input data types
 *
 * Transforms incoming request data:
 * - Strings to numbers, booleans, dates
 * - Trims whitespace
 * - Converts null/undefined intelligently
 * - Handles nested objects
 *
 * @injectable
 */
@Injectable()
export class TransformPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any {
    if (value === null || value === undefined) {
      return value;
    }

    const { type, metatype } = metadata;

    // Transform based on metatype
    if (metatype === Number) {
      return this.transformNumber(value);
    } else if (metatype === Boolean) {
      return this.transformBoolean(value);
    } else if (metatype === Date) {
      return this.transformDate(value);
    } else if (metatype === String) {
      return this.transformString(value);
    }

    return value;
  }

  /**
   * Transform to number
   */
  private transformNumber(value: any): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  /**
   * Transform to boolean
   */
  private transformBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return [
        'true',
        '1',
        'yes',
        'on',
      ].includes(value.toLowerCase());
    }
    return Boolean(value);
  }

  /**
   * Transform to date
   */
  private transformDate(value: any): Date | null {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Transform to string
   */
  private transformString(value: any): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    return String(value).trim();
  }
}
