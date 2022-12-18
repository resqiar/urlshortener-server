import { FastifyInstance } from "fastify";
import Joi from "joi";

const schema = Joi.object({
  originalUrl: Joi.string().uri().required(),
  shortUrl: Joi.string().required(),
  description: Joi.string(),
  authorId: Joi.string().uuid().required(),
  expireDay: Joi.number().positive().required(),
});

export function CreateURLValidate(server: FastifyInstance) {
  return {
    preValidation: [server.authenticate],
    schema: { body: schema },
    validatorCompiler: ({ schema }: any) => {
      return (data: any) => schema.validate(data);
    },
  };
}
