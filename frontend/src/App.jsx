
import { useState, useEffect } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import MerchantQR from "./components/merchantqr";
import CustomerScanner from "./components/CustomerScanner";
const menu = [
  "Overview",
  "Scan & Pay",
  "Online Shopping",
  "Transactions",
  "AI Assistant",
  "Merchant QR"
];



function App() {
  const [transactions, setTransactions] = useState([]);
  const [aiQuestion, setAiQuestion] = useState("");
const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);


const loadTransactions = () => {
  fetch("http://localhost:5000/api/transactions")
    .then(response => response.json())
    .then(data => {
      setTransactions(data.transactions);
    })
    .catch(error => {
      console.error("Transaction error:", error);
    });
};


useEffect(() => {
  const loadTransactions = () => {
    fetch("http://localhost:5000/api/transactions")
      .then((response) => response.json())
      .then((data) => {
        setTransactions(data.transactions || []);
      })
      .catch((error) => {
        console.error("Transaction error:", error);
      });
  };

  loadTransactions();

  window.addEventListener("transactions-updated", loadTransactions);

  return () => {
    window.removeEventListener("transactions-updated", loadTransactions);
  };
}, []);


  const [active, setActive] = useState("Overview");

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const paypalStatus = params.get("paypal");
  const orderID = params.get("token");

  if (paypalStatus === "success" && orderID) {
    window.history.replaceState({}, "", "/");

    fetch("http://localhost:5000/api/paypal/capture-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ orderID })
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Payment capture failed.");
        }

        const transactionResponse = await fetch(
          "http://localhost:5000/api/transactions"
        );
        const transactionData = await transactionResponse.json();

        setTransactions(transactionData.transactions || []);
        setActive("Transactions");

        alert("PayPal Sandbox payment completed successfully!");
      })
      .catch((error) => {
        alert("Payment capture error: " + error.message);
      });
  }

  if (paypalStatus === "cancel") {
    window.history.replaceState({}, "", "/");
    alert("PayPal payment was cancelled.");
  }
}, []);

  const [cart, setCart] = useState([]);
const [paypalLoading, setPaypalLoading] = useState(false);

const products = [
  { id: 1, name: "Wireless Headphones", price: 49.99, icon: "🎧" },
  { id: 2, name: "Smart Watch", price: 79.99, icon: "⌚" },
  { id: 3, name: "Laptop Stand", price: 29.99, icon: "💻" },
  { id: 4, name: "Bluetooth Speaker", price: 39.99, icon: "🔊" }
];

const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

const handlePaypalCheckout = async () => {
  if (cart.length === 0) {
    alert("Please add a product to your cart.");
    return;
  }

  setPaypalLoading(true);

  try {
    const response = await fetch(
      "http://localhost:5000/api/paypal/create-order",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cartTotal.toFixed(2) })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.approvalUrl) {
      throw new Error(data.message || "PayPal order creation failed.");
    }

    window.location.href = data.approvalUrl;
  } catch (error) {
    alert(error.message);
    setPaypalLoading(false);
  }
};

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080D19",
      color: "#F8FAFC",
      fontFamily: "Arial, sans-serif",
      display: "flex"
    }}>

      {/* Sidebar */}
      <aside style={{
        width: "230px",
        background: "#0D1526",
        borderRight: "1px solid #202B42",
        padding: "25px 15px",
        boxSizing: "border-box"
      }}>
        <h2 style={{ color: "#8B7CFF", marginBottom: "5px" }}>
          MoneyPilot <span style={{ color: "#38BDF8" }}>AI</span>
        </h2>
        <p style={{ color: "#8290A8", fontSize: "12px" }}>
          Your Financial Copilot
        </p>

        <p style={{
          color: "#64748B",
          fontSize: "11px",
          marginTop: "45px"
        }}>MAIN MENU</p>

        {menu.map(item => (
          <button
            key={item}
            onClick={() => setActive(item)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "13px",
              marginBottom: "9px",
              border: "none",
              borderRadius: "9px",
              cursor: "pointer",
              color: active === item ? "white" : "#AAB4C8",
              background: active === item
                ? "linear-gradient(90deg,#5546D9,#2563EB)"
                : "transparent",
              fontSize: "14px"
            }}
          >
            {item}
          </button>
        ))}

        <div style={{
          marginTop: "80px",
          padding: "13px",
          background: "#151F34",
          borderRadius: "10px"
        }}>
          <p style={{ color: "#AAB4C8", fontSize: "12px" }}>
            Account
          </p>
          <strong>Demo User</strong>
          <p style={{ color: "#64748B", fontSize: "11px" }}>
            Customer Account
          </p>
        </div>
      </aside>

      {/* Main Dashboard */}
      <main style={{
        flex: 1,
        padding: "30px",
        minWidth: 0
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px"
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "27px" }}>
              {active}
            </h1>
            <p style={{ color: "#8290A8" }}>
              Welcome back! Here's your financial overview.
            </p>
          </div>

          <div style={{
            background: "#151F34",
            padding: "12px 18px",
            borderRadius: "10px"
          }}>
            <span>👤 </span> Demo User
          </div>
        </div>

        {active === "Overview" ? (
          <>
            {/* Summary Cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
              gap: "18px",
              marginTop: "25px"
            }}>
              {[
                ["Total Spending", "₹12,450", "This month", "💳"],
                ["Payments Made", "28", "This month", "📤"],
                ["Money Received", "₹8,500", "Demo records", "📥"],
                ["Saved This Month", "₹2,100", "Demo estimate", "💰"]
              ].map(([label, value, note, icon]) => (
                <div key={label} style={{
                  background: "#121D32",
                  border: "1px solid #263653",
                  borderRadius: "15px",
                  padding: "20px"
                }}>
                  <div style={{ fontSize: "25px" }}>{icon}</div>
                  <p style={{ color: "#94A3B8", fontSize: "13px" }}>
                    {label}
                  </p>
                  <h2 style={{ margin: "8px 0" }}>{value}</h2>
                  <span style={{ color: "#38BDF8", fontSize: "12px" }}>
                    {note}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <h2 style={{ marginTop: "35px" }}>Quick Actions</h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
              gap: "15px"
            }}>
              {[
                ["📷", "Scan & Pay"],
                ["🛍️", "Online Shopping"],
                ["📊", "Transactions"],
                ["🤖", "AI Assistant"]
              ].map(([icon, label]) => (
                <button key={label}
                  onClick={() => setActive(label)}
                  style={{
                    padding: "22px",
                    background: "#17243B",
                    color: "white",
                    border: "1px solid #30415F",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontSize: "15px"
                  }}>
                  <div style={{ fontSize: "28px", marginBottom: "10px" }}>
                    {icon}
                  </div>
                  {label}
                </button>
              ))}
            </div>

            {/* Transactions */}
            <h2 style={{ marginTop: "35px" }}>
              t Transactions
            </h2>

            <div style={{
              background: "#121D32",
              border: "1px solid #263653",
              borderRadius: "14px",
              padding: "15px",
              overflowX: "auto"
            }}>
              {transactions.map((t, index) => (
                <div key={index} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  padding: "15px 5px",
                  borderBottom: index === transactions.length - 1
                    ? "none" : "1px solid #263653"
                }}>
                  <div>
                    <strong>{t.name}</strong>
                    <p style={{ color: "#8290A8", fontSize: "12px", margin: "5px 0" }}>
                      {t.type} · {t.date}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{
                      color: String(t.amount).startsWith("+") ? "#34D399" : "white"
                    }}>{t.amount}</strong>
                    <p style={{ color: "#34D399", fontSize: "11px", margin: "5px 0" }}>
                      {t.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ color: "#64748B", fontSize: "11px", marginTop: "12px" }}>
              Sample demonstration data only. No real payments have been made.
            </p>
          </>
   ) : active === "Merchant QR" ? (
  <MerchantQR />
) : active === "Scan & Pay" ? (
 <CustomerScanner onPaymentSuccess={loadTransactions} />
 ) : active === "Online Shopping" ? (
  <div style={{ marginTop: "25px" }}>
    <h2>🛍️ Online Shopping Store</h2>
    <p style={{ color: "#94A3B8" }}>
      Choose products and pay securely using PayPal Sandbox.
    </p>

    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
      gap: "18px"
    }}>
      {products.map(product => (
        <div key={product.id} style={{
          background: "#121D32",
          border: "1px solid #263653",
          borderRadius: "14px",
          padding: "22px"
        }}>
          <div style={{ fontSize: "45px" }}>{product.icon}</div>
          <h3>{product.name}</h3>
          <h2>${product.price.toFixed(2)}</h2>
          <button
            onClick={() => setCart([...cart, product])}
            style={{
              background: "#5546D9",
              color: "white",
              padding: "11px 18px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Add to Cart
          </button>
        </div>
      ))}
    </div>

    <div style={{
      background: "#121D32",
      border: "1px solid #263653",
      borderRadius: "14px",
      padding: "22px",
      marginTop: "25px"
    }}>
      <h2>🛒 Your Cart ({cart.length})</h2>

      {cart.map((item, index) => (
        <div key={`${item.id}-${index}`} style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "10px 0"
        }}>
          <span>{item.name}</span>
          <span>${item.price.toFixed(2)}</span>
          <button onClick={() =>
            setCart(cart.filter((_, i) => i !== index))
          }>
            Remove
          </button>
        </div>
      ))}

      <h2>Total: ${cartTotal.toFixed(2)} USD</h2>

      
{cart.length > 0 && (
  <div style={{ maxWidth: "450px", marginTop: "20px" }}>
    <PayPalButtons
      style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
      createOrder={async () => {
        const response = await fetch(
          "http://localhost:5000/api/paypal/create-order",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: cartTotal })
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not create PayPal order");
        }

        return data.orderID;
      }}
      onApprove={async (data) => {
        const response = await fetch(
          "http://localhost:5000/api/paypal/capture-order",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderID: data.orderID })
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Payment capture failed");
        }

        alert("PayPal Sandbox payment completed!");

        const transactionResponse = await fetch(
          "http://localhost:5000/api/transactions"
        );
        const transactionData = await transactionResponse.json();

        setTransactions(transactionData.transactions || []);
        setCart([]);
        setActive("Transactions");
      }}
      onError={(error) => {
        console.error("PayPal checkout error:", error);
        alert("PayPal checkout failed. Check the browser console.");
      }}
    />
  </div>
)}

      <p style={{ color: "#94A3B8", fontSize: "12px" }}>
        Sandbox testing only. No real money will be charged.
      </p>
    </div>
  </div>
) : active === "Transactions" ? (
  <div style={{ marginTop: "25px" }}>
    
<h2>Transaction History</h2>

<div style={{
  background: "#121D32",
  border: "1px solid #263653",
  borderRadius: "14px",
  padding: "20px",
  marginTop: "18px",
  overflowX: "auto"
}}>
  {transactions.length === 0 ? (
    <p>No transactions found.</p>
  ) : (
    <table style={{
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "650px",
      textAlign: "left"
    }}>
      <thead>
        <tr style={{ color: "#94A3B8", borderBottom: "1px solid #263653" }}>
          {["Transaction", "Payment ID", "Amount", "Method", "Status", "Date"].map(header => (
            <th key={header} style={{ padding: "14px 10px" }}>
              {header}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {transactions.map((t, index) => (
          <tr key={t.id || index} style={{
            borderBottom: "1px solid #263653"
          }}>
            <td style={{ padding: "16px 10px" }}>
              <strong>{t.name || "Payment"}</strong>
            </td>

            <td style={{ padding: "16px 10px", color: "#94A3B8" }}>
              {t.paypalCaptureId || t.paypalOrderId || t.id || "Demo"}
            </td>

            <td style={{ padding: "16px 10px", fontWeight: "bold" }}>
              {t.currency || "INR"} {Number(t.amount || 0).toFixed(2)}
            </td>

            <td style={{ padding: "16px 10px", color: "#A5B4FC" }}>
              {t.type || "Payment"}
            </td>

            <td style={{ padding: "16px 10px" }}>
              <span style={{
                background: t.status === "Completed" ? "#064E3B" : "#713F12",
                color: t.status === "Completed" ? "#6EE7B7" : "#FDE68A",
                padding: "6px 10px",
                borderRadius: "20px",
                fontSize: "12px"
              }}>
                {t.status}
              </span>
            </td>

            <td style={{ padding: "16px 10px", color: "#94A3B8" }}>
              {t.date}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>
</div>
) : active === "AI Assistant" ? (
  <div style={{
    marginTop: "35px",
    background: "#121D32",
    border: "1px solid #263653",
    borderRadius: "15px",
    padding: "30px"
  }}>
    <h2 style={{ color: "white" }}>🤖 MoneyPilot AI Assistant</h2>
    <p style={{ color: "#AAB4C8" }}>
      Your personal financial assistant. Ask about your transactions and spending.
    </p>

    <div style={{
      marginTop: "25px",
      padding: "20px",
      background: "#17243B",
      borderRadius: "12px"
    }}>
      <p style={{ color: "#AAB4C8" }}>Try asking:</p>
      <button onClick={() => setAiQuestion("Summarize my spending")}
        style={{ margin: "5px", padding: "10px", cursor: "pointer" }}>
        Spending summary
      </button>
      <button onClick={() => setAiQuestion("How many transactions do I have?")}
        style={{ margin: "5px", padding: "10px", cursor: "pointer" }}>
        Transaction count
      </button>
    </div>

    <textarea
      value={aiQuestion}
      onChange={(e) => setAiQuestion(e.target.value)}
      placeholder="Ask MoneyPilot anything about your spending..."
      style={{
        width: "100%",
        minHeight: "100px",
        marginTop: "20px",
        padding: "15px",
        background: "#0B1425",
        color: "white",
        border: "1px solid #30415F",
        borderRadius: "10px",
        boxSizing: "border-box"
      }}
    />

    <button
      onClick={async () => {
        if (!aiQuestion.trim()) {
          setAiAnswer("Please enter a question first.");
          return;
        }

        setAiLoading(true);
        setAiAnswer("");

        try {
          const response = await fetch("http://localhost:5000/api/ai/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ question: aiQuestion })
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.message || "AI request failed.");
          }

          setAiAnswer(data.answer);
        } catch (error) {
          console.error("AI Assistant error:", error);
          setAiAnswer("Sorry, AI could not respond. Please check your backend and API settings.");
        } finally {
          setAiLoading(false);
        }
      }}
      disabled={aiLoading}
      style={{
        marginTop: "15px",
        background: aiLoading ? "#6D5DF6" : "#5546D9",
        color: "white",
        border: "none",
        padding: "13px 25px",
        borderRadius: "8px",
        cursor: aiLoading ? "not-allowed" : "pointer",
        opacity: aiLoading ? 0.8 : 1
      }}
    >
      {aiLoading ? "Thinking..." : "Ask MoneyPilot AI"}
    </button>

    {aiAnswer && (
      <div style={{
        marginTop: "25px",
        padding: "20px",
        background: "#17243B",
        border: "1px solid #30415F",
        borderRadius: "10px",
        color: "#E2E8F0"
      }}>
        <h3>💡 Assistant Response</h3>
        <p>{aiAnswer}</p>
      </div>
    )}

    <button
      onClick={() => setActive("Overview")}
      style={{
        marginTop: "20px",
        background: "transparent",
        color: "#AAB4C8",
        border: "1px solid #30415F",
        padding: "10px 18px",
        borderRadius: "8px",
        cursor: "pointer"
      }}
    >
      Back to Overview
    </button>
  </div>
) : (
  <div style={{
    marginTop: "35px",
    background: "#121D32",
    border: "1px solid #263653",
    borderRadius: "15px",
    padding: "35px"
  }}>
    <h2>{active}</h2>
    <p style={{ color: "#AAB4C8" }}>
      Welcome to the {active} section of MoneyPilot AI.
    </p>
    <p style={{ color: "#8290A8" }}>
      This feature is under development. We will build it step by step.
    </p>
    <button onClick={() => setActive("Overview")}>
      Back to Overview
    </button>
  </div>
)}      
      </main>
    </div>
  );
}

export default App;
