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
  </body>
</html>`;

    let parsedFiles = { "/App.js": code };
    try {
        const parsed = JSON.parse(code);
        if (typeof parsed === 'object') {
            parsedFiles = parsed;
            if (!parsedFiles['/App.js'] && parsedFiles['App.js']) {
                parsedFiles['/App.js'] = parsedFiles['App.js'];
                delete parsedFiles['App.js'];
            }
        }
    } catch (e) {
        // Fallback for legacy single-file projects
    }

    return (
        <div className="h-screen w-full bg-[#0A0A0A] overflow-hidden">
            <SandpackProvider
                template="react"
                theme="dark"
                files={{
                    ...parsedFiles,
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
