import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { generateImage, getWeather } from "./utils/index.js";
import tools from "./utils/tools.js";

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    baseURL: process.env.ZHIPUAI_BASE_URL,
    apiKey: process.env.ZHIPUAI_API_KEY,
});

// 模拟天气API

app.post("/chat", async (req, res) => {
    try {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        let messages = [...req.body.messages];
        const stream = await openai.chat.completions.create({
            model: "glm-4-flash-250414",
            // model: "glm-4v-flash",
            messages,
            tools,
            stream: true,
        });

        let toolResponseSent = false;

        for await (const chunk of stream) {
            const toolCalls = chunk.choices[0]?.delta?.tool_calls;

            // 检测到函数调用
            if (toolCalls && !toolResponseSent) {
                // 暂停原始流
                stream.controller.abort();

                // 获取函数调用参数
                const functionCall = toolCalls[0].function;
                const args = JSON.parse(functionCall.arguments);
                // console.log("🚀 ~ forawait ~ args:", args)

                let toolResponse;

                // 根据不同的函数调用执行不同的操作
                if (functionCall.name === "get_weather") {
                    // 执行天气查询
                    toolResponse = await getWeather(args.location);
                } else if (functionCall.name === "generate_image") {
                    // 执行图片生成
                    toolResponse = await generateImage(args.prompt);
                }
                console.log("🚀 ~ forawait ~ toolResponse:", toolResponse)

                // 构建工具响应消息
                messages.push({
                    role: "assistant",
                    tool_calls: toolCalls,
                });

                messages.push({
                    role: "tool",
                    tool_call_id: toolCalls[0].id,
                    name: functionCall.name,
                    content: toolResponse,
                });

                // 重新发起请求获取最终回复
                const secondStream = await openai.chat.completions.create({
                    model: "glm-4-flash-250414",
                    messages,
                    stream: true,
                });
                console.log("🚀 ~ forawait ~ secondStream:", secondStream)

                // 发送最终回复
                for await (const finalChunk of secondStream) {
                    const content = finalChunk.choices[0]?.delta?.content || "";
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }

                toolResponseSent = true;
                break;
            }

            // 正常文本回复
            const content = chunk.choices[0]?.delta?.content || "";
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        res.end();
    }
});

app.listen(8080, () => console.log("Server running on port 8080"));
