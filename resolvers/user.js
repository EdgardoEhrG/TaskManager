const jsw = require("jsonwebtoken");
const { combineResolvers } = require("graphql-resolvers");

const { users, tasks } = require("../constants");
const User = require("../database/models/user");
const Task = require("../database/models/task");
const { isAuthenticated } = require("./middleware");

// const bcrypt = require('bcrypt'); # There is a problem with this package

module.exports = {
  Query: {
    user: combineResolvers(isAuthenticated, (_, __, { email }) => {
      try {
        const user = await User.findOne({email}).populate({ path: 'tasks' });
        if (!user){
            throw new Error('User not found');
        }
        return user;
      } catch (error) {
        console.log(error);
        throw error;
      }
    }),
  },
  Mutation: {
    signUp: async (_, { input }) => {
      try {
        const user = await User.findOne({ email: input.email });

        if (user) {
          throw new Error("Email already in use");
        }

        const newUser = new User(...input);
        const res = await newUser.save();
        return res;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    login: async (_, { input }) => {
      try {
        const user = await User.findOne({ email: input.email });

        if (!user) {
          throw new Error("User not found");
        }

        const secret = process.env.JWT_SECRET_KEY || "secretKey";
        const token = jsw.sign({ email: user.email }, secret, {
          expiresIn: "1d",
        });
        return token;
      } catch (err) {
        console.log(err);
        throw err;
      }
    },
  },
  User: {
    tasks: async ({ id }) => {
        try {
          const task = await Task.find({ user: id });
          return task;
        } catch (error) {
          console.log(error);
          throw error;
        }
    }
  },
};
