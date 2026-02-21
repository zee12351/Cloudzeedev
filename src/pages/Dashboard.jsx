import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";
import './Dashboard.css';

export default function Dashboard({ session }) {
    const navigate = useNavigate();
    const [publishedProjects, setPublishedProjects] = useState([]);

    const [menuOpenId, setMenuOpenId] = useState(null);

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
                alert("Failed to delete project from the database.");
            }
        }
    };

    const handlePreviewProject = (project) => {
        localStorage.setItem('cloudzeedev_live_code', project.code);
        window.open('/live', '_blank');
    };

    return (
        <div className="dashboard-page">
            <header className="dashboard-header glass">
                <div className="container header-container">
                    <Link to="/" className="logo cursor-pointer text-gradient">
                        <span className="font-bold">CloudzeeDev</span>
                    </Link>

                    <div className="user-info">
                        <span className="user-email">{session?.user?.email}</span>
                        <button onClick={handleSignOut} className="btn btn-secondary">
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            <main className="container dashboard-main animate-fade-in">
                <h1 className="dashboard-title">Welcome to your Workspace</h1>
                <p className="dashboard-subtitle">
                    In Phase 2, this is where you will see your agent chat and your live project previews!
                </p>

                <div className="projects-grid">
                    <Link to="/workspace/new" className="project-card glass" style={{ textDecoration: 'none', display: 'block' }}>
                        <div className="project-preview new-project">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                        </div>
                        <div className="project-info">
                            <h3>Create new project</h3>
                            <p>Start a new AI conversation</p>
                        </div>
                    </Link>

                    {publishedProjects.map(project => (
                        <div key={project.id} className="project-card glass relative" style={{ textDecoration: 'none', display: 'block' }}>
                            {/* Kebab Menu Button */}
                            <div className="absolute top-2 right-2 z-20">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === project.id ? null : project.id); }}
                                    className="p-1 rounded-md bg-white/50 hover:bg-white/80 transition-colors shadow-sm"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                                </button>

                                {menuOpenId === project.id && (
                                    <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-30 py-1">
                                        <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); handleEditProject(project); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit Project</button>
                                        <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); handlePreviewProject(project); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Live Preview</button>
                                        <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); handleDeleteProject(project.id); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                                    </div>
                                )}
                            </div>

                            <div
                                className="project-preview overflow-hidden relative cursor-pointer"
                                style={{ height: '160px', width: '100%', background: '#fff' }}
                                onClick={() => handleEditProject(project)}
                            >
                                <div style={{ transform: 'scale(0.35)', transformOrigin: 'top left', width: '286%', height: '286%', pointerEvents: 'none' }}>
                                    <SandpackProvider
                                        template="react"
                                        theme="light"
                                        files={{
                                            "/App.js": project.code,
                                            "/styles.css": `@tailwind base;\n@tailwind components;\n@tailwind utilities;\nbody { font-family: sans-serif; }`,
                                            "/public/index.html": `<!DOCTYPE html><html lang="en"><head><script src="https://cdn.tailwindcss.com"></script></head><body><div id="root"></div></body></html>`
                                        }}
                                        options={{ externalResources: ["https://cdn.tailwindcss.com"] }}
                                    >
                                        <SandpackPreview showOpenInCodeSandbox={false} showRefreshButton={false} style={{ height: '100vh' }} />
                                    </SandpackProvider>
                                </div>
                            </div>
                            <div className="project-info p-4 border-t border-gray-100 cursor-pointer" onClick={() => handleEditProject(project)}>
                                <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                                <p className="text-xs text-gray-500 truncate mt-1">Published: {new Date(project.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
