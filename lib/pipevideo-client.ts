const DEFAULT_BASE_URL = "https://api.pipevideo.co";
const POLL_INTERVAL_MS = 3_000;
const DEFAULT_TIMEOUT_MS = 55_000;

interface ListModelsResponse {
  models: Array<{
    slug: string;
    name: string;
    display_name: string;
    description: string | null;
    capabilities: unknown;
    pricing: unknown;
    maker: { slug: string; name: string };
    family: { slug: string; name: string };
    routes: Array<{ provider: string; host: string }>;
  }>;
}

interface GetModelResponse {
  model: {
    id: string;
    slug: string;
    name: string;
    display_name: string;
    description: string | null;
    capabilities: unknown;
    pricing: unknown;
    maker: { slug: string; name: string };
    family: { slug: string; name: string };
    routes: Array<{
      provider: { slug: string; name: string };
      host: { slug: string; name: string };
    }>;
  };
  metrics: {
    totalRequests: number;
    completedRequests: number;
    failedRequests: number;
    successRate: number;
    avgLatencyMs: number | null;
    p50LatencyMs: number | null;
    p95LatencyMs: number | null;
  };
}

interface CreateGenerationResponse {
  id: string;
  status: string;
  created_at: number;
}

interface GetGenerationResponse {
  id: string;
  status: string;
  output_url: string | null;
  cost_cents: number | null;
  latency_ms: number | null;
  error_message: string | null;
  created_at: number;
  completed_at: number | null;
}

interface UsageResponse {
  credit_balance: number;
  totals: {
    total_requests: number;
    completed_requests: number;
    failed_requests: number;
    total_cost_cents: number;
  };
  daily_usage: Array<{
    date: string;
    request_count: number;
    completed_count: number;
    failed_count: number;
    total_cost_cents: number;
    total_duration_seconds: number;
  }>;
  recent_requests: Array<{
    id: string;
    status: string;
    model_name: string;
    cost_cents: number | null;
    latency_ms: number | null;
    created_at: number;
    completed_at: number | null;
  }>;
}

export class PipevideoClient {
  private baseUrl: string;
  private token: string;

  constructor(token: string) {
    this.baseUrl = (
      process.env.PIPEVIDEO_API_URL || DEFAULT_BASE_URL
    ).replace(/\/$/, "");
    this.token = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
        "X-Application-Name": "pipevideo-mcp",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Pipevideo API ${res.status}: ${text || res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  async listModels(): Promise<ListModelsResponse> {
    return this.request("GET", "/v1/models");
  }

  async getModel(slug: string): Promise<GetModelResponse> {
    return this.request("GET", `/v1/models/${encodeURIComponent(slug)}`);
  }

  async createGeneration(params: {
    model: string;
    prompt: string;
    provider?: string;
    [key: string]: unknown;
  }): Promise<CreateGenerationResponse> {
    return this.request("POST", "/v1/video/generations", params);
  }

  async getGeneration(id: string): Promise<GetGenerationResponse> {
    return this.request("GET", `/v1/video/generations/${encodeURIComponent(id)}`);
  }

  async getUsage(): Promise<UsageResponse> {
    return this.request("GET", "/v1/usage");
  }

  async waitForGeneration(
    id: string,
    timeoutMs = DEFAULT_TIMEOUT_MS
  ): Promise<GetGenerationResponse> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const gen = await this.getGeneration(id);

      if (gen.status === "completed" || gen.status === "failed") {
        return gen;
      }

      const remaining = deadline - Date.now();
      if (remaining < POLL_INTERVAL_MS) break;

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    return this.getGeneration(id);
  }
}
