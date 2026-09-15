const { z } = require("zod");

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("must be a valid email"),
  password: z.string().min(8, "password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("must be a valid email"),
  password: z.string().min(1, "password is required"),
});

module.exports = { signupSchema, loginSchema };
