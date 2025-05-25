import axios from "axios";
import cityList from "../config/cityCode.js";

export async function getWeather(location) {
    // 实际项目中替换为真实API调用
    try {
        const cityData = cityList.find((item) =>
            location?.toLowerCase().includes(item.city_name?.toLowerCase())
        );
        if (!cityData) {
            throw {
                msg: "没有查询到该城市天气，你可以重新尝试",
                code: 200,
                validate: null,
                serviceCode: 201,
            };
        }
        const cityCode = cityData.city_code.length ? cityData.city_code : null;
        if (!cityCode) {
            throw {
                msg: "没有查询到该城市天气，你可以重新尝试",
                code: 200,
                validate: null,
                serviceCode: 201,
            };
        }
        const queryUrl = process.env.QUERY_WEATHER_URL + cityCode;
        const weatherData = await axios.get(queryUrl);
        const res = {
            cityInfo: weatherData.data.cityInfo,
            ...weatherData.data.data,
        };
        return JSON.stringify({
            location,
            ...res,
        });
    } catch (error) {
        throw error;
    }
}

export async function generateImage(prompt) {
    console.log("🚀 ~ generateImage ~ prompt:", prompt)
    try {
        const response = await axios.post(
            process.env.ZHIPUAI_API_URL,
            {
                model: "cogview-3-flash", // 指定模型
                prompt: prompt,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.ZHIPUAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        // 处理响应
        if (response.data.data && response.data.data.length > 0) {
            const imageUrl = response.data.data[0].url;
            // console.log("生成的图片URL:", imageUrl);
            // return `<img src="${imageUrl}" alt="生成图片" />`;、
            return imageUrl;
        } else {
            // throw new Error("未收到有效图片数据");
            return "生成图片失败";
        }
    } catch (error) {
        console.error("生成图片失败:", error.response?.data || error.message);
        throw error;
    }
}
