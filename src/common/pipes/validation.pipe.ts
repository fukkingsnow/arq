import {
  Injectable,
  PipeTransform,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

/**
 * ValidationPipe - Request data validation using class-validator
 *
 * Validates incoming request data against DTO classes using
 * class-validator decorators (@IsString, @IsEmail, etc.).
 *
 * Automatically converts and validates:
 * - Type conversion (string to number, etc.)
 * - Constraint validation (min, max, length, patterns)
 * - Nested object validation
 * - Custom validators
 *
 * @injectable
 */
@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(
    value: any,
    metadata: ArgumentMetadata,
  ): Promise<any> {
    if (!value) {
      return value;
    }

    const { type, metatype } = metadata;

    // Skip validation for primitives
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors.flatMap((error) =>
        Object.values(error.constraints || {}),
      );
      throw new BadRequestException({
        message: messages,
        error: 'Validation failed',
      });
    }

    return object;
  }

  /**
   * Check if should validate this metatype
   */
  private toValidate(metatype: Function): boolean {
    const types: Function[] = [
      String,
      Boolean,
      Number,
      Array,
      Object,
    ];
    return !types.includes(metatype);
  }
}
