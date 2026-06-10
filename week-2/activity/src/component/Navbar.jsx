import "./Navbar.scss";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getStoredAuthToken } from "../auth";
import { fetchAlerts, markAlertsAsRead } from "../services/weatherApi";

function Navbar({ isAuthenticated, onLogout, username }) {
    const [alerts, setAlerts] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const token = getStoredAuthToken();

    const loadAlerts = async () => {
        if (!isAuthenticated || !token) return;
        try {
            const data = await fetchAlerts(token);
            setAlerts(data);
        } catch (err) {
            console.error("Error fetching alerts in Navbar", err);
        }
    };

    useEffect(() => {
        loadAlerts();
        let interval;
        if (isAuthenticated) {
            interval = setInterval(loadAlerts, 15000);
        }

        const handleUpdate = () => {
            loadAlerts();
        };

        window.addEventListener("alerts-updated", handleUpdate);

        return () => {
            if (interval) clearInterval(interval);
            window.removeEventListener("alerts-updated", handleUpdate);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, token]);


    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleMarkAllRead = async () => {
        if (!token) return;
        try {
            await markAlertsAsRead(token);
            loadAlerts();
            window.dispatchEvent(new CustomEvent("alerts-updated"));
        } catch (err) {
            console.error("Error marking alerts read", err);
        }
    };

    const unreadCount = alerts.filter(a => !a.isRead).length;

    return (
        <div className="Navbar">
            <ul>
                <li className="box">
                    <Link to="/">Home</Link>
                </li>
                {isAuthenticated ? (
                    <>
                        <li className="box nav-alerts-container" ref={dropdownRef}>
                            <button 
                                type="button" 
                                className={`nav-icon-button ${unreadCount > 0 ? "has-unread" : ""}`}
                                onClick={() => setShowDropdown(!showDropdown)}
                                aria-label="Toggle notifications"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
                                    <path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-17 11.5-28.5T460-860q17 0 28.5 11.5T500-820v28q80 20 130 84.5T680-560v280h80v80H160Zm300-240Zm0 440q-33 0-56.5-23.5T380-120h160q0 33-23.5 56.5T460-64ZM320-280h280v-280q0-58-41-99t-99-41q-58 0-99 41t-41 99v280Z"/>
                                </svg>

                                {unreadCount > 0 && <span className="alert-badge">{unreadCount}</span>}
                            </button>

                            {showDropdown && (
                                <div className="alerts-dropdown">
                                    <div className="dropdown-header">
                                        <h3>Weather Alerts</h3>
                                        {unreadCount > 0 && (
                                            <button type="button" className="mark-read-btn" onClick={handleMarkAllRead}>
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="dropdown-content">
                                        {alerts.length === 0 ? (
                                            <div className="empty-alerts">No alerts triggered.</div>
                                        ) : (
                                            alerts.map(alert => (
                                                <div key={alert.id} className={`alert-item ${!alert.isRead ? "unread" : ""}`}>
                                                    <div className="alert-item-header">
                                                        <span className="alert-city">{alert.city}</span>
                                                        <span className="alert-time">
                                                            {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="alert-msg">{alert.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
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
 