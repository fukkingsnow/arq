import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OrchestratorService {
  private docker: any;
  private readonly logger = new Logger(OrchestratorService.name);

  constructor() {
    try {
      const Dockerode = require('dockerode');
      this.docker = new Dockerode({ socketPath: '/var/run/docker.sock' });
      this.logger.log('Dockerode instance created successfully');
    } catch (e) {
      this.logger.error(`Initialization error: ${e.message}`);
    }
  }

  async launchService(serviceName: string, image: string) {
    if (!this.docker) return { success: false, error: 'Docker not initialized' };
    try {
      this.logger.log(`Launching service: ${serviceName} [${image}]`);
      const container = await this.docker.createContainer({
        Image: image,
        name: `arq-svc-${serviceName}-${Date.now()}`,
        HostConfig: { 
          NetworkMode: 'arq_arq_network',
          RestartPolicy: { Name: 'always' }
        },
      });
      await container.start();
      return { success: true, id: container.id };
    } catch (error) {
      this.logger.error(`Launch failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async listRunningServices() {
    if (!this.docker) {
      this.logger.error('Docker not initialized, cannot list containers');
      return [];
    }
    try {
      return await this.docker.listContainers({ all: true });
    } catch (error) {
      this.logger.error(`List failed: ${error.message}`);
      return [];
    }
  }

  async testConnection() {
    return { status: 'Orchestrator is alive', dockerReady: !!this.docker };
  }
}
