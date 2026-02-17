# Phase 18, Step 1: User Mode Architecture

## Overview
This phase establishes comprehensive user mode functionality for the ARQIUM browser, enabling multi-user profiles, personalized settings, user sessions, and advanced browsing capabilities.

## 1.1 User Profile System

```typescript
// Core user profile management
interface UserProfile {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  profileImage?: string;
  createdAt: Date;
  lastLogin: Date;
  preferences: UserPreferences;
  permissions: Permission[];
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: number;
  defaultSearchEngine: string;
  autoSave: boolean;
  privacyMode: boolean;
  doNotTrack: boolean;
  enableNotifications: boolean;
}

class UserProfileManager {
  private profiles: Map<string, UserProfile> = new Map();
  private currentUser: UserProfile | null = null;
  
  // Create new user profile
  async createProfile(userData: Partial<UserProfile>): Promise<UserProfile> {
    const profile: UserProfile = {
      userId: this.generateUserId(),
      username: userData.username || '',
      email: userData.email || '',
      displayName: userData.displayName || '',
      createdAt: new Date(),
      lastLogin: new Date(),
      preferences: this.getDefaultPreferences(),
      permissions: ['read', 'write'],
    };
    
    // Encrypt profile data
    const encrypted = await this.encryptProfileData(profile);
    await this.persistProfile(encrypted);
    
    this.profiles.set(profile.userId, profile);
    return profile;
  }
  
  // Switch user profile
  async switchProfile(userId: string): Promise<boolean> {
    const profile = this.profiles.get(userId);
    if (!profile) return false;
    
    // Clear previous user context
    await this.clearUserContext();
    
    // Load new profile context
    this.currentUser = profile;
    profile.lastLogin = new Date();
    
    // Load user-specific data
    await this.loadUserData(userId);
    
    return true;
  }
  
  // Update user preferences
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    if (!this.currentUser) throw new Error('No active user');
    
    this.currentUser.preferences = {
      ...this.currentUser.preferences,
      ...preferences,
    };
    
    // Apply theme immediately
    this.applyTheme(this.currentUser.preferences.theme);
    
    // Save preferences
    await this.persistProfile(this.currentUser);
  }
}
```

## 1.2 Multi-Profile Management

```typescript
interface ProfileInfo {
  userId: string;
  displayName: string;
  profileImage?: string;
  lastLogin: Date;
  isActive: boolean;
}

class MultiProfileManager {
  private profiles: ProfileInfo[] = [];
  private maxProfiles = 10;
  
  // Get all profiles
  async getAllProfiles(): Promise<ProfileInfo[]> {
    return this.profiles.sort((a, b) => 
      b.lastLogin.getTime() - a.lastLogin.getTime()
    );
  }
  
  // Add new profile with quick access
  async addProfile(profileData: Partial<UserProfile>): Promise<ProfileInfo> {
    if (this.profiles.length >= this.maxProfiles) {
      throw new Error('Maximum profiles reached');
    }
    
    const newProfile = await new UserProfileManager().createProfile(profileData);
    
    this.profiles.push({
      userId: newProfile.userId,
      displayName: newProfile.displayName,
      profileImage: newProfile.profileImage,
      lastLogin: newProfile.lastLogin,
      isActive: false,
    });
    
    return this.profiles[this.profiles.length - 1];
  }
  
  // Remove profile
  async removeProfile(userId: string): Promise<void> {
    const index = this.profiles.findIndex(p => p.userId === userId);
    if (index === -1) throw new Error('Profile not found');
    
    // Secure deletion
    await this.secureDeleteProfile(userId);
    this.profiles.splice(index, 1);
  }
  
  // Profile switcher UI data
  getProfileSwitcherData(): ProfileInfo[] {
    return this.profiles.slice(0, 5); // Show top 5 recent
  }
}
```

## 1.3 Session Management

```typescript
interface BrowserSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  tabs: TabSession[];
  isActive: boolean;
  deviceInfo: DeviceInfo;
}

interface TabSession {
  tabId: string;
  url: string;
  title: string;
  timestamp: Date;
  scrollPosition: number;
}

class SessionManager {
  private sessions: Map<string, BrowserSession> = new Map();
  private sessionTimeout = 3600000; // 1 hour
  
  // Create new session
  async createSession(userId: string, deviceInfo: DeviceInfo): Promise<string> {
    const sessionId = this.generateSessionId();
    const session: BrowserSession = {
      sessionId,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      tabs: [],
      isActive: true,
      deviceInfo,
    };
    
    this.sessions.set(sessionId, session);
    
    // Start session monitoring
    this.startSessionMonitor(sessionId);
    
    return sessionId;
  }
  
  // Save session state
  async saveSessionState(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const tabStates = await Promise.all(
      session.tabs.map(tab => this.getTabState(tab.tabId))
    );
    
    const sessionData = {
      sessionId,
      tabs: tabStates,
      timestamp: new Date(),
    };
    
    // Persist to encrypted storage
    await this.persistSession(sessionData);
  }
  
  // Restore session
  async restoreSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return;
    
    const savedData = await this.retrieveSession(sessionId);
    
    // Restore each tab
    for (const tabState of savedData.tabs) {
      await this.restoreTab(tabState);
    }
  }
  
  // Monitor session activity
  private startSessionMonitor(sessionId: string): void {
    const interval = setInterval(async () => {
      const session = this.sessions.get(sessionId);
      if (!session) {
        clearInterval(interval);
        return;
      }
      
      const inactiveTime = Date.now() - session.lastActivity.getTime();
      if (inactiveTime > this.sessionTimeout) {
        await this.saveSessionState(sessionId);
        session.isActive = false;
        clearInterval(interval);
      }
    }, 60000); // Check every minute
  }
}
```

## 1.4 User Data Storage

```typescript
interface UserDataStore {
  bookmarks: Bookmark[];
  history: HistoryEntry[];
  passwords: SavedPassword[];
  autofillProfiles: AutofillProfile[];
  extensions: InstalledExtension[];
  settings: BrowserSettings;
}

class UserDataManager {
  private dataStore: UserDataStore | null = null;
  private cryptoEngine: CryptoEngine;
  
  // Load user data with encryption
  async loadUserData(userId: string): Promise<UserDataStore> {
    // Retrieve encrypted data
    const encryptedData = await this.retrieveFromStorage(userId);
    
    // Decrypt with user key
    const userKey = await this.deriveUserKey(userId);
    const decryptedData = await this.cryptoEngine.decrypt(encryptedData, userKey);
    
    this.dataStore = JSON.parse(decryptedData);
    return this.dataStore;
  }
  
  // Save user data with encryption
  async saveUserData(userId: string): Promise<void> {
    if (!this.dataStore) return;
    
    const jsonData = JSON.stringify(this.dataStore);
    const userKey = await this.deriveUserKey(userId);
    const encrypted = await this.cryptoEngine.encrypt(jsonData, userKey);
    
    await this.persistToStorage(userId, encrypted);
  }
  
  // Sync across devices
  async syncUserData(userId: string): Promise<void> {
    // Upload local data to sync server
    const userData = this.dataStore;
    await this.uploadToSyncServer(userId, userData);
    
    // Download remote changes
    const remoteData = await this.downloadFromSyncServer(userId);
    
    // Merge changes (last-write-wins for simplicity)
    this.dataStore = this.mergeUserData(userData, remoteData);
    
    await this.saveUserData(userId);
  }
}
```

## 1.5 Permission System

```typescript
type Permission = 
  | 'read' | 'write' | 'delete'
  | 'import' | 'export'
  | 'manage_extensions' | 'manage_profiles'
  | 'access_settings' | 'modify_security';

class PermissionManager {
  private rolePermissions: Map<string, Permission[]> = new Map([
    ['admin', ['read', 'write', 'delete', 'import', 'export', 'manage_extensions', 'manage_profiles', 'access_settings', 'modify_security']],
    ['user', ['read', 'write', 'import', 'export', 'manage_extensions', 'access_settings']],
    ['guest', ['read', 'import']],
  ]);
  
  // Check permission
  hasPermission(userRole: string, permission: Permission): boolean {
    const permissions = this.rolePermissions.get(userRole) || [];
    return permissions.includes(permission);
  }
  
  // Check multiple permissions (AND logic)
  hasAllPermissions(userRole: string, permissions: Permission[]): boolean {
    return permissions.every(p => this.hasPermission(userRole, p));
  }
  
  // Check multiple permissions (OR logic)
  hasAnyPermission(userRole: string, permissions: Permission[]): boolean {
    return permissions.some(p => this.hasPermission(userRole, p));
  }
  
  // Enforce permission
  async enforcePermission(userRole: string, permission: Permission): Promise<void> {
    if (!this.hasPermission(userRole, permission)) {
      throw new Error(`Permission denied: ${permission}`);
    }
  }
}
```

## 1.6 User Context Management

```typescript
class UserContext {
  private userId: string | null = null;
  private sessionId: string | null = null;
  private permissions: Permission[] = [];
  private contextData: Map<string, any> = new Map();
  
  // Initialize context
  async initialize(userId: string, sessionId: string): Promise<void> {
    this.userId = userId;
    this.sessionId = sessionId;
    
    // Load user permissions
    const profile = await this.loadUserProfile(userId);
    this.permissions = profile.permissions;
    
    // Load context-specific data
    await this.loadContextData();
  }
  
  // Store context data
  setContextData(key: string, value: any): void {
    this.contextData.set(key, value);
  }
  
  // Retrieve context data
  getContextData(key: string): any {
    return this.contextData.get(key);
  }
  
  // Clear context
  async clear(): Promise<void> {
    this.userId = null;
    this.sessionId = null;
    this.permissions = [];
    this.contextData.clear();
  }
}
```

## User Mode Feature Matrix

| Feature | Status | Priority |
|---------|--------|----------|
| Multi-profile support | ✓ Design | HIGH |
| Profile switching | ✓ Design | HIGH |
| Session persistence | ✓ Design | HIGH |
| Permission system | ✓ Design | HIGH |
| User preferences | ✓ Design | MEDIUM |
| Data encryption | ✓ Design | HIGH |
| Cross-device sync | ✓ Design | MEDIUM |
| Activity tracking | ✓ Design | LOW |

## Implementation Priorities

1. User profile system (HIGH)
2. Multi-profile management (HIGH)
3. Session management (HIGH)
4. Permission system (HIGH)
5. User data storage (MEDIUM)
6. Cross-device sync (MEDIUM)

---

**Status**: Phase 18 Step 1 - User Mode Architecture (290 lines)
**Next**: Phase 18 Step 2 - Session Management & Persistence
