export interface CreateWorkflowDto {
  name: string;
  description?: string;
  steps?: any[];
  status?: 'draft' | 'active' | 'paused' | 'archived';
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  steps?: any[];
  status?: 'draft' | 'active' | 'paused' | 'archived';
}
