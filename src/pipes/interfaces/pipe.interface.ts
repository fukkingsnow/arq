/**
 * Pipe Interface - Base contract for all dialogue processing pipes
 *
 * A pipe is a modular processing unit that transforms dialogue context
 * and can be composed into a processing pipeline
 */

export interface DialogueContext {
  message: string;
  userId: string;
  sessionId: string;
  intent?: string;
  intentId?: string;
  entities?: Record<string, any>;
  memory?: Record<string, any>;
  metadata?: Record<string, any>;
  enriched?: boolean;
  routed?: boolean;
  transformed?: boolean;
  route?: string;
  fieldsAdded?: string[];
  transformationCount?: number;
  conversationDepth?: number;
  userAgentAnalyzed?: boolean;
  messageSentiment?: string;
  detectedLanguage?: string;
  priorityScore?: number;
  [key: string]: any;
}

export interface PipeResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  context?: DialogueContext;
  metadata?: {
    name?: string;
    duration?: number;
    executedPipes?: any[];
    pipelineExecuted?: string;
    errorHandled?: boolean;
  };
}

export interface IPipe {
  /**
   * Unique identifier for the pipe
   */
  readonly name: string;

  readonly metadata?: {
    name: string;
    priority?: number;
  };

  /**
   * Execute the pipe logic
   */
  execute(context: DialogueContext): Promise<PipeResult>;

  /**
   * Validate if the pipe can be applied to this context
   */
  canProcess(context: DialogueContext): boolean;

  /**
   * Get pipe metadata
   */
  getMetadata(): PipeMetadata;
}

export interface PipeMetadata {
  name: string;
  description: string;
  version: string;
  priority: number;
  enabled: boolean;
}
