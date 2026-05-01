# Antigravity-DebugMCP-Bridge

A bridge that connects Antigravity to the [DebugMCP](https://github.com/microsoft/vscode-debugmcp) server to resolve compatibility issues between Antigravity and the current version of the DebugMCP extension's SSE implementation.

## Setup

### 1. Install Dependencies
Ensure you have Node.js installed, then run:
```bash
npm install
```

### 2. Build the Bridge
Compile the TypeScript code to JavaScript:
```bash
npm run build
```

### 3. Configure Antigravity
Add the following to your Antigravity MCP configuration. Replace `/absolute/path/to/project` with the actual path to this directory on your machine.

```json
{
  "mcpServers": {
    "debugmcp": {
      "command": "node",
      "args": [
        "/absolute/path/to/project/dist/bridge.js"
      ],
      "env": {
        "DEBUGMCP_PORT": "3001"
      }
    }
  }
}
```
