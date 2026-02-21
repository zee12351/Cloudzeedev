import React from 'react';
import './CodeEditor.css';

export default function CodeEditor({ code }) {
    return (
        <div className="code-editor-container">
            <div className="editor-header">
                <span className="file-name">App.jsx</span>
                <button className="copy-btn text-muted">Copy code</button>
            </div>

            <div className="editor-content">
                {code ? (
                    <pre className="code-block">
                        <code>{code}</code>
                    </pre>
                ) : (
                    <div className="empty-state text-muted">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                        <p>Generated React code will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
