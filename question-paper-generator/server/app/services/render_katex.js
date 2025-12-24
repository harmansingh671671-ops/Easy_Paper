// server/app/services/render_katex.js
const katex = require('katex');

// The first two arguments are 'node' and the script name.
const args = process.argv.slice(2);
const latex = args[0];
const displayMode = args.includes('--display-mode');

if (!latex) {
  console.error("No LaTeX string provided.");
  process.exit(1);
}

try {
  const html = katex.renderToString(latex, {
    throwOnError: false,
    output: 'html',
    displayMode: displayMode
  });
  console.log(html);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
