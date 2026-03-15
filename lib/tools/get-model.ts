import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { clientFromAuth } from "@/lib/auth";

export function registerGetModelTool(server: McpServer) {
  server.tool(
    "get_model",
    "Get detailed information about a specific video generation model including metrics",
    {
      slug: z.string().describe("Model slug (e.g. 'veo-veo-3-1')"),
    },
    async ({ slug }, { authInfo }) => {
      const client = clientFromAuth(authInfo!);
      const { model, metrics } = await client.getModel(slug);

      const text =
        `**${model.display_name}** (\`${model.slug}\`)\n` +
        `Maker: ${model.maker.name} | Family: ${model.family.name}\n` +
        (model.description ? `Description: ${model.description}\n` : "") +
        `\nRoutes:\n${model.routes.map((r) => `  - ${r.provider.name} via ${r.host.name}`).join("\n")}` +
        `\n\nMetrics (7d):\n` +
        `  Total requests: ${metrics.totalRequests}\n` +
        `  Success rate: ${metrics.successRate}%\n` +
        `  Avg latency: ${metrics.avgLatencyMs ? `${metrics.avgLatencyMs}ms` : "N/A"}\n` +
        `  P50 latency: ${metrics.p50LatencyMs ? `${metrics.p50LatencyMs}ms` : "N/A"}\n` +
        `  P95 latency: ${metrics.p95LatencyMs ? `${metrics.p95LatencyMs}ms` : "N/A"}`;

      return {
        content: [{ type: "text" as const, text }],
      };
    }
  );
}
