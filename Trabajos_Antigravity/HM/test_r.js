const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'engine', 'pooling.R');
const payload = {
    "yi": [0.5, 0.4, 0.6],
    "vi": [0.01, 0.02, 0.015],
    "labels": ["Study 1", "Study 2", "Study 3"],
    "model": "random",
    "effectMeasure": "SMD"
};

const rProc = spawn('Rscript', ['--vanilla', scriptPath]);
let stdout = '';
let stderr = '';

rProc.stdin.write(JSON.stringify(payload));
rProc.stdin.end();

rProc.stdout.on('data', chunk => { stdout += chunk; });
rProc.stderr.on('data', chunk => { stderr += chunk; });

rProc.on('close', code => {
    console.log("--- STDOUT ---");
    console.log(stdout);
    console.log("--- STDERR ---");
    console.log(stderr);
    console.log("--- CODE ---", code);
});
