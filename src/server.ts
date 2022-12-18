import * as dotenv from "dotenv";
dotenv.config();

import fastifyPostgres from "@fastify/postgres";
import fastify, { FastifyInstance } from "fastify";
import fastifyBcrypt from "fastify-bcrypt";
import UserRoutes from "./routes/users.route";
import URLRoutes from "./routes/urls.route";

const server: FastifyInstance = fastify();

server.get("/ping", async () => {
  return "Please stop pinging me!";
});

server.register(fastifyPostgres, {
  connectionString: process.env.DATABASE_URL,
});

/**
 *This code registers the fastify-bcrypt plugin with the Fastify server,
 * which provides bcrypt hashing functionality. The saltWorkFactor option
 * specifies the number of iterations of algorithms.
 **/
server.register(fastifyBcrypt, { saltWorkFactor: 12 });

// JWT Plugin
server.register(require("./plugins/jwt.plugin"));

/**
 * These code registers the Routes of individuals responsibility with the server,
 * using the '/v1' prefix for all routes within the server instance.
 * This allows us to easily group and organize our routes.
 **/
server.register(UserRoutes, { prefix: "/v1/user" });
server.register(URLRoutes, { prefix: "/v1/url" });

server.listen({ port: 3333 }, async (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server listening at ${address}`);

  try {
    // Connnect to Database
    await server.pg.connect();
    console.log("Connected to Postgres");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});