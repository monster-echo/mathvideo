import Link from "next/link";

export default function LocaleNotFound() {
  return (
    <div className="animg-container py-24">
      <div className="animg-card mx-auto max-w-xl p-8 text-center">
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="mt-3 animg-muted">The requested page does not exist in this locale.</p>
        <Link href="/en" className="animg-button-primary mt-6">
          Back to home
        </Link>
      </div>
    </div>
  );
}
