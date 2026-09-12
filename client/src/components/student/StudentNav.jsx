import {
  Bell,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  UserRound,
} from "lucide-react";
import RoleNav from "../common/RoleNav.jsx";

const links = [
  { to: "/student", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/student/courses", label: "My Courses", Icon: BookOpen },
  { to: "/student/assignments", label: "Assignments", Icon: ClipboardList },
  { to: "/student/announcements", label: "Announcements", Icon: Bell },
  { to: "/student/profile", label: "Profile", Icon: UserRound },
];

export default function StudentNav() {
  return <RoleNav links={links} role="Student" />;
}
