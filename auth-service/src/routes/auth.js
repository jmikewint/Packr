const express = require("express");
const bcrypt = require("bcrypt");
const prisma = require("../prisma");
const { signupSchema, loginSchema } = require("../validation");
const { signToken } = require("../jwt");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

const SALT_ROUNDS = 12;

// Precomputed at startup so /login always has a hash to compare against,
// even when the email doesn't exist - keeps response time (and thus the
// timing side-channel) the same for "wrong password" and "no such user".
const DUMMY_HASH = bcrypt.hashSync("packr-timing-safety-placeholder", SALT_ROUNDS);

function toPublicUser(user) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

router.post("/signup", async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }
    const { email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({ data: { email, passwordHash } });

    const token = signToken(user);
    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always run bcrypt.compare - against the real hash if the user exists,
    // otherwise against the dummy hash - so a timing attack can't be used
    // to enumerate registered emails.
    const passwordMatches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

    if (!user || !passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user);
    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

// Protected: verifies the JWT from the Authorization header. Other services
// can call this to validate a token and fetch the identity it belongs to.
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
