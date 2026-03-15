import { PipevideoClient } from "./pipevideo-client";

/**
 * Extract the raw Clerk OAuth token from MCP authInfo and create a
 * PipevideoClient that forwards it to the Pipevideo API.
 */
export function clientFromAuth(authInfo: {
  token?: string;
  extra?: Record<string, unknown>;
}): PipevideoClient {
  const token = authInfo.token;
  if (!token) {
    throw new Error("Missing authentication token");
  }
  return new PipevideoClient(token);
}
