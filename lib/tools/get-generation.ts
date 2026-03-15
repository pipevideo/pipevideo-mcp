import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { clientFromAuth } from "@/lib/auth";

export function registerGetGenerationTool(server: McpServer) {
  server.tool(
    "get_generation",
    "Check the status of a video generation by its ID",
    {
      id: z.string().describe("Generation ID returned from generate_video"),
    },
    async ({ id }, { authInfo }) => {
      const client = clientFromAuth(authInfo!);
      const gen = await client.getGeneration(id);

      const lines = [
        `ID: ${gen.id}`,
        `Status: ${gen.status}`,
      ];

      if (gen.output_url) lines.push(`URL: ${gen.output_url}`);
      if (gen.cost_cents != null)
        lines.push(`Cost: $${(gen.cost_cents / 100).toFixed(2)}`);
      if (gen.latency_ms != null)
        lines.push(`Latency: ${(gen.latency_ms / 1000).toFixed(1)}s`);
      if (gen.error_message) lines.push(`Error: ${gen.error_message}`);
      if (gen.completed_at)
        lines.push(`Completed: ${new Date(gen.completed_at).toISOString()}`);

      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    }
  );
}
