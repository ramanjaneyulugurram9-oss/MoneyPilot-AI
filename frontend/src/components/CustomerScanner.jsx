
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

function CustomerScanner({ onPaymentSuccess })  {
  const scannerRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [merchant, setMerchant] = useState(null);
  const [amount, setAmount] = useState("250");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const stopCamera = async () => {
    const scanner = scannerRef.current;

    if (!scanner) {
      setScanning(false);
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      await scanner.clear();
    } catch (error) {
      console.log("Scanner cleanup:", error);
    }

    scannerRef.current = null;
    setScanning(false);
  };

 

const processQR = async (decodedText) => {
  if (!decodedText) return;

  await stopCamera();

  setMerchant(null);
  setResult(null);

  const text = decodedText.trim();

  // 1. MoneyPilot merchant QR
  try {
    const parsedUrl = new URL(text);
    const merchantId = parsedUrl.searchParams.get("merchant");

    if (merchantId === "fresh-mart-001") {
      setMerchant({
        id: "fresh-mart-001",
        name: "Fresh Mart",
        qrType: "MONEYPILOT"
      });

      setAmount("250");
      showMessage(
        "Fresh Mart QR recognized. Enter the payment amount.",
        "success"
      );
      return;
    }
  } catch (error) {
    // Continue checking other QR formats.
  }

  // 2. External UPI QR (PhonePe, Google Pay, Paytm, etc.)
  if (/^upi:\/\/pay(?:\?|$)/i.test(text)) {
    try {
      const upiUrl = new URL(text);

      const upiId = upiUrl.searchParams.get("pa");
      const payeeName = upiUrl.searchParams.get("pn");
      const qrAmount = upiUrl.searchParams.get("am");
      const note = upiUrl.searchParams.get("tn");

      if (!upiId) {
        showMessage("Invalid UPI QR: UPI ID is missing.", "error");
        return;
      }

      const upiMerchant = {
        id: upiId,
        name: payeeName || upiId,
        upiId: upiId,
        amount: qrAmount || "",
        note: note || "",
        qrType: "UPI"
      };

      setMerchant(upiMerchant);
      setAmount(qrAmount || "");

      showMessage(
        `UPI QR recognized successfully. Payee: ${upiMerchant.name}`,
        "success"
      );
      return;

    } catch (error) {
      console.error("UPI parsing error:", error);
      showMessage("Unable to read UPI QR details.", "error");
      return;
    }
  }

  // 3. Website QR
  if (/^https?:\/\//i.test(text)) {
    showMessage(`Website QR recognized: ${text}`, "success");
    return;
  }

  // 4. Wi-Fi QR
  if (text.startsWith("WIFI:")) {
    showMessage("Wi-Fi QR code recognized successfully.", "success");
    return;
  }

  // 5. Other QR codes
  showMessage(
    `QR code recognized. Content: ${text}`,
    "success"
  );
};



  const startCamera = async () => {
    setMessage("");
    setResult(null);
    setMerchant(null);

    try {
      const scanner = new Html5Qrcode("money-pilot-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "user" },
        {
  fps: 15,
  aspectRatio: 1,
  disableFlip: false
},
        processQR,
        () => {}
      );

      setScanning(true);
      showMessage("Camera started. Point it at a QR code.", "info");
    } catch (error) {
      scannerRef.current = null;
      setScanning(false);
      showMessage(
        "Camera could not start. Allow camera permission and close other apps using your webcam.",
        "error"
      );
      console.error("Camera error:", error);
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage("");
    setResult(null);
    setMerchant(null);

    try {
      await stopCamera();

      const scanner = new Html5Qrcode("money-pilot-reader");
      scannerRef.current = scanner;

      showMessage("Reading your QR image...", "info");

      
let decodedText;

try {
  // First try the original QR image.
  decodedText = await scanner.scanFile(file, true);
} catch (firstError) {
  // If normal decoding fails, invert the image colours.
  showMessage("Trying inverted QR image...", "info");

  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement("canvas");

  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0);

  const imageData = context.getImageData(
    0, 0, canvas.width, canvas.height
  );

  for (let i = 0; i < imageData.data.length; i += 4) {
    imageData.data[i] = 255 - imageData.data[i];
    imageData.data[i + 1] = 255 - imageData.data[i + 1];
    imageData.data[i + 2] = 255 - imageData.data[i + 2];
  }

  context.putImageData(imageData, 0, 0);
  bitmap.close();

  const invertedBlob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!invertedBlob) {
    throw new Error("Could not preprocess QR image.");
  }

  const invertedFile = new File(
    [invertedBlob],
    "inverted-qr.png",
    { type: "image/png" }
  );

  decodedText = await scanner.scanFile(invertedFile, true);
}


      await scanner.clear();
      scannerRef.current = null;

      await processQR(decodedText);
    } catch (error) {
      console.error("Image QR scan error:", error);
      if (scannerRef.current) {
        try {
          await scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }
      showMessage(
  `QR scanning failed: ${error?.message || String(error)}`,
  "error"
);
    }

    event.target.value = "";
  };
     const makePayment = async () => {
    const value = Number(amount);

    if (!merchant) {
      showMessage("Please scan a merchant QR code first.", "error");
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      showMessage("Please enter a valid amount.", "error");
      return;
    }

    setBusy(true);
    setResult(null);
    showMessage("Processing your demo transaction...", "info");

    try {
      const response = await fetch("http://localhost:5000/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: merchant.name,
          amount: value,
          type: "QR Payment"
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Transaction could not be saved.");
      }

      const paymentResult = {
        id: data.transaction?.id || "Not provided",
        name: merchant.name,
        amount: value,
        status: "Demo Completed",
        date: data.transaction?.date || new Date().toLocaleString("en-IN")
      };

      setResult(paymentResult);
      showMessage("Your demo transaction was recorded successfully.", "success");

      window.dispatchEvent(new Event("transactions-updated"));
      if (onPaymentSuccess) {
  onPaymentSuccess();
}
    } catch (error) {
      console.error("Payment error:", error);
      showMessage(
        error.message || "Could not save transaction. Check the backend.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner) {
        if (scanner.isScanning) {
          scanner.stop().then(() => scanner.clear()).catch(() => {});
        } else {
          scanner.clear().catch(() => {});
        }
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{
      background: "#121D32",
      border: "1px solid #263653",
      borderRadius: "14px",
      padding: "28px",
      textAlign: "center",
      maxWidth: "850px",
      margin: "20px auto"
    }}>
      <h2>Universal QR Scanner</h2>
      <p style={{ color: "#A9B8D0" }}>
        Scan a MoneyPilot merchant QR using your camera or an image.
      </p>

      <div
        id="money-pilot-reader"
        style={{
          width: "100%",
          maxWidth: "500px",
          minHeight: scanning ? "300px" : "0px",
          margin: "20px auto",
          overflow: "hidden",
          borderRadius: "12px"
        }}
      />

      <div style={{ margin: "18px 0" }}>
        {!scanning ? (
          <button onClick={startCamera} style={buttonStyle("#5546D9")}>
            Start Camera Scanner
          </button>
        ) : (
          <button onClick={stopCamera} style={buttonStyle("#334155")}>
            Stop Camera
          </button>
        )}
      </div>

      <div style={{
        background: "#17243B",
        padding: "20px",
        borderRadius: "12px",
        margin: "20px auto",
        maxWidth: "500px"
      }}>
        <h3>Upload QR Image</h3>
        <p style={{ color: "#A9B8D0" }}>
          Choose a QR code image from your device.
        </p>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFile}
          style={{ color: "white", maxWidth: "100%" }}
        />
      </div>

      {message && (
        <p style={{
          margin: "20px auto",
          padding: "13px",
          borderRadius: "8px",
          maxWidth: "600px",
          background: "#080D19",
          color:
            messageType === "success" ? "#34D399" :
            messageType === "error" ? "#F87171" : "#A9B8D0"
        }}>
          {message}
        </p>
      )}

      {merchant && (
        <div style={{
          background: "#17243B",
          padding: "22px",
          borderRadius: "12px",
          marginTop: "20px"
        }}>
          <h3 style={{ color: "#34D399" }}>Merchant Verified</h3>
          <p>Payee: <strong>{merchant.name}</strong></p>
          <p>Payment ID: {merchant.id}</p>

          <label style={{ display: "block", margin: "18px 0 8px" }}>
            Enter Payment Amount (₹)
          </label>

          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            style={{
              width: "100%",
              maxWidth: "320px",
              padding: "12px",
              background: "#080D19",
              color: "white",
              border: "1px solid #263653",
              borderRadius: "8px"
            }}
          />

          <div>
            <button
              onClick={makePayment}
              disabled={busy}
              style={{
                ...buttonStyle(busy ? "#475569" : "#2563EB"),
                marginTop: "18px"
              }}
            >
              {busy ? "Processing..." : "Continue to Payment"}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div style={{
          background: "#102C2A",
          border: "1px solid #34D399",
          borderRadius: "14px",
          padding: "25px",
          marginTop: "24px",
          textAlign: "left"
        }}>
          <h2 style={{ color: "#34D399", textAlign: "center" }}>
            ✓ Payment Recorded Successfully
          </h2>
          <h3 style={{ textAlign: "center" }}>₹{result.amount.toFixed(2)}</h3>
          <p>Merchant: <strong>{result.name}</strong></p>
          <p>Transaction ID: <strong>{result.id}</strong></p>
          <p>Date: {result.date}</p>
          <p>Status: <strong style={{ color: "#34D399" }}>{result.status}</strong></p>
          <p style={{ color: "#FBBF24", textAlign: "center" }}>
            Demo transaction only. No real money was transferred.
          </p>
          <button
            onClick={() => {
              setResult(null);
              setMerchant(null);
              setAmount("250");
              showMessage("Ready for the next QR scan.", "info");
            }}
            style={{ ...buttonStyle("#5546D9"), display: "block", margin: "15px auto 0" }}
          >
            Make Another Payment
          </button>
        </div>
      )}

      <p style={{ color: "#FBBF24", marginTop: "20px" }}>
        Demo only. No real payment is made.
      </p>
    </div>
  );
}

const buttonStyle = (background) => ({
  background,
  color: "white",
  padding: "13px 24px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer"
});

export default CustomerScanner;
