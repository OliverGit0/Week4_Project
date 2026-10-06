import {
    getAnswersByQuestionIdService,
    createAnswerService,
    updateAnswerService,
    deleteAnswerService,
    upvoteAnswerService,
    downvoteAnswerService,
} from '../services/answerService.js';

//a2. getAnswersByQuestionId – Extract questionId from req.params. Call the service to get
//answers for the given question ID.

export const getAnswersByQuestionId = async (req, res) => {
    const { questionId } = req.params;

    const answers = await getAnswersByQuestionIdService({ questionId });

    res.status(200).json({
        success: true,
        message: 'Answers retrieved successfully',
        data: answers,
    });
};

//b2. createAnswer – Extract questionId from req.params, answerText from req.body, and
//author from req.user.id. Call the service to create an answer. Respond with status 201
//(Created) instead of 200 for this endpoint, and include the created answer in the data field of the
//response.

export const createAnswer = async (req, res) => {
    const { questionId } = req.params;
    const { answerText } = req.body;
    const author = req.user.id;

    const newAnswer = await createAnswerService({ questionId, answerText, author });

    res.status(201).json({
        success: true,
        message: 'Answer created successfully',
        data: newAnswer,
    });
};

//c2. updateAnswer – Extract answerId from req.params and answerText from req.body. Call
//the service to update the answer, passing the full req.user object for ownership/admin
//verification.

export const updateAnswer = async (req, res) => {
    const { answerId } = req.params;
    const { answerText } = req.body;
    const loggedInUser = req.user;

    const updatedAnswer = await updateAnswerService({ answerId, answerText, loggedInUser });

    res.status(200).json({
        success: true,
        message: 'Answer updated successfully',
        data: updatedAnswer,
    });
};

//d2. deleteAnswer – Extract answerId from req.params. Call the service to delete the answer,
//passing the full req.user object for ownership/admin verification. No data field is included in the
//response.

export const deleteAnswer = async (req, res) => {
    const { answerId } = req.params;
    const loggedInUser = req.user;

    await deleteAnswerService({ answerId, loggedInUser });

    res.status(200).json({
        success: true,
        message: 'Answer deleted successfully',
    });
};

//e2. upvoteAnswer and downvoteAnswer – Extract answerId from req.params and userId from
//req.user.id (set by the authenticate middleware). Call the appropriate service function to
//upvote/downvote the answer.

export const upvoteAnswer = async (req, res) => {
    const { answerId } = req.params;
    const userId = req.user.id;

    const updatedAnswer = await upvoteAnswerService({ answerId, userId });

    res.status(200).json({
        success: true,
        message: 'Answer upvoted successfully',
        data: updatedAnswer,
    });
};

export const downvoteAnswer = async (req, res) => {
    const { answerId } = req.params;
    const userId = req.user.id;

    const updatedAnswer = await downvoteAnswerService({ answerId, userId });

    res.status(200).json({
        success: true,
        message: 'Answer downvoted successfully',
        data: updatedAnswer,
    });
};