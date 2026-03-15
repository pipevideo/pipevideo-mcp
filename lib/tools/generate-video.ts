import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { clientFromAuth } from "@/lib/auth";

export function registerGenerateVideoTool(server: McpServer) {
  server.tool(
    "generate_video",
    "Generate a video from a text prompt. Polls until the video is ready or the request times out (~55s). Returns the video URL on success.",
    {
      model: z
        .string()
        .describe("Model slug (e.g. 'kling-kling-video-v3-pro')"),
      prompt: z.string().describe("Text prompt describing the video to generate"),
      provider: z
        .string()
        .optional()
        .describe("Optional provider slug (e.g. 'fal', 'replicate')"),
      duration: z
        .number()
        .optional()
        .describe("Video duration in seconds (model-dependent)"),
      aspect_ratio: z
        .string()
        .optional()
        .describe("Aspect ratio (e.g. '16:9', '9:16', '1:1')"),
    },
    async ({ model, prompt, provider, duration, aspect_ratio }, { authInfo }) => {
      const client = clientFromAuth(authInfo!);

      const params: Record<string, unknown> = { model, prompt };
      if (provider) params.provider = provider;
      if (duration !== undefined) params.duration = duration;
      if (aspect_ratio) params.aspectRatio = aspect_ratio;

      const created = await client.createGeneration(
        params as Parameters<typeof client.createGeneration>[0]
      );

      const result = await client.waitForGeneration(created.id);

      if (result.status === "failed") {
        return {
          content: [
            {
              type: "text" as const,
              text:
                `Video generation failed.\n` +
                `ID: ${result.id}\n` +
                `Error: ${result.error_message ?? "Unknown error"}`,
            },
          ],
          isError: true,
        };
      }

      if (result.status === "completed") {
        return {
          content: [
            {
              type: "text" as const,
              text:
                `Video generated successfully!\n` +
                `ID: ${result.id}\n` +
                `URL: ${result.output_url}\n` +
                `Cost: ${result.cost_cents != null ? `$${(result.cost_cents / 100).toFixed(2)}` : "N/A"}\n` +
                `Latency: ${result.latency_ms != null ? `${(result.latency_ms / 1000).toFixed(1)}s` : "N/A"}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text:
              `Video generation is still in progress (status: ${result.status}).\n` +
              `ID: ${result.id}\n` +
              `Use get_generation with this ID to check the status later.`,
          },
        ],
      };
    }
  );
}
