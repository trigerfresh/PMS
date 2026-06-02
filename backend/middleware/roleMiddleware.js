exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      })
    }

    if (!roles.includes(req.user.role_name)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      })
    }

    next()
  }
}
