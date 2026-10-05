//a. In src/routes/questions.js, define the following endpoints and connect them to the controller
//functions:
//1. Public Routes:
//GET / (get all questions),Your Code Here

import express from 'express';
import { getAllQuestions, getQuestionById, updateQuestion, createQuestion } from '../controllers/questionController.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

// Public Routes
router.get('/', getAllQuestions);
router.get('/:id', getQuestionById);
router.post('/', authenticate, createQuestion);
router.put('/:id', authenticate, updateQuestion);

export default router;

//1. Public Routes:
//GET /:id (get question by ID)

