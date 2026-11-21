/** The footer shown under every page. */
export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-sm text-slate-600 sm:px-6">
        <p>CollegeCart beta · CMU&apos;s student marketplace</p>
        <p>
          Built by{" "}
          <a
            href="https://scottylabs.org"
            target="_blank"
            rel="noreferrer"
            className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            ScottyLabs
          </a>
        </p>
      </div>
    </footer>
  );
}
