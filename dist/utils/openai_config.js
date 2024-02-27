"use strict";
const axios = require("axios");
const token = process.env.OPENAI_API_KEY;
const getPrompt = async (content) => {
    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content }],
    }, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
    return response;
};
module.exports = getPrompt;
