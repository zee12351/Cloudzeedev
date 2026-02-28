import React, { useState, useRef, useEffect } from 'react';
import './Workspace.css';
import ChatHistory from '../components/chat/ChatHistory';
import ChatInput from '../components/chat/ChatInput';
import CodePreview from '../components/preview/CodePreview';
import CodeEditor from '../components/preview/CodeEditor';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function Workspace() {
    const { session } = useAuth();
    const { id } = useParams();
    const [projectName, setProjectName] = useState('Untitled Project');
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Hi there! What would you like to build today?' }
    ]);
    const [activeTab, setActiveTab] = useState('preview');
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadedChatId, setLoadedChatId] = useState(null);
    const [code, setCode] = useState('');
    const [credits, setCredits] = useState(null);
    const [versions, setVersions] = useState([]);
    const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

    // Add streaming state
    const [isStreamingMsg, setIsStreamingMsg] = useState('');
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [publishType, setPublishType] = useState('public');
    const location = useLocation();
    const navigate = useNavigate();

    // Load project if editing an existing one
    useEffect(() => {
        let isMounted = true;

        async function loadProject() {
            if (session?.user?.id && id) {
                if (id !== 'new') {
                    try {
                        const { data, error } = await supabase
                            .from('projects')
                            .select('name, code')
                            .eq('id', id)
                            .single();

                        if (!error && data && isMounted) {
                            setProjectName(data.name);
                            setCode(data.code || '');
                        }
                    } catch (e) {
                        console.error("Error loading project data", e);
                    }
                } else {
                    if (isMounted) {
                        setProjectName('Untitled Project');
                        setCode('');
                    }
                }

                if (isMounted) {
                    try {
                        // Load saved messages from Supabase
                        const { data: dbMessages, error: msgError } = await supabase
                            .from('project_messages')
                            .select('role, content')
                            .eq('project_id', id)
                            .order('created_at', { ascending: true });

                        if (msgError) throw msgError;

                        if (dbMessages && dbMessages.length > 0) {
                            setMessages(dbMessages);
                        } else {
                            // Reset to default greeting if no history exists for this id
                            setMessages([{ role: 'ai', content: 'Hi there! What would you like to build today?' }]);
                        }
                    } catch (e) {
                        console.error("Failed to load saved messages", e);
                        setMessages([{ role: 'ai', content: 'Hi there! What would you like to build today?' }]);
                    }

                    try {
                        // Fetch Versions
                        const { data: versionsData, error: versionsError } = await supabase
                            .from('project_versions')
                            .select('*')
                            .eq('project_id', id)
                            .order('created_at', { ascending: false });

                        if (!versionsError && versionsData) {
                            setVersions(versionsData);
                        }
                    } catch (e) {
                        console.error("Failed to load versions", e);
                    }

                    setLoadedChatId(id);
                }
            }
        }

        loadProject();

        return () => { isMounted = false; };
    }, [id, session]);

    // Initialize and load credits
    useEffect(() => {
        let isMounted = true;

        async function loadCredits() {
            if (session?.user?.id) {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('credits')
                        .eq('id', session.user.id)
                        .single();

                    if (!error && data && isMounted) {
                        setCredits(data.credits);
                    }
                } catch (e) {
                    console.error("Failed to load live credits", e);
                }
            }
        }

        loadCredits();

        return () => { isMounted = false; };
    }, [session]);

    // Auto-save messages to Supabase when they change per project
    useEffect(() => {
        let isWriting = false;

        async function saveMessagesToCloud() {
            if (isWriting || loadedChatId !== id || !session?.user?.id || !id || id === 'new' || messages.length === 0) return;
            isWriting = true;

            try {
                // Determine the last message added to conditionally insert it
                // For a robust implementation we might wipe and rewrite, but for performance
                // we'll assume messages only get appended. We delete all and re-insert for sync simplicity right now.
                // A better approach in V3 would be tracking the message IDs.
                await supabase.from('project_messages').delete().eq('project_id', id);

                const inserts = messages.map(msg => ({
                    project_id: id,
                    role: msg.role === 'ai' ? 'ai' : msg.role,
                    content: msg.content
                }));

                if (inserts.length > 0) {
                    await supabase.from('project_messages').insert(inserts);
                }
            } catch (e) {
                console.error("Failed to save messages to cloud", e);
            } finally {
                isWriting = false;
            }
        }

        const timeoutId = setTimeout(() => {
            saveMessagesToCloud();
        }, 1000); // Debounce DB writes by 1s

        return () => clearTimeout(timeoutId);

    }, [messages, session, id, loadedChatId]);

    // Auto-save code on change (Debounced to prevent spam)
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (session?.user?.id && code && id && id !== 'new') {
                localStorage.setItem(`cloudzeedev_code_${session.user.id}`, code);

                try {
                    await supabase
                        .from('projects')
                        .update({ code: code, updated_at: new Date().toISOString() })
                        .eq('id', id);
                } catch (e) {
                    console.error("Live save failed", e);
                }
            }
        }, 1500); // 1.5s debounce

        return () => clearTimeout(timeoutId);
    }, [code, session, id]);

    const handleSendMessage = async (messageContent) => {
        let currentCredits = credits;
        const isUnlimited = session?.user?.email === 'zeepharma1@gmail.com';

        if (!isUnlimited && currentCredits <= 0) {
            setMessages(prev => [...prev, { role: 'ai', content: 'You have run out of credits! Please upgrade your plan to continue building.' }]);
            return;
        }

        // Deduct 1 credit if not unlimited
        const newCreditBalance = currentCredits - 1;
        if (!isUnlimited) {
            setCredits(newCreditBalance);

            try {
                await supabase.from('profiles').update({ credits: newCreditBalance }).eq('id', session.user.id);
            } catch (e) {
                console.error("Failed to deduct live credit", e);
            }
        }

        // Add user message
        const newUserMessage = { role: 'user', content: messageContent };
        const newMessages = [...messages, newUserMessage];
        setMessages(newMessages);
        setIsGenerating(true);

        try {
            // 1. Prepare system instructions and message payload
            const systemPrompt = `Role: Act as a Senior Product Designer and Lead Frontend Engineer.
Task: Your goal is to build high-end, production-ready web applications that rival the quality of Lovable.dev and V0.

Core Engineering Principles:
1. Component-Driven Development: Always use React with Tailwind CSS. Prefer accessible, professional-grade components.
2. Design-First Thinking: Never output "raw" HTML. Every element must have a design system applied.
3. Typography: Use a clean Sans-Serif stack (Inter/Geist) with a clear hierarchy (text-neutral-400 for subtext).
4. Layout: Use sophisticated spacing (large paddings, gap-8+ for sections) and max-w-7xl containers.
5. Visual Polish: Implement backdrop-blur, subtle borders (border-white/10), and smooth transitions (transition-all duration-300).
6. Smart Defaults: If a user asks for a "button," don't just give a <button>. Give a beautifully styled, rounded, animated button with a hover state. If they ask for a "landing page," include a Hero, Features Grid, and Footer by default.
7. Logic & State: Ensure all forms have validation states and all interactive elements are functional using Framer Motion for animations.
8. Output Format: Output conversational text first, then exactly ONE code block starting with \`\`\`json and ending with \`\`\`. The JSON object MUST map file paths as keys (e.g., "/App.js", "/components/Header.js") to their string code as values. The main entry point MUST be "/App.js".
9. The Goal: Every output must look like a $50k/month SaaS product. Do not settle for "basic" or "placeholder" styles. Use lucide-react for beautiful icons.`;

            let finalSystemPrompt = systemPrompt;
            if (code) {
                finalSystemPrompt += `\n\n--- CURRENT SOURCE CODE ---
The following is the current state of the application's source code in JSON format. You MUST use this as your baseline. If the user asks for a modification, apply the modification to this existing code. Do NOT recreate the app from scratch unless explicitly asked. Always return the FULL updated JSON array containing all necessary files.
\`\`\`json
${code}
\`\`\``;
            }

            const contents = newMessages.map(msg => ({
                role: msg.role === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            // Inject system instructions as the first message
            const payload = {
                contents: [
                    { role: 'user', parts: [{ text: finalSystemPrompt }] },
                    { role: 'model', parts: [{ text: "Understood. I will act as the CloudzeeDev AI developer according to those rules and output exactly ONE ```json block containing the multi-file architecture." }] },
                    ...contents
                ],
                generationConfig: {
                    temperature: 0.1, // extremely low temperature for highest coding precision
                }
            };

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAypZOFLoJq8LccQAqv4Lt7YulJaCDVNmY';

            // Use streamGenerateContent instead of generateContent
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                console.error("Gemini API Error Payload:", data);
                throw new Error(data.error?.message || 'Failed to generate response');
            }

            // Read the stream
            const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
            let generatedText = '';

            setIsStreamingMsg('');

            // Append a temporary empty AI message slot to the UI
            setMessages(prev => [...prev, { role: 'ai', content: '' }]);

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                // Combine chunks
                generatedText += value;

                // Update the UI character by character
                // We'll extract only the conversational text to display in the chat, ignoring the JSON.
                // Or simply display everything until we hit ```json
                let displayString = generatedText;
                const jsonStartIdx = displayString.indexOf('```json');
                if (jsonStartIdx !== -1) {
                    displayString = displayString.substring(0, jsonStartIdx).trim();
                } else {
                    const altJsonStart = displayString.indexOf('```');
                    if (altJsonStart !== -1) {
                        displayString = displayString.substring(0, altJsonStart).trim();
                    }
                }

                setMessages(prev => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = displayString || 'Thinking...';
                    return newMsgs;
                });
            }

            // 3. Post-Streaming: Parse and Split final response into Chat text vs JSON Code blocks
            const codeBlockRegex = /\`\`\`(?:json)?\n([\s\S]*?)\n\`\`\`/i;
            const match = generatedText.match(codeBlockRegex);

            let chatResponse = generatedText;
            let generatedCode = '';

            if (match) {
                generatedCode = match[1]; // Capture group 1 is the actual JSON string content
                // Remove the code block from the chat output
                chatResponse = generatedText.replace(match[0], '').trim();
            }

            setMessages(prev => {
                const finalMsgs = [...prev];
                finalMsgs[finalMsgs.length - 1].content = chatResponse || 'Here is your generated code!';
                return finalMsgs;
            });

            if (generatedCode) {
                setCode(generatedCode);
                setActiveTab('preview');


                // Phase 9: Auto-save functionality for new generation prompts using Postgres
                if (id === 'new') {
                    try {
                        // Default project name 
                        const generatedName = `Project ${Math.floor(Math.random() * 1000)}`;

                        const { data, error } = await supabase
                            .from('projects')
                            .insert([
                                {
                                    user_id: session.user.id,
                                    name: generatedName,
                                    code: generatedCode,
                                    type: 'private'
                                }
                            ])
                            .select()
                            .single();

                        if (error) throw error;

                        if (data && data.id) {
                            setProjectName(data.name);

                            // Save initial version
                            await supabase.from('project_versions').insert([{
                                project_id: data.id,
                                code: generatedCode,
                                prompt: messageContent
                            }]);

                            // Auto-save messages to new project ID database storage
                            const updatedMessages = [...newMessages, { role: 'ai', content: chatResponse || 'Here is your generated code!' }];
                            const inserts = updatedMessages.map(msg => ({
                                project_id: data.id,
                                role: msg.role === 'ai' ? 'ai' : msg.role,
                                content: msg.content
                            }));

                            await supabase.from('project_messages').insert(inserts);

                            navigate(`/workspace/${data.id}`, { replace: true });
                        }
                    } catch (e) {
                        console.error("Failed to create new project in Database", e);
                        toast.error("Failed to auto-save project.");
                    }
                } else {
                    // Save new version to existing project
                    try {
                        const { data: newVersion, error } = await supabase
                            .from('project_versions')
                            .insert([{
                                project_id: id,
                                code: generatedCode,
                                prompt: messageContent
                            }])
                            .select()
                            .single();

                        if (!error && newVersion) {
                            setVersions(prev => [newVersion, ...prev]);
                        }
                    } catch (e) {
                        console.error("Failed to save project version", e);
                    }
                }
            } // This closes if (generatedCode)

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error communicating with the AI provider.' }]);
        } finally {
            setIsGenerating(false);
        }
    };

    // Auto-Kickoff effect for Prompts coming from Hero Landing Page
    // Only fire this AFTER credits have been loaded from Supabase to prevent false "out of credits" errors
    useEffect(() => {
        if (location.state?.initialPrompt && session?.user?.id && credits !== null) {
            const initialPrompt = location.state.initialPrompt;
            // Clear route state to prevent infinite loops on reload
            navigate(location.pathname, { replace: true, state: {} });

            // Allow state to securely settle before generating
            setTimeout(() => {
                handleSendMessage(initialPrompt);
            }, 500);
        }
    }, [location.state?.initialPrompt, session, navigate, credits]);

    const handleExportProject = async () => {
        if (!code) {
            toast.error("No code available to export!");
            return;
        }

        try {
            const zip = new JSZip();
            let parsedFiles = { "/App.js": code };

            try {
                const parsed = JSON.parse(code);
                if (typeof parsed === 'object') {
                    parsedFiles = parsed;
                }
            } catch (e) {
                // Not JSON, just a single file
            }

            // Create standard Vite project structure
            const srcFolder = zip.folder("src");

            // Add all the generated files into the src directory
            Object.entries(parsedFiles).forEach(([path, content]) => {
                const cleanPath = path.startsWith('/') ? path.slice(1) : path;
                srcFolder.file(cleanPath, content);
            });

            // Add standard Vite boilerplate files
            zip.file("package.json", JSON.stringify({
                "name": projectName.toLowerCase().replace(/\s+/g, '-'),
                "private": true,
                "version": "0.0.0",
                "type": "module",
                "scripts": {
                    "dev": "vite",
                    "build": "vite build",
                    "preview": "vite preview"
                },
                "dependencies": {
                    "react": "^18.2.0",
                    "react-dom": "^18.2.0",
                    "lucide-react": "latest",
                    "framer-motion": "latest",
                    "recharts": "latest",
                    "clsx": "latest",
                    "tailwind-merge": "latest"
                },
                "devDependencies": {
                    "@types/react": "^18.2.43",
                    "@types/react-dom": "^18.2.17",
                    "@vitejs/plugin-react": "^4.2.1",
                    "autoprefixer": "^10.4.17",
                    "postcss": "^8.4.33",
                    "tailwindcss": "^3.4.1",
                    "vite": "^5.0.8"
                }
            }, null, 2));

            zip.file("index.html", `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`);

            zip.file("tailwind.config.js", `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`);

            zip.file("postcss.config.js", `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`);

            zip.file("vite.config.js", `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`);

            srcFolder.file("main.jsx", `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`);

            srcFolder.file("index.css", `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background-color: #0A0A0A;
  color: #fff;
}`);

            const blob = await zip.generateAsync({ type: "blob" });
            saveAs(blob, `${projectName.replace(/\s+/g, '-').toLowerCase()}-export.zip`);
            toast.success("Project downloaded successfully!");

        } catch (error) {
            console.error("Export failed", error);
            toast.error("Failed to export project: " + error.message);
        }
    };

    return (
        <div className="workspace-container">
            {/* Workspace Header */}
            <header className="workspace-header glass">
                <div className="header-left">
                    <Link to="/dashboard" className="logo text-gradient mb-0 font-bold">CloudzeeDev</Link>
                    <span className="project-name">{projectName}</span>
                </div>
                <div className="header-tabs">
                    <button
                        className={`tab - btn ${activeTab === 'preview' ? 'active' : ''} `}
                        onClick={() => setActiveTab('preview')}
                    >
                        Preview
                    </button>
                    <button
                        className={`tab - btn ${activeTab === 'code' ? 'active' : ''} `}
                        onClick={() => setActiveTab('code')}
                    >
                        Code
                    </button>
                </div>
                <div className="header-right flex items-center gap-4">
                    <Link to="/pricing" className={`text-sm px-3 py-1 rounded-full border ${session?.user?.email === 'zeepharma1@gmail.com' || credits > 5 ? 'border-gray-200 text-gray-500 hover:text-gray-900 bg-white' : 'border-red-200 text-red-600 bg-red-50'} `}>
                        <span className="font-medium">{session?.user?.email === 'zeepharma1@gmail.com' ? 'Unlimited' : credits}</span> credits remaining
                    </Link>
                    <button onClick={handleExportProject} className="btn btn-secondary share-btn px-4 border-gray-300 gap-2 flex items-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Export
                    </button>
                    <button onClick={() => setIsVersionsModalOpen(true)} className="btn btn-secondary share-btn px-4 border-gray-300 gap-2 flex items-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><path d="M12 7v5l4 2"></path></svg>
                        History
                    </button>
                    <button onClick={() => setIsPublishModalOpen(true)} className="btn btn-secondary share-btn px-4">Publish</button>

                    <div className="relative">
                        <button onClick={() => setIsShareOpen(!isShareOpen)} className="btn btn-primary share-btn px-4">Share</button>
                        {isShareOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-2">
                                <a href={`https://wa.me/?text=${encodeURIComponent('Check out my new project built with CloudzeeDev! https://cloudzeedev.app')}`} target="_blank" rel="noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                                    WhatsApp
                                </a >
                                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://cloudzeedev.app')}`} target="_blank" rel="noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
                                    LinkedIn
                                </a>
                                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out my new project built with CloudzeeDev!')}&url=${encodeURIComponent('https://cloudzeedev.app')}`} target="_blank" rel="noreferrer" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
                                    X (Twitter)
                                </a>
                                <button onClick={() => { navigator.clipboard.writeText('https://cloudzeedev.app'); toast.success('Link copied to clipboard!'); setIsShareOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer border-t border-gray-100 mt-1 pt-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                    Copy Link
                                </button>
                            </div >
                        )
                        }
                    </div >
                </div >
            </header >

            {/* Main Split Pane Layout */}
            < div className="workspace-main" >
                {/* Left Pane - Chat */}
                < div className="pane chat-pane" >
                    <ChatHistory messages={messages} isGenerating={isGenerating} />
                    <ChatInput onSend={handleSendMessage} disabled={isGenerating} />
                </div >

                {/* Right Pane - Preview Area */}
                < div className="pane preview-pane" >
                    {activeTab === 'preview' ? (
                        <CodePreview code={code} />
                    ) : (
                        <CodeEditor code={code} onChange={setCode} />
                    )}
                </div >
            </div >

            {/* Publish Modal */}
            {
                isPublishModalOpen && (
                    <div className="publish-modal-overlay">
                        <div className="publish-modal">
                            <h2 className="publish-modal-title">Publish Project</h2>
                            <p className="publish-modal-subtitle">Choose how you want to publish your project to CloudzeeDev.</p>

                            <div className="publish-options">
                                <button
                                    onClick={() => setPublishType('public')}
                                    className={`publish-option ${publishType === 'public' ? 'selected' : ''}`}
                                >
                                    <div className="publish-option-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg></div>
                                    <div className="publish-option-content">
                                        <div className="publish-option-title">Public</div>
                                        <div className="publish-option-desc">Anyone on the internet can see this.</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setPublishType('private')}
                                    className={`publish-option ${publishType === 'private' ? 'selected' : ''}`}
                                >
                                    <div className="publish-option-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg></div>
                                    <div className="publish-option-content">
                                        <div className="publish-option-title">Private</div>
                                        <div className="publish-option-desc">Only you and invited collaborators can access.</div>
                                    </div>
                                </button>
                            </div>

                            <div className="publish-modal-actions">
                                <button onClick={() => setIsPublishModalOpen(false)} className="publish-btn-cancel">Cancel</button>
                                <button
                                    onClick={async () => {
                                        if (session?.user?.id && code) {
                                            if (id && id !== 'new') {
                                                try {
                                                    const { error } = await supabase
                                                        .from('projects')
                                                        .update({ type: publishType })
                                                        .eq('id', id);

                                                    if (error) throw error;
                                                    toast.success(`Project successfully updated to ${publishType}!`);
                                                } catch (e) {
                                                    console.error("Failed to update project type", e);
                                                    toast.error(`Failed to publish project: ${e.message || e.details || "Unknown error"}`);
                                                }
                                            }
                                        } else {
                                            toast.error("No project context available to publish!");
                                        }
                                        setIsPublishModalOpen(false);
                                    }}
                                    className="publish-btn-confirm"
                                >
                                    Publish Project
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Versions Modal */}
            {isVersionsModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-fade-in text-white relative">
                        <button onClick={() => setIsVersionsModalOpen(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><path d="M12 7v5l4 2"></path></svg>
                            Version History
                        </h2>
                        <p className="text-neutral-400 text-sm mb-6">Restore your project to any previous generation. Note: This replaces your current active code.</p>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {versions.length === 0 ? (
                                <p className="text-center text-neutral-500 py-8">No version history available for this project yet.</p>
                            ) : (
                                versions.map((ver, idx) => (
                                    <div key={ver.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 group">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className="text-xs font-semibold px-2 py-1 bg-white/10 text-neutral-300 rounded-md">v{versions.length - idx}</span>
                                                <span className="text-xs text-neutral-500 ml-3">{new Date(ver.created_at).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-neutral-300 line-clamp-2 italic">"{ver.prompt}"</p>
                                        <button
                                            onClick={() => {
                                                setCode(ver.code);
                                                setIsVersionsModalOpen(false);
                                                toast.success(`Restored to version ${versions.length - idx}!`);
                                            }}
                                            className="w-full mt-2 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                                            Restore Version
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
