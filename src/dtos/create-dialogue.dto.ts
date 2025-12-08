import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendMessageDTO {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class CreateConversationDTO {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  context?: string;
}

export class DialogueResponseDTO {
  conversationId: string;
  message: string;
  timestamp: Date;
  status: string;
}
