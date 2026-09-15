const jwt = require("jsonwebtoken");

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}

// Issues a token other services can accept over the network via the
// Authorization header - not an httpOnly cookie tied to one app's domain.
function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, getSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { signToken, verifyToken };
