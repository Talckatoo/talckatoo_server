// In generateVerificationCode.js
const generateVerificationCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let verificationCode = '';
    const codeLength = 4; // You can adjust this as needed
  
    for (let i = 0; i < codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      verificationCode += characters.charAt(randomIndex);
    }
  
    return verificationCode;
  };
  
  export default generateVerificationCode;
  