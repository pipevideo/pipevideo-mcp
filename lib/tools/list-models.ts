import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { clientFromAuth } from "@/lib/auth";

export function registerListModelsTool(server: McpServer) {
  server.tool(
    "list_models",
    "List all available video generation models with pricing and capabilities",
    {},
    async (_, { authInfo }) => {
      const client = clientFromAuth(authInfo!);
      const { models } = await client.listModels();

      const formatted = models
        .map(
          (m) =>
            `**${m.display_name}** (\`${m.slug}\`)\n` +
            `  Maker: ${m.maker.name} | Family: ${m.family.name}\n` +
            (m.description ? `  ${m.description}\n` : "") +
            `  Providers: ${m.routes.map((r) => r.provider).join(", ")}`
        )
        .join("\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `Available models (${models.length}):\n\n${formatted}`,
          },
        ],
      };
    }
  );
}
