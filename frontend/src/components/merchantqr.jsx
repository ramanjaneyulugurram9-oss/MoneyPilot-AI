
import { useEffect, useState } from "react";
import QRCode from "qrcode";

function MerchantQR() {
  const [shopName, setShopName] = useState("Fresh Mart");
  const [shopLocation, setShopLocation] = useState("Mangalagiri");
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(false);

  const merchantId = "fresh-mart-001";

  const generateQR = async () => {
    if (!shopName.trim() || !shopLocation.trim()) {
      alert("Please enter shop details");
      return;
    }

    setLoading(true);

    try {
      const paymentURL =
        `${window.location.origin}/?merchant=${merchantId}`;

      const image = await QRCode.toDataURL(paymentURL, {
        width: 280,
        margin: 2,
        color: {
          dark: "#080D19",
          light: "#FFFFFF"
        }
      });

      setQrImage(image);
    } catch (error) {
      console.error("QR generation failed:", error);
      alert("Unable to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: "#121D32",
      border: "1px solid #263653",
      borderRadius: "16px",
      padding: "25px",
      maxWidth: "500px"
    }}>
      <h2 style={{ color: "#38BDF8" }}>
        Merchant QR Generator
      </h2>

      <p style={{ color: "#94A3B8" }}>
        Create a QR code for your shop.
      </p>

      <label>Shop Name</label>
      <input
        value={shopName}
        onChange={(e) => setShopName(e.target.value)}
        style={inputStyle}
      />

      <label>Shop Location</label>
      <input
        value={shopLocation}
        onChange={(e) => setShopLocation(e.target.value)}
        style={inputStyle}
      />

      <button
        onClick={generateQR}
        disabled={loading}
        style={buttonStyle}
      >
        {loading ? "Generating..." : "Generate QR Code"}
      </button>

      {qrImage && (
        <div style={{
          textAlign: "center",
          marginTop: "25px"
        }}>
          <img
            src={qrImage}
            alt="Merchant payment QR code"
            style={{
              width: "280px",
              maxWidth: "100%",
              background: "white",
              padding: "12px",
              borderRadius: "12px"
            }}
          />

          <h3>{shopName}</h3>
          <p style={{ color: "#94A3B8" }}>
            {shopLocation}
          </p>

          <button
            onClick={() => {
              const link = document.createElement("a");
              link.href = qrImage;
              link.download = "MoneyPilot-Merchant-QR.png";
              link.click();
            }}
            style={buttonStyle}
          >
            Download QR Code
          </button>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "12px",
  margin: "8px 0 18px",
  background: "#080D19",
  color: "white",
  border: "1px solid #263653",
  borderRadius: "8px",
  boxSizing: "border-box"
};

const buttonStyle = {
  background: "#2563EB",
  color: "white",
  border: "none",
  padding: "12px 20px",
  borderRadius: "8px",
  cursor: "pointer",
  marginTop: "10px"
};

export default MerchantQR;
