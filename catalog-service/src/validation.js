const { z } = require("zod");

const RARITIES = ["COMMON", "UNCOMMON", "RARE", "ULTRA_RARE", "SECRET_RARE"];
const CONDITIONS = ["MINT", "NEAR_MINT", "LIGHTLY_PLAYED", "DAMAGED"];

// Full payload required on create.
const createCardSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  set: z.string().trim().min(1, "set is required"),
  rarity: z.enum(RARITIES),
  condition: z.enum(CONDITIONS),
  price: z.coerce.number().positive("price must be greater than 0"),
  imageUrl: z.string().url("imageUrl must be a valid URL").optional(),
});

// Any subset allowed on update, but at least one field must be present.
const updateCardSchema = createCardSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "at least one field must be provided" }
);

module.exports = { createCardSchema, updateCardSchema, RARITIES, CONDITIONS };
