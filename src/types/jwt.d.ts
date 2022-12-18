import * as fastify from "fastify";
import * as http from "http";

declare module "fastify" {
  export interface FastifyInstance<
    server = http.Server,
    request = http.IncomingMessage,
    response = http.ServerResponse
  > {
    authenticate: any;
  }
}
