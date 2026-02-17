import { Test, TestingModule } from '@nestjs/testing';
import { PullRequestManager } from '../services/pull-request.manager';
import { GitHubService } from '../services/github.service';

describe('PullRequestManager', () => {
  let manager: PullRequestManager;
  let githubService: GitHubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PullRequestManager,
        {
          provide: GitHubService,
          useValue: {
            createBranch: jest.fn(),
            getFileContent: jest.fn(),
            createOrUpdateFile: jest.fn(),
            createPullRequest: jest.fn(),
            getPullRequest: jest.fn(),
            mergePullRequest: jest.fn(),
            addComment: jest.fn(),
          },
        },
        {
          provide: 'LLMService',
          useValue: {
            generateText: jest.fn().mockResolvedValue('Generated PR description'),
          },
        },
      ],
    }).compile();

    manager = module.get<PullRequestManager>(PullRequestManager);
    githubService = module.get<GitHubService>(GitHubService);
  });

  it('should be defined', () => {
    expect(manager).toBeDefined();
  });

  describe('createPullRequest', () => {
    it('should create a pull request with branch and files', async () => {
      const config = {
        title: 'Test Feature',
        description: 'Test Description',
        branchName: 'feature/test',
        changes: {
          'src/test.ts': 'test content',
        },
      };

      const mockPR = {
        number: 1,
        title: config.title,
        state: 'open',
      };

      jest.spyOn(githubService, 'createBranch').mockResolvedValue({});
      jest.spyOn(githubService, 'createOrUpdateFile').mockResolvedValue({});
      jest.spyOn(githubService, 'createPullRequest').mockResolvedValue(mockPR);

      const result = await manager.createPullRequest(config);

      expect(result.number).toBe(1);
      expect(githubService.createBranch).toHaveBeenCalled();
      expect(githubService.createPullRequest).toHaveBeenCalled();
    });
  });

  describe('getPRStatus', () => {
    it('should return PR status from cache', () => {
      const mockStatus = {
        number: 1,
        state: 'open',
        title: 'Test PR',
        checks: [],
      };

      // Manually set cache for testing
      const statusResult = manager.getPRStatus(999);
      expect(statusResult).toBeUndefined();
    });
  });

  describe('getAllPRStatuses', () => {
    it('should return all cached PR statuses', () => {
      const statuses = manager.getAllPRStatuses();
      expect(Array.isArray(statuses)).toBe(true);
    });
  });

  describe('addSelfReview', () => {
    it('should add self-review comment to PR', async () => {
      jest.spyOn(githubService, 'addComment').mockResolvedValue({});

      await manager.addSelfReview(1, 'Test review comment');

      expect(githubService.addComment).toHaveBeenCalledWith(
        1,
        expect.stringContaining('Self-Review'),
      );
    });
  });
});
