import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("NULL");
    const [password, setPassword] = useState("NULL");
    function handleSubmit(event) {
        event.preventDefault();

        const username = event.target.username.value;
        const password = event.target.password.value;
        setUsername(username);
        setPassword(password);
        console.log("Username:", username);
        console.log("Password:", password);
    }
        
    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Login</h1>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                    />
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                    />
                    <button type="submit">Login</button>
                </form>
                <button className="auth-ghost" type="button" onClick={() => navigate('/signup')}>Signup</button>
            </div>
        </div>
    );
}

export default Login;