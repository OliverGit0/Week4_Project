import express from "express";
import authRouter from "./auth.js";
import tagsRouter from "./tags.js";
import questionsRouter from "./questions.js";

const router = express.Router();

// Route for user registration
router.use("/auth", authRouter);

// Add question and answer routes
router.use("/questions", questionsRouter);


// Routes for Tags
router.use("/tags", tagsRouter);

export default router;
