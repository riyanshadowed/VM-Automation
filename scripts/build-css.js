const { compile } = require("@tailwindcss/node");
const fs = require("fs");
const path = require("path");

async function buildCSS() {
  const pagePath = path.join(__dirname, "../app/page.tsx");
  const layoutPath = path.join(__dirname, "../app/layout.tsx");
  const pageContent = fs.readFileSync(pagePath, "utf8");
  const layoutContent = fs.readFileSync(layoutPath, "utf8");

  // Extract all tokens from JSX
  const fullText = pageContent + " " + layoutContent;
  const tokenRegex = /[a-zA-Z0-9_\-\:\[\]\/\#\%\.\@]+/g;
  const tokens = Array.from(new Set(fullText.match(tokenRegex) || []));

  const tailwindInput = `
@import "tailwindcss";

:root {
  --background: #f8fafc;
  --foreground: #0f172a;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
`;

  const compiler = await compile(tailwindInput, {
    base: path.join(__dirname, ".."),
    onDependency: () => {},
  });

  const compiledCss = compiler.build(tokens);
  const outPath = path.join(__dirname, "../app/globals.css");
  fs.writeFileSync(outPath, compiledCss, "utf8");
  console.log("Successfully compiled Tailwind CSS to app/globals.css (" + compiledCss.length + " bytes)");
}

buildCSS().catch(console.error);

