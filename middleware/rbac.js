function checkRole(allowedRoles) {
    return (req, res, next) => {
        const userRole = req.user?.roleID;

        if (!userRole) {
            return res.status(401).json({ 
                error: 'Not authenticated.' 
            });
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                error: `Access denied. Your role (${req.user.roleName}) cannot perform this action.` 
            });
        }

        next();
    };
}

module.exports = checkRole;