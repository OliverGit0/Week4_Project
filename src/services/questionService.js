import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Tag from '../models/Tag.js';
import { createAppError } from '../utils/createAppError.js';
import { handleVote } from './voteService.js';

//getAllQuestionsService - Fetch all the questions in the database. Populate the author name
//and tags for each question. Attach the answerCount to each question, which is the total number
//of answers for that question.

export const getAllQuestionsService = async () => {
    const questions = await Question.find()
        .populate('author', 'name')
        .populate('tags');

    if (!questions || questions.length === 0) {
        throw createAppError('No questions found', 404);
    }

    return Promise.all(
        questions.map(async (question) => {
            const answerCount = await Answer.countDocuments({
                questionId: question._id,
            });

            return {
                ...question.toObject(),
                answerCount,
            };
        })
    );
};

//b. getQuestionByIdService - Given the argument id, fetch the question by its ID. Increment its
//views, populate the author name and tags. Fetch and attach all answers for the question. Throw a
//404 AppError (using the createAppError function) if the question is not found.

export const getQuestionByIdService = async (id) => {
    const question = await Question.findByIdAndUpdate(
        id,
        { $inc: { views: 1 } },
        { new: true }
    )
        .populate('author', 'name')
        .populate('tags');

    if (!question) {
        throw createAppError('Question not found', 404);
    }

    const answers = await Answer.find({ questionId: question._id });

    return {
        ...question.toObject(),
        answers,
    };
};

//c. createQuestionService - Given the arguments title, description, tags, author, create a new
//question with those field. Accept tags as a comma-separated string (e.g. 'javascript,
//nodejs'), resolve each tag name to its ID (create the tag if it does not exist), save and return the
//new question.

export const createQuestionService = async ({ title, description, tags, author }) => {
    const tagNames = [...new Set(
        tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean)
    )];

    const tagIds = await Promise.all(
        tagNames.map(async (name) => {
            const tag = await Tag.findOneAndUpdate(
                { name },
                { $setOnInsert: { name } },
                { new: true, upsert: true }
            );
            return tag._id;
        })
    );

    const question = await Question.create({
        title,
        description,
        tags: tagIds,
        author,
    });

    return question;
};

//d. updateQuestionService - Given the arguments id, title, description, tags and loggedInUser,
//update the question with the given id. Verify that the requester is the owner or an admin, accept
//tags as a comma-separated string, resolve tag names to IDs (create the tag if missing), update the
//question and return the updated question. Throw a 404 AppError if the question is not found, or a
//403 AppError if the requester is not authorized to update the question.

export const updateQuestionService = async ({ id, title, description, tags, loggedInUser }) => {
    const question = await Question.findById(id);

    if (!question) {
        throw createAppError('Question not found', 404);
    }

    if (!question.author.equals(loggedInUser.id) && !loggedInUser.isAdmin) {
        throw createAppError('Not authorized to update this question', 403);
    }

    const tagNames = [...new Set(
        tags
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean)
    )];

    const tagIds = await Promise.all(
        tagNames.map(async (name) => {
            const tag = await Tag.findOneAndUpdate(
                { name },
                { $setOnInsert: { name } },
                { new: true, upsert: true }
            );
            return tag._id;
        })
    );

    question.title = title;
    question.description = description;
    question.tags = tagIds;

    await question.save();

    return question;
};

//e. deleteQuestionService - Given the arguments id and loggedInUser, verify that the requester is
//the owner or an admin, then delete the question with the given id and all its answers. Throw a 404
//AppError if the question is not found, or a 403 AppError if the requester is not authorized to delete
//the question.

export const deleteQuestionService = async ({ id, loggedInUser }) => {
    const question = await Question.findById(id);

    if (!question) {
        throw createAppError('Question not found', 404);
    }

    if (!question.author.equals(loggedInUser.id) && !loggedInUser.isAdmin) {
        throw createAppError('Not authorized to delete this question', 403);
    }

    await Answer.deleteMany({ questionId: id });
    await question.deleteOne();

    return question;
};

//f. upvoteQuestionService / downvoteQuestionService - Given the arguments questionId and
//userId, call the voteService.handleVote function with the appropriate arguments. Throw a 400
//AppError if the vote operation returns a falsy result. Return the updated question document
//returned by voteService.handleVote.

export const upvoteQuestionService = async ({ questionId, userId }) => {
    const updatedQuestion = await handleVote(Question, questionId, userId, 'upvote');

    if (!updatedQuestion) {
        throw createAppError('Failed to upvote question', 400);
    }

    return updatedQuestion;
};

export const downvoteQuestionService = async ({ questionId, userId }) => {
    const updatedQuestion = await handleVote(Question, questionId, userId, 'downvote');

    if (!updatedQuestion) {
        throw createAppError('Failed to downvote question', 400);
    }

    return updatedQuestion;
};