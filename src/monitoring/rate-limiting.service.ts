import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

interface ClientQuota {
  clientId: string;
  requestCount: number;
  resetTime: number;
  blocked: boolean;
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  nextRetryTime?: number;
}

@Injectable()
export class RateLimitingService {
  private readonly logger = new Logger(RateLimitingService.name);
  private clientQuotas: Map<string, ClientQuota> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();

  private readonly defaultRequestsPerMinute = 60;
  private readonly defaultBlockDuration = 60000; // 1 minute
  private readonly circuitBreakerThreshold = 5;
  private readonly circuitBreakerTimeout = 30000; // 30 seconds

  /**
   * Check if client is allowed to make request
   */
  checkRateLimit(clientId: string, requestsPerMinute: number = this.defaultRequestsPerMinute): boolean {
    const now = Date.now();
    let quota = this.clientQuotas.get(clientId);

    if (!quota) {
      quota = {
        clientId,
        requestCount: 1,
        resetTime: now + 60000,
        blocked: false,
      };
      this.clientQuotas.set(clientId, quota);
      return true;
    }

    // Reset quota if time window has passed
    if (now > quota.resetTime) {
      quota.requestCount = 1;
      quota.resetTime = now + 60000;
      quota.blocked = false;
      return true;
    }

    // Check if client is blocked
    if (quota.blocked) {
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    // Check request limit
    if (quota.requestCount >= requestsPerMinute) {
      quota.blocked = true;
      setTimeout(() => {
        quota!.blocked = false;
      }, this.defaultBlockDuration);
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    quota.requestCount++;
    return true;
  }

  /**
   * Get remaining quota for client
   */
  getRemainingQuota(clientId: string, requestsPerMinute: number = this.defaultRequestsPerMinute): number {
    const quota = this.clientQuotas.get(clientId);
    if (!quota) {
      return requestsPerMinute;
    }

    const now = Date.now();
    if (now > quota.resetTime) {
      return requestsPerMinute;
    }

    return Math.max(0, requestsPerMinute - quota.requestCount);
  }

  /**
   * Circuit breaker: check if service is available
   */
  checkCircuitBreaker(serviceName: string): boolean {
    const breaker = this.circuitBreakers.get(serviceName) || this.initializeBreaker(serviceName);

    if (breaker.state === 'CLOSED') {
      return true;
    }

    if (breaker.state === 'OPEN') {
      const now = Date.now();
      if (now > (breaker.nextRetryTime || 0)) {
        breaker.state = 'HALF_OPEN';
        breaker.successCount = 0;
        return true;
      }
      throw new HttpException('Service temporarily unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }

    // HALF_OPEN state
    return true;
  }

  /**
   * Record successful call
   */
  recordSuccess(serviceName: string): void {
    let breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      breaker = this.initializeBreaker(serviceName);
    }

    if (breaker.state === 'HALF_OPEN') {
      breaker.successCount++;
      if (breaker.successCount >= 2) {
        breaker.state = 'CLOSED';
        breaker.failureCount = 0;
        this.logger.log(`Circuit breaker for ${serviceName} closed`);
      }
    } else if (breaker.state === 'CLOSED') {
      breaker.failureCount = Math.max(0, breaker.failureCount - 1);
    }
  }

  /**
   * Record failed call
   */
  recordFailure(serviceName: string): void {
    let breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      breaker = this.initializeBreaker(serviceName);
    }

    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failureCount >= this.circuitBreakerThreshold) {
      breaker.state = 'OPEN';
      breaker.nextRetryTime = Date.now() + this.circuitBreakerTimeout;
      this.logger.warn(`Circuit breaker for ${serviceName} opened`);
    }
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(serviceName: string): CircuitBreakerState {
    return (
      this.circuitBreakers.get(serviceName) || this.initializeBreaker(serviceName)
    );
  }

  /**
   * Initialize circuit breaker
   */
  private initializeBreaker(serviceName: string): CircuitBreakerState {
    const breaker: CircuitBreakerState = {
      state: 'CLOSED',
      failureCount: 0,
      successCount: 0,
    };
    this.circuitBreakers.set(serviceName, breaker);
    return breaker;
  }

  /**
   * Cleanup old quota records
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [clientId, quota] of this.clientQuotas.entries()) {
      if (now > quota.resetTime + 300000) {
        // Keep for 5 minutes after reset
        this.clientQuotas.delete(clientId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} quota records`);
    }
  }
}
