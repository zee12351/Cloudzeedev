import React, { useEffect, useRef } from 'react';
import './ChatHistory.css';

export default function ChatHistory({ messages, isGenerating }) {
    const bottomRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isGenerating]);

    return (
        <div className="chat-history">
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-wrapper ${msg.role}`}>
                        <div className={`message-bubble ${msg.role === 'user' ? 'user-msg' : 'ai-msg glass'}`}>
                            <p>{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isGenerating && (
                    <div className="message-wrapper ai">
                        <div className="message-bubble ai-msg glass generating">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
