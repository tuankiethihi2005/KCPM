import React from "react";
import { useAuthStore } from "../../stores/authStore";

const PERMISSION_ROLE_MAP = {
  CAN_CREATE_CHAPTER: ["Mangaka", "Admin"],
  CAN_UPLOAD_PAGE: ["Mangaka", "Admin"],
  CAN_UPDATE_VERSION: ["Mangaka", "Admin", "Assistant"],
  CAN_APPROVE_PAGE: ["Tantou Editor", "Admin"],
  CAN_PUBLISH_CHAPTER: ["Tantou Editor", "Admin"],
  CAN_MANAGE_USERS: ["Admin"],
  CAN_MANAGE_RANKING: ["Editorial Board", "Admin"],
  CAN_VIEW_RANKING: ["Editorial Board", "Mangaka", "Tantou Editor", "Admin"],
  CAN_UPDATE_PAGE_STATUS: ["Mangaka", "Tantou Editor", "Admin"],
  CAN_DELETE_RESTORE_CHAPTER_PAGE: ["Mangaka", "Admin"],
  CAN_EDIT_ANNOTATION: ["Tantou Editor", "Admin"],
};

export default function RequirePermission({ required, children }) {
  const user = useAuthStore((state) => state.user);
  const allowedRoles = PERMISSION_ROLE_MAP[required] || [];
  const hasPermission = user && allowedRoles.includes(user.role);

  return hasPermission ? <>{children}</> : null;
}
