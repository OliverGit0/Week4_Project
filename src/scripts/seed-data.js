import { Types } from 'mongoose';

// Create sample tags
const t1 = new Types.ObjectId();
const t2 = new Types.ObjectId();
const t3 = new Types.ObjectId();
const t4 = new Types.ObjectId();
const t5 = new Types.ObjectId();
const t6 = new Types.ObjectId();
const t7 = new Types.ObjectId();
const t8 = new Types.ObjectId();

export const tags = [
  { _id: t1, name: 'javascript' },
  { _id: t2, name: 'nodejs' },
  { _id: t3, name: 'express' },
  { _id: t4, name: 'mongodb' },
  { _id: t5, name: 'react' },
  { _id: t6, name: 'vue' },
  { _id: t7, name: 'python' },
  { _id: t8, name: 'java' },
];

// Create sample users
const u1 = new Types.ObjectId();
const u2 = new Types.ObjectId();
const u3 = new Types.ObjectId();
const u4 = new Types.ObjectId();
const u5 = new Types.ObjectId();
const u6 = new Types.ObjectId();

export const users = [
  { _id: u1, name: 'Bob Smith', email: 'bob@example.com', password: 'pass123', isAdmin: true },
  { _id: u2, name: 'Alice Johnson', email: 'alice@example.com', password: 'pass123', isAdmin: false },
  { _id: u3, name: 'Charlie Brown', email: 'charlie@example.com', password: 'pass123', isAdmin: false },
  { _id: u4, name: 'David Wilson', email: 'david@example.com', password: 'pass123', isAdmin: false },
  { _id: u5, name: 'Eva Green', email: 'eva@example.com', password: 'pass123', isAdmin: false },
  { _id: u6, name: 'Frank Wright', email: 'frank@example.com', password: 'pass123', isAdmin: false }
];

// Sample question titles and descriptions
const q1 = new Types.ObjectId();
const q2 = new Types.ObjectId();
const q3 = new Types.ObjectId();
const q4 = new Types.ObjectId();
const q5 = new Types.ObjectId();
const q6 = new Types.ObjectId();
const q7 = new Types.ObjectId();
const q8 = new Types.ObjectId();
const q9 = new Types.ObjectId();
const q10 = new Types.ObjectId();

export const questions = [
  {
    _id: q1,
    title: "How to implement authentication in Express.js?",
    description: "I'm building a web application with Express and need to implement user authentication. What are the best practices and libraries to use?",
    tags: [t2, t3],
    upvotes: [u2, u3],
    downvotes: [],
    views: 10,
    author: u1
  },
  {
    _id: q2,
    title: "Optimizing MongoDB queries for large datasets",
    description: "My application has grown and now has millions of documents. Queries are becoming slow. How can I optimize my MongoDB queries for better performance?",
    tags: [t4],
    upvotes: [u1,u3,u4],
    downvotes: [],
    views: 15,
    author: u2
  },
  {
    _id: q3,
    title: "React state management solutions comparison",
    description: "With so many state management libraries available for React (Redux, MobX, Context API, Recoil), which one should I use for a medium-sized application?",
    tags: [t5],
    upvotes: [u2],
    downvotes: [u1],
    views: 12,
    author: u3
  },
  {
    _id: q4,
    title: "Deploying Node.js applications to AWS",
    description: "What is the best way to deploy a Node.js application to AWS? I've heard of Elastic Beanstalk, EC2, and Lambda, but I'm not sure which one to choose.",
    tags: [t2],
    upvotes: [u1, u2],
    downvotes: [],
    views: 8,
    author: u4
  },
  {
    _id: q5,
    title: "Handling file uploads with Express and Multer",
    description: "I need to implement file uploads in my Express application. How can I use Multer effectively and securely?",
    tags: [t3],
    upvotes: [u1, u2, u3],
    downvotes: [],
    views: 10,
    author: u5
  },
  {
    _id: q6,
    title: "Best practices for error handling in async/await",
    description: "I'm using async/await in my Node.js application. What are the best practices for handling errors in async functions?",
    tags: [t2],
    upvotes: [u1, u2],
    downvotes: [],
    views: 5,
    author: u6
  },
  {
    _id: q7,
    title: "Implementing real-time features with Socket.io",
    description: "How can I add real-time capabilities like notifications and chat to my Express application using Socket.io?",
    tags: [t2],
    upvotes: [u5, u2, u3],
    downvotes: [],
    views: 8,
    author: u1
  },
  {
    _id: q8,
    title: "Securing MongoDB connections in production",
    description: "What steps should I take to secure my MongoDB connections in a production environment?",
    tags: [t4],
    upvotes: [u3, u4, u5],
    downvotes: [u2],
    views: 10,
    author: u2
  },
  {
    _id: q9,
    title: "TypeScript integration with Express",
    description: "I want to convert my Express application from JavaScript to TypeScript. What's the best approach and what are the benefits?",
    tags: [t1, t2],
    upvotes: [u3, u4, u5, u6],
    downvotes: [],
    views: 22,
    author: u3
  },
  {
    _id: q10,
    title: "MongoDB vs PostgreSQL for web applications",
    description: "I'm starting a new web project and can't decide between MongoDB and PostgreSQL. What are the pros and cons of each for modern web applications?",
    tags: [t2, t4],
    upvotes: [u3, u4, u5, u6],
    downvotes: [],
    views: 12,
    author: u4
  }
];

// Sample answers for questions
export const answers = [
  {
    questionId: q1,
    answerText: "You can use Passport.js for authentication in Express. It supports various strategies like local, OAuth, etc. Make sure to hash passwords using bcrypt.",
    author: u2,
    upvotes: [u1],
    downvotes: [],
  },
  {
    questionId: q1,
    answerText: "Consider using JWT for stateless authentication. It allows you to securely transmit user information between the client and server.",
    author: u5,
    upvotes: [u3, u4],
    downvotes: [],
  },
  {
    questionId: q1,
    answerText: "For session management, you can use express-session with a store like connect-mongo for MongoDB.",
    author: u6,
    upvotes: [u1],
    downvotes: [],
  },
  {
    questionId: q2,
    answerText: "To optimize MongoDB queries, you can create indexes on fields that are frequently queried. Use the explain() method to analyze query performance.",
    author: u4,
    upvotes: [u1],
    downvotes: [],
  },
  {
    questionId: q2,
    answerText: "Consider using aggregation pipelines for complex queries. They can be more efficient than multiple find() calls.",
    author: u5,
    upvotes: [u6, u1, u4],
    downvotes: [],
  },
  {
    questionId: q3,
    answerText: "For medium-sized applications, Redux is a popular choice due to its ecosystem and community support. However, Context API is a good lightweight alternative.",
    author: u5,
    upvotes: [u1],
    downvotes: [],
  },
  {
    questionId: q3,
    answerText: "Recoil is a newer library that provides a more flexible and modern approach to state management in React. It might be worth exploring.",
    author: u6,
    upvotes: [u2, u4],
    downvotes: [],
  },
  {
    questionId: q4,
    answerText: "Elastic Beanstalk is a good choice for easy deployment, while EC2 offers more control. Lambda is great for serverless architectures.",
    author: u5,
    upvotes: [u4, u6],
    downvotes: [],
  },
  {
    questionId: q5,
    answerText: "Multer is a middleware for handling multipart/form-data. Use it to process file uploads in your Express app.",
    author: u2,
    upvotes: [u1, u3],
    downvotes: [],
  },
  {
    questionId: q6,
    answerText: "Use try/catch blocks to handle errors in async functions. You can also use a middleware to catch errors globally.",
    author: u3,
    upvotes: [u1, u2],
    downvotes: [],
  },
  {
    questionId: q7,
    answerText: "Socket.io makes it easy to add real-time features. You can use it for chat applications, notifications, and more.",
    author: u4,
    upvotes: [u3, u5],
    downvotes: [],
  },
  {
    questionId: q8,
    answerText: "To secure MongoDB connections, use SSL/TLS, enable authentication, and restrict IP addresses.",
    author: u5,
    upvotes: [u2, u3, u4],
    downvotes: [],
  }
];