const tools = [
    {
        type: "function",
        function: {
            name: "get_weather",
            description: "获取指定城市的天气信息",
            parameters: {
                type: "object",
                properties: {
                    location: {
                        type: "string",
                        description: "城市名称",
                    },
                },
                required: ["location"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "generate_image",
            description:
                "根据用户提供的提示词生成高质量图片，支持调整风格、尺寸、数量等参数。",
            parameters: {
                type: "object",
                properties: {
                    prompt: {
                        type: "string",
                        description:
                            "图片生成提示词，应尽可能详细描述内容、风格、构图等。例如：'一只戴着墨镜的猫，赛博朋克风格，霓虹灯光，未来城市背景，4K高清'",
                    },
                    style: {
                        type: "string",
                        description:
                            "图片风格，如：'写实'、'卡通'、'油画'、'水彩'、'赛博朋克'、'极简主义'等",
                        enum: [
                            "realistic",
                            "cartoon",
                            "oil-painting",
                            "watercolor",
                            "cyberpunk",
                            "minimalist",
                            "anime",
                            "pixel-art",
                        ],
                        default: "realistic",
                    },
                    size: {
                        type: "string",
                        description:
                            "图片尺寸，如：'1024x1024'、'512x768'、'1920x1080'",
                        enum: ["512x512", "768x512", "1024x1024", "1920x1080"],
                        default: "1024x1024",
                    },
                    enhance_prompt: {
                        type: "boolean",
                        description:
                            "是否自动优化提示词（AI可能会调整描述使其更符合生成要求）",
                        default: true,
                    },
                },
                required: ["prompt"],
            },
        },
    }
];

export default tools;
