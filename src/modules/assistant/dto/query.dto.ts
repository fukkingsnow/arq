import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class QueryDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  taskId?: string;
}
