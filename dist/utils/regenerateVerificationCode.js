"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// In generateVerificationCode.js
const generateVerificationCode = () => {
    let verificationCode = "";
    const codeLength = 4; // You can adjust this as needed
    for (let i = 0; i < codeLength; i++) {
        const randomIndex = Math.floor(Math.random() * 10);
        verificationCode += randomIndex;
    }
    return verificationCode;
};
exports.default = generateVerificationCode;
