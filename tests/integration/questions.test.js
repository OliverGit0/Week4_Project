import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import {
	beforeEach,
	describe,
	expect,
	it,
} from 'vitest';
import app from '../../src/app.js';
import Answer from '../../src/models/Answer.js';
import Question from '../../src/models/Question.js';
import Tag from '../../src/models/Tag.js';
import User from '../../src/models/User.js';

process.env.JWT_SECRET ??= 'integration-test-secret';

let owner;
let otherUser;
let admin;
let ownerToken;
let otherUserToken;
let adminToken;

const createToken = (user) => jwt.sign(
	{ id: user._id },
	process.env.JWT_SECRET,
);

const createQuestion = (overrides = {}) => Question.create({
	title: 'A question title',
	description: 'A question description',
	author: owner._id,
	...overrides,
});

const createAnswer = (overrides = {}) => Answer.create({
	questionId: overrides.questionId,
	answerText: 'An answer text',
	author: owner._id,
	...overrides,
});

const expectError = (response, status, message) => {
	expect(response.status).toBe(status);
	expect(response.body).toEqual(expect.objectContaining({
		success: false,
		message,
	}));
};

beforeEach(async () => {
	await Promise.all([
		Question.deleteMany({}),
		Answer.deleteMany({}),
		User.deleteMany({}),
		Tag.deleteMany({}),
	]);

	[owner, otherUser, admin] = await User.create([
		{
			name: 'Question Owner',
			email: 'owner@example.com',
			password: 'password',
			isAdmin: false,
		},
		{
			name: 'Other User',
			email: 'other@example.com',
			password: 'password',
			isAdmin: false,
		},
		{
			name: 'Administrator',
			email: 'admin@example.com',
			password: 'password',
			isAdmin: true,
		},
	]);

	ownerToken = createToken(owner);
	otherUserToken = createToken(otherUser);
	adminToken = createToken(admin);
});

describe('GET /api/questions', () => {
	it('returns questions with populated author, tags, and answer counts', async () => {
		const tag = await Tag.create({ name: 'javascript' });
		const question = await createQuestion({ tags: [tag._id] });
		await createAnswer({ questionId: question._id });

		const response = await request(app).get('/api/questions');

		expect(response.status).toBe(200);
		expect(response.body.success).toBe(true);
		expect(response.body.message).toBe('Questions fetched successfully');
		expect(response.body.data).toHaveLength(1);
		expect(response.body.data[0]).toEqual(expect.objectContaining({
			_id: question._id.toString(),
			answerCount: 1,
			author: {
				_id: owner._id.toString(),
				name: 'Question Owner',
			},
			tags: [expect.objectContaining({
				_id: tag._id.toString(),
				name: 'javascript',
			})],
		}));
	});

	it('returns a 404 when no questions exist', async () => {
		const response = await request(app).get('/api/questions');

		expectError(response, 404, 'No questions found');
	});

	it('returns multiple questions with independent answer counts', async () => {
		const firstQuestion = await createQuestion({ title: 'First question' });
		const secondQuestion = await createQuestion({ title: 'Second question' });
		await createAnswer({ questionId: firstQuestion._id });
		await createAnswer({ questionId: firstQuestion._id });

		const response = await request(app).get('/api/questions');

		expect(response.status).toBe(200);
		expect(response.body.data).toEqual(expect.arrayContaining([
			expect.objectContaining({
				_id: firstQuestion._id.toString(),
				answerCount: 2,
			}),
			expect.objectContaining({
				_id: secondQuestion._id.toString(),
				answerCount: 0,
			}),
		]));
	});
});

describe('GET /api/questions/:id', () => {
	it('returns the question, increments views, and includes its answers', async () => {
		const tag = await Tag.create({ name: 'nodejs' });
		const question = await createQuestion({
			tags: [tag._id],
			views: 2,
		});
		const answer = await createAnswer({ questionId: question._id });

		const response = await request(app).get(`/api/questions/${question._id}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(expect.objectContaining({
			success: true,
			message: 'Question fetched successfully',
		}));
		expect(response.body.data).toEqual(expect.objectContaining({
			_id: question._id.toString(),
			views: 3,
			author: {
				_id: owner._id.toString(),
				name: 'Question Owner',
			},
			tags: [expect.objectContaining({ name: 'nodejs' })],
			answers: [expect.objectContaining({
				_id: answer._id.toString(),
				questionId: question._id.toString(),
			})],
		}));
	});

	it('returns a 404 for a valid-format nonexistent question id', async () => {
		const missingId = new mongoose.Types.ObjectId();

		const response = await request(app).get(`/api/questions/${missingId}`);

		expectError(response, 404, 'Question not found');
	});

	it('returns 500 for a malformed question id', async () => {
		const response = await request(app).get('/api/questions/not-an-object-id');

		expect(response.status).toBe(500);
		expect(response.body.success).toBe(false);
		expect(response.body.message).toMatch(/Cast to ObjectId failed/);
	});
});

describe('POST /api/questions', () => {
	it('returns 401 when no token is provided', async () => {
		const response = await request(app)
			.post('/api/questions')
			.send({
				title: 'Unauthorized question',
				description: 'No token',
				tags: 'testing',
			});

		expectError(response, 401, 'No token provided, authorization denied.');
	});

	it('creates a question and its tags for an authenticated user', async () => {
		const response = await request(app)
			.post('/api/questions')
			.set('Authorization', `Bearer ${ownerToken}`)
			.send({
				title: 'Created question',
				description: 'Created description',
				tags: 'javascript, nodejs',
			});

		expect(response.status).toBe(201);
		expect(response.body).toEqual(expect.objectContaining({
			success: true,
			message: 'Question created successfully',
			data: expect.objectContaining({
				title: 'Created question',
				description: 'Created description',
				author: owner._id.toString(),
			}),
		}));
		expect(response.body.data.tags).toHaveLength(2);
		expect(await Tag.countDocuments({})).toBe(2);
	});

	it('returns 401 when the token uses userId instead of the required id claim', async () => {
		const wrongClaimToken = jwt.sign(
			{ userId: owner._id },
			process.env.JWT_SECRET,
		);

		const response = await request(app)
			.post('/api/questions')
			.set('Authorization', `Bearer ${wrongClaimToken}`)
			.send({
				title: 'Invalid claim question',
				description: 'Invalid claim',
				tags: 'testing',
			});

		expectError(response, 401, 'User not found.');
	});
});

describe('PUT /api/questions/:id', () => {
	it('returns 401 when no token is provided', async () => {
		const question = await createQuestion();

		const response = await request(app)
			.put(`/api/questions/${question._id}`)
			.send({
				title: 'Updated title',
				description: 'Updated description',
				tags: 'updated',
			});

		expectError(response, 401, 'No token provided, authorization denied.');
	});

	it('allows the owner to update the question', async () => {
		const question = await createQuestion({ title: 'Original title' });

		const response = await request(app)
			.put(`/api/questions/${question._id}`)
			.set('Authorization', `Bearer ${ownerToken}`)
			.send({
				title: 'Updated title',
				description: 'Updated description',
				tags: 'javascript, testing',
			});

		expect(response.status).toBe(200);
		expect(response.body).toEqual(expect.objectContaining({
			success: true,
			message: 'Question updated successfully',
			data: expect.objectContaining({
				_id: question._id.toString(),
				title: 'Updated title',
				description: 'Updated description',
			}),
		}));
		expect(response.body.data.tags).toHaveLength(2);
	});

	it('returns 403 for a non-owner non-admin', async () => {
		const question = await createQuestion();

		const response = await request(app)
			.put(`/api/questions/${question._id}`)
			.set('Authorization', `Bearer ${otherUserToken}`)
			.send({
				title: 'Unauthorized title',
				description: 'Unauthorized description',
				tags: 'testing',
			});

		expectError(response, 403, 'Not authorized to update this question');
	});

	it('returns 404 when the question does not exist', async () => {
		const missingId = new mongoose.Types.ObjectId();

		const response = await request(app)
			.put(`/api/questions/${missingId}`)
			.set('Authorization', `Bearer ${ownerToken}`)
			.send({
				title: 'Missing title',
				description: 'Missing description',
				tags: 'testing',
			});

		expectError(response, 404, 'Question not found');
	});
});

describe('DELETE /api/questions/:id', () => {
	it('returns 401 when no token is provided', async () => {
		const question = await createQuestion();

		const response = await request(app)
			.delete(`/api/questions/${question._id}`);

		expectError(response, 401, 'No token provided, authorization denied.');
	});

	it('allows the owner to delete the question and its answers', async () => {
		const question = await createQuestion();
		const answer = await createAnswer({ questionId: question._id });

		const response = await request(app)
			.delete(`/api/questions/${question._id}`)
			.set('Authorization', `Bearer ${ownerToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(expect.objectContaining({
			success: true,
			message: 'Question deleted successfully',
			data: expect.objectContaining({ _id: question._id.toString() }),
		}));
		expect(await Question.findById(question._id)).toBeNull();
		expect(await Answer.findById(answer._id)).toBeNull();
	});

	it('returns 403 for a non-owner non-admin', async () => {
		const question = await createQuestion();

		const response = await request(app)
			.delete(`/api/questions/${question._id}`)
			.set('Authorization', `Bearer ${otherUserToken}`);

		expectError(response, 403, 'Not authorized to delete this question');
		expect(await Question.findById(question._id)).not.toBeNull();
	});

	it('allows an admin to delete a question they do not own', async () => {
		const question = await createQuestion();

		const response = await request(app)
			.delete(`/api/questions/${question._id}`)
			.set('Authorization', `Bearer ${adminToken}`);

		expect(response.status).toBe(200);
		expect(response.body.message).toBe('Question deleted successfully');
		expect(await Question.findById(question._id)).toBeNull();
	});

	it('returns 404 when the question does not exist', async () => {
		const missingId = new mongoose.Types.ObjectId();

		const response = await request(app)
			.delete(`/api/questions/${missingId}`)
			.set('Authorization', `Bearer ${ownerToken}`);

		expectError(response, 404, 'Question not found');
	});
});

describe('POST /api/questions/:id/upvote', () => {
	it('returns 401 when no token is provided', async () => {
		const question = await createQuestion();

		const response = await request(app)
			.post(`/api/questions/${question._id}/upvote`);

		expectError(response, 401, 'No token provided, authorization denied.');
	});

	it('adds an upvote for the authenticated user', async () => {
		const question = await createQuestion();

		const response = await request(app)
			.post(`/api/questions/${question._id}/upvote`)
			.set('Authorization', `Bearer ${ownerToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(expect.objectContaining({
			success: true,
			message: 'Question upvoted successfully',
			data: expect.objectContaining({
				_id: question._id.toString(),
				upvotes: [owner._id.toString()],
				downvotes: [],
				voteCount: 1,
			}),
		}));
	});

	it('replaces an existing downvote with an upvote', async () => {
		const question = await createQuestion({ downvotes: [owner._id] });

		const response = await request(app)
			.post(`/api/questions/${question._id}/upvote`)
			.set('Authorization', `Bearer ${ownerToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.upvotes).toEqual([owner._id.toString()]);
		expect(response.body.data.downvotes).toEqual([]);
		expect(response.body.data.voteCount).toBe(1);
	});

	it('returns 500 when the question does not exist because handleVote throws a plain Error', async () => {
		const missingId = new mongoose.Types.ObjectId();

		const response = await request(app)
			.post(`/api/questions/${missingId}/upvote`)
			.set('Authorization', `Bearer ${ownerToken}`);

		expect(response.status).toBe(500);
		expect(response.body).toEqual(expect.objectContaining({
			success: false,
			message: 'Document not found',
		}));
	});
});

describe('POST /api/questions/:id/downvote', () => {
	it('returns 401 when no token is provided', async () => {
		const question = await createQuestion();

		const response = await request(app)
			.post(`/api/questions/${question._id}/downvote`);

		expectError(response, 401, 'No token provided, authorization denied.');
	});

	it('adds a downvote for the authenticated user', async () => {
		const question = await createQuestion();

		const response = await request(app)
			.post(`/api/questions/${question._id}/downvote`)
			.set('Authorization', `Bearer ${ownerToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(expect.objectContaining({
			success: true,
			message: 'Question downvoted successfully',
			data: expect.objectContaining({
				_id: question._id.toString(),
				upvotes: [],
				downvotes: [owner._id.toString()],
				voteCount: -1,
			}),
		}));
	});

	it('replaces an existing upvote with a downvote', async () => {
		const question = await createQuestion({ upvotes: [owner._id] });

		const response = await request(app)
			.post(`/api/questions/${question._id}/downvote`)
			.set('Authorization', `Bearer ${ownerToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data.upvotes).toEqual([]);
		expect(response.body.data.downvotes).toEqual([owner._id.toString()]);
		expect(response.body.data.voteCount).toBe(-1);
	});

	it('returns 500 when the question does not exist because handleVote throws a plain Error', async () => {
		const missingId = new mongoose.Types.ObjectId();

		const response = await request(app)
			.post(`/api/questions/${missingId}/downvote`)
			.set('Authorization', `Bearer ${ownerToken}`);

		expect(response.status).toBe(500);
		expect(response.body).toEqual(expect.objectContaining({
			success: false,
			message: 'Document not found',
		}));
	});
});

describe('GET /api/questions/:questionId/answers', () => {
	it('returns answers with populated author names', async () => {
		const question = await createQuestion();
		const answer = await createAnswer({ questionId: question._id });

		const response = await request(app)
			.get(`/api/questions/${question._id}/answers`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(expect.objectContaining({
			success: true,
			message: 'Answers retrieved successfully',
			data: [expect.objectContaining({
				_id: answer._id.toString(),
				questionId: question._id.toString(),
				author: {
					_id: owner._id.toString(),
					name: 'Question Owner',
				},
			})],
		}));
	});

	it('returns 404 when the question has no answers', async () => {
		const question = await createQuestion();

		const response = await request(app)
			.get(`/api/questions/${question._id}/answers`);

		expectError(response, 404, 'No answers found for this question');
	});

	it('returns 500 for a malformed question id', async () => {
		const response = await request(app)
			.get('/api/questions/not-an-object-id/answers');

		expect(response.status).toBe(500);
		expect(response.body.success).toBe(false);
		expect(response.body.message).toMatch(/Cast to ObjectId failed/);
	});
});

describe('POST /api/questions/:questionId/answers', () => {
	it('returns 401 when no token is provided', async () => {
		const question = await createQuestion();

		const response = await request(app)
			.post(`/api/questions/${question._id}/answers`)
			.send({ answerText: 'Unauthorized answer' });

		expectError(response, 401, 'No token provided, authorization denied.');
	});

	it('creates an answer for an authenticated user', async () => {
		const question = await createQuestion();

		const response = await request(app)
			.post(`/api/questions/${question._id}/answers`)
			.set('Authorization', `Bearer ${ownerToken}`)
			.send({ answerText: 'Created answer' });

		expect(response.status).toBe(201);
		expect(response.body).toEqual(expect.objectContaining({
			success: true,
			message: 'Answer created successfully',
			data: expect.objectContaining({
				questionId: question._id.toString(),
				answerText: 'Created answer',
				author: {
					_id: owner._id.toString(),
					name: 'Question Owner',
				},
			}),
		}));
	});

	it('creates an answer even when the parent question does not exist', async () => {
		const missingQuestionId = new mongoose.Types.ObjectId();

		const response = await request(app)
			.post(`/api/questions/${missingQuestionId}/answers`)
			.set('Authorization', `Bearer ${ownerToken}`)
			.send({ answerText: 'Orphan answer' });

		expect(response.status).toBe(201);
		expect(response.body).toEqual(expect.objectContaining({
			success: true,
			message: 'Answer created successfully',
			data: expect.objectContaining({
				questionId: missingQuestionId.toString(),
				answerText: 'Orphan answer',
			}),
		}));
		expect(await Answer.countDocuments({
			questionId: missingQuestionId,
		})).toBe(1);
	});
});
