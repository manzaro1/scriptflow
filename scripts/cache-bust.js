import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const distDir = './dist';
const timestamp = Date.now();

// Find the main JS and CSS files
const files = readdirSync(join(distDir, 'assets'));
const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
const cssFile = files.find(f => f.startsWith('index-') && f.endsWith('.css'));

console.log(`Found JS: ${jsFile}, CSS: ${cssFile}`);

// Read and update index.html
let html = readFileSync(join(distDir, 'index.html'), 'utf-8');
html = html.replace(/src="\/assets\/[^"]+\.js"/, `src="/assets/${jsFile}?v=${timestamp}"`);
html = html.replace(/href="\/assets\/[^"]+\.css"/, `href="/assets/${cssFile}?v=${timestamp}"`);
writeFileSync(join(distDir, 'index.html'), html);

console.log(`Updated index.html with cache-busting timestamp: ${timestamp}`);
