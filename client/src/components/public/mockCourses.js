import {
  Braces,
  Code2,
  Database,
  FileCode2,
  Palette,
  Terminal,
} from "lucide-react";

export const courses = [
  {
    title: "Introduction to HTML",
    category: "Web basics",
    description: "Build accessible page structures with modern semantic HTML.",
    difficulty: "Beginner",
    lessons: 10,
    teacher: "Faculty instructor",
    icon: FileCode2,
    visual: "bg-orange-50 text-orange-700",
  },
  {
    title: "CSS Fundamentals",
    category: "Web design",
    description:
      "Turn structured pages into responsive and polished experiences.",
    difficulty: "Beginner",
    lessons: 12,
    teacher: "Faculty instructor",
    icon: Palette,
    visual: "bg-blue-50 text-blue-700",
  },
  {
    title: "JavaScript Essentials",
    category: "Programming",
    description:
      "Learn core JavaScript concepts through practical browser activities.",
    difficulty: "Intermediate",
    lessons: 14,
    teacher: "Faculty instructor",
    icon: Braces,
    visual: "bg-yellow-50 text-yellow-700",
  },
  {
    title: "Python Programming",
    category: "Programming",
    description:
      "Develop problem-solving skills with readable Python programs.",
    difficulty: "Beginner",
    lessons: 16,
    teacher: "Faculty instructor",
    icon: Terminal,
    visual: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Database Fundamentals",
    category: "Data",
    description:
      "Understand relational data, SQL queries and sound database design.",
    difficulty: "Intermediate",
    lessons: 11,
    teacher: "Faculty instructor",
    icon: Database,
    visual: "bg-violet-50 text-violet-700",
  },
  {
    title: "Web Development",
    category: "Full stack",
    description:
      "Connect frontend foundations in a guided end-to-end web project.",
    difficulty: "Intermediate",
    lessons: 18,
    teacher: "Faculty instructor",
    icon: Code2,
    visual: "bg-cyan-50 text-cyan-700",
  },
];
