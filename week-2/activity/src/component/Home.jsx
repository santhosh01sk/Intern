import React from "react";
import { useLocation } from "react-router-dom";
import Login from "./Login.jsx";
import Counter from "./Counter.jsx";
function Home() {
    const location = useLocation();
    const isLoggedIn = location.state?.isLoggedIn ?? false;
    const data=[
        [1,2,3],
        [4,5,6],
        [7,8,9]
    ]
    return (
        <div>
            {isLoggedIn ? <Counter /> : <Login />}
            <div>
                {data.map((row, rowIndex) => (
                    <div key={rowIndex}>
                        {row.map((value, colIndex) => (
                            <span key={colIndex}>{value}</span>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Home;