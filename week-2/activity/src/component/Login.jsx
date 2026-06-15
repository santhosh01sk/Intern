import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.scss";

const API_BASE_URL = "http://localhost:8080/api/auth";

function Login({ onLoginSuccess }) {
    const navigate = useNavigate();
    const [serverError, setServerError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") || "").trim();
        const password = String(formData.get("password") || "");

        setServerError("");
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            let payload = {};
            const text = await response.text();
            if (text) {
                try {
                    payload = JSON.parse(text);
                } catch (e) {
                    // Response is not JSON
                }
            }

            if (!response.ok) {
                throw new Error(payload.message || text || "Login failed.");
            }

            if (typeof onLoginSuccess === "function") {
                onLoginSuccess(payload.accessToken, payload.refreshToken, payload.username || email);
                return;
            }

            navigate("/");
        } catch (error) {
            setServerError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    function goSignup() {
        navigate("/signup");
    }
    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Login</h1>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" name="email" required />
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" required />
                    {serverError ? <p className="auth-error">{serverError}</p> : null}
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Logging in..." : "Login"}
                    </button>
                </form>
                <button className="auth-ghost" type="button" onClick={goSignup}>Signup</button>
            </div>
        </div>
    );
}

export default Login;