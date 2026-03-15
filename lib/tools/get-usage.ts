import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { clientFromAuth } from "@/lib/auth";

export function registerGetUsageTool(server: McpServer) {
  server.tool(
    "get_usage",
    "Get your Pipevideo credit balance and usage statistics",
    {},
    async (_, { authInfo }) => {
      const client = clientFromAuth(authInfo!);
      const usage = await client.getUsage();

      const text =
        `Credit Balance: $${(usage.credit_balance / 100).toFixed(2)}\n\n` +
        `Totals:\n` +
        `  Total requests: ${usage.totals.total_requests}\n` +
        `  Completed: ${usage.totals.completed_requests}\n` +
        `  Failed: ${usage.totals.failed_requests}\n` +
        `  Total cost: $${(usage.totals.total_cost_cents / 100).toFixed(2)}\n\n` +
        `Recent requests (last ${usage.recent_requests.length}):\n` +
        usage.recent_requests
          .slice(0, 10)
          .map(
            (r) =>
              `  - ${r.model_name}: ${r.status}` +
              (r.cost_cents != null
                ? ` ($${(r.cost_cents / 100).toFixed(2)})`
                : "") +
              (r.latency_ms != null
                ? ` ${(r.latency_ms / 1000).toFixed(1)}s`
                : "")
          )
          .join("\n");

      return {
        content: [{ type: "text" as const, text }],
      };
    }
  );
}
