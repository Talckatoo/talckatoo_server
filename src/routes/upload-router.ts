import express from "express";
import { uploadMedia } from "../controllers/media-controller";

const router = express.Router();

router.post("/upload", uploadMedia);

export default router;
