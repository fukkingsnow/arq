import { DialogueContext, IPipe, PipeMetadata, PipeResult } from '../interfaces';

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
  canProcess(context: DialogueContext): boolean {
    return this.metadata.enabled;
  }

  /**
   * Execute the pipe - abstract method to be implemented by subclasses
   */
  abstract execute(context: DialogueContext): Promise<PipeResult>;

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
    context?: DialogueContext,
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
    context?: DialogueContext,
  ): PipeResult {
    return {
      success: false,
      error,
      context,
    };
  }
}
