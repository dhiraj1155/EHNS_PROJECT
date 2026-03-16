import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getRole, setRole } from "../services/api";
import "./Navbar.css";

const roleOptions = ["doctor", "auditor", "admin"];

function Navbar() {
    const location = useLocation();
    const [role, setRoleState] = useState(getRole());

    const handleRoleChange = (e) => {
        const newRole = e.target.value;
        setRole(newRole);
        setRoleState(newRole);
    };

    const isActive = (path) =>
        location.pathname === path ? "nav-link active" : "nav-link";

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <div className="brand-icon">🏥</div>
                <div className="brand-text">
                    <span className="brand-title">Hospital Logs</span>
                    <span className="brand-subtitle">Tamper-Proof Registry</span>
                </div>
            </div>

            <div className="navbar-links">
                <Link to="/" className={isActive("/")}>
                    <span className="nav-icon">📋</span>
                    Dashboard
                </Link>
                <Link to="/add" className={isActive("/add")}>
                    <span className="nav-icon">➕</span>
                    Add Log
                </Link>
            </div>

            <div className="navbar-role">
                <label className="role-label">Role</label>
                <select
                    className="role-select"
                    value={role}
                    onChange={handleRoleChange}
                >
                    {roleOptions.map((r) => (
                        <option key={r} value={r}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                    ))}
                </select>
            </div>
        </nav>
    );
}

export default Navbar;
