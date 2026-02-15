// Minimal Express backend for Stripe Checkout
// Stripe requires a backend to securely create payment sessions. Card data
// never touches our server — it goes directly to Stripe (PCI compliant).
// Run with: npm run dev (from /backend)

import "dotenv/config";
import express from "express";
import cors from "cors";
import Stripe from "stripe";

const app = express();

// Port for the Stripe server (default 4242)
const PORT = process.env.PORT || 4242;

// Stripe is initialised with the secret key (never exposed to the frontend)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Allow requests from the frontend dev server
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

// Creates a Stripe Checkout Session for a paid event
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { eventId, eventTitle, entryFee, userUid } = req.body;

    if (!eventId || !eventTitle || !entryFee || !userUid) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: eventTitle,
              description: `Entry fee for ${eventTitle}`,
            },
            // Stripe expects amounts in the smallest currency unit (pence)
            unit_amount: Math.round(entryFee * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // Pass event and user info so the frontend knows what to update after payment
      success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/?payment=success&eventId=${eventId}&uid=${userUid}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/?payment=cancelled`,
      metadata: {
        eventId,
        userUid,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe session error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

app.listen(PORT, () => {
  console.log(`Stripe server running on http://localhost:${PORT}`);
});
