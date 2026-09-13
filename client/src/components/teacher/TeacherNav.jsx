import RoleNav from "../common/RoleNav.jsx";

const links = [
  { to: "/teacher", label: "Dashboard", end: true },
  { to: "/teacher/courses", label: "My Courses" },
  { to: "/teacher/courses/create", label: "Create Course" },
];

export default function TeacherNav() {
  return <RoleNav links={links} role="Teacher" />;
}
