import Joi from "joi";

const messageSchema = Joi.object({
  userId: Joi.string().required(),
  message: Joi.string().required(),
});

const validateMessage = (message) => {
  return messageSchema.validate(message);
};

export { validateMessage };
