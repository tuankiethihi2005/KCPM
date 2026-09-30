const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user && req.user.role;

    if (!userRole) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Missing authenticated user context." });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error:
          "Forbidden. Your account does not have permission to perform this action.",
      });
    }

    next();
  };
};

module.exports = { checkRole };
