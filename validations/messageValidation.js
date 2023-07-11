import Joi from "joi";

export const messageSchema = Joi.object({
  userId: Joi.string().required(),
  message: Joi.string().required(),
});
