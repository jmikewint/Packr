const express = require("express");
const prisma = require("../prisma");
const { createCardSchema, updateCardSchema, RARITIES } = require("../validation");

const router = express.Router();

// GET /cards - list all, optional ?set= and ?rarity= filters
router.get("/", async (req, res, next) => {
  try {
    const { set, rarity } = req.query;
    if (rarity && !RARITIES.includes(rarity)) {
      return res.status(400).json({ error: `rarity must be one of: ${RARITIES.join(", ")}` });
    }
    const where = {};
    if (set) where.set = set;
    if (rarity) where.rarity = rarity;

    const cards = await prisma.card.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json(cards);
  } catch (err) {
    next(err);
  }
});

// GET /cards/:id
router.get("/:id", async (req, res, next) => {
  try {
    const card = await prisma.card.findUnique({ where: { id: req.params.id } });
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json(card);
  } catch (err) {
    next(err);
  }
});

// POST /cards - create
router.post("/", async (req, res, next) => {
  try {
    const parsed = createCardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }
    const card = await prisma.card.create({ data: parsed.data });
    res.status(201).json(card);
  } catch (err) {
    next(err);
  }
});

// PUT /cards/:id - update
router.put("/:id", async (req, res, next) => {
  try {
    const parsed = updateCardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }
    const card = await prisma.card.update({
      where: { id: req.params.id },
      data: parsed.data,
    });
    res.json(card);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Card not found" });
    next(err);
  }
});

// DELETE /cards/:id
router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.card.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Card not found" });
    next(err);
  }
});

module.exports = router;
