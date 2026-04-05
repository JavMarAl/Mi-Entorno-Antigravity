const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function main() {
    try {
        console.log('Connecting to NotebookLM MCP Server...');
        const transport = new StdioClientTransport({
            command: 'npx',
            args: ['-y', '@google/notebooklm-mcp-server'],
        });
        const client = new Client({ name: 'test-client', version: '1.0.0' }, { capabilities: {} });
        await client.connect(transport);
        console.log('Connected.');

        try {
            const listResourcesResult = await client.listResources();
            console.log('--- RESOURCES ---');
            console.log(JSON.stringify(listResourcesResult, null, 2));
        } catch (e) {
            console.log('Error listing resources:', e.message);
        }

        try {
            const listToolsResult = await client.listTools();
            console.log('--- TOOLS ---');
            console.log(JSON.stringify(listToolsResult, null, 2));
        } catch (e) {
            console.log('Error listing tools:', e.message);
        }

        process.exit(0);
    } catch (err) {
        console.error('Fatal error:', err);
        process.exit(1);
    }
}

main();
