import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { listNotifications, markAllNotificationsRead, markNotificationRead, unreadNotificationCount } from "../controllers/notificationController.js";

const router = Router();
router.use(authenticate);
router.get("/", listNotifications);
router.get("/unread-count", unreadNotificationCount);
router.patch("/:id/read", markNotificationRead);
router.patch("/read-all", markAllNotificationsRead);
export default router;
