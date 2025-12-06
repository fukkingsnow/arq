# Phase 17 Step 5: Inter-Process Communication Framework
## Message Passing & RPC System for Distributed Browser Architecture

**Phase**: 17 (Browser Framework)  
**Step**: 5 of 9  
**Duration**: 3-4 days  
**Lines of Specification**: 240+  
**Focus**: IPC protocols, async messaging, request-response patterns  
**Status**: IN PROGRESS ✓

---

## 1. IPC ARCHITECTURE OVERVIEW

The Inter-Process Communication framework enables reliable, efficient message passing between browser processes (main, renderer, plugin, worker) with strong typing, error handling, and performance monitoring.

### 1.1 Process Communication Topology
```
┌──────────────────────────────────────────┐
│         BROWSER MAIN PROCESS             │
│    (UI, Window Management, IPC Router)   │
├──────────────────┬───────────────────────┤
│  IPC Hub         │ Message Queue (Ring)  │
│  - Route messages│ - In-memory buffer    │
│  - Load balance  │ - 100MB capacity      │
│  - Monitor perf  │ - Lock-free ops       │
└──────┬───────────┴────┬─────────┬────────┘
       │                │         │
   [Renderer 1]    [Renderer N]  [GPU Proc]
   [Plugin 1]      [Network]     [Worker]
```

### 1.2 Message Flow
```
Sender Process:
  ↓
Create IPCMessage (typed)
  ↓
Serialize JSON
  ↓
Add to sender queue
  ↓
Signal receiver (eventfd/PostMessage)
  ↓
Receiver Process:
  ↓
Dequeue message
  ↓
Deserialize & validate
  ↓
Route to handler (by method)
  ↓
Handler executes
  ↓
Create response IPCResponse
  ↓
Send back to sender (async)
```

---

## 2. MESSAGE PROTOCOL

### 2.1 Message Structure
```typescript
interface IPCMessage {
  // Identification
  id: string;                    // UUID v4
  sequence: number;              // For ordering
  
  // Routing
  type: 'request' | 'response' | 'notification' | 'batch';
  source: string;                // 'main' | 'renderer-1' | 'plugin-a'
  target?: string;               // target process
  method: string;                // e.g., 'arq.executeCommand'
  
  // Payload
  args: unknown[];               // Method arguments
  options?: {
    timeout: number;             // 5000ms default
    priority: 'high' | 'normal' | 'low';
    requiresResponse: boolean;   // Default: true
    retryCount: number;          // Auto-retry on failure
  };
  
  // Metadata
  timestamp: number;             // ISO timestamp in ms
  processId: number;             // PID of sender
  threadId: number;              // TID of sender
}

interface IPCResponse {
  requestId: string;             // Original message ID
  status: 'ok' | 'error' | 'timeout';
  result?: unknown;              // Success payload
  error?: {
    code: string;                // e.g., 'PERMISSION_DENIED'
    message: string;
    stack?: string;              // In debug mode only
  };
  duration: number;              // Execution time in ms
}
```

### 2.2 Message Routing
```typescript
interface IPCRouter {
  // Register handlers
  registerHandler(method: string, handler: Handler): void;
  registerNamespace(namespace: string, handlers: Record<string, Handler>): void;
  
  // Send messages
  async send(message: IPCMessage): Promise<IPCResponse>;
  async sendTo(targetProcess: string, message: IPCMessage): Promise<IPCResponse>;
  broadcast(message: IPCMessage, filter?: ProcessFilter): Promise<IPCResponse[]>;
  
  // Direct RPC
  async call(method: string, ...args: unknown[]): Promise<unknown>;
}
```

---

## 3. ASYNC RPC PATTERN

### 3.1 Promise-based Request-Response
```typescript
// Client (Renderer Process)
async function executeCommand(commandId: string) {
  const message: IPCMessage = {
    id: uuid(),
    type: 'request',
    source: 'renderer-1',
    target: 'main',
    method: 'arq.executeCommand',
    args: [{ commandId, context: getUserContext() }],
    options: { timeout: 5000, requiresResponse: true }
  };
  
  const response = await ipcRouter.send(message);
  
  if (response.status === 'ok') {
    console.log('Command executed:', response.result);
  } else {
    handleError(response.error);
  }
}

// Server (Main Process)
ipcRouter.registerHandler('arq.executeCommand', async (args) => {
  const [{ commandId, context }] = args;
  
  // Execute command logic
  const result = await executeCommandLogic(commandId, context);
  
  // Return result (auto-wrapped in IPCResponse)
  return result;
});
```

### 3.2 Notification Pattern (Fire & Forget)
```typescript
async function logUserInteraction(interaction: UserInteraction) {
  const message: IPCMessage = {
    id: uuid(),
    type: 'notification',
    source: 'renderer-1',
    target: 'main',
    method: 'arq.logInteraction',
    args: [interaction],
    options: { requiresResponse: false }  // No response expected
  };
  
  // Send and immediately return (don't wait)
  await ipcRouter.send(message);
}
```

### 3.3 Batch Messages
```typescript
// Send multiple messages in one batch
const batch: IPCMessage = {
  id: uuid(),
  type: 'batch',
  source: 'renderer-1',
  target: 'main',
  args: [
    { method: 'arq.logEvent', args: [event1] },
    { method: 'arq.logEvent', args: [event2] },
    { method: 'arq.logEvent', args: [event3] }
  ]
};

await ipcRouter.send(batch);
```

---

## 4. TRANSPORT MECHANISM

### 4.1 Named Pipes (Unix Sockets)
```
Local machine IPC:
├── /tmp/arqium-ipc-router.sock (main process socket)
├── /tmp/arqium-renderer-1.sock (renderer 1 socket)
├── /tmp/arqium-plugin-a.sock (plugin A socket)
└── /tmp/arqium-gpu.sock (GPU process socket)

Each process connects to router and exchanges messages
```

### 4.2 Shared Memory Ring Buffers
```typescript
// High-performance for hot paths
class SharedMemoryBuffer {
  // Ring buffer layout
  // [head_ptr (8b)][tail_ptr (8b)][data: 100MB]
  
  async write(message: IPCMessage): Promise<void>;
  async read(timeoutMs: number): Promise<IPCMessage | null>;
}
```

### 4.3 Message Queue Implementation
```typescript
interface MessageQueue {
  capacity: number;             // 1000 messages default
  highWaterMark: number;        // 80% capacity = pause senders
  lowWaterMark: number;         // 20% capacity = resume senders
  
  // Async queue operations
  async enqueue(message: IPCMessage): Promise<void>;
  async dequeue(timeoutMs: number): Promise<IPCMessage | null>;
  async size(): Promise<number>;
  async clear(): Promise<void>;
}
```

---

## 5. ERROR HANDLING & RESILIENCE

### 5.1 Failure Scenarios
```
Scenario: Target process crashed
Solution: Router detects disconnection → return error response with code 'TARGET_UNAVAILABLE'

Scenario: Message timeout (5s default)
Solution: Cancel request, retry with exponential backoff, eventually fail

Scenario: Malformed message
Solution: Validation error response, log for debugging

Scenario: Handler throws exception
Solution: Catch error, wrap in IPCResponse with code 'HANDLER_ERROR'

Scenario: Process hung
Solution: Watchdog timer → process restart → reconnect to router
```

### 5.2 Retry Strategy
```typescript
interface RetryPolicy {
  maxRetries: number;           // 3 default
  initialDelayMs: number;       // 100ms
  maxDelayMs: number;           // 5000ms
  backoffMultiplier: number;    // 2.0x
  
  // Jitter to avoid thundering herd
  addJitter(delay: number): number;
}

async function sendWithRetry(message: IPCMessage, policy: RetryPolicy) {
  for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
    try {
      return await ipcRouter.send(message);
    } catch (error) {
      if (attempt < policy.maxRetries && isRetryable(error)) {
        const delay = calculateBackoff(attempt, policy);
        await sleep(delay + policy.addJitter(delay));
      } else {
        throw error;
      }
    }
  }
}
```

---

## 6. PERFORMANCE MONITORING

### 6.1 Message Metrics
```typescript
interface IPCMetrics {
  // Throughput
  messagesPerSecond: number;
  bytesPerSecond: number;
  
  // Latency
  p50Latency: number;           // 50th percentile
  p95Latency: number;           // 95th percentile
  p99Latency: number;           // 99th percentile
  maxLatency: number;
  
  // Queue stats
  avgQueueSize: number;
  maxQueueSize: number;
  dropCount: number;            // Messages dropped due to queue overflow
  
  // Error rates
  errorRate: number;            // Percentage of failed messages
  timeoutRate: number;
  retryRate: number;
}

// Metrics collected per method, per process pair
// Reported every 60 seconds
```

### 6.2 Monitoring & Alerting
```
Alert thresholds:
- P95 latency > 100ms → WARNING
- P99 latency > 500ms → CRITICAL
- Error rate > 5% → CRITICAL
- Message drop rate > 1% → WARNING
- Queue backlog > 500 messages → WARNING
```

---

## 7. SECURITY & VALIDATION

### 7.1 Message Validation
```typescript
// Strict schema validation on message arrival
function validateIPCMessage(data: unknown): IPCMessage {
  // Type check all fields
  // Validate method name against whitelist
  // Limit message size (10MB max)
  // Deserialize args safely
  
  return validatedMessage;
}
```

### 7.2 Process Isolation
```
- Each process validates sender identity
- Only allow communication between authorized process pairs
- Signature verification for critical messages
- Encryption for sensitive data in flight
```

---

## 8. IMPLEMENTATION ROADMAP

**Step 5 Deliverables**:
- ✓ IPC architecture specification
- ✓ Message protocol definition (TypeScript interfaces)
- ✓ Async RPC pattern examples
- ✓ Transport mechanism options
- ✓ Error handling & resilience strategies
- ✓ Performance monitoring framework
- ✓ Security & validation procedures

**Next: Step 6 - Rendering Pipeline Optimization**

---

**Document Version**: 1.0  
**Phase**: 17 Step 5  
**Lines**: 240+  
**Status**: IPC Framework Specification Complete
