import RoleNav from "../common/RoleNav.jsx";

const links = [
  { to: "/student", label: "Dashboard", end: true },
  { to: "/student/courses", label: "My Courses" },
  { to: "/student/assignments", label: "Assignments" },
];

export default function StudentNav() {
  return <RoleNav links={links} role="Student" />;
}
