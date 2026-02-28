import React, { useEffect, useState } from 'react';
import { SandpackProvider, SandpackLayout, SandpackPreview } from '@codesandbox/sandpack-react';

export default function LivePreview() {
    const [code, setCode] = useState('');

    useEffect(() => {
        const savedCode = localStorage.getItem('cloudzeedev_live_code');
        if (savedCode) {
            setCode(savedCode);
        }
    }, []);

    if (!code) return <div className="h-screen w-full bg-[#0A0A0A] flex items-center justify-center text-white font-medium">No active preview found. Please generate an app first.</div>;

    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Inject Tailwind CSS for the AI generated code to use -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { margin: 0; padding: 0; font-family: system-ui, sans-serif; background: #0A0A0A; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;

    let parsedFiles = { "/src/App.jsx": code };
    try {
        const parsed = JSON.parse(code);
        if (typeof parsed === 'object') {
            parsedFiles = {};
            Object.entries(parsed).forEach(([key, value]) => {
                let fileName = key.startsWith('/') ? key.substring(1) : key;
                if (fileName === 'App.js' || fileName === 'App') fileName = 'App.jsx';
                if (fileName === 'package.json' || fileName === 'vite.config.js' || fileName === 'index.html') {
                    parsedFiles[`/${fileName}`] = value;
                } else {
                    parsedFiles[`/src/${fileName}`] = value;
                }
            });
            if (!parsedFiles['/src/App.jsx'] && parsedFiles['/src/App.js']) {
                parsedFiles['/src/App.jsx'] = parsedFiles['/src/App.js'];
                delete parsedFiles['/src/App.js'];
            }
        }
    } catch (e) {
        // Fallback for legacy single-file projects
    }

    return (
        <div className="h-screen w-full bg-[#0A0A0A] overflow-hidden">
            <SandpackProvider
                template="vite-react"
                theme="dark"
                files={{
                    ...parsedFiles,
                    "/index.html": indexHtml,
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
                <SandpackLayout style={{ height: '100vh', border: 'none', borderRadius: 0, background: 'transparent' }}>
                    <SandpackPreview
                        showNavigator={false}
                        showOpenInCodeSandbox={false}
                        showRefreshButton={false}
                        style={{ height: '100vh', flex: 1 }}
                    />
                </SandpackLayout>
            </SandpackProvider>
        </div>
    );
}
