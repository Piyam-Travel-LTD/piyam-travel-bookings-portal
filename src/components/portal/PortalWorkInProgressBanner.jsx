import React from 'react';

export default function PortalWorkInProgressBanner() {
  return (
    <aside className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100" role="status">
      <div className="mx-auto flex max-w-5xl items-start gap-3 text-sm">
        <span className="mt-0.5" aria-hidden="true">🚧</span>
        <p>
          <span className="font-bold">Portal improvements are in progress.</span>{' '}
          Some sections are still being developed while we continue improving your experience.
        </p>
      </div>
    </aside>
  );
}
