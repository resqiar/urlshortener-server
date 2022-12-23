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
  /**
   * Registers the JWT (JSON Web Token) to the Fastify server instance.
   * Once the plugin is registered, we can use the
   * 'sign()' and 'verify()' functions respectively.
   *
   * Secret key will be used to sign and verify the JWTs.
   * The value is coming from environment variable.
   **/
  server.register(fastifyJwt, {
    secret: process.env.JWT_KEY!,
  });

  /**
   * Decorates the server instance with a new function called 'authenticate'.
   * This allows us to add new methods to the instance that can be used
   * throughout our application, in this case we use to verify the token.
   **/
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
