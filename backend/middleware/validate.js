const { validationResult, body, param } = require("express-validator");

// Collects express-validator errors into a clean 400 response.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((e) => ({ field: e.path, msg: e.msg })),
    });
  }
  next();
}

// Reusable rule sets
const rules = {
  login: [
    body("collegeId").isString().trim().notEmpty().withMessage("collegeId required"),
    body("password").isString().notEmpty().withMessage("password required"),
  ],
  createUser: [
    body("name").isString().trim().notEmpty(),
    body("collegeId").isString().trim().notEmpty(),
    body("role").isIn(["admin", "teacher", "student"]),
    body("password").optional().isString().isLength({ min: 6 }),
    body("parentPhone").optional().isString().trim(),
  ],
  timetable: [
    body("subject").isString().trim().notEmpty(),
    body("section").isString().trim().notEmpty(),
    body("room").isString().trim().notEmpty(),
    body("day").isInt({ min: 0, max: 6 }),
    body("startTime").matches(/^\d{2}:\d{2}$/),
    body("endTime").matches(/^\d{2}:\d{2}$/),
    body("roomLat").isFloat(),
    body("roomLng").isFloat(),
    body("radius").optional().isFloat({ min: 1 }),
  ],
  enrollFace: [
    body("embedding").isArray({ min: 128, max: 128 }).withMessage("128-length embedding required"),
    body("embedding.*").isFloat(),
    body("deviceId").optional().isString(),
  ],
  mark: [
    body("shortCode").isString().trim().notEmpty(),
    body("embedding").isArray({ min: 128, max: 128 }),
    body("embedding.*").isFloat(),
    body("livenessPassed").isBoolean(),
    body("roomCode").isString().trim().isLength({ min: 4, max: 8 }),
    body("lat").optional().isFloat(),
    body("lng").optional().isFloat(),
    body("deviceId").optional().isString(),
  ],
  mongoId: (name) => param(name).isMongoId().withMessage("invalid id"),
};

module.exports = { validate, rules, body, param };
