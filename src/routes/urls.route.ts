import {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  FastifyServerOptions,
} from "fastify";
import { CreateURLValidate } from "../schemas/create-url.schema";
import URLService from "../services/urls.service";

export default function URLRoutes(
  server: FastifyInstance,
  _: FastifyServerOptions,
  done: () => void
) {
  const urlService = new URLService(server);

  server.get("/", async function () {
    const result = await server.pg.query("SELECT * FROM urls");
    return result.rows;
  });

  server.get(
    "/:short",
    async function (
      req: FastifyRequest<{ Params: { short: string } }>,
      res: FastifyReply
    ) {
      const short: string = req.params.short;
      if (!short) return;

      const result = await urlService.findByShort(short);

      if (!result)
        res.send({
          error: "Could not find the shortened URL",
          status: 404,
        });

      res.send(result);
    }
  );

  server.post(
    "/create",
    CreateURLValidate(server),
    async function (req: FastifyRequest, res: FastifyReply) {
      const currentUser = req.user as { id: string };
      const result = await urlService.create(req.body, currentUser.id);
      res.send(result);
    }
  );

  done();
}
