import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum BrowserType {
  CHROME = 'chrome',
  FIREFOX = 'firefox',
  WEBKIT = 'webkit',
}

export class CreateBrowserSessionDto {
  @ApiProperty({
    description: 'Browser type to launch',
    enum: BrowserType,
    example: BrowserType.CHROME,
  })
  @IsEnum(BrowserType)
  browserType: BrowserType = BrowserType.CHROME;

  @ApiProperty({
    description: 'Optional browser launch arguments',
    example: '--no-sandbox',
    required: false,
  })
  @IsOptional()
  @IsString()
  args?: string;

  @ApiProperty({
    description: 'Enable headless mode',
    example: true,
    required: false,
  })
  @IsOptional()
  headless?: boolean = true;
}

export class BrowserSessionResponseDto {
  @ApiProperty({
    description: 'Unique session identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Unique browser session ID',
    example: 'sess_abc123xyz',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Browser type',
    enum: BrowserType,
  })
  browserType: BrowserType;

  @ApiProperty({
    description: 'Session status',
    example: 'active',
  })
  status: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-12-11T23:00:00Z',
  })
  createdAt: Date;
}
