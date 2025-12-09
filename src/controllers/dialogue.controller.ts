import { Controller, Post, Get, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { DialogueService } from '../services/dialogue.service';
import { ConversationManager } from '../services/conversation.manager';
import { DialogueHistoryService } from '../services/dialogue-history.service';

@Controller('api/dialogue')
export class DialogueController {
  constructor(
    private readonly dialogueService: DialogueService,
    private readonly conversationManager: ConversationManager,
    private readonly historyService: DialogueHistoryService,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Body() dto: { conversationId: string; message: string; userId: string; sessionId: string },
  ) {
    return this.dialogueService.processDialogue({
      conversationId: dto.conversationId,
      message: dto.message,
      userId: dto.userId,
      sessionId: dto.sessionId,
    });
  }

  @Get('conversation/:id')
  async getConversation(@Param('id') conversationId: string) {
    return this.conversationManager.getConversation(conversationId);
  }

  @Post('conversation')
  @HttpCode(HttpStatus.CREATED)
  async createConversation(
    @Body() dto: { sessionId: string; userId: string },
  ) {
    return this.conversationManager.createConversation(dto.sessionId, dto.userId);
  }

  @Get('history/:conversationId')
  async getHistory(@Param('conversationId') conversationId: string) {
    return this.historyService.getHistory(conversationId);
  }

  @Post('history/:conversationId/clear')
  @HttpCode(HttpStatus.OK)
  async clearHistory(@Param('conversationId') conversationId: string) {
    return this.historyService.clearHistory(conversationId);
  }
}
