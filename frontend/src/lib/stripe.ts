// Stripe Checkout integration
// Calls the backend to create a Stripe Checkout Session, then redirects
// the user to Stripe's hosted payment page. Card data never touches our
// servers — Stripe handles PCI compliance entirely.

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4242";

interface CheckoutParams {
  eventId: string;
  eventTitle: string;
  entryFee: number;
  userUid: string;
}

// Creates a Stripe Checkout Session via the backend and redirects to payment
export async function redirectToCheckout(params: CheckoutParams): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to create payment session");
  }

  // Redirect to Stripe's hosted checkout page
  window.location.href = data.url;
}
