export default function SuccessPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-4 text-center">
      <div className="rounded-full bg-volt-500/10 p-4">
        <span className="text-4xl text-volt-400">&#10003;</span>
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Welcome to Volt HQ Pro
      </h1>
      <p className="mt-4 max-w-md text-neutral-400">
        Your subscription is active. Spend tracking, budget alerts, and savings reports are now enabled.
      </p>
      <a
        href="/"
        className="mt-8 rounded-md bg-volt-500 px-6 py-2.5 text-sm font-medium text-black hover:bg-volt-400 transition-colors"
      >
        Back to home
      </a>
    </main>
  );
}
