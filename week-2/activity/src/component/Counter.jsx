import React, { useState, useEffect } from "react";

function Counter() {

    const [count, setCount] = useState(0);
    useEffect(() => {
        console.log("count has been updated");
    }, [count]);
    
    return (
        <div>
            <h1>{count}</h1>

            <Child increment={() => setCount(count + 1)} decrement={() => setCount(count - 1)} />
            
        </div>
    );
}

function Child(props) {
    return (
        <div>
        <button onClick={props.increment}>
            Increment
        </button>
        <button onClick={props.decrement}>
            Decrement
        </button>
        </div>
    );
}
export default Counter;