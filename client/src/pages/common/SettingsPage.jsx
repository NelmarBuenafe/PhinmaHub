import { Accessibility, LayoutPanelTop, LogOut, Monitor, Moon, Palette, RotateCcw, Sun, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader.jsx";
import ProfileDetails from "../../components/common/ProfileDetails.jsx";
import { useAuth } from "../../contexts/authContext.js";
import { useToast } from "../../contexts/toastStore.js";
import { useUserPreferences } from "../../contexts/useUserPreferences.js";

const settingsSections = [
  ["general", "General", Palette],
  ["accessibility", "Accessibility", Accessibility],
  ["account", "Account", UserRound],
];

const adminProfileSections = [
  {
    title: "Account Information",
    fields: [
      ["Account Status", (profile) => profile.account_status],
      ["School ID", (profile) => profile.school_id],
    ],
  },
];

function fullName(profile = {}) {
  return [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(" ") || "Name not provided";
}

function initials(profile = {}) {
  return [profile.first_name, profile.last_name].filter(Boolean).map((part) => part.trim().charAt(0)).join("").toUpperCase() || "PH";
}

function ChoiceGroup({ label, options, value, onChange }) {
  return <fieldset><legend className="text-sm font-bold text-slate-950">{label}</legend><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{options.map(({ label: optionLabel, value: optionValue, Icon }) => <label className={`ph-action flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-600 ${value === optionValue ? "border-emerald-500 bg-emerald-50 text-emerald-950" : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"}`} key={optionValue}><input checked={value === optionValue} className="sr-only" name={label} onChange={() => onChange(optionValue)} type="radio" value={optionValue} /><span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600"><Icon aria-hidden="true" size={17} /></span><span className="font-semibold">{optionLabel}</span></label>)}</div></fieldset>;
}

function AccountSummary({ profile, role, onSignOut }) {
  const rolePath = role.toLowerCase();
  const avatar = profile?.avatar_url;
  return <section aria-labelledby="account-heading" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="text-lg font-bold text-slate-950" id="account-heading">Account</h2><p className="mt-1 text-sm leading-6 text-slate-600">Your profile information is read-only here. Academic and faculty records are available on your Profile page.</p><div className="mt-6 flex min-w-0 items-center gap-4 rounded-xl bg-slate-50 p-4">{avatar ? <img alt={`${fullName(profile)} profile photo`} className="size-14 shrink-0 rounded-full object-cover" src={avatar} /> : <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full bg-emerald-700 text-sm font-black text-white">{initials(profile)}</span>}<div className="min-w-0"><p className="truncate font-bold text-slate-950">{fullName(profile)}</p><p className="mt-1 break-all text-sm text-slate-600">{profile?.email || "Email not provided"}</p><p className="mt-1 text-sm font-semibold text-emerald-800">{role}</p>{profile?.account_status && <p className="mt-1 text-xs font-semibold capitalize text-slate-500">Account status: {profile.account_status}</p>}</div></div><div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-5"><Link className="ph-action inline-flex items-center gap-2 rounded-lg border border-emerald-700 px-3.5 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50" to={role === "Admin" ? "/admin/profile" : `/${rolePath}/profile`}><UserRound aria-hidden="true" size={17} /> View Profile</Link><button className="ph-action inline-flex items-center gap-2 rounded-lg border border-red-200 px-3.5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50" onClick={onSignOut} type="button"><LogOut aria-hidden="true" size={17} /> Sign out</button></div></section>;
}

export default function SettingsPage({ initialSection = "general", profileOnly = false, role }) {
  const [section, setSection] = useState(initialSection);
  const { profile, signOut } = useAuth();
  const { theme, density, motion, updatePreferences, resetPreferences } = useUserPreferences();
  const toast = useToast();
  const navigate = useNavigate();

  function updateAppearance(key, value, message = "Appearance updated.") {
    if ({ theme, density, motion }[key] === value) return;
    updatePreferences({ [key]: value });
    toast.success(message);
  }

  async function logout() {
    await signOut();
    navigate("/");
  }

  const general = <section aria-labelledby="appearance-heading" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="text-lg font-bold text-slate-950" id="appearance-heading">Appearance</h2><p className="mt-1 text-sm leading-6 text-slate-600">Customize how PhinmaHub looks on this device.</p><div className="mt-6 space-y-7"><ChoiceGroup label="Theme" value={theme} onChange={(value) => updateAppearance("theme", value)} options={[{ label: "Light", value: "light", Icon: Sun }, { label: "Dark", value: "dark", Icon: Moon }, { label: "System", value: "system", Icon: Monitor }]} /><ChoiceGroup label="Interface density" value={density} onChange={(value) => updateAppearance("density", value)} options={[{ label: "Comfortable", value: "comfortable", Icon: LayoutPanelTop }, { label: "Compact", value: "compact", Icon: LayoutPanelTop }]} /></div></section>;
  const accessibility = <section aria-labelledby="accessibility-heading" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="text-lg font-bold text-slate-950" id="accessibility-heading">Accessibility</h2><p className="mt-1 text-sm leading-6 text-slate-600">Adjust motion and interaction preferences.</p><div className="mt-6"><ChoiceGroup label="Motion preference" value={motion} onChange={(value) => updateAppearance("motion", value, "Motion preference updated.")} options={[{ label: "Use device setting", value: "system", Icon: Monitor }, { label: "Reduce motion", value: "reduce", Icon: Accessibility }, { label: "Allow motion", value: "allow", Icon: LayoutPanelTop }]} /></div></section>;
  const account = <AccountSummary onSignOut={logout} profile={profile} role={role} />;

  return <div className="min-w-0"><section className="ph-role-page max-w-[1180px]"><PageHeader description={profileOnly ? "Review the information associated with your administrator account." : "Manage how PhinmaHub looks and behaves for you."} eyebrow={profileOnly ? "Account" : "Settings"} title={profileOnly ? "My Profile" : "Settings"} />{profileOnly ? <ProfileDetails details={null} profile={profile} role="Administrator" sections={adminProfileSections} /> : <><div className="mt-6 grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]"><nav aria-label="Settings sections" className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 lg:flex-col lg:self-start">{settingsSections.map(([id, label, Icon]) => <button aria-current={section === id ? "page" : undefined} className={`ph-action inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${section === id ? "bg-emerald-50 text-emerald-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`} key={id} onClick={() => setSection(id)} type="button"><Icon aria-hidden="true" size={17} /> {label}</button>)}</nav><div className="min-w-0 space-y-5">{section === "general" && general}{section === "accessibility" && accessibility}{section === "account" && account}{section !== "account" && <button className="ph-action inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => { resetPreferences(); toast.success("Preferences reset to defaults."); }} type="button"><RotateCcw aria-hidden="true" size={16} /> Reset to defaults</button>}</div></div><footer className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-slate-600"><Link className="hover:text-emerald-800 hover:underline" to="/privacy-policy">Privacy Policy</Link><Link className="hover:text-emerald-800 hover:underline" to="/terms-of-use">Terms of Use</Link></footer></>}</section></div>;
}
