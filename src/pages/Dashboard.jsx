import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
    const { session } = useAuth();
    const navigate = useNavigate();
    const [publishedProjects, setPublishedProjects] = useState([]);
    const [menuOpenId, setMenuOpenId] = useState(null);

    const parseProjectCodeForSandpack = (code) => {
        let parsedFiles = { "/src/App.jsx": code };
        try {
            const parsed = JSON.parse(code);
            if (typeof parsed === 'object') {
                parsedFiles = {};
                Object.entries(parsed).forEach(([key, value]) => {
                    let fileName = key.startsWith('/') ? key.substring(1) : key;
                    if (fileName === 'package.json') return;

                    if (fileName === 'App.js' || fileName === 'App') fileName = 'App.jsx';
                    if (fileName === 'vite.config.js' || fileName === 'index.html') {
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
            // Fallback
        }
        return parsedFiles;
    };

    const handleShare = () => {
        if (session?.user?.id) {
            const inviteLink = `${window.location.origin}/auth?ref=${session.user.id}`;
            navigator.clipboard.writeText(inviteLink);
            toast.success("Referral link copied to clipboard! You earn 5 credits for each sign-up.");
        } else {
            toast.error("You need to be logged in to share a referral link.");
        }
    };

    useEffect(() => {
        let isMounted = true;

        async function fetchProjects() {
            if (session?.user?.id) {
                try {
                    const { data, error } = await supabase
                        .from('projects')
                        .select('*')
                        .eq('user_id', session.user.id)
                        .order('created_at', { ascending: false });

                    if (error) {
                        console.error("Failed to fetch published projects", error);
                    } else if (isMounted && data) {
                        setPublishedProjects(data);
                    }
                } catch (e) {
                    console.error("Unexpected error fetching projects", e);
                }
            }
        }

        fetchProjects();

        // Close menu when clicking outside
        const closeMenu = () => setMenuOpenId(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, [session]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const handleEditProject = (project) => {
        localStorage.setItem(`cloudzeedev_code_${session.user.id}`, project.code);
        navigate(`/workspace/${project.id}`);
    };

    const handleDeleteProject = async (projectId) => {
        if (window.confirm("Are you sure you want to delete this project?")) {
            try {
                const { error } = await supabase.from('projects').delete().eq('id', projectId);
                if (error) throw error;

                // Update local state to reflect deletion immediately
                const updatedProjects = publishedProjects.filter(p => p.id !== projectId);
                setPublishedProjects(updatedProjects);
            } catch (err) {
                console.error("Error deleting project:", err);
                toast.error("Failed to delete project from the database.");
            }
        }
    };

    const handlePreviewProject = (project) => {
        localStorage.setItem('cloudzeedev_live_code', project.code);
        window.open('/live', '_blank');
    };

    return (
        <div className="dashboard-layout">
            {/* Dark Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <Link to="/" className="sidebar-logo text-gradient font-bold">
                        CloudzeeDev
                    </Link>
                    <div className="sidebar-user-dropdown">
                        <div className="user-avatar text-white bg-pink-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">
                            {session?.user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <span className="user-email truncate">{session?.user?.email}</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-group">
                        <Link to="/dashboard" className="sidebar-link active">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                            Home
                        </Link>
                        <button className="sidebar-link w-full text-left">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            Search
                        </button>
                    </div>

                    <div className="nav-group mt-6">
                        <h4 className="nav-group-title">Projects</h4>
                        <Link to="/dashboard" className="sidebar-link">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            All projects
                        </Link>
                        <Link to="/dashboard" className="sidebar-link">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            Recents
                        </Link>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleShare} className="sidebar-action-card">
                        <div className="action-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg></div>
                        <div className="action-text">
                            <div className="font-semibold text-white">Share CloudzeeDev</div>
                            <div className="text-xs text-gray-400">Earn credits per referral</div>
                        </div>
                    </button>
                    <Link to="/pricing" className="sidebar-action-card upgrade">
                        <div className="action-icon text-yellow-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg></div>
                        <div className="action-text">
                            <div className="font-semibold text-white">Upgrade to Pro</div>
                            <div className="text-xs text-gray-400">Unlock more benefits</div>
                        </div>
                    </Link>
                    <div className="sidebar-bottom-user mt-4 flex items-center justify-between">
                        <div className="user-avatar text-white bg-pink-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                            {session?.user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <button onClick={handleSignOut} className="text-xs text-gray-400 hover:text-white transition-colors">Sign out</button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="dashboard-content">
                <main className="dashboard-main animate-fade-in p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">What should we build, {session?.user?.email?.split('@')[0]}?</h1>
                            <p className="text-gray-400">Pick up where you left off or start something new.</p>
                        </div>
                    </div>

                    <div className="projects-grid">
                        <Link to="/workspace/new" className="project-card glass shadow-lg border border-gray-800 bg-gray-900/50 hover:bg-gray-800/80 transition-all" style={{ textDecoration: 'none', display: 'block' }}>
                            <div className="project-preview new-project bg-transparent text-gray-400">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14" /></svg>
                            </div>
                            <div className="project-info p-4 border-t border-gray-800">
                                <h3 className="text-white font-semibold">Create new project</h3>
                                <p className="text-gray-500 text-sm">Start a new AI conversation</p>
                            </div>
                        </Link>

                        {publishedProjects.map(project => (
                            <div key={project.id} className="project-card glass shadow-lg border border-gray-800 bg-gray-900/50 relative" style={{ textDecoration: 'none', display: 'block' }}>
                                {/* Kebab Menu Button */}
                                <div className="absolute top-2 right-2 z-20">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === project.id ? null : project.id); }}
                                        className="p-1 rounded-md bg-gray-800/80 hover:bg-gray-700 transition-colors shadow-sm text-gray-300"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                                    </button>

                                    {menuOpenId === project.id && (
                                        <div className="absolute right-0 mt-1 w-36 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-30 py-1">
                                            <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); handleEditProject(project); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Edit Project</button>
                                            <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); handlePreviewProject(project); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Live Preview</button>
                                            <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); handleDeleteProject(project.id); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10">Delete</button>
                                        </div>
                                    )}
                                </div>

                                <div
                                    className="project-preview overflow-hidden relative cursor-pointer"
                                    style={{ height: '180px', width: '100%', background: '#000' }}
                                    onClick={() => handleEditProject(project)}
                                >
                                    <div style={{ transform: 'scale(0.35)', transformOrigin: 'top left', width: '286%', height: '286%', pointerEvents: 'none' }}>
                                        <SandpackProvider
                                            template="vite-react"
                                            theme="dark"
                                            files={{
                                                ...parseProjectCodeForSandpack(project.code),
                                                "/index.html": `<!DOCTYPE html><html lang="en"><head><script src="https://cdn.tailwindcss.com"></script></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
                                            }}
                                            options={{ externalResources: ["https://cdn.tailwindcss.com"] }}
                                        >
                                            <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={false} style={{ height: '100vh', background: '#000' }} />
                                        </SandpackProvider>
                                    </div>
                                </div>
                                <div className="project-info p-4 border-t border-gray-800 cursor-pointer flex items-center justify-between" onClick={() => handleEditProject(project)}>
                                    <div className="flex items-center gap-3">
                                        <div className="user-avatar text-white bg-pink-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                            {session?.user?.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h3 className="font-semibold text-white truncate text-base">{project.name}</h3>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">Viewed {new Date(project.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
