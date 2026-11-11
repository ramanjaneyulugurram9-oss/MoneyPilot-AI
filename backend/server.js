
const express = require("express");

const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();


const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, "transactions.json");
const PAYPAL_BASE_URL = (
  process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com"
).replace(/\/$/, "");

// Initial transactions for a new installation.
const sampleTransactions = [
  {
    id: 1,
    name: "Fresh Mart",
    type: "QR Payment",
    amount: 500,
    currency: "INR",
    status: "Completed",
    date: new Date().toLocaleString("en-IN")
  },
  {
    id: 2,
    name: "Online Store",
    type: "Shopping",
    amount: 1200,
    currency: "INR",
    status: "Completed",
    date: new Date().toLocaleString("en-IN")
  },
  {
    id: 3,
    name: "Received Payment",
    type: "Merchant Payment",
    amount: 2500,
    currency: "INR",
    status: "Completed",
    date: new Date().toLocaleString("en-IN")
  },
  {
    id: 4,
    name: "Cafe Coffee",
    type: "QR Payment",
    amount: 300,
    currency: "INR",
    status: "Completed",
    date: new Date().toLocaleString("en-IN")
  }
];

// Load transactions from the JSON file.
function loadTransactions() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const savedData = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
      );

      return Array.isArray(savedData) ? savedData : sampleTransactions;
    }

    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(sampleTransactions, null, 2)
    );

    return sampleTransactions;
  } catch (error) {
    console.error("Could not load transactions:", error);
    return sampleTransactions;
  }
}

let transactions = loadTransactions();

// Save transactions to the JSON file.
function saveTransactions() {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(transactions, null, 2),
    "utf8"
  );
}

// Basic routes.
app.get("/", (req, res) => {
  res.send("Welcome to MoneyPilot AI Backend!");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MoneyPilot AI backend is running."
  });
});

// Get all transactions.
app.get("/api/transactions", (req, res) => {
  res.json({
    success: true,
    transactions
  });
});
// MoneyPilot AI Assistant

app.post("/api/ai/chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a question."
      });
    }

    if (question.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Question is too long."
      });
    }

    const completedTransactions = transactions.filter(
      t => t.status === "Completed" || t.status === "Demo Completed"
    );

    const transactionSummary = {
      totalTransactions: transactions.length,
      completedTransactions: completedTransactions.length,
      transactions: completedTransactions.slice(0, 50).map(t => ({
        name: t.name,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        date: t.date
      }))
    };

    const prompt = `
You are MoneyPilot AI, a personal finance assistant.

Answer clearly and simply.
Analyze only the supplied transaction data.
Never invent financial facts.
Respect transaction currencies.
Mention that records may include demo transactions.
Give practical budgeting suggestions when appropriate.
Never claim to execute payments.

Customer question:
${question}

Transaction data:
${JSON.stringify(transactionSummary, null, 2)}
`;

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    res.json({
      success: true,
      answer: response.text || "Please try asking another question."
    });

  } catch (error) {
    console.error("Gemini API error:", error);

    res.status(500).json({
      success: false,
      message: "Gemini AI could not respond. Check your API key, model access and quota."
    });
  }
});


// MoneyPilot AI Assistant - Google Gemini
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a question."
      });
    }

    if (question.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Question is too long. Maximum 2000 characters."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is missing. Check backend .env."
      });
    }

    const completedTransactions = transactions.filter(
      t => t.status === "Completed" || t.status === "Demo Completed"
    );

    const totalSpending = completedTransactions.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    );

    const transactionSummary = {
      totalTransactions: transactions.length,
      completedTransactions: completedTransactions.length,
      totalRecordedAmount: totalSpending,
      transactions: completedTransactions.slice(0, 50).map(t => ({
        name: t.name,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        date: t.date
      }))
    };

    const prompt = `
You are MoneyPilot AI, a helpful personal finance assistant.

Instructions:
- Answer clearly and simply.
- Analyze only the transaction data provided.
- Never invent transactions or financial facts.
- Respect the currency shown in each transaction.
- Mention that recorded amounts may include demo transactions.
- Give practical budgeting suggestions when appropriate.
- Do not claim to execute payments.
- Do not provide professional financial advice.

Customer question:
${question}

Customer transaction data:
${JSON.stringify(transactionSummary, null, 2)}
`;

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    res.json({
      success: true,
      answer: response.text || "Sorry, I could not generate an answer."
    });

  } catch (error) {
    console.error("Gemini API error:", error.message);

    res.status(500).json({
      success: false,
      message: "Gemini AI could not respond. Check your API key, quota and backend terminal."
    });
  }
});

// Demo transaction route.
// This is for testing only and does NOT process a real PayPal payment.
app.post("/api/transactions", (req, res) => {
  const { name, amount, type } = req.body;
  const numericAmount = Number(amount);

  if (
    typeof name !== "string" ||
    !name.trim() ||
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid name and amount."
    });
  }

  const newTransaction = {
    id: Date.now(),
    name: name.trim(),
    type: type || "Demo QR Payment",
    amount: numericAmount,
    currency: "INR",
    status: "Demo Completed",
    date: new Date().toLocaleString("en-IN")
  };

  try {
    transactions.unshift(newTransaction);
    saveTransactions();

    return res.status(201).json({
      success: true,
      transaction: newTransaction,
      message: "Demo transaction saved."
    });
  } catch (error) {
    transactions = transactions.filter(
      (item) => item.id !== newTransaction.id
    );

    console.error("Demo transaction save error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not save demo transaction."
    });
  }
});

// Get a PayPal Sandbox access token.
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "PayPal credentials are missing. Check your backend .env file."
    );
  }

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetch(
    `${PAYPAL_BASE_URL}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("PayPal authentication response:", data);
    throw new Error(
      data.error_description || "PayPal authentication failed."
    );
  }

  return data.access_token;
}

// Create a PayPal Sandbox order.
app.post("/api/paypal/create-order", async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid payment amount."
      });
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amount.toFixed(2)
            }
          }
        ],
        application_context: {
          return_url: "http://localhost:5173/?paypal=success",
          cancel_url: "http://localhost:5173/?paypal=cancel",
          user_action: "PAY_NOW"
        }
      })
    });

    const order = await response.json();
    if (!response.ok) {
      console.error("PayPal create order response:", order);

      return res.status(400).json({
        success: false,
        message: "Could not create PayPal order.",
        details: order
      });
    }

    const approvalLink = order.links?.find(
      (link) => link.rel === "approve"
    );

    return res.json({
      success: true,
      orderID: order.id,
      approvalUrl: approvalLink?.href
    });
  } catch (error) {
    console.error("PayPal create order error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Capture an approved PayPal order and save the completed payment.
app.post("/api/paypal/capture-order", async (req, res) => {
  try {
    const { orderID } = req.body;

    if (!orderID || typeof orderID !== "string") {
      return res.status(400).json({
        success: false,
        message: "A valid PayPal order ID is required."
      });
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    const captureData = await response.json();

    if (!response.ok) {
      console.error("PayPal capture response:", captureData);

      return res.status(400).json({
        success: false,
        message: "PayPal payment capture failed.",
        details: captureData
      });
    }

    // Find the actual captured payment.
    const purchaseUnits = captureData.purchase_units || [];
    const captures = purchaseUnits.flatMap(
      (unit) => unit.payments?.captures || []
    );

    const completedCapture = captures.find(
      (item) => item.status === "COMPLETED"
    );

    if (
      captureData.status !== "COMPLETED" ||
      !completedCapture
    ) {
      return res.status(400).json({
        success: false,
        message: "PayPal has not confirmed a completed payment.",
        details: captureData
      });
    }

    // Avoid saving the same PayPal capture twice.
    const existingTransaction = transactions.find(
      (item) => item.paypalCaptureId === completedCapture.id
    );

    if (existingTransaction) {
      return res.json({
        success: true,
        transaction: existingTransaction,
        capture: captureData,
        message: "This PayPal payment was already recorded."
      });
    }

    const paidAmount = Number(completedCapture.amount?.value);
    const currency = completedCapture.amount?.currency_code || "USD";

    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "PayPal returned an invalid captured amount."
      });
    }

    const newTransaction = {
      id: Date.now(),
      name: "PayPal Sandbox Payment",
      type: "PayPal Payment",
      amount: paidAmount,
      currency,
      status: "Completed",
      paypalOrderId: orderID,
      paypalCaptureId: completedCapture.id,
      date: new Date().toLocaleString("en-IN")
    };

    try {
      transactions.unshift(newTransaction);
      saveTransactions();
    } catch (saveError) {
      transactions = transactions.filter(
        (item) => item.paypalCaptureId !== completedCapture.id
      );

      console.error("PayPal transaction save error:", saveError);

      return res.status(500).json({
        success: false,
        message: "Payment was captured, but the transaction could not be saved. Check the backend data file.",
        captureId: completedCapture.id
      });
    }

    return res.json({
      success: true,
      transaction: newTransaction,
      capture: captureData,
      message: "PayPal payment completed and transaction saved."
    });
  } catch (error) {
    console.error("PayPal capture error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Start the backend.
app.listen(PORT, () => {
  console.log(`MoneyPilot AI running on port ${PORT}`);
});
