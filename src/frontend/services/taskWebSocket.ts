export class TaskWebSocketService {
  private static ws = null;
  private static listeners = {};
  private static reconnectAttempts = 0;
  private static maxReconnect = 5;

  static connect(url = 'wss://arq-ai.ru/api/v1/arq/ws') {
    if (this.ws) return Promise.resolve();

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('[WS] Connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const { type, data } = message;
            if (this.listeners[type]) {
              this.listeners[type].forEach(cb => cb(data));
            }
          } catch (e) {
            console.error('[WS] Parse error:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[WS] Disconnected');
          this.ws = null;
          this.reconnect();
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  static disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  static on(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  static off(type, callback) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    }
  }

  static send(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('[WS] Not connected');
    }
  }

  private static reconnect() {
    if (this.reconnectAttempts < this.maxReconnect) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      console.log(`[WS] Reconnecting in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    }
  }

  static isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}
