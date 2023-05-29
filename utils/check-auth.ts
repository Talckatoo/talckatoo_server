import { Request, Response, NextFunction } from "express";

const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.redirect("/api/v1/users/login");
  }
};
