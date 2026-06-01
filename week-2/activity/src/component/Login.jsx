import React from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.scss";

function Login() {
    const navigate = useNavigate();
    function handleSubmit(event) {
        event.preventDefault();
        const uname = event.target.username.value;
        const pwd = event.target.password.value;
        console.log("Username:", uname);
        console.log("Password:", pwd);
        navigate("/", { state: { isLoggedIn: true } });
    }

    function goSignup() {
        navigate("/signup");
    }
    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Login</h1>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <label htmlFor="username">Username:</label>
                    <input type="text" id="username" name="username" />
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" />
                    <button type="submit">Login</button>
                </form>
                <button className="auth-ghost" type="button" onClick={goSignup}>Signup</button>
            </div>
        </div>
    );
}

export default Login;