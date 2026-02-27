import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { toast } from 'sonner';
import './CodeEditor.css';

export default function CodeEditor({ code, onChange }) {
    const [files, setFiles] = useState({ "/App.js": code || "" });
    const [activeFile, setActiveFile] = useState("/App.js");

    useEffect(() => {
        if (!code) return;
        try {
            const parsed = JSON.parse(code);
            if (typeof parsed === 'object') {
                if (parsed['App.js'] && !parsed['/App.js']) {
                    parsed['/App.js'] = parsed['App.js'];
                    delete parsed['App.js'];
                }
                setFiles(parsed);
                if (!parsed[activeFile]) {
                    setActiveFile(Object.keys(parsed)[0] || "/App.js");
                }
            } else {
                setFiles({ "/App.js": code });
                setActiveFile("/App.js");
            }
        } catch (e) {
            setFiles({ "/App.js": code });
            setActiveFile("/App.js");
        }
    }, [code]);

    const handleEditorChange = (value) => {
        const newFiles = { ...files, [activeFile]: value };
        setFiles(newFiles);
        if (onChange) {
            try {
                JSON.parse(code);
                onChange(JSON.stringify(newFiles, null, 2));
            } catch (e) {
                onChange(value);
            }
        }
    };

    return (
        <div className="code-editor-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1e1e' }}>
            <div className="editor-header flex flex-wrap gap-2 items-center px-4 py-3 border-b border-white/10" style={{ flexShrink: 0 }}>
                <div className="flex gap-2 overflow-x-auto mr-auto max-w-[70%]">
                    {Object.keys(files).map((filename) => (
                        <button
                            key={filename}
                            onClick={() => setActiveFile(filename)}
                            className={`px-3 py-1.5 rounded-md text-sm transition-all whitespace-nowrap ${activeFile === filename ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            {filename.replace('/', '')}
                        </button>
                    ))}
                </div>
                <button
                    className="copy-btn ml-auto bg-transparent border border-white/10 px-3 py-1.5 rounded-md text-sm text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
                    onClick={() => {
                        navigator.clipboard.writeText(files[activeFile] || '');
                        toast.success('File contents copied to clipboard!');
                    }}
                >
                    Copy {activeFile.replace('/', '')}
                </button>
            </div>

            <div className="editor-content" style={{ flexGrow: 1, position: 'relative' }}>
                <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    theme="vs-dark"
                    value={files[activeFile] || ''}
                    onChange={handleEditorChange}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        padding: { top: 16 }
                    }}
                    loading={
                        <div className="empty-state text-muted h-full flex items-center justify-center">
                            <p>Loading Editor...</p>
                        </div>
                    }
                />
            </div>
        </div>
    );
}
