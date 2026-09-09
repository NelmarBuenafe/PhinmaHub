import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorizeRole } from "../middleware/authorizeRole.js";
import {
  changeCourseStatus,
  changeMessageStatus,
  changeUserStatus,
  createAnnouncement,
  createCategory,
  createStudyTool,
  dashboard,
  listAnnouncements,
  listApplications,
  listAuditLogs,
  listCategories,
  listCourses,
  listMessages,
  listStudyTools,
  listUsers,
  inviteUser,
  updateCategory,
  updateStudyTool,
} from "../controllers/adminController.js";

const router = Router();
router.use(authenticate, authorizeRole("admin"));

router.get("/dashboard", dashboard);
router.get("/applications", listApplications);
router.get("/users", listUsers);
router.post("/users/invite", inviteUser);
router.patch("/users/:id/status", changeUserStatus);
router.get("/courses", listCourses);
router.patch("/courses/:id/status", changeCourseStatus);
router.get("/categories", listCategories);
router.post("/categories", createCategory);
router.patch("/categories/:id", updateCategory);
router.get("/announcements", listAnnouncements);
router.post("/announcements", createAnnouncement);
router.get("/study-tools", listStudyTools);
router.post("/study-tools", createStudyTool);
router.patch("/study-tools/:id", updateStudyTool);
router.get("/messages", listMessages);
router.patch("/messages/:id/status", changeMessageStatus);
router.get("/audit-logs", listAuditLogs);

export default router;
