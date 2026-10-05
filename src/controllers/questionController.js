//a. getAllQuestions – Call the service to get all questions. Ensure that the response object has the following structure for all successful responses: {
// "success": true,
// "message": "Descriptive success message",
// "data": {} // or [] depending on the endpoint
// }
import {
    getAllQuestionsService,
    getQuestionByIdService,
    createQuestionService,
    updateQuestionService,
    deleteQuestionService,
} from '../services/questionService.js';

export const getAllQuestions = async (req, res) => {
    const questions = await getAllQuestionsService();

    res.status(200).json({
        success: true,
        message: 'Questions fetched successfully',
        data: questions,
    });
};
//b. getQuestionById – Extract id from req.params. Call the service to get the question by ID.
//Ensure that the response object has the following structure for all successful responses:
// "success": true,
// "message": "Descriptive success message",
// "data": {} // or [] depending on the endpoint
// }


export const getQuestionById = async (req, res) => {
    const { id } = req.params;
    const question = await getQuestionByIdService(id);

    res.status(200).json({
        success: true,
        message: 'Question fetched successfully',
        data: question,
    });
};

//c. createQuestion – Extract { title, description, tags } from req.body and author
//from req.user.id. Call the service to create a question.


export const createQuestion = async (req, res) => {
    const { title, description, tags } = req.body;
    const author = req.user.id;

    const question = await createQuestionService({ title, description, tags, author });

    res.status(201).json({
        success: true,
        message: 'Question created successfully',
        data: question,
    });
};

//d. updateQuestion – Extract id from req.params and { title, description, tags } from
//req.body. Call the service to update a question, passing the full req.user object so the service
//can perform ownership/admin verification.

export const updateQuestion = async (req, res) => {
    const { id } = req.params;
    const { title, description, tags } = req.body;
    const loggedInUser = req.user;

    const question = await updateQuestionService({ id, title, description, tags, loggedInUser });

    res.status(200).json({
        success: true,
        message: 'Question updated successfully',
        data: question,
    });
};

//e. deleteQuestion – Call the delete question service with arguments req.params.id and req.user,
//passing the full req.user object for ownership/admin verification.

export const deleteQuestion = async (req, res) => {
    const { id } = req.params;
    const loggedInUser = req.user;

    const question = await deleteQuestionService({ id, loggedInUser });

    res.status(200).json({
        success: true,
        message: 'Question deleted successfully',
        data: question,
    });
};