const uuid = require("uuid");
const { combineResolvers } = require('graphql-resolvers');

const { users, tasks } = require("../constants");
const Task = require("../database/models/task");
const User = require("../database/models/user");
const { isAuthenticated, isTaskOwner } = require('./middleware');

module.exports = {
  Query: {
    tasks: combineResolvers(isAuthenticated, (_, { skip = 0, limit = 15 }, { loggedInUserId }) => {
      try {
        const tasks = await Task.find({ user: loggedInUserId }).sort({ _id: -1 }).skip(skip).limit(limit);
        return tasks
      } catch(err) {
        console.log(err);
        throw err;
      }
    }),
    task: combineResolvers(isAuthenticated, isTaskOwner, async (_, { id }) => {
      try {
        const task = await Task.findById(id);
        return task;
      } catch(err) {
        console.log(err);
        throw err;
      }
    }),
  },
  Mutation: {
    createTask: combineResolvers(isAuthenticated, (_, { input }, { email }) => {
        try {
          const user = await User.findOne({ email });
          const task = new Task({ ...input, user: user.id });
          const res = await task.save();
          user.tasks.push(res.id);
          await user.save();
          return res;
        } catch(err) {
          console.log(err);
          throw err;
        }
    }),
    updateTask: combineResolvers(isAuthenticated, isTaskOwner, (_, { id, input }) => {
      try {
        const task = Task.findByIdAndUpdate(id, { ...input }, { new: true });
        return task;
      } catch(err) {
        console.log(err);
        throw err;
      }
    }),
    deleteTask: combineResolvers(isAuthenticated, isTaskOwner, (_, { id }, { loggedInUserId }) => {
      try {
        const task = Task.findByIdAndDelete(id);
        await User.updateOne({ _id: loggedInUserId }, { $pull: { tasks: task.id } });
        return task;
      } catch(err) {
        console.log(err);
        throw err;
      }
    }),
  },
  Task: {
    user: async (parent) => {
      try {
        const user = await User.findById(parent.user);
        return user;
      } catch(err) {
        console.log(err);
        throw err;
      }
    }
  },
};
