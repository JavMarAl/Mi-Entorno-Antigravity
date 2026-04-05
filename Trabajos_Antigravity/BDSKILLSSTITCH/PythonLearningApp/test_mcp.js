const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function testMcp() {
    const transport = new StdioClientTransport({
        command: 'npx',
        args: ['-y', 'notebooklm-mcp-server'],
    });

    const client = new Client({ name: 'test', version: '1.0.0' }, { capabilities: {} });
    await client.connect(transport);

    const tools = await client.listTools();
    console.log("TOOLS AVAILABLE:\n" + JSON.stringify(tools, null, 2));

    try {
        const result = await client.callTool({ name: 'list_notebooks', arguments: {} });
        console.log("NOTEBOOKS:\n" + JSON.stringify(result, null, 2));
    } catch (err) {
        console.log("list_notebooks failed or missing:", err.message);
    }

    process.exit(0);
}
testMcp();
