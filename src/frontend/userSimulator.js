userSimulator.js  // Phase 50.2: User Simulator
// Simulates concurrent virtual users with realistic behavior patterns

class UserSimulator {
  constructor() {
    this.users = new Map();
    this.behaviors = {
      activeUser: 0.7,
      idleUser: 0.2,
      slowNetwork: 0.1
    };
    this.requestPatterns = [
      { endpoint: '/api/v1/taskstasks', weight: 40 },
      { endpoint: '/api/ai-chat', weight: 30 },
      { endpoint: '/api/metrics', weight: 20 },
      { endpoint: '/api/status', weight: 10 }
    ];
  }

  createUser(userId) {
    const user = {
      id: userId,
      createdAt: Date.now(),
      behavior: this.selectBehavior(),
      session: {
        startTime: Date.now(),
        requestCount: 0,
        errorCount: 0,
        totalResponseTime: 0
      },
      active: true,
      thinkTime: this.getThinkTime()
    };

    this.users.set(userId, user);
    return user;
  }

  selectBehavior() {
    const rand = Math.random();
    if (rand < this.behaviors.activeUser) return 'active';
    if (rand < this.behaviors.activeUser + this.behaviors.idleUser) return 'idle';
    return 'slow';
  }

  getThinkTime() {
    // Think time between requests (ms)
    return Math.random() * 3000 + 1000; // 1-4 seconds
  }

  async simulateSession(userId, duration) {
    const user = this.users.get(userId);
    if (!user) return null;

    const sessionStart = Date.now();
    let activeTime = 0;

    while (Date.now() - sessionStart < duration && user.active) {
      const requestDelay = user.behavior === 'idle' 
        ? Math.random() * 10000 + 5000  // 5-15 seconds
        : user.thinkTime;  // 1-4 seconds

      await new Promise(resolve => setTimeout(resolve, requestDelay));

      if (Date.now() - sessionStart >= duration) break;

      const endpoint = this.selectEndpoint();
      const latency = user.behavior === 'slow' 
        ? Math.random() * 2000 + 500  // 500-2500ms
        : Math.random() * 500 + 100;  // 100-600ms

      try {
        const startTime = performance.now();
        await this.makeRequest(endpoint, latency);
        const responseTime = performance.now() - startTime;

        user.session.requestCount++;
        user.session.totalResponseTime += responseTime;
        activeTime += latency;
      } catch (error) {
        user.session.errorCount++;
      }
    }

    user.session.endTime = Date.now();
    user.session.duration = user.session.endTime - sessionStart;
    return user.session;
  }

  selectEndpoint() {
    const rand = Math.random() * 100;
    let cumulative = 0;

    for (const pattern of this.requestPatterns) {
      cumulative += pattern.weight;
      if (rand <= cumulative) {
        return pattern.endpoint;
      }
    }

    return this.requestPatterns[0].endpoint;
  }

  async makeRequest(endpoint, simulatedLatency) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 95% success rate
        if (Math.random() > 0.05) {
          resolve({ endpoint, latency: simulatedLatency });
        } else {
          reject(new Error(`Request failed to ${endpoint}`));
        }
      }, simulatedLatency);
    });
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  getUserStats(userId) {
    const user = this.users.get(userId);
    if (!user) return null;

    const { session } = user;
    return {
      userId: user.id,
      behavior: user.behavior,
      totalRequests: session.requestCount,
      totalErrors: session.errorCount,
      errorRate: session.requestCount > 0 
        ? (session.errorCount / session.requestCount * 100).toFixed(1)
        : 'N/A',
      avgResponseTime: session.requestCount > 0
        ? (session.totalResponseTime / session.requestCount).toFixed(0)
        : 'N/A',
      sessionDuration: session.duration || 0
    };
  }

  getAllUserStats() {
    const stats = [];
    for (const [userId] of this.users) {
      stats.push(this.getUserStats(userId));
    }
    return stats;
  }

  getAggregateStats() {
    const allStats = this.getAllUserStats();
    if (allStats.length === 0) return null;

    const totalRequests = allStats.reduce((sum, s) => sum + s.totalRequests, 0);
    const totalErrors = allStats.reduce((sum, s) => sum + s.totalErrors, 0);
    const avgResponseTimes = allStats
      .filter(s => s.avgResponseTime !== 'N/A')
      .map(s => parseFloat(s.avgResponseTime));

    return {
      totalUsers: this.users.size,
      totalRequests: totalRequests,
      totalErrors: totalErrors,
      overallErrorRate: totalRequests > 0 
        ? (totalErrors / totalRequests * 100).toFixed(1)
        : '0',
      avgResponseTime: avgResponseTimes.length > 0
        ? (avgResponseTimes.reduce((a, b) => a + b) / avgResponseTimes.length).toFixed(0)
        : 'N/A',
      behaviorDistribution: {
        active: allStats.filter(s => s.behavior === 'active').length,
        idle: allStats.filter(s => s.behavior === 'idle').length,
        slow: allStats.filter(s => s.behavior === 'slow').length
      }
    };
  }

  pauseUser(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.active = false;
      console.log(`User ${userId} paused`);
    }
  }

  resumeUser(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.active = true;
      console.log(`User ${userId} resumed`);
    }
  }

  removeUser(userId) {
    this.users.delete(userId);
    console.log(`User ${userId} removed`);
  }

  clearAllUsers() {
    this.users.clear();
    console.log('All users cleared');
  }

  generateBehaviorReport() {
    const stats = this.getAllUserStats();
    const grouped = {};

    stats.forEach(stat => {
      const behavior = stat.behavior;
      if (!grouped[behavior]) {
        grouped[behavior] = [];
      }
      grouped[behavior].push(stat);
    });

    const report = {};
    for (const [behavior, userStats] of Object.entries(grouped)) {
      const avgError = userStats.reduce((sum, s) => {
        const rate = s.errorRate === 'N/A' ? 0 : parseFloat(s.errorRate);
        return sum + rate;
      }, 0) / userStats.length;

      report[behavior] = {
        userCount: userStats.length,
        avgErrorRate: avgError.toFixed(1),
        totalRequests: userStats.reduce((sum, s) => sum + s.totalRequests, 0)
      };
    }

    return report;
  }
}

window.userSimulator = new UserSimulator();
console.log('UserSimulator loaded');
