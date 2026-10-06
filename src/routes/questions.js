//a. In src/routes/questions.js, define the following endpoints and connect them to the controller
//functions:
//1. Public Routes:
//GET / (get all questions),Your Code Here

import express from 'express';
import {
    getAllQuestions,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    upvoteQuestion,
    downvoteQuestion,
} from '../controllers/questionController.js';
import {
    getAnswersByQuestionId,
    createAnswer,
} from '../controllers/answerController.js';
import authenticate from '../middleware/authHandler.js';

const router = express.Router();

// Public Routes
router.get('/', getAllQuestions);
router.get('/:id', getQuestionById);
router.get('/:questionId/answers', getAnswersByQuestionId);

// Protected Routes (require authentication)
router.post('/', authenticate, createQuestion);
router.put('/:id', authenticate, updateQuestion);
router.delete('/:id', authenticate, deleteQuestion);
router.post('/:id/upvote', authenticate, upvoteQuestion);
router.post('/:id/downvote', authenticate, downvoteQuestion);
router.post('/:questionId/answers', authenticate, createAnswer);

export default router;

