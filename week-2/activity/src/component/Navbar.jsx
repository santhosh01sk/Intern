import "./Navbar.scss";
import { Link } from "react-router-dom";

function Navbar({ isAuthenticated, onLogout, username }) {
    return (
        <div className="Navbar">
            <ul>
                {isAuthenticated ? (
                    <>
                        <li className="box">
                            <Link to="/">Home</Link>
                        </li>
                        <li className="box">
                            <Link to="/profile">Profile</Link>
                        </li>
                        <li className="box">
                            <span className="nav-user">{username ? `Signed in as ${username}` : "Signed in"}</span>
                        </li>
                        <li className="box">
                            <button type="button" className="nav-button" onClick={onLogout}>
                                Sign out
                            </button>
                        </li>
                    </>
                ) : (
                    <>
                        <li className="box">
                            <Link to="/login">Login</Link>
                        </li>
                        <li className="box">
                            <Link to="/signup">Signup</Link>
                        </li>
                    </>
                )}
            </ul>
        </div>
    );
}

export default Navbar;

 