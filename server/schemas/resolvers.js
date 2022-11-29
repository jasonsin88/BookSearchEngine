const { User, Book } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (_parent, _args, context) => {
            if (context.user) {
                const userData = await User
                    .findOne({ _id: context.user._id })
                    .select('-__v - password');

                return userData;
            };
            throw new AuthenticationError('You shall not pass...without logging in!');
        },
    },

    Mutation: {
        login: async (_parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new AuthenticationError('Do you even go here?');
            }

            const correctPW = await user.isCorrectPassword(password);
            if (!correctPW) {
                throw new AuthenticationError('Stop trying to make fetch happen!');
            }

            const token = signToken(user);
            return { token, user };
        },
        addUser: async (_parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);

            return { token, user };
        },
        saveBook: async (_parent, { userId, bookData }, context) => {
            if (context.user) {
                return User
                    .findOneAndUpdate(
                        { _id: userId },
                        { $addToSet: { savedBooks: bookData } },
                        { new: true, runValidators: true },
                    )
            };
            throw new AuthenticationError('No books for you! Unless you log in!');
        },
        removeBook: async (_parent, { bookId }, context) => {
            if (context.user) {
                const userUpdate = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId } } },
                    { new: true }
                );
                return userUpdate;
            };
            throw new AuthenticationError('You need to log in first, how many times do you need to be told?');
        },
    },
};

module.exports = resolvers;