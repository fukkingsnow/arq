import { Catch, ExceptionFilter, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';

export class DialogueException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly code?: string,
  ) {
    super(message, status);
  }
}

@Catch(DialogueException)
export class DialogueExceptionFilter implements ExceptionFilter {
  private logger = new Logger(DialogueExceptionFilter.name);

  catch(exception: DialogueException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    this.logger.error(
      `Dialogue Exception: ${exception.message} [${exception.code}]`,
      exception.stack,
    );

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      code: exception.code,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    });
  }
}
