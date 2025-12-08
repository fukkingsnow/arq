import { DialogContext, IPipe, PipeMetadata, PipeResult } from '../interfaces';

/**
 * BasePipe - Abstract base class for all ARQ pipes
 * Provides common functionality for dialogue processing pipes
 */
export abstract class BasePipe implements IPipe {
  public name: string;
  public metadata: PipeMetadata;

  constructor(name: string, metadata: Omit<PipeMetadata, 'name'>) {
    this.name = name;
    this.metadata = {
      name,
      ...metadata,
    };
  }

  /**
   * Default implementation - checks if metadata is enabled
   * Can be overridden by subclasses for custom validation
   */
  canProcess(context: DialogContext): boolean {
    return this.metadata.enabled;
  }

  /**
   * Execute the pipe - abstract method to be implemented by subclasses
   */
  abstract execute(context: DialogContext): Promise<PipeResult>;

  /**
   * Get pipe metadata
   */
  getMetadata(): PipeMetadata {
    return { ...this.metadata };
  }

  /**
   * Create a successful result
   */
  protected createSuccessResult<T = any>(
    data?: T,
    context?: DialogContext,
  ): PipeResult<T> {
    return {
      success: true,
      data,
      context,
    };
  }

  /**
   * Create an error result
   */
  protected createErrorResult(
    error: string,
    context?: DialogContext,
  ): PipeResult {
    return {
      success: false,
      error,
      context,
    };
  }
}
