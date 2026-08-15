const jwt = require("jsonwebtoken");

// Login token (identifies the user + role)
function signLogin(user) {
  return jwt.sign(
    { id: user._id, role: user.role, collegeId: user.collegeId, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
}

// Attendance link token: short-lived, HMAC-SHA256 signed (that is what JWT
// HS256 uses under the hood), bound to one session and expiry.
function signLinkToken(sessionId, expiresAt) {
  const secondsLeft = Math.max(
    30,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
  );
  return jwt.sign({ sessionId }, process.env.LINK_SECRET, {
    expiresIn: secondsLeft,
  });
}

function verifyLinkToken(tokenStr) {
  return jwt.verify(tokenStr, process.env.LINK_SECRET);
}

module.exports = { signLogin, signLinkToken, verifyLinkToken };
