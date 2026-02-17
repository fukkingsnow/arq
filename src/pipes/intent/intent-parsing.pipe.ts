import { BasePipe } from '../base/base.pipe';
import { DialogueContext, IPipe, PipeResult } from '../interfaces';

/**
 * IntentParsingPipe - Extracts intent/action type from dialogue message
 * Recognizes keywords to determine action: navigate, click, search, scroll, type, etc.
 */
export class IntentParsingPipe extends BasePipe {
  private readonly intentPatterns: Record<string, RegExp> = {
    navigate: /(navigate|go to|open|visit|load|open url|go|visit|browse)/i,
    click: /(click|press|hit|tap|select|choose)/i,
    scroll: /(scroll|scroll down|scroll up|page down|page up)/i,
    type: /(type|type enter|write|input|fill in|type in)/i,
    wait: /(wait|pause|hold on|wait for)/i,
    close: /(close|exit|quit|back|return)/i,
  };

  constructor() {
    super('IntentParsingPipe', {
      description: 'Extracts intent/action type from dialogue message',
      version: '1.0.0',
      priority: 90,
      enabled: true,
    });
  }

  async execute(context: DialogueContext): Promise<PipeResult> {
    try {
      const intent = this.parseIntent(context.message);
      return this.createSuccessResult(
        {
          intent,
          confidence: intent ? 0.8 : 0,
          ...context,
        },
        context,
      );
    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : String(error),
        context,
      );
    }
  }

  private parseIntent(message: string): string | undefined {
    for (const [intent, pattern] of Object.entries(this.intentPatterns)) {
      if (pattern.test(message)) {
        return intent;
      }
    }
    return undefined;
  }
}
