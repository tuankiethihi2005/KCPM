const { ROLES } = require("../../../constants/roles");

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const role = req.user && req.user.role;

    if (!role) {
      return res.status(401).json({
        error: {
          code: "AUTHZ_MISSING_USER",
          message: "Missing authenticated user context.",
        },
      });
    }

    if (role === ROLES.ADMIN || allowedRoles.includes(role)) {
      return next();
    }

    return res.status(403).json({
      error: {
        code: "AUTHZ_ROLE_DENIED",
        message: "You do not have permission to access this resource.",
      },
    });
  };
};

module.exports = {
  requireRole,
};
