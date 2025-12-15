import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';

/**
 * GitHubService - Integration with GitHub API for repository operations
 * Enables ARQ to interact with its own repository for self-development
 */
@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private readonly octokit: Octokit;
  private readonly owner: string;
  private readonly repo: string;

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('GITHUB_TOKEN');
    this.owner = this.configService.get<string>('GITHUB_OWNER', 'fukkingsnow');
    this.repo = this.configService.get<string>('GITHUB_REPO', 'arq');

    if (!token) {
      this.logger.warn('GITHUB_TOKEN not configured - GitHub integration disabled');
    }

    this.octokit = new Octokit({ auth: token });
    this.logger.log(`GitHub Service initialized for ${this.owner}/${this.repo}`);
  }

  /**
   * List all open issues in the repository
   */
  async listIssues(state: 'open' | 'closed' | 'all' = 'open') {
    try {
      const { data } = await this.octokit.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        state,
      });
      return data;
    } catch (error) {
      this.logger.error(`Failed to list issues: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get specific issue by number
   */
  async getIssue(issueNumber: number) {
    try {
      const { data } = await this.octokit.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });
      return data;
    } catch (error) {
      this.logger.error(`Failed to get issue #${issueNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new issue
   */
  async createIssue(title: string, body?: string, labels?: string[]) {
    try {
      const { data } = await this.octokit.issues.create({
        owner: this.owner,
        repo: this.repo,
        title,
        body,
        labels,
      });
      this.logger.log(`Created issue #${data.number}: ${title}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to create issue: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(branchName: string, baseBranch: string = 'main') {
    try {
      // Get the SHA of the base branch
      const { data: refData } = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${baseBranch}`,
      });

      // Create new branch
      const { data } = await this.octokit.git.createRef({
        owner: this.owner,
        repo: this.repo,
        ref: `refs/heads/${branchName}`,
        sha: refData.object.sha,
      });
      this.logger.log(`Created branch: ${branchName}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to create branch ${branchName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get file content from repository
   */
  async getFileContent(path: string, branch: string = 'main') {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: branch,
      });

      if ('content' in data) {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return { content, sha: data.sha };
      }
      throw new Error('Path is a directory, not a file');
    } catch (error) {
      this.logger.error(`Failed to get file ${path}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create or update a file
   */
  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    branch: string = 'main',
    sha?: string,
  ) {
    try {
      const { data } = await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        branch,
        sha,
      });
      this.logger.log(`Updated file: ${path}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to update file ${path}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a Pull Request
   */
  async createPullRequest(
    title: string,
    head: string,
    base: string = 'main',
    body?: string,
  ) {
    try {
      const { data } = await this.octokit.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title,
        head,
        base,
        body,
      });
      this.logger.log(`Created PR #${data.number}: ${title}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to create PR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Merge a Pull Request
   */
  async mergePullRequest(pullNumber: number, mergeMethod: 'merge' | 'squash' | 'rebase' = 'squash') {
    try {
      const { data } = await this.octokit.pulls.merge({
        owner: this.owner,
        repo: this.repo,
        pull_number: pullNumber,
        merge_method: mergeMethod,
      });
      this.logger.log(`Merged PR #${pullNumber}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to merge PR #${pullNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add a comment to an issue or PR
   */
  async addComment(issueNumber: number, body: string) {
    try {
      const { data } = await this.octokit.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        body,
      });
      this.logger.log(`Added comment to #${issueNumber}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to add comment: ${error.message}`);
      throw error;
    }
  }

  /**
   * List repository commits
   */
  async listCommits(branch: string = 'main', perPage: number = 30) {
    try {
      const { data } = await this.octokit.repos.listCommits({
        owner: this.owner,
        repo: this.repo,
        sha: branch,
        per_page: perPage,
      });
      return data;
    } catch (error) {
      this.logger.error(`Failed to list commits: ${error.message}`);
      throw error;
    }
  }
}
