function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <path
        d="M21.8 12.2c0-.7-.1-1.5-.2-2.2H12v4h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 5-.9 6.8-2.3l-3.3-2.6c-.9.6-2.1 1-3.5 1a6 6 0 0 1-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.4 14a6 6 0 0 1 0-4V7.3H3a10 10 0 0 0 0 9.4L6.4 14Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3 7.3L6.4 10A6 6 0 0 1 12 5.9Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GoogleAuthButton({ children, disabled, onClick }) {
  return (
    <button
      className="ph-action flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 shadow-sm hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <GoogleIcon />
      {children}
    </button>
  );
}

export default GoogleAuthButton;
