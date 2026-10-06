import Answer from '../models/Answer.js';
import { createAppError } from '../utils/createAppError.js';
import { handleVote } from './voteService.js';

//a2. getAnswersByQuestionIdService - Given the argument questionId, retrieve all answers for
//the given questionId. Populate the author name of each answer. Throw a 404 AppError (using
//the createAppError function) if the list of answers is null or empty.

export const getAnswersByQuestionIdService = async ({ questionId }) => {
    const answers = await Answer.find({ questionId }).populate('author', 'name');

    if (!answers || answers.length === 0) {
        throw createAppError('No answers found for this question', 404);
    }

    return answers;
};

//b2. createAnswerService - Given the arguments questionId, answerText, and author, create a
//new answer. Populate the author's name in the newly created answer and return the populated
//document.

export const createAnswerService = async ({ questionId, answerText, author }) => {
    const newAnswer = await Answer.create({ questionId, answerText, author });
    await newAnswer.populate('author', 'name');
    return newAnswer;
};

//c2. updateAnswerService - Given the arguments answerId, answerText, and loggedInUser,
//verify the requester is the owner or an admin, update the answer text, and return the updated
//document. Throw a 404 AppError if the answer is not found, or a 403 AppError if the requester is
//not authorized to update the answer.

export const updateAnswerService = async ({ answerId, answerText, loggedInUser }) => {
    const answer = await Answer.findById(answerId);

    if (!answer) {
        throw createAppError('Answer not found', 404);
    }

    if (!answer.author.equals(loggedInUser.id) && !loggedInUser.isAdmin) {
        throw createAppError('Not authorized to update this answer', 403);
    }

    answer.answerText = answerText;
    await answer.save();
    await answer.populate('author', 'name');

    return answer;
};

//d2. deleteAnswerService - Given the arguments answerId and loggedInUser, verify the
//requester is the owner or an admin, then delete the answer. Throw a 404 AppError if the answer is
//not found, or a 403 AppError if the requester is not authorized to delete the answer.

export const deleteAnswerService = async ({ answerId, loggedInUser }) => {
    const answer = await Answer.findById(answerId);

    if (!answer) {
        throw createAppError('Answer not found', 404);
    }

    if (!answer.author.equals(loggedInUser.id) && !loggedInUser.isAdmin) {
        throw createAppError('Not authorized to delete this answer', 403);
    }

    await answer.deleteOne();

    return answer;
};

//e2. upvoteAnswerService / downvoteAnswerService - Given the arguments answerId and
//userId, call the voteService.handleVote function with the appropriate arguments. Throw a
//400 AppError if the vote operation returns a falsy result. Return the updated answer document
//returned by voteService.handleVote.

export const upvoteAnswerService = async ({ answerId, userId }) => {
    const updatedAnswer = await handleVote(Answer, answerId, userId, 'upvote');

    if (!updatedAnswer) {
        throw createAppError('Failed to upvote answer', 400);
    }

    return updatedAnswer;
};

export const downvoteAnswerService = async ({ answerId, userId }) => {
    const updatedAnswer = await handleVote(Answer, answerId, userId, 'downvote');

    if (!updatedAnswer) {
        throw createAppError('Failed to downvote answer', 400);
    }

    return updatedAnswer;
};