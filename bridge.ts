// Copyright (c) Microsoft Corporation.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
	ListToolsRequestSchema, 
	CallToolRequestSchema, 
	ListResourcesRequestSchema, 
	ReadResourceRequestSchema 
} from "@modelcontextprotocol/sdk/types.js";

/**
 * Low-level Bridge script that connects to the DebugMCP SSE server 
 * and transparently proxies all requests to match Antigravity's expectations.
 */
async function main() {
	const port = process.env.DEBUGMCP_PORT || "3331";
	const hosts = ["[::1]", "127.0.0.1", "localhost"];
	
	let client: Client | null = null;
	let connected = false;

	console.error(`DebugMCP Bridge: Searching for server on port ${port}...`);

	for (let i = 0; i < 30; i++) {
		for (const host of hosts) {
			try {
				const url = `http://${host}:${port}/mcp`;
				const transport = new StreamableHTTPClientTransport(new URL(url));
				const candidate = new Client({ name: "bridge-client", version: "1.0.0" });
				await candidate.connect(transport);
				client = candidate;
				connected = true;
				console.error(`DebugMCP Bridge: Connected to server at ${url}`);
				break;
			} catch (e) {}
		}
		if (connected) break;
		await new Promise(r => setTimeout(r, 2000));
	}

	if (!client) {
		console.error("DebugMCP Bridge: Failed to connect to server.");
		process.exit(1);
	}

	// Create a low-level server that proxies everything
	const server = new Server({
		name: "debugmcp",
		version: "1.0.0"
	}, {
		capabilities: {
			tools: {},
			resources: {}
		}
	});

	// Proxy Tools
	server.setRequestHandler(ListToolsRequestSchema, async () => {
		console.error("DebugMCP Bridge: Proxying tools/list");
		return await client!.listTools();
	});

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		console.error(`DebugMCP Bridge: Proxying tools/call (${request.params.name})`);
		// Normalize arguments: support both standard 'arguments' and direct 'params' properties
		const args = request.params.arguments || (request.params as any).params || {};
		return await client!.callTool({
			name: request.params.name,
			arguments: args
		});
	});

	// Proxy Resources
	server.setRequestHandler(ListResourcesRequestSchema, async () => {
		console.error("DebugMCP Bridge: Proxying resources/list");
		return await client!.listResources();
	});

	server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
		console.error(`DebugMCP Bridge: Proxying resources/read (${request.params.uri})`);
		return await client!.readResource({
			uri: request.params.uri
		});
	});

	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("DebugMCP Bridge: Transparent proxy started on stdio.");
}

main().catch(e => {
	console.error("DebugMCP Bridge: Fatal error:", e);
	process.exit(1);
});
