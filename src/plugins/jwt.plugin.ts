import fastifyJwt from "@fastify/jwt";
import {
  FastifyInstance,
  FastifyRequest,
  FastifyServerOptions,
  FastifyReply,
} from "fastify";
import plugin from "fastify-plugin";

export default plugin(async function (
  server: FastifyInstance,
  _: FastifyServerOptions
) {
  server.register(fastifyJwt, {
    secret: process.env.JWT_KEY!,
  });

  server.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  );
});
