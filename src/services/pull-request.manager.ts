import { Injectable, Logger } from '@nestjs/common';
import { GitHubService } from './github.service';

interface PRConfig {
  title: string;
  description: string;
  branchName: string;
  changes: Record<string, string>;
  issueNumber?: number;
  labels?: string[];
}

interface PRStatus {
  number: number;
  state: 'open' | 'closed' | 'merged';
  title: string;
  checks: Array<{
    name: string;
    status: 'pending' | 'success' | 'failure';
    conclusion?: string;
  }>;
}

/**
 * PullRequestManager - Automated PR creation and management
 * Enables ARQ to create, review, and merge its own pull requests
 */
@Injectable()
export class PullRequestManager {
  private readonly logger = new Logger(PullRequestManager.name);
  private prCache: Map<number, PRStatus> = new Map();
  private checkInterval = 30000; // Check PR status every 30s

  constructor(
    private readonly githubService: GitHubService,
    private readonly llmService: LLMService,
  ) {
    this.logger.log('PullRequestManager initialized');
  }

  /**
   * Create a new PR with description generation
   */
  async createPullRequest(config: PRConfig): Promise<any> {
    try {
      // Create feature branch
      const branchCreated = await this.githubService.createBranch(
        config.branchName,
        'main',
      );
      this.logger.log(`Created branch: ${config.branchName}`);

      // Update files in the branch
      for (const [filePath, content] of Object.entries(config.changes)) {
        try {
          const fileData = await this.githubService.getFileContent(
            filePath,
            config.branchName,
          );
          await this.githubService.createOrUpdateFile(
            filePath,
            content,
            `feat: ${config.title}`,
            config.branchName,
            fileData.sha,
          );
        } catch {
          // File doesn't exist, create it
          await this.githubService.createOrUpdateFile(
            filePath,
            content,
            `feat: ${config.title}`,
            config.branchName,
          );
        }
      }
      this.logger.log(`Updated files for PR: ${config.title}`);

      // Generate detailed PR description
      const fullDescription = await this.generatePRDescription(
        config.title,
        config.description,
        config.changes,
        config.issueNumber,
      );

      // Create the PR
      const prData = await this.githubService.createPullRequest(
        config.title,
        config.branchName,
        'main',
        fullDescription,
      );

      // Cache the PR status
      this.prCache.set(prData.number, {
        number: prData.number,
        state: 'open',
        title: prData.title,
        checks: [],
      });

      // Start monitoring
      this.monitorPRStatus(prData.number);

      return prData;
    } catch (error) {
      this.logger.error(`Failed to create PR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate comprehensive PR description with AI
   */
  async generatePRDescription(
    title: string,
    description: string,
    changes: Record<string, string>,
    issueNumber?: number,
  ): Promise<string> {
    try {
      const fileList = Object.keys(changes)
        .map((f) => `- ${f}`)
        .join('\n');

      const prompt = `Generate a professional GitHub PR description for:
Title: ${title}
Description: ${description}
Files changed:\n${fileList}

Include: Summary, Changes, Testing, Performance impact, and Related issues.`;

      // Use LLM to generate description
      const aiDescription = await this.llmService.generateText(prompt);

      let fullDescription = `## ${title}\n\n${aiDescription}\n\n`;

      if (issueNumber) {
        fullDescription += `## Related Issues\nCloses #${issueNumber}\n`;
      }

      fullDescription += `\n## Checklist\n- [ ] Code follows project style\n- [ ] Self-reviewed own code\n- [ ] Added necessary comments\n- [ ] No new warnings generated\n- [ ] Updated documentation\n`;

      return fullDescription;
    } catch (error) {
      this.logger.warn(`Failed to generate AI description: ${error.message}`);
      // Fall back to basic description
      return `## ${title}\n\n${description}`;
    }
  }

  /**
   * Monitor PR status and checks
   */
  async monitorPRStatus(prNumber: number): Promise<void> {
    const interval = setInterval(async () => {
      try {
        const pr = await this.githubService.getPullRequest(prNumber);
        const checks = await this.getPRChecks(prNumber);

        const status: PRStatus = {
          number: prNumber,
          state: pr.state as 'open' | 'closed' | 'merged',
          title: pr.title,
          checks,
        };

        this.prCache.set(prNumber, status);

        // Auto-merge if all checks pass and PR is approved
        if (
          checks.every((c) => c.status === 'success') &&
          pr.state === 'open'
        ) {
          const canMerge = await this.validatePRForMerge(prNumber);
          if (canMerge) {
            await this.autoMergePR(prNumber);
            clearInterval(interval);
          }
        }

        // Stop monitoring if PR is closed/merged
        if (pr.state !== 'open') {
          clearInterval(interval);
        }
      } catch (error) {
        this.logger.error(
          `Error monitoring PR #${prNumber}: ${error.message}`,
        );
      }
    }, this.checkInterval);
  }

  /**
   * Get PR check status
   */
  private async getPRChecks(
    prNumber: number,
  ): Promise<
    Array<{ name: string; status: 'pending' | 'success' | 'failure'; conclusion?: string }>
  > {
    // This would require additional GitHub API implementation
    // For now, return empty array
    return [];
  }

  /**
   * Validate PR is ready for merge
   */
  private async validatePRForMerge(prNumber: number): Promise<boolean> {
    try {
      const pr = await this.githubService.getPullRequest(prNumber);
      return (
        pr.state === 'open' &&
        pr.mergeable === true &&
        pr.review_comments === 0 &&
        pr.requested_reviewers.length === 0
      );
    } catch (error) {
      this.logger.error(`Failed to validate PR #${prNumber}`);
      return false;
    }
  }

  /**
   * Auto-merge PR when ready
   */
  async autoMergePR(prNumber: number): Promise<any> {
    try {
      const result = await this.githubService.mergePullRequest(
        prNumber,
        'squash',
      );
      this.logger.log(`Auto-merged PR #${prNumber}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to merge PR #${prNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get PR status from cache
   */
  getPRStatus(prNumber: number): PRStatus | undefined {
    return this.prCache.get(prNumber);
  }

  /**
   * Get all monitored PRs
   */
  getAllPRStatuses(): PRStatus[] {
    return Array.from(this.prCache.values());
  }

  /**
   * Add self-review comment
   */
  async addSelfReview(prNumber: number, review: string): Promise<any> {
    try {
      const comment = `## 🤖 Self-Review by ARQ\n\n${review}`;
      return await this.githubService.addComment(prNumber, comment);
    } catch (error) {
      this.logger.error(`Failed to add review: ${error.message}`);
      throw error;
    }
  }
}
