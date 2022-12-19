import { FastifyInstance } from "fastify";
import Joi from "joi";

const schema = Joi.object({
  id: Joi.string().uuid().required(),
});

export function DeleteURLValidate(server: FastifyInstance) {
  return {
    preValidation: [server.authenticate],
    schema: { body: schema },
    validatorCompiler: ({ schema }: any) => {
      return (data: any) => schema.validate(data);
    },
  };
}
