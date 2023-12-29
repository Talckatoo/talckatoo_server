import { Request, Response, NextFunction } from "express";
const catchAsync =
  (fn: any) => (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);
module.exports = catchAsync;
export default catchAsync;
