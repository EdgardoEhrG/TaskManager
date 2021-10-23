const express = require("express");
const { ApolloServer } = require("apollo-server-express");

const cors = require("cors");
require("dotenv").config();

// Items
const resolvers = require("./resolvers");
const typeDefs = require("./typeDefs");
const { verifyUser } = require("./helpers/context");

// Init
const app = express();

// DB
const { connection } = require("./database/util");
connection();

// Apollo

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    await verifyUser(req);
    return {
      email: req.email,
      loggedInUserId: req.loggedInUserId,
    };
  },
});

apolloServer.applyMiddleware({ app, path: "/graphql" });

// Middleware

app.use(express.json());
app.use(cors());

// Variables
const port = process.env.PORT || 3000;

// Server

app.listen(port, () => {
  console.log(`Server is listening on PORT: ${port}`);
  console.log(`GraphQL endpoint: ${apolloServer.graphqlPath}`);
});

// Routin'

app.get("/", (req, res) => {
  res.send("Hello");
});
