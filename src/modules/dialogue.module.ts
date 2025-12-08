import { Module } from '@nestjs/common';
import { DialogueService } from '../services/dialogue.service';
import { ConversationManager } from '../services/conversation.manager';
import { DialogueHistoryService } from '../services/dialogue-history.service';

@Module({
  providers: [
    DialogueService,
    ConversationManager,
    DialogueHistoryService,
  ],
  exports: [
    DialogueService,
    ConversationManager,
    DialogueHistoryService,
  ],
})
export class DialogueModule {}
