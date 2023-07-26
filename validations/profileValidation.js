import Joi from "joi"

export const updateProfileSchema = Joi.object({
    status: Joi.string().required().trim(),
    bio: Joi.string().required().trim(),
  });