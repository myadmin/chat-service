import { useEffect, useRef } from "react";
import { marked } from "marked";
import useChatStore from "./store/useChatStore";
import { useThemeStore } from "./store/useThemeStore";
import hljs from "highlight.js";
import "highlight.js/styles/github.css"; // 可选主题
import "./App.css";

marked.setOptions({
    highlight: function (code, lang) {
        const validLang = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language: validLang }).value;
    },
    breaks: true, // 支持换行
    gfm: true, // 启用GitHub风格的Markdown
    xhtml: true, // 生成兼容XHTML的标签
});

marked.use({
    extensions: [
        {
            name: "think",
            level: "block",
            start(src) {
                return src.indexOf("<think>");
            },
            tokenizer(src) {
                const match = src.match(/<think>([\s\S]*?)<\/think>/);
                if (match) {
                    return {
                        type: "think",
                        raw: match[0],
                        text: match[1].trim(),
                    };
                }
            },
            renderer(token) {
                return `<div class="think-block">${token.text}</div>`;
            },
        },
    ],
});

function App() {
    const { input, isLoading, messages, setInput, submitMessage } =
        useChatStore();

    const { darkMode, toggleDarkMode } = useThemeStore();
    const messagesEndRef = useRef(null);

    const textareaRef = useRef(null);

    // 自动滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) submitMessage();
    };

    // 将Markdown文本转换为HTML
    const markdownToHtml = (text) => {
        const rawHtml = marked(text);

        return { __html: rawHtml };
    };

    // 复制消息到剪贴板
    const copyMessage = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            alert("已复制到剪贴板");
        } catch (err) {
            console.error("复制失败:", err);
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    return (
        <div className={`app-container ${darkMode ? "dark-mode" : ""}`}>
            <header className="app-header">
                <h1>智能助手</h1>
                <button onClick={toggleDarkMode} className="theme-toggle">
                    {darkMode ? "🌞" : "🌙"}
                </button>
            </header>

            <div className="chat-wrapper">
                <div className="messages-container">
                    {messages.length === 0 ? (
                        <div className="empty-state">
                            <div className="welcome-message">
                                <h2>欢迎使用智能助手</h2>
                                <p>输入消息开始对话</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`message-bubble ${msg.role} ${
                                    msg.role === "user"
                                        ? "user-message"
                                        : "assistant-message"
                                }`}
                            >
                                <div className="message-content">
                                    {msg.role === "assistant" && (
                                        <div className="assistant-avatar">
                                            AI
                                        </div>
                                    )}
                                    <div className="text-content">
                                        <div className="message-header">
                                            <span className="message-role">
                                                {msg.role === "user"
                                                    ? "你"
                                                    : "AI助手"}
                                            </span>
                                            <span className="message-time">
                                                {new Date(
                                                    msg.timestamp
                                                ).toLocaleString()}
                                            </span>
                                            <button
                                                className="copy-button"
                                                title="Copy"
                                                onClick={() =>
                                                    copyMessage(msg.content)
                                                }
                                            >
                                                ⎘
                                            </button>
                                        </div>
                                        {/* 使用markdownToHtml函数来解析Markdown */}
                                        <div
                                            className="markdown-body markdown custom-markdown"
                                            dangerouslySetInnerHTML={markdownToHtml(
                                                msg.content
                                            )}
                                        />
                                    </div>
                                    {msg.role === "user" && (
                                        <div className="user-avatar">你</div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="input-area" onSubmit={handleSubmit}>
                    <div className="input-wrapper">
                        <input
                            ref={textareaRef}
                            value={input}
                            onChange={handleInputChange}
                            placeholder="输入消息..."
                            disabled={isLoading}
                            autoFocus
                            className="chat-input"
                        />

                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className={isLoading ? "loading" : ""}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    发送中
                                </>
                            ) : (
                                "发送"
                            )}
                        </button>
                    </div>
                    <p className="hint-text">支持多轮对话和功能调用</p>
                </form>
            </div>
        </div>
    );
}

export default App;
