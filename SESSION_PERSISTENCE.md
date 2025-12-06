# Phase 18, Step 2: Session Management & Persistence

## Overview
This phase implements comprehensive session persistence, allowing users to seamlessly resume browsing sessions across browser restarts, with full tab state recovery and automatic crash recovery.

## 2.1 Session Storage Architecture

```typescript
// IndexedDB schema for session storage
interface SessionStore {
  sessionId: string;
  userId: string;
  createdAt: Date;
  lastModified: Date;
  tabSessions: TabSessionState[];
  windowState: WindowState;
  appState: ApplicationState;
  metadata: SessionMetadata;
}

interface TabSessionState {
  tabId: string;
  url: string;
  title: string;
  favicon: string;
  scrollPosition: { x: number; y: number };
  formData: Record<string, any>;
  cookies: CookieState[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  index: number; // Tab index/order
  isActive: boolean;
  timestamp: Date;
  historyStack: HistoryEntry[];
}

interface WindowState {
  windowId: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  state: 'normal' | 'maximized' | 'minimized';
  tabs: string[]; // Tab IDs in order
  focusedTabId: string;
}

class SessionPersistence {
  private db: IDBDatabase;
  private sessionStoreVersion = 1;
  private autoSaveInterval = 30000; // 30 seconds
  private maxSessions = 5;
  
  // Initialize IndexedDB
  async initialize(): Promise<void> {
    const request = indexedDB.open('arqium-sessions', this.sessionStoreVersion);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'sessionId' });
        sessionStore.createIndex('userId', 'userId', { unique: false });
        sessionStore.createIndex('timestamp', 'lastModified', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('tabs')) {
        const tabStore = db.createObjectStore('tabs', { keyPath: 'tabId' });
        tabStore.createIndex('sessionId', 'sessionId', { unique: false });
        tabStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  // Save current session state
  async saveSession(sessionId: string, state: SessionStore): Promise<void> {
    state.lastModified = new Date();
    
    const transaction = this.db.transaction(['sessions', 'tabs'], 'readwrite');
    const sessionStore = transaction.objectStore('sessions');
    const tabStore = transaction.objectStore('tabs');
    
    // Save main session
    await new Promise((resolve, reject) => {
      const request = sessionStore.put(state);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
    
    // Save individual tabs
    for (const tab of state.tabSessions) {
      tab.timestamp = new Date();
      await new Promise((resolve, reject) => {
        const request = tabStore.put(tab);
        request.onsuccess = () => resolve(undefined);
        request.onerror = () => reject(request.error);
      });
    }
  }
  
  // Restore session from storage
  async restoreSession(sessionId: string): Promise<SessionStore | null> {
    const transaction = this.db.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');
    
    return new Promise((resolve, reject) => {
      const request = store.get(sessionId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }
  
  // Get recent sessions for recovery
  async getRecentSessions(userId: string, limit: number = 5): Promise<SessionStore[]> {
    const transaction = this.db.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');
    const index = store.index('userId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(userId);
      request.onsuccess = () => {
        const results = (request.result as SessionStore[])
          .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
          .slice(0, limit);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }
  
  // Clean up old sessions
  async cleanupSessions(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const transaction = this.db.transaction(['sessions', 'tabs'], 'readwrite');
    const sessionStore = transaction.objectStore('sessions');
    const tabStore = transaction.objectStore('tabs');
    const index = sessionStore.index('timestamp');
    
    const range = IDBKeyRange.upperBound(cutoffDate.getTime());
    const sessions = await new Promise<SessionStore[]>((resolve, reject) => {
      const request = index.getAll(range);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    for (const session of sessions) {
      sessionStore.delete(session.sessionId);
    }
  }
}
```

## 2.2 Tab State Serialization

```typescript
class TabStateSerializer {
  // Serialize tab DOM state
  async serializeTabState(tab: Tab): Promise<TabSessionState> {
    const document = tab.getDocument();
    const scrollPos = tab.getScrollPosition();
    
    return {
      tabId: tab.id,
      url: tab.url,
      title: document.title,
      favicon: this.extractFavicon(document),
      scrollPosition: scrollPos,
      formData: this.extractFormData(document),
      cookies: await this.extractCookies(tab.url),
      localStorage: this.extractLocalStorage(),
      sessionStorage: this.extractSessionStorage(),
      index: tab.index,
      isActive: tab.isActive,
      timestamp: new Date(),
      historyStack: tab.getHistoryStack(),
    };
  }
  
  // Deserialize and restore tab state
  async deserializeTabState(state: TabSessionState, tab: Tab): Promise<void> {
    // Restore history
    tab.setHistoryStack(state.historyStack);
    
    // Restore cookies
    for (const cookie of state.cookies) {
      document.cookie = this.serializeCookie(cookie);
    }
    
    // Restore localStorage
    for (const [key, value] of Object.entries(state.localStorage)) {
      localStorage.setItem(key, value);
    }
    
    // Restore sessionStorage
    for (const [key, value] of Object.entries(state.sessionStorage)) {
      sessionStorage.setItem(key, value);
    }
    
    // Restore form data
    this.restoreFormData(tab.getDocument(), state.formData);
    
    // Restore scroll position
    setTimeout(() => {
      tab.setScrollPosition(state.scrollPosition);
    }, 100); // Delay to allow DOM rendering
  }
  
  private extractFormData(document: Document): Record<string, any> {
    const formData: Record<string, any> = {};
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach((input: any) => {
      if (input.name && input.type !== 'password') {
        if (input.type === 'checkbox' || input.type === 'radio') {
          formData[input.name] = input.checked;
        } else {
          formData[input.name] = input.value;
        }
      }
    });
    
    return formData;
  }
  
  private restoreFormData(document: Document, formData: Record<string, any>): void {
    for (const [name, value] of Object.entries(formData)) {
      const element = document.querySelector(`[name="${name}"]`) as any;
      if (element) {
        if (element.type === 'checkbox' || element.type === 'radio') {
          element.checked = value as boolean;
        } else {
          element.value = value;
        }
      }
    }
  }
}
```

## 2.3 Crash Recovery System

```typescript
class CrashRecovery {
  private recoveryCheckInterval = 5000; // 5 seconds
  private sessionCheckpoint: SessionStore | null = null;
  private watchdogActive = false;
  
  // Start crash detection watchdog
  startWatchdog(): void {
    if (this.watchdogActive) return;
    this.watchdogActive = true;
    
    // Write recovery marker
    this.writeRecoveryMarker();
    
    // Monitor browser health
    setInterval(() => {
      this.performHealthCheck();
    }, this.recoveryCheckInterval);
  }
  
  // Handle unexpected crash
  async handleCrashRecovery(sessionId: string): Promise<boolean> {
    const session = await this.getRecoverySession(sessionId);
    if (!session) return false;
    
    // Show recovery dialog
    const shouldRecover = await this.showRecoveryDialog(session);
    
    if (shouldRecover) {
      // Restore all tabs from checkpoint
      await this.restoreAllTabs(session);
      return true;
    }
    
    return false;
  }
  
  // Show recovery UI
  private async showRecoveryDialog(session: SessionStore): Promise<boolean> {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'recovery-dialog';
      dialog.innerHTML = `
        <div class="recovery-content">
          <h2>Restore Previous Session?</h2>
          <p>${session.tabSessions.length} tabs were open</p>
          <div class="recovery-actions">
            <button id="restore-btn">Restore Session</button>
            <button id="start-fresh-btn">Start Fresh</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(dialog);
      
      document.getElementById('restore-btn')?.addEventListener('click', () => {
        dialog.remove();
        resolve(true);
      });
      
      document.getElementById('start-fresh-btn')?.addEventListener('click', () => {
        dialog.remove();
        resolve(false);
      });
    });
  }
  
  // Recovery marker for crash detection
  private writeRecoveryMarker(): void {
    sessionStorage.setItem('crash_marker', Date.now().toString());
  }
  
  private performHealthCheck(): void {
    const marker = sessionStorage.getItem('crash_marker');
    if (!marker) {
      // Crash detected - marker was cleared
      sessionStorage.removeItem('crash_marker');
      this.handleCrashRecovery(sessionStorage.getItem('sessionId') || '');
    }
  }
}
```

## 2.4 Cross-Tab Synchronization

```typescript
class CrossTabSync {
  private channel: BroadcastChannel;
  
  constructor(private sessionId: string) {
    this.channel = new BroadcastChannel(`session-${sessionId}`);
    this.setupListeners();
  }
  
  // Sync state across tabs
  broadcastStateChange(change: StateChange): void {
    this.channel.postMessage({
      type: 'state_change',
      timestamp: Date.now(),
      data: change,
    });
  }
  
  // Listen for changes from other tabs
  private setupListeners(): void {
    this.channel.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'state_change':
          this.applyRemoteChange(data);
          break;
        case 'bookmark_added':
          this.syncBookmark(data);
          break;
        case 'history_updated':
          this.syncHistory(data);
          break;
      }
    };
  }
  
  private applyRemoteChange(change: StateChange): void {
    // Merge remote changes with local state
    // Implement conflict resolution logic
  }
}
```

## Performance Targets

- Session save: < 500ms
- Session restore: < 1s
- Crash detection: < 10s
- Form data preservation: 100%
- Scroll position accuracy: ±5px

## Implementation Priority

1. IndexedDB session storage (HIGH)
2. Tab state serialization (HIGH)
3. Session restoration (HIGH)
4. Crash recovery (MEDIUM)
5. Cross-tab sync (MEDIUM)

---

**Status**: Phase 18 Step 2 - Session Persistence (260 lines)
**Next**: Phase 18 Step 3 - Browser Extensions API
