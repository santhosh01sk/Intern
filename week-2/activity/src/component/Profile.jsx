import React, { useEffect, useState } from "react";
import { fetchProfile } from "../services/weatherApi";
import { getStoredAuthToken } from "../auth";
import "./Profile.scss";

function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadProfile() {
        setLoading(true);
        setError("");
        try {
            const token = getStoredAuthToken();
            const data = await fetchProfile(token);
            setProfile(data);
        } catch (err) {
            setError(err.message || "Failed to load profile details.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProfile();
    }, []);

    if (loading) {
        return (
            <div className="profile-container">
                <div className="profile-card loading-card">
                    <div className="spinner"></div>
                    <p>Loading profile details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-container">
                <div className="profile-card error-card">
                    <h2>Error</h2>
                    <p className="error-message">{error}</p>
                    <button className="retry-btn" type="button" onClick={loadProfile}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {profile?.username ? profile.username.substring(0, 2).toUpperCase() : "US"}
                    </div>
                    <h1>User Profile</h1>
                    <p className="profile-tagline">Manage your account settings and credentials</p>
                </div>
                <div className="profile-body">
                    <div className="info-row">
                        <span className="info-label">User ID:</span>
                        <span className="info-value">{profile?.id}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Username:</span>
                        <span className="info-value">{profile?.username}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Email:</span>
                        <span className="info-value">{profile?.email}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
