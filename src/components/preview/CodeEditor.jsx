import React from 'react';
import Editor from '@monaco-editor/react';
import './CodeEditor.css';

export default function CodeEditor({ code, onChange }) {
    const handleEditorChange = (value) => {
        if (onChange) {
            onChange(value);
        }
    };

    return (
        <div className="code-editor-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="editor-header" style={{ flexShrink: 0 }}>
                <span className="file-name">App.jsx</span>
                <button
                    className="copy-btn text-muted"
                    onClick={() => {
                        navigator.clipboard.writeText(code);
                        alert('Code copied to clipboard!');
                    }}
                >
                    Copy code
                </button>
            </div>

            <div className="editor-content" style={{ flexGrow: 1, position: 'relative' }}>
                <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    theme="vs-dark"
                    value={code}
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
