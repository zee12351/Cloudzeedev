import React, { useState, useRef, useEffect } from 'react';
import './Workspace.css';
import ChatHistory from '../components/chat/ChatHistory';
import ChatInput from '../components/chat/ChatInput';
import CodePreview from '../components/preview/CodePreview';
import CodeEditor from '../components/preview/CodeEditor';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Workspace({ session }) {
    const { id } = useParams();
    const [projectName, setProjectName] = useState('Untitled Project');
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Hi there! What would you like to build today?' }
    ]);
    const [activeTab, setActiveTab] = useState('preview');
    const [isGenerating, setIsGenerating] = useState(false);
    const [code, setCode] = useState('');
    const [credits, setCredits] = useState(0);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [publishType, setPublishType] = useState('public');
    const location = useLocation();
    const navigate = useNavigate();

    // Load project if editing an existing one
    useEffect(() => {
        let isMounted = true;

        async function loadProject() {
            if (session?.user?.id && id && id !== 'new') {
                try {
                    const { data, error } = await supabase
                        .from('projects')
                        .select('name, code')
                        .eq('id', id)
                        .single();

                    if (!error && data && isMounted) {
                        setProjectName(data.name);
                        setCode(data.code);
                    }
                } catch (e) {
                    console.error("Error loading project data", e);
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

                // Load saved messages
                const messagesKey = `cloudzeedev_messages_${session.user.id}`;
                const savedMessages = localStorage.getItem(messagesKey);
                if (savedMessages) {
                    try {
                        setMessages(JSON.parse(savedMessages));
                    } catch (e) {
                        console.error("Failed to parse saved messages", e);
                    }
                }
            }
        }

        loadCredits();

        return () => { isMounted = false; };
    }, [session]);

    // Auto-save messages on change
    useEffect(() => {
        if (session?.user?.id && messages.length > 1) {
            const messagesKey = `cloudzeedev_messages_${session.user.id}`;
            localStorage.setItem(messagesKey, JSON.stringify(messages));
        }
    }, [messages, session]);

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

        if (currentCredits <= 0) {
            setMessages(prev => [...prev, { role: 'ai', content: 'You have run out of credits! Please upgrade your plan to continue building.' }]);
            return;
        }

        // Deduct 1 credit
        const newCreditBalance = currentCredits - 1;
        setCredits(newCreditBalance);

        try {
            await supabase.from('profiles').update({ credits: newCreditBalance }).eq('id', session.user.id);
        } catch (e) {
            console.error("Failed to deduct live credit", e);
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
8. Output Format: Output conversational text first, then exactly ONE code block starting with \`\`\`jsx and ending with \`\`\`. Do not use \`\`\`javascript. The React code must be a single file using Tailwind CSS classes for styling. DO NOT export multiple components. Use a default export for the main component.
9. The Goal: Every output must look like a $50k/month SaaS product. Do not settle for "basic" or "placeholder" styles. Use lucide-react for beautiful icons.`;

            const contents = newMessages.map(msg => ({
                role: msg.role === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            // Inject system instructions as the first message
            const payload = {
                contents: [
                    { role: 'user', parts: [{ text: systemPrompt }] },
                    { role: 'model', parts: [{ text: "Understood. I will act as the CloudzeeDev AI developer according to those rules and output ```jsx blocks." }] },
                    ...contents
                ],
                generationConfig: {
                    temperature: 0.1, // extremely low temperature for highest coding precision
                }
            };

            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAypZOFLoJq8LccQAqv4Lt7YulJaCDVNmY';

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Gemini API Error Payload:", data);
                throw new Error(data.error?.message || 'Failed to generate response');
            }

            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // 3. Parse and Split response into Chat text vs Code blocks
            // This regex flexibly matches ```jsx, ```javascript, ```tsx, or just ```
            const codeBlockRegex = /\`\`\`(jsx|js|javascript|tsx|ts)?\n([\s\S]*?)\n\`\`\`/i;
            const match = generatedText.match(codeBlockRegex);

            let chatResponse = generatedText;
            let generatedCode = '';

            if (match) {
                generatedCode = match[2]; // Capture group 2 is the actual code content
                // Remove the code block from the chat output
                chatResponse = generatedText.replace(match[0], '').trim();
            }

            setMessages(prev => [...prev, { role: 'ai', content: chatResponse || 'Here is your generated code!' }]);
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
                            navigate(`/workspace/${data.id}`, { replace: true });
                        }
                    } catch (e) {
                        console.error("Failed to create new project in Database", e);
                        alert("Failed to auto-save project.");
                    }
                }
            }


        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error communicating with the AI provider.' }]);
        } finally {
            setIsGenerating(false);
        }
    };

    // Auto-Kickoff effect for Prompts coming from Hero Landing Page
    useEffect(() => {
        if (location.state?.initialPrompt && session?.user?.id) {
            const initialPrompt = location.state.initialPrompt;
            // Clear route state to prevent infinite loops on reload
            navigate(location.pathname, { replace: true, state: {} });

            // Allow state to securely settle before generating
            setTimeout(() => {
                handleSendMessage(initialPrompt);
            }, 500);
        }
    }, [location.state?.initialPrompt, session, navigate]);

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
                    <Link to="/pricing" className={`text - sm px - 3 py - 1 rounded - full border ${credits > 5 ? 'border-gray-200 text-gray-500 hover:text-gray-900 bg-white' : 'border-red-200 text-red-600 bg-red-50'} `}>
                        <span className="font-medium">{credits}</span> credits remaining
                    </Link>
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
                                <button onClick={() => { navigator.clipboard.writeText('https://cloudzeedev.app'); alert('Link copied!'); setIsShareOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer border-t border-gray-100 mt-1 pt-2">
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
                        <CodeEditor code={code} />
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
                                                    alert(`Project successfully updated to ${publishType}!`);
                                                } catch (e) {
                                                    console.error("Failed to update project type", e);
                                                    alert("Failed to publish project.");
                                                }
                                            }
                                        } else {
                                            alert("No project context available to publish!");
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
        </div >
    );
}
