import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListModelsTool } from "./list-models";
import { registerGetModelTool } from "./get-model";
import { registerGenerateVideoTool } from "./generate-video";
import { registerGetGenerationTool } from "./get-generation";
import { registerGetUsageTool } from "./get-usage";

export function registerAllTools(server: McpServer) {
  registerListModelsTool(server);
  registerGetModelTool(server);
  registerGenerateVideoTool(server);
  registerGetGenerationTool(server);
  registerGetUsageTool(server);
}
