"use client";

import { useEffect, useState } from "react";

import { authMeResponseSchema } from "@/contracts/auth";
import { listRendersSuccessResponseSchema, type RenderJob } from "@/contracts/renders";
import { SignInModal } from "@/components/auth/sign-in-modal";
import { parseWithSchema, readJsonSafely } from "@/lib/api/client";
import { type Locale } from "@/lib/i18n";

export function MyAnimationsClient({ locale }: { locale: Locale }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [showSignInModal, setShowSignInModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const meResponse = await fetch("/api/auth/me");
        const meData = parseWithSchema(authMeResponseSchema, await readJsonSafely(meResponse));

        if (!meData?.authenticated) {
          if (!cancelled) {
            setAuthenticated(false);
            setShowSignInModal(true);
          }
          return;
        }

        const response = await fetch("/api/renders?limit=20");
        const data = parseWithSchema(listRendersSuccessResponseSchema, await readJsonSafely(response));

        if (!cancelled) {
          setAuthenticated(true);
          setJobs(data?.items ?? []);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="animg-container">
      <h1 className="text-3xl font-bold">Your Latest Creations</h1>
      <p className="mt-2 text-sm animg-muted">View and manage your generated animations.</p>

      <div className="mt-5 space-y-3">
        {loading ? <p className="text-sm animg-muted">Loading...</p> : null}

        {!loading && authenticated && jobs.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm animg-muted dark:border-slate-700 dark:bg-slate-900">
            No render jobs yet.
          </p>
        ) : null}

        {jobs.map((job) => (
          <article key={job.id} className="animg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{job.title}</h2>
                <p className="mt-1 text-xs animg-muted">{job.createdAt}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {job.status}
              </span>
            </div>
            <p className="mt-2 text-sm animg-muted">
              Quality: {job.quality} {job.output?.resolution ? `• ${job.output.resolution}` : ""}
            </p>
          </article>
        ))}
      </div>

      <SignInModal
        open={showSignInModal}
        locale={locale}
        onClose={() => setShowSignInModal(false)}
        onSuccess={() => {
          setShowSignInModal(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
