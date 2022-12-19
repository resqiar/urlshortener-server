import {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  FastifyServerOptions,
} from "fastify";
import { CreateURLValidate } from "../schemas/create-url.schema";
import { DeleteURLValidate } from "../schemas/delete-url.schema";
import URLService from "../services/urls.service";

export default function URLRoutes(
  server: FastifyInstance,
  _: FastifyServerOptions,
  done: () => void
) {
  /**
   * This line of code creates a new instance of the URLService.
   * URLService class is responsible for handling URL-related tasks
   * across all the server instances;
   **/
  const urlService = new URLService(server);

  server.get(
    "/:short",
    async function (
      req: FastifyRequest<{ Params: { short: string } }>,
      res: FastifyReply
    ) {
      /**
       * Get "short" parameters coming from request URL.
       * Parameter is a way to pass arbitrary data to the server by GET method.
       * Example "localhost/{short}"
       **/
      const short: string = req.params.short;

      // If short is not present dont proceed further
      if (!short) return;

      /**
       * Call service to search URL based on the short (custom-name)
       * that already given by the user above via the request parametes.
       **/
      const result = await urlService.findByShort(short);

      if (!result)
        res.send({
          error: "Could not find the shortened URL",
          status: 404,
        });

      /**
       * Call service to visit URL based on the "result" id.
       * What the service does is increment the "visit" field in by 1.
       **/
      await urlService.visit(result[0].id);

      res.send(result);
    }
  );

  server.post(
    "/create",
    CreateURLValidate(server),
    async function (req: FastifyRequest, res: FastifyReply) {
      /**
       * The currentUser variable is the object passed by "req.user".
       * Req.user itselft is the data of the current authenticated user,
       * which indeed also coming from the middleware of CreateURLValidate.
       **/
      const currentUser = req.user as { id: string };

      /**
       * Call service to create new URL while passing req.body
       * and the currrent authenticated user id and send back the result.
       **/
      const result = await urlService.create(req.body, currentUser.id);
      res.send(result);
    }
  );

  server.post(
    "/delete",
    DeleteURLValidate(server),
    async function (req: FastifyRequest, res: FastifyReply) {
      /**
       * The currentUser variable is the object passed by "req.user".
       * Req.user itselft is the data of the current authenticated user,
       * which indeed also coming from the middleware of DeleteURLValidate.
       **/
      const currentUser = req.user as { id: string };

      /**
       * Call service to delete URL while passing req.body
       * and the currrent authenticated user id and send back the result.
       **/
      const result = await urlService.delete(req.body, currentUser.id);
      res.send(result);
    }
  );

  server.get(
    "/inventory",
    { preValidation: [server.authenticate] },
    async function (req: FastifyRequest, res: FastifyReply) {
      /**
       * The currentUser variable is the object passed by "req.user".
       * Req.user itselft is the data of the current authenticated user,
       * which indeed also coming from the middleware of CreateURLValidate.
       **/
      const currentUser = req.user as { id: string };

      /**
       * Call service to find URL based on the current passed user id.
       * This will return an Array of URLs owned by the current user.
       **/
      const result = await urlService.findByUser(currentUser.id);

      if (!result)
        res.send({
          error: "Error",
          message: "Something went wrong in the server",
        });

      res.send(result);
    }
  );

  done();
}
