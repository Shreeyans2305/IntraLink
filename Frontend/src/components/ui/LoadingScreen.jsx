function LoadingScreen({
  isLoading = false,
  loadingText = 'Loading',
  showProgress = true,
  useBlur = true,
}) {
  if (!isLoading) {
    return null
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center ${
        useBlur ? 'backdrop-blur-md' : ''
      }`}
      style={{ background: 'var(--bg-page, rgba(9, 9, 11, 0.94))' }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex w-full max-w-sm flex-col items-center px-6 text-center">
        <div className="loading-logo-orbit">
          <img
            src="/LOGO.webp"
            alt="IntraLink loading"
            className="loading-logo-3d h-24 w-24 select-none object-contain"
          />
        </div>

        <p className="mt-6 text-sm font-medium tracking-wide text-zinc-300">
          {loadingText}
          <span className="loading-dots" aria-hidden="true">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>

        {showProgress ? (
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full border border-zinc-700/70 bg-zinc-900/60">
            <span className="loading-progress-bar block h-full w-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-300" />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default LoadingScreen