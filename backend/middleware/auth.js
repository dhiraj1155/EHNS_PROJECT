/**
 * Simple role-based access control middleware.
 *
 * For this MVP, the role is passed via the `X-Role` request header.
 * In production, replace with JWT verification (e.g. jsonwebtoken).
 *
 * Roles:
 *  - doctor   → can create and read logs
 *  - auditor  → read-only + can run verify
 *  - admin    → full access
 */

const VALID_ROLES = ["doctor", "auditor", "admin"];

/**
 * requireRole(roles)
 * Middleware factory. Pass an array of allowed roles.
 * e.g.  requireRole(["doctor", "admin"])
 */
function requireRole(roles = []) {
    return (req, res, next) => {
        const role = (req.headers["x-role"] || "").toLowerCase().trim();

        if (!role) {
            return res.status(401).json({
                error: "Unauthorized: Missing X-Role header",
                hint: "Add  X-Role: doctor | auditor | admin  to your request",
            });
        }

        if (!VALID_ROLES.includes(role)) {
            return res.status(401).json({
                error: `Unauthorized: Unknown role '${role}'`,
                validRoles: VALID_ROLES,
            });
        }

        if (!roles.includes(role)) {
            return res.status(403).json({
                error: `Forbidden: Role '${role}' is not allowed to perform this action`,
                requiredRoles: roles,
            });
        }

        // Attach role to request object for downstream use
        req.userRole = role;
        next();
    };
}

/**
 * Convenience shorthand middlewares
 */
const doctorOrAdmin = requireRole(["doctor", "admin"]);
const anyValidRole = requireRole(VALID_ROLES);

module.exports = { requireRole, doctorOrAdmin, anyValidRole };
