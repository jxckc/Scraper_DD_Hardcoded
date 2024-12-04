export interface AgentQLClient {
  queryElements(query: string): Promise<any>;
  queryData(query: string): Promise<any>;
  getByPrompt(prompt: string): Promise<any>;
}

export interface AgentQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
  }>;
  metadata?: {
    screenshot?: string;
    request_id?: string;
  };
  warnings?: Array<string>;
} 