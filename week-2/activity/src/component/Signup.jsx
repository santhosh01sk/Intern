import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.scss";

function Signup() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});

    function validateForm() {
        const nextErrors = {};

        if (!username.trim()) {
            nextErrors.username = "Username is required.";
        } else if (username.trim().length < 3) {
            nextErrors.username = "Username must be at least 3 characters.";
        }

        if (!password) {
            nextErrors.password = "Password is required.";
        } else if (password.length < 6) {
            nextErrors.password = "Password must be at least 6 characters.";
        }

        return nextErrors;
    }

    function handleSubmit(event) {
        event.preventDefault();

        const nextErrors = validateForm();
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        console.log("Username:", username);
        console.log("Password:", password);
        navigate("/login");
    }

    function goLogin() {
        navigate("/login");
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Signup</h1>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        aria-invalid={Boolean(errors.username)}
                        aria-describedby={errors.username ? "username-error" : undefined}
                        required
                    />
                    {errors.username && <p className="auth-error" id="username-error">{errors.username}</p>}
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={errors.password ? "password-error" : undefined}
                        required
                        minLength={6}
                    />
                    {errors.password && <p className="auth-error" id="password-error">{errors.password}</p>}
                    <button type="submit">Signup</button>
                    <button type="button" className="auth-ghost" onClick={goLogin}>
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}
export default Signup;