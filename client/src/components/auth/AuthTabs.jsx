function AuthTabs({ activeTab, onChange, role }) {
  return (
    <div
      className="grid grid-cols-2 rounded-xl bg-slate-100 p-1"
      role="tablist"
      aria-label={`${role} authentication type`}
    >
      {["login", "register"].map((tab) => (
        <button
          aria-selected={activeTab === tab}
          className={`rounded-lg px-4 py-2.5 text-sm font-black capitalize transition ${activeTab === tab ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
          key={tab}
          onClick={() => onChange(tab)}
          role="tab"
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export default AuthTabs;
