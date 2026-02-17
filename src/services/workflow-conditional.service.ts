import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class WorkflowConditionalService {
  /**
   * Evaluate condition expression against execution context
   */
  evaluateCondition(
    condition: string,
    context: Record<string, any>,
  ): boolean {
    try {
      // Parse and evaluate condition
      const func = new Function('ctx', `return ${condition}`);
      return Boolean(func(context));
    } catch (error) {
      throw new BadRequestException(
        `Invalid condition expression: ${error.message}`,
      );
    }
  }

  /**
   * Evaluate if/else branching
   */
  evaluateBranch(
    condition: string,
    trueCase: any,
    falseCase: any,
    context: Record<string, any>,
  ): any {
    return this.evaluateCondition(condition, context) ? trueCase : falseCase;
  }

  /**
   * Evaluate switch/case logic
   */
  evaluateSwitch(
    value: any,
    cases: Record<string, any>,
    defaultCase?: any,
  ): any {
    return cases[value] !== undefined ? cases[value] : defaultCase;
  }

  /**
   * Compare two values
   */
  compare(
    left: any,
    operator: string,
    right: any,
  ): boolean {
    switch (operator) {
      case '==':
      case 'equals':
        return left == right;
      case '===':
        return left === right;
      case '!=':
        return left != right;
      case '!==':
        return left !== right;
      case '<':
        return left < right;
      case '>':
        return left > right;
      case '<=':
        return left <= right;
      case '>=':
        return left >= right;
      case 'contains':
        return String(left).includes(String(right));
      case 'in':
        return String(right).includes(String(left));
      default:
        throw new BadRequestException(`Unknown operator: ${operator}`);
    }
  }

  /**
   * Validate condition syntax
   */
  validateCondition(condition: string): { valid: boolean; error?: string } {
    try {
      new Function('ctx', `return ${condition}`);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}
