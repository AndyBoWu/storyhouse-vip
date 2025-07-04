# Fix Cloudflare R2 MCP Authentication Issue

## Problem
The Cloudflare R2 MCP server is failing with "fetch failed" error when trying to connect to `https://r2.mcp.cloudflare.com/sse`.

## Solution Steps

### 1. Verify Environment Variables
First, ensure your Cloudflare credentials are properly set:

```bash
# Check if variables are set
echo $CLOUDFLARE_API_TOKEN
echo $CLOUDFLARE_ACCOUNT_ID
```

If not set, source the .envrc file (after updating with real values):
```bash
# Update .envrc with your actual credentials
vim .envrc

# Then source it
source .envrc
```

### 2. Restart Claude Code
The MCP servers need to be reloaded after setting environment variables:

```bash
# Exit Claude Code (Ctrl+C or Cmd+C)
# Then restart
claude
```

### 3. Check MCP Server Status
After restart, check if MCP servers are available:
```bash
claude mcp list
```

### 4. Alternative: Manual MCP Configuration
If the automatic configuration doesn't work, you can try manual configuration:

1. Create Claude configuration directory:
```bash
mkdir -p ~/.config/claude
```

2. Create or edit the MCP configuration:
```bash
cat > ~/.config/claude/mcp.json << 'EOF'
{
  "servers": {
    "cloudflare-r2": {
      "command": "npx",
      "args": ["@cloudflare/mcp-server-cloudflare"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "${CLOUDFLARE_API_TOKEN}",
        "CLOUDFLARE_ACCOUNT_ID": "${CLOUDFLARE_ACCOUNT_ID}"
      }
    }
  }
}
EOF
```

3. Restart Claude Code again

### 5. Verify Connection
Once connected, test with:
- "List my Cloudflare R2 buckets"
- "Show files in storyhouse-metadata bucket"

## Troubleshooting

### If "fetch failed" persists:

1. **Check Network**: Ensure you can reach Cloudflare:
```bash
curl -I https://api.cloudflare.com/client/v4/user
```

2. **Validate API Token**: Test your token directly:
```bash
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json"
```

3. **Check Token Permissions**: Ensure your API token has:
   - Account:Cloudflare R2:Read
   - Account:Cloudflare R2:Write

4. **Use OAuth Instead**: The MCP server supports OAuth authentication. On first use, it should prompt you to authenticate via browser.

### If MCP server won't start:

1. Remove and re-add the server:
```bash
claude mcp remove cloudflare-r2
claude mcp add cloudflare-r2
```

2. Check Claude Code logs for errors:
```bash
# Location varies by OS, typically:
# macOS: ~/Library/Logs/Claude/
# Linux: ~/.local/share/claude/logs/
```

## Expected Result
Once properly configured, you should see:
- ✓ Cloudflare-r2 MCP Server
- Status: ✓ connected
- No fetch errors

The MCP server will then allow you to interact with your R2 buckets directly through Claude.