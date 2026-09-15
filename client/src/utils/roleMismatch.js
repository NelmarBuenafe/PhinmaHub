const ROLE_LABELS = {
  admin: "Administrator",
  student: "Student",
  teacher: "Teacher",
};

export function getRoleMismatchDetails(actualRole, intendedRole) {
  const label = ROLE_LABELS[actualRole];
  const intendedLabel = ROLE_LABELS[intendedRole];
  if (!label || !intendedLabel || actualRole === intendedRole) return null;
  return {
    destination: `/auth/${actualRole}`,
    label,
    message: `This account is registered as a ${label}, but you're signing in through the ${intendedLabel} portal. Use the ${label} portal to continue.`,
  };
}
