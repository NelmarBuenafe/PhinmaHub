import {
  BookOpen,
  LayoutDashboard,
  PlusCircle,
  UserRound,
} from "lucide-react";
import RoleNav from "../common/RoleNav.jsx";

const links = [
  { to: "/teacher", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/teacher/courses", label: "My Courses", Icon: BookOpen },
  { to: "/teacher/courses/create", label: "Create Course", Icon: PlusCircle },
  { to: "/teacher/profile", label: "Profile", Icon: UserRound },
];

export default function TeacherNav() {
  return <RoleNav links={links} role="Teacher" />;
}
