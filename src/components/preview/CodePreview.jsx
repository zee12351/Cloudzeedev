import React from 'react';
import { SandpackProvider, SandpackLayout, SandpackPreview } from '@codesandbox/sandpack-react';
import './CodePreview.css';

export default function CodePreview({ code }) {
  // A standard modern React starting point
  const defaultAppCode = `import React from 'react';\n\nexport default function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500">
        AI Generated App
      </h1>
      <p className="text-neutral-400 mb-8 max-w-md text-center">
        Your AI-generated UI will appear here. Try asking CloudzeeDev to build a button, a card, or a whole landing page!
      </p>
      <div className="p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm w-full max-w-lg">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-white/10 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-white/10 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-white/10 rounded col-span-2"></div>
                <div className="h-2 bg-white/10 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
`;

  // HTML index to inject Tailwind CSS via CDN so generated classes work
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudzeeDev AI App</title>
    <!-- Inject Tailwind CSS for the AI generated code to use -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { margin: 0; padding: 0; font-family: system-ui, sans-serif; background: #171717; }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

  const handleOpenNewWindow = () => {
    localStorage.setItem('cloudzeedev_live_code', code || defaultAppCode);
    window.open('/live', '_blank');
  };

  return (
    <div className="code-preview-container flex flex-col h-full w-full bg-neutral-900 overflow-hidden">
      <div className="browser-toolbar">
        <div className="browser-toolbar-left">
          <button>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
            Preview
          </button>
        </div>

        <div className="browser-urlbar">
          <span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0110 0v4"></path></svg>
            localhost:3000 /
          </span>
          <button><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16" /></svg></button>
        </div>

        <div className="browser-actions">
          <button onClick={handleOpenNewWindow} title="Open in new tab"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg></button>
        </div>
      </div>

      <div className="preview-canvas flex-1 flex flex-col bg-neutral-900 relative overflow-hidden">
        <div className="sandpack-wrapper w-full h-full flex flex-col absolute inset-0">
          <SandpackProvider
            template="react"
            theme="dark"
            files={{
              "/App.js": code || defaultAppCode,
              "/public/index.html": indexHtml,
            }}
            customSetup={{
              dependencies: {
                "lucide-react": "latest",
                "recharts": "latest",
                "framer-motion": "latest",
                "clsx": "latest",
                "tailwind-merge": "latest"
              }
            }}
            options={{
              externalResources: ["https://cdn.tailwindcss.com"]
            }}
          >
            <SandpackLayout style={{ flex: 1, border: 'none', background: 'transparent' }}>
              <SandpackPreview
                showNavigator={false}
                showOpenInCodeSandbox={false}
                showRefreshButton={false}
                style={{ flex: 1, height: '100%' }}
              />
            </SandpackLayout>
          </SandpackProvider>
        </div>
      </div>
    </div>
  );
}
