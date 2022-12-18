import Joi from "joi";

const schema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const RegisterUserValidate = {
  schema: { body: schema },
  validatorCompiler: ({ schema }: any) => {
    return (data: any) => schema.validate(data);
  },
};
