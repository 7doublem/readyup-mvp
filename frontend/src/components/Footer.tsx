// Shared footer component — displays the ReadyUp tagline on every page

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-black px-4 py-6 text-center">
      <p
        className="text-sm font-bold uppercase tracking-[0.3em] text-gray-500"
        style={{ fontFamily: "Orbitron, sans-serif" }}
      >
        Compete. Win. Get Paid.
      </p>
    </footer>
  );
}
