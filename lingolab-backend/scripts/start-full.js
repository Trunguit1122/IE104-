#!/usr/bin/env node
/**
 * Cross-platform starter script for LingoLab Full Stack
 * Automatically detects OS and runs the appropriate script
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const scriptsDir = __dirname;
const isWindows = os.platform() === 'win32';

console.log(`🖥️  Detected OS: ${os.platform()}`);
console.log(`📂 Scripts directory: ${scriptsDir}`);
console.log('');

let child;

if (isWindows) {
    // Windows: Run PowerShell script
    const psScript = path.join(scriptsDir, 'start-with-model.ps1');
    console.log(`🚀 Running PowerShell script: ${psScript}`);
    console.log('');
    
    child = spawn('powershell.exe', [
        '-ExecutionPolicy', 'Bypass',
        '-File', psScript
    ], {
        stdio: 'inherit',
        cwd: path.dirname(scriptsDir)
    });
} else {
    // Unix/Linux/macOS: Run bash script
    const bashScript = path.join(scriptsDir, 'start-with-model.sh');
    console.log(`🚀 Running Bash script: ${bashScript}`);
    console.log('');
    
    child = spawn('bash', [bashScript], {
        stdio: 'inherit',
        cwd: path.dirname(scriptsDir)
    });
}

// Forward exit code
child.on('close', (code) => {
    process.exit(code || 0);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
    child.kill('SIGINT');
});

process.on('SIGTERM', () => {
    child.kill('SIGTERM');
});
