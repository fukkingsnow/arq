# Phase 18, Step 3: Browser Extensions API

## Overview
This phase implements a comprehensive, WebExtensions-compatible API for third-party developers to create extensions that enhance ARQIUM browser functionality with content scripts, background workers, and native API access.

## 3.1 Extension Manifest & Metadata

```typescript
// Extension manifest schema (manifest.json v3)
interface ExtensionManifest {
  manifest_version: 3;
  name: string;
  version: string;
  description?: string;
  icons?: Record<string, string>;
  action?: {
    default_icon?: string;
    default_title?: string;
    default_popup?: string;
  };
  permissions: Permission[];
  host_permissions?: string[];
  content_scripts?: ContentScript[];
  background?: {
    service_worker: string;
  };
  web_accessible_resources?: WebAccessibleResource[];
  commands?: Record<string, Command>;
}

type Permission = 
  | 'storage' | 'cookies' | 'webRequest' | 'webNavigation'
  | 'tabs' | 'activeTab' | 'scripting'
  | 'bookmarks' | 'history' | 'downloads'
  | 'idle' | 'power' | 'nativeMessaging';

interface ContentScript {
  matches: string[];
  js: string[];
  css?: string[];
  run_at?: 'document_start' | 'document_end' | 'document_idle';
  all_frames?: boolean;
}

class ExtensionManifestValidator {
  // Validate manifest against schema
  validateManifest(manifest: any): ValidationResult {
    const errors: string[] = [];
    
    if (!manifest.manifest_version || manifest.manifest_version !== 3) {
      errors.push('Invalid manifest_version');
    }
    
    if (!manifest.name || manifest.name.length === 0) {
      errors.push('Extension name is required');
    }
    
    if (!manifest.version || !this.isValidVersion(manifest.version)) {
      errors.push('Invalid version format');
    }
    
    // Validate permissions
    if (!Array.isArray(manifest.permissions)) {
      errors.push('Permissions must be an array');
    } else {
      for (const perm of manifest.permissions) {
        if (!this.isValidPermission(perm)) {
          errors.push(`Unknown permission: ${perm}`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
```

## 3.2 Extension Loader & Sandbox

```typescript
interface LoadedExtension {
  id: string;
  manifest: ExtensionManifest;
  baseUrl: string;
  permissions: Permission[];
  contentScripts: ContentScript[];
  serviceWorker?: SharedWorker;
  isEnabled: boolean;
}

class ExtensionLoader {
  private extensions: Map<string, LoadedExtension> = new Map();
  private sandboxes: Map<string, ServiceWorkerContainer> = new Map();
  
  // Load extension from package
  async loadExtension(extensionPath: string): Promise<string> {
    // 1. Extract and validate manifest
    const manifest = await this.loadManifest(extensionPath);
    const validation = this.validateManifest(manifest);
    
    if (!validation.valid) {
      throw new Error(`Invalid extension: ${validation.errors.join(', ')}`);
    }
    
    // 2. Create sandboxed environment
    const extensionId = this.generateExtensionId();
    const baseUrl = `chrome-extension://${extensionId}/`;
    
    // 3. Load service worker (background script)
    if (manifest.background?.service_worker) {
      await this.loadServiceWorker(extensionId, manifest.background.service_worker);
    }
    
    // 4. Inject content scripts
    if (manifest.content_scripts) {
      await this.injectContentScripts(extensionId, manifest.content_scripts);
    }
    
    // 5. Register extension
    const extension: LoadedExtension = {
      id: extensionId,
      manifest,
      baseUrl,
      permissions: manifest.permissions,
      contentScripts: manifest.content_scripts || [],
      isEnabled: true,
    };
    
    this.extensions.set(extensionId, extension);
    return extensionId;
  }
  
  // Service worker initialization
  private async loadServiceWorker(extensionId: string, workerScript: string): Promise<void> {
    const worker = new SharedWorker(workerScript, {
      type: 'module',
    });
    
    // Create isolated global scope
    const scope = this.createExtensionScope(extensionId);
    
    // Port for communication
    worker.port.start();
    worker.port.onmessage = (event) => this.handleWorkerMessage(extensionId, event);
    
    this.sandboxes.set(extensionId, worker);
  }
  
  // Content script injection
  private async injectContentScripts(extensionId: string, scripts: ContentScript[]): Promise<void> {
    for (const script of scripts) {
      // Match against current pages
      const tabs = await this.getMatchingTabs(script.matches);
      
      for (const tab of tabs) {
        const injector = new ContentScriptInjector(extensionId, this.createExtensionScope(extensionId));
        await injector.inject(tab, script);
      }
    }
  }
  
  // Create isolated scope for extension
  private createExtensionScope(extensionId: string): ExtensionGlobalScope {
    return {
      chrome: this.createChromeAPI(extensionId),
      extensionId,
    };
  }
}
```

## 3.3 Content Script Injection

```typescript
class ContentScriptInjector {
  constructor(
    private extensionId: string,
    private scope: ExtensionGlobalScope,
  ) {}
  
  // Inject script into page
  async inject(tab: Tab, script: ContentScript): Promise<void> {
    const document = tab.getDocument();
    
    // 1. Inject CSS if specified
    if (script.css) {
      for (const cssPath of script.css) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `chrome-extension://${this.extensionId}/${cssPath}`;
        document.head.appendChild(link);
      }
    }
    
    // 2. Inject JavaScript with isolated context
    for (const jsPath of script.js) {
      const scriptEl = document.createElement('script');
      scriptEl.src = `chrome-extension://${this.extensionId}/${jsPath}`;
      
      // Create message port for content script <-> background communication
      const port = this.createMessagePort();
      (scriptEl as any).__port__ = port;
      
      document.head.appendChild(scriptEl);
    }
  }
  
  // Isolated message port for content <-> background communication
  private createMessagePort(): MessagePort {
    const channel = new MessageChannel();
    const port = channel.port1;
    
    port.onmessage = (event) => {
      // Route messages from content script to background worker
      this.routeMessage(event.data);
    };
    
    return channel.port2;
  }
  
  private routeMessage(message: any): void {
    // Route to appropriate handler based on message.method
    // Implement rate limiting and permission checking
  }
}
```

## 3.4 Extension APIs

```typescript
// Core extension APIs
interface ChromeAPI {
  runtime: RuntimeAPI;
  storage: StorageAPI;
  tabs: TabsAPI;
  cookies: CookiesAPI;
  webNavigation: WebNavigationAPI;
  bookmarks: BookmarksAPI;
  history: HistoryAPI;
  idle: IdleAPI;
}

class RuntimeAPI {
  // Get extension ID
  getId(): string {
    return chrome.extension.id;
  }
  
  // Send message to background
  sendMessage(message: any, callback?: (response: any) => void): void {
    // Send to background worker
  }
  
  // Listen for messages
  onMessage = {
    addListener: (callback: MessageCallback) => {
      // Register message handler
    },
  };
  
  // Get extension URL
  getURL(path: string): string {
    return `chrome-extension://${this.getId()}/${path}`;
  }
}

class StorageAPI {
  async get(keys: string[]): Promise<Record<string, any>> {
    // Access isolated extension storage
    return this.accessEncryptedStorage(keys);
  }
  
  async set(items: Record<string, any>): Promise<void> {
    // Store with encryption
    return this.saveEncryptedStorage(items);
  }
  
  async remove(keys: string[]): Promise<void> {
    // Remove from storage
  }
  
  private async accessEncryptedStorage(keys: string[]): Promise<Record<string, any>> {
    // Fetch from IndexedDB with user key decryption
    return {};
  }
}

class TabsAPI {
  async query(queryInfo: TabQueryInfo): Promise<Tab[]> {
    // Query tabs matching criteria
    // Only return tabs user has permitted access to
    return [];
  }
  
  async sendMessage(tabId: number, message: any): Promise<any> {
    // Send message to content script in tab
    return {};
  }
  
  async executeScript(tabId: number, details: ScriptDetails): Promise<any[]> {
    // Execute script with permission check
    return [];
  }
}
```

## 3.5 Permission System & Sandboxing

```typescript
class ExtensionPermissionManager {
  // Verify extension permission
  hasPermission(extensionId: string, permission: Permission): boolean {
    const ext = this.getExtension(extensionId);
    return ext.permissions.includes(permission);
  }
  
  // Enforce API access
  enforceAPIAccess(extensionId: string, api: string): void {
    const permissionRequired = this.getPermissionForAPI(api);
    
    if (!this.hasPermission(extensionId, permissionRequired)) {
      throw new Error(`Extension lacks permission: ${permissionRequired}`);
    }
  }
  
  // Show permission prompt to user
  async requestPermission(extensionId: string, permission: Permission): Promise<boolean> {
    // Display prompt dialog
    // Return user decision
    return false;
  }
}

class ExtensionSandbox {
  // Prevent extension from accessing sensitive APIs
  private restrictedAPIs = [
    'eval',
    'Function',
    'document.write',
    'innerHTML', // Only for allowed elements
  ];
  
  // Create CSP header for extension
  generateCSPHeader(extensionId: string): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'wasm-unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
    ].join('; ');
  }
  
  // Proxy globals to prevent access
  createSandboxGlobals(): Record<string, any> {
    return {
      window: this.createProxyObject(),
      document: this.createProxyObject(),
      localStorage: this.createStorageProxy(),
      // ... other globals
    };
  }
}
```

## 3.6 Extension Store & Management

```typescript
class ExtensionStore {
  // List installed extensions
  async listExtensions(): Promise<InstalledExtension[]> {
    return [];
  }
  
  // Uninstall extension
  async uninstall(extensionId: string): Promise<void> {
    // Clean up resources
    // Remove content scripts
    // Terminate workers
  }
  
  // Enable/disable extension
  async setEnabled(extensionId: string, enabled: boolean): Promise<void> {
    const ext = this.extensions.get(extensionId);
    if (ext) {
      ext.isEnabled = enabled;
      if (!enabled) {
        await this.disableExtension(extensionId);
      } else {
        await this.enableExtension(extensionId);
      }
    }
  }
  
  // Check for updates
  async checkForUpdates(): Promise<ExtensionUpdate[]> {
    // Query extension store for updates
    return [];
  }
}
```

## Security Features

- **CSP Headers**: Prevent XSS and code injection
- **Sandboxed Execution**: Isolated context per extension
- **Permission Model**: User grants specific capabilities
- **API Whitelisting**: Only approved APIs exposed
- **Resource Limits**: CPU, memory, storage quotas
- **Rate Limiting**: Prevent abuse of APIs
- **Audit Logging**: Track extension API calls

## Performance Targets

- Extension load time: < 2s
- Content script injection: < 500ms
- Message latency: < 50ms
- Storage access: < 100ms
- Permission check: < 10ms

## Implementation Priority

1. Manifest validation & loading (HIGH)
2. Service worker infrastructure (HIGH)
3. Content script injection (HIGH)
4. Chrome API implementation (HIGH)
5. Permission system (HIGH)
6. Extension store (MEDIUM)
7. Auto-update system (MEDIUM)

---

**Status**: Phase 18 Step 3 - Browser Extensions API (310 lines)
**Next**: Phase 18 Step 4 - Advanced Features (Bookmarks, History, Password Manager)
