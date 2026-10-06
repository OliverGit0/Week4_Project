import {
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
	Question: {
		find: vi.fn(),
		findById: vi.fn(),
		findByIdAndUpdate: vi.fn(),
		create: vi.fn(),
	},
	Answer: {
		find: vi.fn(),
		countDocuments: vi.fn(),
		deleteMany: vi.fn(),
	},
	Tag: {
		findOneAndUpdate: vi.fn(),
	},
	handleVote: vi.fn(),
}));

vi.mock('../../../src/models/Question.js', () => ({
	default: mocks.Question,
}));

vi.mock('../../../src/models/Answer.js', () => ({
	default: mocks.Answer,
}));

vi.mock('../../../src/models/Tag.js', () => ({
	default: mocks.Tag,
}));

vi.mock('../../../src/services/voteService.js', () => ({
	handleVote: mocks.handleVote,
}));

import {
	createQuestionService,
	deleteQuestionService,
	downvoteQuestionService,
	getAllQuestionsService,
	getQuestionByIdService,
	updateQuestionService,
	upvoteQuestionService,
} from '../../../src/services/questionService.js';

const createQuestionDocument = (overrides = {}) => {
	const question = {
		_id: 'question-1',
		views: 0,
		author: {
			equals: vi.fn().mockReturnValue(true),
		},
		tags: [],
		save: vi.fn().mockResolvedValue(undefined),
		deleteOne: vi.fn().mockResolvedValue(undefined),
		...overrides,
	};

	question.toObject ??= vi.fn(() => {
		const { toObject, ...plainQuestion } = question;
		return plainQuestion;
	});

	return question;
};

const mockQuestionFindWithPopulates = (result) => {
	const tagsPopulate = vi.fn().mockResolvedValue(result);
	const authorPopulate = vi.fn().mockReturnValue({
		populate: tagsPopulate,
	});

	mocks.Question.find.mockReturnValue({
		populate: authorPopulate,
	});

	return { authorPopulate, tagsPopulate };
};

const mockQuestionFindByIdAndUpdateWithPopulates = (result) => {
	const tagsPopulate = vi.fn().mockResolvedValue(result);
	const authorPopulate = vi.fn().mockReturnValue({
		populate: tagsPopulate,
	});

	mocks.Question.findByIdAndUpdate.mockReturnValue({
		populate: authorPopulate,
	});

	return { authorPopulate, tagsPopulate };
};

const mockAnswerFindWithAuthorPopulate = (result) => {
	const authorPopulate = vi.fn().mockResolvedValue(result);

	mocks.Answer.find.mockReturnValue({
		populate: authorPopulate,
	});

	return authorPopulate;
};

const expectAppError = async (operation, message, statusCode) => {
	await expect(operation()).rejects.toMatchObject({
		message,
		statusCode,
	});
};

beforeEach(() => {
	vi.resetAllMocks();
});

describe('getAllQuestionsService', () => {
	it('returns all questions with populated author, tags, and answer counts', async () => {
		const firstQuestion = createQuestionDocument({ _id: 'question-1' });
		const secondQuestion = createQuestionDocument({ _id: 'question-2' });
		const { authorPopulate, tagsPopulate } = mockQuestionFindWithPopulates([
			firstQuestion,
			secondQuestion,
		]);
		mocks.Answer.countDocuments
			.mockResolvedValueOnce(2)
			.mockResolvedValueOnce(1);

		const result = await getAllQuestionsService();

		expect(authorPopulate).toHaveBeenCalledWith('author', 'name');
		expect(tagsPopulate).toHaveBeenCalledWith('tags');
		expect(mocks.Answer.countDocuments).toHaveBeenNthCalledWith(1, {
			questionId: 'question-1',
		});
		expect(mocks.Answer.countDocuments).toHaveBeenNthCalledWith(2, {
			questionId: 'question-2',
		});
		expect(result).toEqual([
			expect.objectContaining({ _id: 'question-1', answerCount: 2 }),
			expect.objectContaining({ _id: 'question-2', answerCount: 1 }),
		]);
	});

	it('returns an answerCount of zero when a question has no answers', async () => {
		const question = createQuestionDocument();
		mockQuestionFindWithPopulates([question]);
		mocks.Answer.countDocuments.mockResolvedValue(0);

		const result = await getAllQuestionsService();

		expect(result).toEqual([
			expect.objectContaining({ _id: 'question-1', answerCount: 0 }),
		]);
	});

	it('throws a 404 AppError when no questions are found', async () => {
		mockQuestionFindWithPopulates([]);

		await expectAppError(
			() => getAllQuestionsService(),
			'No questions found',
			404,
		);
	});
});

describe('getQuestionByIdService', () => {
	it('increments views, populates the question, and attaches its answers', async () => {
		const question = createQuestionDocument({
			_id: 'question-1',
			views: 4,
			toObject: vi.fn().mockReturnValue({
				_id: 'question-1',
				views: 5,
				author: { name: 'Ada' },
				tags: [{ name: 'javascript' }],
			}),
		});
		const answers = [{ _id: 'answer-1', answerText: 'Use tests.' }];
		const { authorPopulate, tagsPopulate } =
			mockQuestionFindByIdAndUpdateWithPopulates(question);
		mocks.Answer.find.mockResolvedValue(answers);

		const result = await getQuestionByIdService('question-1');

		expect(mocks.Question.findByIdAndUpdate).toHaveBeenCalledWith(
			'question-1',
			{ $inc: { views: 1 } },
			{ new: true },
		);
		expect(authorPopulate).toHaveBeenCalledWith('author', 'name');
		expect(tagsPopulate).toHaveBeenCalledWith('tags');
		expect(mocks.Answer.find).toHaveBeenCalledWith({
			questionId: 'question-1',
		});
		expect(result).toEqual({
			_id: 'question-1',
			views: 5,
			author: { name: 'Ada' },
			tags: [{ name: 'javascript' }],
			answers,
		});
	});

	it('returns an empty answers array when the question has no answers', async () => {
		const question = createQuestionDocument({
			toObject: vi.fn().mockReturnValue({ _id: 'question-1', views: 1 }),
		});
		mockQuestionFindByIdAndUpdateWithPopulates(question);
		mocks.Answer.find.mockResolvedValue([]);

		const result = await getQuestionByIdService('question-1');

		expect(result).toEqual({
			_id: 'question-1',
			views: 1,
			answers: [],
		});
	});

	it('throws a 404 AppError when the question does not exist', async () => {
		mockQuestionFindByIdAndUpdateWithPopulates(null);

		await expectAppError(
			() => getQuestionByIdService('missing-question'),
			'Question not found',
			404,
		);
		expect(mocks.Answer.find).not.toHaveBeenCalled();
	});
});

describe('createQuestionService', () => {
	it('upserts trimmed tag names and creates a question with their ids', async () => {
		const createdQuestion = { _id: 'question-1' };
		mocks.Tag.findOneAndUpdate
			.mockResolvedValueOnce({ _id: 'tag-javascript' })
			.mockResolvedValueOnce({ _id: 'tag-nodejs' })
			.mockResolvedValueOnce({ _id: 'tag-react' });
		mocks.Question.create.mockResolvedValue(createdQuestion);

		const result = await createQuestionService({
			title: 'Testing JavaScript',
			description: 'How should this be tested?',
			tags: ' javascript, nodejs, react ',
			author: 'user-1',
		});

		expect(mocks.Tag.findOneAndUpdate).toHaveBeenNthCalledWith(
			1,
			{ name: 'javascript' },
			{ $setOnInsert: { name: 'javascript' } },
			{ new: true, upsert: true },
		);
		expect(mocks.Tag.findOneAndUpdate).toHaveBeenNthCalledWith(
			2,
			{ name: 'nodejs' },
			{ $setOnInsert: { name: 'nodejs' } },
			{ new: true, upsert: true },
		);
		expect(mocks.Tag.findOneAndUpdate).toHaveBeenNthCalledWith(
			3,
			{ name: 'react' },
			{ $setOnInsert: { name: 'react' } },
			{ new: true, upsert: true },
		);
		expect(mocks.Question.create).toHaveBeenCalledWith({
			title: 'Testing JavaScript',
			description: 'How should this be tested?',
			tags: ['tag-javascript', 'tag-nodejs', 'tag-react'],
			author: 'user-1',
		});
		expect(result).toBe(createdQuestion);
	});

	it('deduplicates tags and filters empty tag names', async () => {
		mocks.Tag.findOneAndUpdate
			.mockResolvedValueOnce({ _id: 'tag-javascript' })
			.mockResolvedValueOnce({ _id: 'tag-nodejs' });
		mocks.Question.create.mockResolvedValue({ _id: 'question-1' });

		await createQuestionService({
			title: 'Tag normalization',
			description: 'Normalize tags.',
			tags: 'javascript, javascript, , nodejs,',
			author: 'user-1',
		});

		expect(mocks.Tag.findOneAndUpdate).toHaveBeenCalledTimes(2);
		expect(mocks.Tag.findOneAndUpdate).toHaveBeenNthCalledWith(
			1,
			{ name: 'javascript' },
			{ $setOnInsert: { name: 'javascript' } },
			{ new: true, upsert: true },
		);
		expect(mocks.Tag.findOneAndUpdate).toHaveBeenNthCalledWith(
			2,
			{ name: 'nodejs' },
			{ $setOnInsert: { name: 'nodejs' } },
			{ new: true, upsert: true },
		);
		expect(mocks.Question.create).toHaveBeenCalledWith(
			expect.objectContaining({ tags: ['tag-javascript', 'tag-nodejs'] }),
		);
	});

	it('creates a question with one tag', async () => {
		const createdQuestion = { _id: 'question-1', title: 'One tag' };
		mocks.Tag.findOneAndUpdate.mockResolvedValue({ _id: 'tag-typescript' });
		mocks.Question.create.mockResolvedValue(createdQuestion);

		const result = await createQuestionService({
			title: 'One tag',
			description: 'A question with one tag.',
			tags: 'typescript',
			author: 'user-1',
		});

		expect(mocks.Tag.findOneAndUpdate).toHaveBeenCalledTimes(1);
		expect(mocks.Question.create).toHaveBeenCalledWith({
			title: 'One tag',
			description: 'A question with one tag.',
			tags: ['tag-typescript'],
			author: 'user-1',
		});
		expect(result).toBe(createdQuestion);
	});
});

describe('updateQuestionService', () => {
	it('allows the question owner to update the question', async () => {
		const question = createQuestionDocument({
			author: { equals: vi.fn().mockReturnValue(true) },
		});
		mocks.Question.findById.mockResolvedValue(question);
		mocks.Tag.findOneAndUpdate
			.mockResolvedValueOnce({ _id: 'tag-nodejs' })
			.mockResolvedValueOnce({ _id: 'tag-testing' });

		const result = await updateQuestionService({
			id: 'question-1',
			title: 'Updated title',
			description: 'Updated description',
			tags: 'nodejs, testing',
			loggedInUser: { id: 'owner-1', isAdmin: false },
		});

		expect(question.author.equals).toHaveBeenCalledWith('owner-1');
		expect(question.title).toBe('Updated title');
		expect(question.description).toBe('Updated description');
		expect(question.tags).toEqual(['tag-nodejs', 'tag-testing']);
		expect(question.save).toHaveBeenCalledOnce();
		expect(result).toBe(question);
	});

	it('allows an admin to update a question they do not own', async () => {
		const question = createQuestionDocument({
			author: { equals: vi.fn().mockReturnValue(false) },
		});
		mocks.Question.findById.mockResolvedValue(question);
		mocks.Tag.findOneAndUpdate.mockResolvedValue({ _id: 'tag-admin' });

		const result = await updateQuestionService({
			id: 'question-1',
			title: 'Admin title',
			description: 'Admin description',
			tags: 'admin',
			loggedInUser: { id: 'admin-1', isAdmin: true },
		});

		expect(question.author.equals).toHaveBeenCalledWith('admin-1');
		expect(question.save).toHaveBeenCalledOnce();
		expect(result).toBe(question);
	});

	it('throws a 403 AppError for a non-owner non-admin', async () => {
		const question = createQuestionDocument({
			author: { equals: vi.fn().mockReturnValue(false) },
		});
		mocks.Question.findById.mockResolvedValue(question);

		await expectAppError(
			() => updateQuestionService({
				id: 'question-1',
				title: 'Unauthorized title',
				description: 'Unauthorized description',
				tags: 'testing',
				loggedInUser: { id: 'other-user', isAdmin: false },
			}),
			'Not authorized to update this question',
			403,
		);
		expect(mocks.Tag.findOneAndUpdate).not.toHaveBeenCalled();
		expect(question.save).not.toHaveBeenCalled();
	});

	it('throws a 404 AppError when the question does not exist', async () => {
		mocks.Question.findById.mockResolvedValue(null);

		await expectAppError(
			() => updateQuestionService({
				id: 'missing-question',
				title: 'Title',
				description: 'Description',
				tags: 'testing',
				loggedInUser: { id: 'owner-1', isAdmin: false },
			}),
			'Question not found',
			404,
		);
	});
});

describe('deleteQuestionService', () => {
	it('allows the owner to delete the question and its answers', async () => {
		const question = createQuestionDocument({
			author: { equals: vi.fn().mockReturnValue(true) },
		});
		mocks.Question.findById.mockResolvedValue(question);
		mocks.Answer.deleteMany.mockResolvedValue({ deletedCount: 2 });

		const result = await deleteQuestionService({
			id: 'question-1',
			loggedInUser: { id: 'owner-1', isAdmin: false },
		});

		expect(mocks.Answer.deleteMany).toHaveBeenCalledWith({
			questionId: 'question-1',
		});
		expect(question.deleteOne).toHaveBeenCalledOnce();
		expect(mocks.Answer.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(
			question.deleteOne.mock.invocationCallOrder[0],
		);
		expect(result).toBe(question);
	});

	it('allows an admin to delete a question they do not own', async () => {
		const question = createQuestionDocument({
			author: { equals: vi.fn().mockReturnValue(false) },
		});
		mocks.Question.findById.mockResolvedValue(question);

		const result = await deleteQuestionService({
			id: 'question-1',
			loggedInUser: { id: 'admin-1', isAdmin: true },
		});

		expect(mocks.Answer.deleteMany).toHaveBeenCalledWith({
			questionId: 'question-1',
		});
		expect(question.deleteOne).toHaveBeenCalledOnce();
		expect(result).toBe(question);
	});

	it('throws a 403 AppError for a non-owner non-admin', async () => {
		const question = createQuestionDocument({
			author: { equals: vi.fn().mockReturnValue(false) },
		});
		mocks.Question.findById.mockResolvedValue(question);

		await expectAppError(
			() => deleteQuestionService({
				id: 'question-1',
				loggedInUser: { id: 'other-user', isAdmin: false },
			}),
			'Not authorized to delete this question',
			403,
		);
		expect(mocks.Answer.deleteMany).not.toHaveBeenCalled();
		expect(question.deleteOne).not.toHaveBeenCalled();
	});

	it('throws a 404 AppError when the question does not exist', async () => {
		mocks.Question.findById.mockResolvedValue(null);

		await expectAppError(
			() => deleteQuestionService({
				id: 'missing-question',
				loggedInUser: { id: 'owner-1', isAdmin: false },
			}),
			'Question not found',
			404,
		);
	});
});

describe('upvoteQuestionService', () => {
	it('delegates an upvote and returns the updated question', async () => {
		const updatedQuestion = { _id: 'question-1', upvotes: ['user-1'] };
		mocks.handleVote.mockResolvedValue(updatedQuestion);

		const result = await upvoteQuestionService({
			questionId: 'question-1',
			userId: 'user-1',
		});

		expect(mocks.handleVote).toHaveBeenCalledWith(
			mocks.Question,
			'question-1',
			'user-1',
			'upvote',
		);
		expect(result).toBe(updatedQuestion);
	});

	it('returns the result when an existing downvote is replaced', async () => {
		const updatedQuestion = {
			_id: 'question-1',
			upvotes: ['user-1'],
			downvotes: [],
			voteCount: 1,
		};
		mocks.handleVote.mockResolvedValue(updatedQuestion);

		const result = await upvoteQuestionService({
			questionId: 'question-1',
			userId: 'user-1',
		});

		expect(result).toEqual(updatedQuestion);
		expect(mocks.handleVote).toHaveBeenCalledTimes(1);
	});

	it('throws a 400 AppError when the vote operation is falsy', async () => {
		mocks.handleVote.mockResolvedValue(null);

		await expectAppError(
			() => upvoteQuestionService({
				questionId: 'question-1',
				userId: 'user-1',
			}),
			'Failed to upvote question',
			400,
		);
	});
});

describe('downvoteQuestionService', () => {
	it('delegates a downvote and returns the updated question', async () => {
		const updatedQuestion = { _id: 'question-1', downvotes: ['user-1'] };
		mocks.handleVote.mockResolvedValue(updatedQuestion);

		const result = await downvoteQuestionService({
			questionId: 'question-1',
			userId: 'user-1',
		});

		expect(mocks.handleVote).toHaveBeenCalledWith(
			mocks.Question,
			'question-1',
			'user-1',
			'downvote',
		);
		expect(result).toBe(updatedQuestion);
	});

	it('returns the result when an existing upvote is replaced', async () => {
		const updatedQuestion = {
			_id: 'question-1',
			upvotes: [],
			downvotes: ['user-1'],
			voteCount: -1,
		};
		mocks.handleVote.mockResolvedValue(updatedQuestion);

		const result = await downvoteQuestionService({
			questionId: 'question-1',
			userId: 'user-1',
		});

		expect(result).toEqual(updatedQuestion);
		expect(mocks.handleVote).toHaveBeenCalledTimes(1);
	});

	it('throws a 400 AppError when the vote operation is falsy', async () => {
		mocks.handleVote.mockResolvedValue(false);

		await expectAppError(
			() => downvoteQuestionService({
				questionId: 'question-1',
				userId: 'user-1',
			}),
			'Failed to downvote question',
			400,
		);
	});
});
