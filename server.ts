import express from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PayFast Configuration Parameters
const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || "10000100"; // Sandbox merchant id default
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || "46f0df51a3fc0"; // Sandbox merchant key default
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || "";
const PAYFAST_ENV = process.env.PAYFAST_ENV || "sandbox"; // "sandbox" or "production"

const PAYFAST_URL = PAYFAST_ENV === "production"
  ? "https://www.payfast.co.za/eng/process"
  : "https://sandbox.payfast.co.za/eng/process";

// PayFast Custom MD5 Signature Calculation Helper
function generatePayFastSignature(data: Record<string, string>, passphrase?: string): string {
  const keys = [
    "merchant_id",
    "merchant_key",
    "return_url",
    "cancel_url",
    "notify_url",
    "name_first",
    "name_last",
    "email_address",
    "m_payment_id",
    "amount",
    "item_name",
    "item_description",
    "custom_str1"
  ];

  let rawString = "";
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
      const escapedValue = encodeURIComponent(String(data[key]).trim()).replace(/%20/g, "+");
      rawString += `${key}=${escapedValue}&`;
    }
  }

  let finalString = rawString.slice(0, -1);
  if (passphrase) {
    finalString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
  }

  return crypto.createHash("md5").update(finalString).digest("hex");
}

// REST endpoints for secure backend PayFast orchestration
app.get("/api/payfast/config", (req, res) => {
  res.json({
    merchantId: PAYFAST_MERCHANT_ID,
    environment: PAYFAST_ENV,
    actionUrl: PAYFAST_URL
  });
});

app.post("/api/payfast/checkout", (req, res) => {
  try {
    const { amount, itemName, userEmail, userId, planName, returnUrl, cancelUrl } = req.body;

    if (!amount || !itemName || !userEmail) {
      return res.status(400).json({ error: "Missing required checkout parameters: amount, itemName, userEmail" });
    }

    // Determine return domain based on request context host header dynamically
    const host = req.get("host") || "localhost:3000";
    const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const baseDomain = `${protocol}://${host}`;

    // Callback redirects
    const pfReturnUrl = returnUrl || `${baseDomain}/#/billing?payfast=success&plan=${encodeURIComponent(planName || "")}`;
    const pfCancelUrl = cancelUrl || `${baseDomain}/#/billing?payfast=cancel`;
    const pfNotifyUrl = `${baseDomain}/api/payfast/notify`;

    const paymentId = `PAYFAST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const checkoutFields: Record<string, string> = {
      merchant_id: PAYFAST_MERCHANT_ID,
      merchant_key: PAYFAST_MERCHANT_KEY,
      return_url: pfReturnUrl,
      cancel_url: pfCancelUrl,
      notify_url: pfNotifyUrl,
      name_first: userEmail.split("@")[0] || "Client",
      name_last: "LogiTrackUser",
      email_address: userEmail,
      m_payment_id: paymentId,
      amount: parseFloat(amount).toFixed(2),
      item_name: itemName,
      item_description: `LogiTrack Logistics ${itemName} license upgrade.`,
      custom_str1: userId || "anonymous"
    };

    const signature = generatePayFastSignature(checkoutFields, PAYFAST_PASSPHRASE);
    
    res.json({
      actionUrl: PAYFAST_URL,
      fields: {
        ...checkoutFields,
        signature
      }
    });
  } catch (error: any) {
    console.error("PayFast Checkout Generation Error:", error);
    res.status(500).json({ error: "Internal PayFast checkout setup failure", details: error.message });
  }
});

// PayFast Instant Payment Notification (IPN / ITN) Callback Listener
app.post("/api/payfast/notify", (req, res) => {
  console.log("PayFast IPN Notification payload received:", req.body);
  
  // Real check verification could also validate secure request source matching PayFast IP ranges
  const receivedData = req.body;
  const receivedSignature = receivedData.signature;

  if (!receivedSignature) {
    return res.status(400).send("No signature located on incoming payload.");
  }

  // Acknowledge receipt of the callback correctly
  res.status(200).send("OK APPROVED");
});

// PWA Manifest and Service Worker Server-Side Endpoints
app.get("/manifest.webmanifest", (req, res) => {
  res.setHeader("Content-Type", "application/manifest+json");
  res.json({
    name: "LogiTrack Fleet",
    short_name: "LogiTrack",
    description: "Enterprise-grade Logistics Real-time Dashboard & Fleet Tracking",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#2f6fed",
    orientation: "portrait",
    icons: [
      {
        src: "https://img.icons8.com/color/512/delivery.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "https://img.icons8.com/color/192/delivery.png",
        sizes: "192x192",
        type: "image/png"
      }
    ]
  });
});

app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.send(`
    const CACHE_NAME = 'logitrack-v2.4';
    const ASSETS = [
      '/',
      '/index.html'
    ];

    self.addEventListener('install', (e) => {
      e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
          return cache.addAll(ASSETS).catch(() => {});
        })
      );
    });

    self.addEventListener('fetch', (e) => {
      if (e.request.method !== 'GET' || e.request.url.includes('/api/') || e.request.url.includes('firestore.googleapis.com')) {
        return;
      }
      e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(e.request).then((response) => {
            if (response && response.status === 200 && e.request.url.startsWith(self.location.origin)) {
              const cacheCopy = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(e.request, cacheCopy);
              });
            }
            return response;
          }).catch(() => {
            return caches.match('/');
          });
        })
      );
    });
  `);
});

// Mounting Vite Development Server Middleware OR serving compiled bundles
async function initializeViteServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware mounted with PayFast endpoints.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static server route serving built assets.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

initializeViteServer().catch((error) => {
  console.error("Vite server booster init error:", error);
});
