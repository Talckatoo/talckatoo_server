"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios = require("axios").default;
const { v4: uuidv4 } = require("uuid");
// location, also known as region.
// required if you're using a multi-service or regional (not global) resource. It can be found in the Azure portal on the Keys and Endpoint page.
const location = "eastus";
const getTranslation = async (targetLanguages, text, key, endpoint) => {
    try {
        const response = await axios.post(`${endpoint}/translate`, [
            {
                text: text,
            },
        ], {
            headers: {
                "Ocp-Apim-Subscription-Key": key,
                "Ocp-Apim-Subscription-Region": location,
                "Content-type": "application/json",
                "X-ClientTraceId": uuidv4().toString(),
            },
            params: {
                "api-version": "3.0",
                to: targetLanguages,
            },
            responseType: "json",
        });
        return response?.data[0]?.translations;
    }
    catch (error) {
        console.error("Translation error:", error.message);
        return undefined;
    }
};
exports.default = getTranslation;
