import * as dotenv from "dotenv";
dotenv.config();

import fastifyPostgres from "@fastify/postgres";
import fastify, { FastifyInstance } from "fastify";
import fastifyBcrypt from "fastify-bcrypt";
import UserRoutes from "./routes/users.route";
import URLRoutes from "./routes/urls.route";
import cors from "@fastify/cors";

/**
 * Initializes a Fastify server instance.
 * By creating a Fastify instance, we can start listening
 * for incoming HTTP requests and handling them with
 * the routes and functions that we define.
 **/
const server: FastifyInstance = fastify();

/**
 * Register the Cross-Origin Resource Sharing (CORS) to the Fastify server instance.
 * By enabling CORS, we can allow the client to make requests to our server
 * without running into the same-origin policy restrictions.
 *
 * CLIENT_ORIGIN value is coming from .env file
 **/
server.register(cors, {
  origin: [process.env.CLIENT_ORIGIN ?? ""],
});

/**
 * Route that used only for testing purpose only.
 * Typically used for periodical ping by external resources.
 **/
server.get("/ping", async () => {
  return "Please stop pinging me!";
});

/**
 * Register PostgreSQL driver to the server.
 * Registering the driver will expose "pg" method in every-
 * server instance.
 **/
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

server.listen(
  {
    // Port is coming from .env variable
    port: Number(process.env.PORT) || 3333,
    // Bind host to 0.0.0.0 instead of 127.0.0.1.
    // This way we can deploy to VPS server that run with Docker.
    host: "0.0.0.0",
  },
  async (err, address) => {
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
  }
);
