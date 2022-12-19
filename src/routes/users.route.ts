import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  FastifyServerOptions,
} from "fastify";
import { LoginUserValidate } from "../schemas/login-user.schema";
import { RegisterUserValidate } from "../schemas/register-user.schema";
import AuthService from "../services/auth.service";

export default function UserRoutes(
  server: FastifyInstance,
  _: FastifyServerOptions,
  done: () => void
) {
  const authService = new AuthService(server);

  server.get("/", async function () {
    const result = await server.pg.query("SELECT * FROM users");
    return result.rows;
  });

  server.get(
    "/profile",
    { preValidation: [server.authenticate] },
    async function (request: FastifyRequest, res: FastifyReply) {
      const user = request.user;
      res.send(user);
    }
  );

  server.post(
    "/login",
    LoginUserValidate,
    async function (req: FastifyRequest, res: FastifyReply) {
      const loginResult = await authService.login(req.body);

      // If the login was not successful, return a 400 status code
      if (!loginResult) {
        res.status(400).send({
          error: "wrong credentials",
          message: "Wrong username or password",
        });
        return;
      }

      // Otherwise, return the token
      res.send({ token: loginResult });
    }
  );

  server.post(
    "/register",
    RegisterUserValidate,
    async function (req: FastifyRequest, res: FastifyReply) {
      // Register the user and store the result
      const registrationResult = await authService.register(req.body);

      // If the registration was not successful, return a 400 status code
      if (!registrationResult) {
        res.status(400).send({ message: "Input is not valid" });
        return;
      }

      // Otherwise, return the token
      res.send({ token: registrationResult });
    }
  );

  done();
}
