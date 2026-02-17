import { Injectable } from '@nestjs/common';

export interface DialogueConfig {
  maxMessageLength: number;
  enableContextEnrichment: boolean;
  enableIntentParsing: boolean;
  contextWindowSize: number;
  conversationTimeout: number;
  maxConcurrentConversations: number;
}

@Injectable()
export class DialogueConfigService {
  private config: DialogueConfig = {
    maxMessageLength: 2000,
    enableContextEnrichment: true,
    enableIntentParsing: true,
    contextWindowSize: 5,
    conversationTimeout: 3600000, // 1 hour
    maxConcurrentConversations: 100,
  };

  getConfig(): DialogueConfig {
    return { ...this.config };
  }

  getConfigValue<K extends keyof DialogueConfig>(
    key: K,
  ): DialogueConfig[K] {
    return this.config[key];
  }

  setConfigValue<K extends keyof DialogueConfig>(
    key: K,
    value: DialogueConfig[K],
  ): void {
    this.config[key] = value;
  }

  updateConfig(partial: Partial<DialogueConfig>): void {
    this.config = { ...this.config, ...partial };
  }
}
