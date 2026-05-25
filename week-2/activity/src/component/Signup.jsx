import React, { useState } from "react";
import "./Auth.css";

function Signup() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    function handleSubmit(event) {
        event.preventDefault();
        const username = event.target.username.value;
        const password = event.target.password.value;
        setUsername(username);
        setPassword(password
        );
        console.log("Username:", username);
        console.log("Password:", password);
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
                    />
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                    />
                    <button type="submit">Signup</button>
                </form>
            </div>
        </div>
    );
}
export default Signup;