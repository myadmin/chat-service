import { create } from "zustand";

const useChatStore = create((set, get) => ({
    // 状态
    messages: [],
    input: "",
    isLoading: false,

    // Actions
    addMessage: (message) =>
        set((state) => ({
            messages: [
                ...state.messages,
                {
                    ...message,
                    timestamp: new Date().toISOString(),
                },
            ],
        })),

    // 在appendContent时更新时间戳
    appendAssistantContent: (content) =>
        set((state) => {
            const lastMessage = state.messages[state.messages.length - 1];
            if (lastMessage?.role === "assistant") {
                return {
                    messages: [
                        ...state.messages.slice(0, -1),
                        {
                            ...lastMessage,
                            content: lastMessage.content + content,
                            timestamp: new Date().toISOString(), // 更新时间戳
                        },
                    ],
                };
            }
            return {
                messages: [
                    ...state.messages,
                    {
                        role: "assistant",
                        content,
                        timestamp: new Date().toISOString(),
                    },
                ],
            };
        }),

    handleToolCall: (toolCall) => {
        if (toolCall.function?.name === "get_weather") {
            const args = JSON.parse(toolCall.function.arguments);
            const content = `\n[触发天气查询：${args.location}]`;
            get().appendAssistantContent(content);
        }
    },

    setInput: (input) => set({ input }),
    setLoading: (isLoading) => set({ isLoading }),

    // 完整的提交处理
    submitMessage: async () => {
        const {
            input,
            messages,
            addMessage,
            appendAssistantContent,
            handleToolCall,
            setLoading,
            setInput,
        } = get();
        if (!input.trim()) return;

        try {
            setLoading(true);
            const newMessage = {
                role: "user",
                content: input,
                timestamp: new Date().toISOString(),
            };
            addMessage(newMessage);
            setInput("");

            const response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [...messages, newMessage] }),
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk
                    .split("\n\n")
                    .filter((line) => line.startsWith("data: "));

                lines.forEach((line) => {
                    try {
                        const data = JSON.parse(line.replace("data: ", ""));
                        if (data.content) appendAssistantContent(data.content);
                        data.toolCalls?.forEach(handleToolCall);
                    } catch (err) {
                        console.error("数据解析错误:", err);
                    }
                });
            }
        } catch (error) {
            console.error("请求失败:", error);
            appendAssistantContent("\n[系统错误，请稍后重试]");
        } finally {
            setLoading(false);
        }
    },
}));

export default useChatStore;
