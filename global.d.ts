declare global {
  namespace Express {
    interface User {
      userId: string;
      userName: string;
      email: string;
    }
  }
}

export {};
