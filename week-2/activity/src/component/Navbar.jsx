import react from "react";
import "./Navbar.scss";
import { Link } from "react-router-dom";
function Navbar() {
    return (
      <div className="Navbar">
            <ul>
                <li className="box">
                    <Link to="/">Home</Link>
                </li>
                <li className="box">
                    <Link to="/about">About</Link>
                </li>
                <li className="box">
                    <Link to="/login">Login</Link>
                </li>
                <li className="box">
                    <Link to="/signup">Signup</Link>
                </li>
            </ul>
      </div>
      );
}
export default Navbar; 