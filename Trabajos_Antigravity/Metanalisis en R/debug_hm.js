const fs = require('fs');
const vm = require('vm');
const context = vm.createContext({ console, Math, Number, Array, Object });
const seSource = fs.readFileSync('c:\\Trabajos Antigravity\\HM\\js\\stats-engine.js', 'utf8');
vm.runInContext(seSource, context);
const deSource = fs.readFileSync('c:\\Trabajos Antigravity\\HM\\js\\data-entry.js', 'utf8');
vm.runInContext(deSource, context);

const runner = `
try {
    const examples = DataEntry.getExampleData('continuous');
    const result = StatsEngine.computeAll(examples, 'continuous', 'SMD', 'random');
    console.log("Success! Baujat Data: " + JSON.stringify(result.baujatData, null, 2));
} catch (e) {
    console.error("Caught error:", e.stack);
}
`;
vm.runInContext(runner, context);
