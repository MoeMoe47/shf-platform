import React from "react";

export default function DecisionSandbox() {
  const [lastAction, setLastAction] = React.useState("none");
  const [received, setReceived] = React.useState("none");

  React.useEffect(() => {
    const handler = (e) => {
      console.log("SANDBOX RECEIVED:", e.detail);
      setReceived(JSON.stringify(e.detail));
    };

    window.addEventListener("shf:ai_action", handler);

    return () => {
      window.removeEventListener("shf:ai_action", handler);
    };
  }, []);

  const dispatchAction = (type) => {
    console.log("SANDBOX DISPATCH:", type);
    setLastAction(type);

    window.dispatchEvent(
      new CustomEvent("shf:ai_action", {
        detail: { type }
      })
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 40,
        background: "#0b1220",
        color: "#ffffff",
        fontFamily: "sans-serif"
      }}
    >
      <h2 style={{ marginBottom: 20 }}>Decision Sandbox</h2>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => dispatchAction("execute")}>Execute</button>
        <button onClick={() => dispatchAction("review")} style={{ marginLeft: 10 }}>
          Review
        </button>
        <button onClick={() => dispatchAction("hold")} style={{ marginLeft: 10 }}>
          Hold
        </button>
      </div>

      <div style={{ marginTop: 20, fontSize: 18 }}>
        <div style={{ marginBottom: 10 }}>Last Dispatched: {lastAction}</div>
        <div>Listener Received: {received}</div>
      </div>
    </div>
  );
}
