"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const checkAuth = (req, res, next) => {
    if (!req.user) {
        res.redirect("/api/v1/users/login");
    }
};
