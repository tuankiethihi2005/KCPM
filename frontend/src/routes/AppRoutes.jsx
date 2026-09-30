import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "../contexts/ToastContext";
import ProtectedLayout from "../components/auth/ProtectedLayout";
import RequireAuth from "../components/security/RequireAuth";
import ChapterListPage from "../pages/ChapterListPage/ChapterListPage";
import AdminUsersPage from "../pages/AdminUsersPage/AdminUsersPage";
import LoginPage from "../pages/LoginPage/LoginPage";
import PageManagementPage from "../pages/PageManagementPage/PageManagementPage";
import PublishApprovalPage from "../pages/PublishApprovalPage/PublishApprovalPage";
import RankingDashboardPage from "../pages/RankingDashboardPage/RankingDashboardPage";
import DashboardIndex from "../pages/Dashboard/DashboardIndex";
import MangakaSeriesListPage from "../pages/MangakaSeriesListPage/MangakaSeriesListPage";
import MangakaSeriesFormPage from "../pages/MangakaSeriesFormPage/MangakaSeriesFormPage";
import BoardPendingSeriesPage from "../pages/BoardPendingSeriesPage/BoardPendingSeriesPage";
import BoardSeriesReviewPage from "../pages/BoardSeriesReviewPage/BoardSeriesReviewPage";
import BoardAtRiskSeriesPage from "../pages/BoardAtRiskSeriesPage/BoardAtRiskSeriesPage";
import AllSeriesPage from "../pages/AllSeriesPage/AllSeriesPage";
import EditorSeriesPage from "../pages/EditorSeriesPage/EditorSeriesPage";
import PageVersionHistory from "../pages/PageVersionHistory/PageVersionHistory";
import RequireRole from "../components/security/RequireRole";

// Import các trang bị thiếu hoặc mới thêm
import AssistantTasksPage from "../pages/AssistantTasksPage/AssistantTasksPage";
import AssistantIncomePage from "../pages/AssistantIncomePage/AssistantIncomePage";
import MangakaTasksPage from "../pages/MangakaTasksPage/MangakaTasksPage";
import PageWorkspacePage from "../pages/PageWorkspacePage/PageWorkspacePage";
import StudioProgressPage from "../pages/StudioProgressPage/StudioProgressPage";
import EditorFeedbackPage from "../pages/EditorFeedbackPage/EditorFeedbackPage";
import NotificationPage from "../pages/NotificationPage/NotificationPage";

export default function AppRoutes() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <ProtectedLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<DashboardIndex />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/chapter-list" element={<ChapterListPage />} />
          <Route path="/chapter-list/:seriesId" element={<ChapterListPage />} />
          <Route
            path="/page-management/:chapterId"
            element={<PageManagementPage />}
          />
          <Route
            path="/publish-approval/:chapterId"
            element={<PublishApprovalPage />}
          />
          <Route path="/board/releases" element={<RankingDashboardPage />} />
          <Route path="/board/ranking" element={<RankingDashboardPage />} />
          <Route path="/mangaka/ranking" element={<RankingDashboardPage />} />
          <Route path="/editor/ranking" element={<RankingDashboardPage />} />
          <Route path="/admin/releases" element={<RankingDashboardPage />} />
          <Route path="/admin/ranking" element={<RankingDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route
            path="/mangaka/series"
            element={
              <RequireRole allowedRoles={["Mangaka", "Admin"]}>
                <MangakaSeriesListPage />
              </RequireRole>
            }
          />
          <Route
            path="/mangaka/series/new"
            element={
              <RequireRole allowedRoles={["Mangaka", "Admin"]}>
                <MangakaSeriesFormPage />
              </RequireRole>
            }
          />
          <Route
            path="/mangaka/series/:seriesId"
            element={
              <RequireRole allowedRoles={["Mangaka", "Admin"]}>
                <MangakaSeriesFormPage />
              </RequireRole>
            }
          />
          
          {/* Assistant Tasks & Income */}
          <Route
            path="/assistant/tasks"
            element={
              <RequireRole allowedRoles={["Assistant", "Admin"]}>
                <AssistantTasksPage />
              </RequireRole>
            }
          />
          <Route
            path="/assistant/income"
            element={
              <RequireRole allowedRoles={["Assistant", "Admin"]}>
                <AssistantIncomePage />
              </RequireRole>
            }
          />

          {/* Mangaka Tasks */}
          <Route
            path="/mangaka/tasks"
            element={
              <RequireRole allowedRoles={["Mangaka", "Admin"]}>
                <MangakaTasksPage />
              </RequireRole>
            }
          />

          {/* Interactive Workspace (Canvas, Annotations & Region Tasks) */}
          <Route
            path="/workspace/:pageId"
            element={<PageWorkspacePage />}
          />

          {/* Studio Kanban Progress Board */}
          <Route
            path="/editor/progress"
            element={
              <RequireRole allowedRoles={["Tantou Editor", "Mangaka", "Editorial Board", "Admin"]}>
                <StudioProgressPage />
              </RequireRole>
            }
          />
          <Route
            path="/editor/feedbacks"
            element={
              <RequireRole allowedRoles={["Tantou Editor", "Admin"]}>
                <EditorFeedbackPage />
              </RequireRole>
            }
          />

          <Route
            path="/editor/series"
            element={
              <RequireRole allowedRoles={["Tantou Editor"]}>
                <EditorSeriesPage />
              </RequireRole>
            }
          />
          <Route
            path="/board/reviews"
            element={
              <RequireRole allowedRoles={["Editorial Board", "Admin"]}>
                <BoardPendingSeriesPage />
              </RequireRole>
            }
          />
          <Route
            path="/board/series/:seriesId"
            element={
              <RequireRole allowedRoles={["Editorial Board", "Admin"]}>
                <BoardSeriesReviewPage />
              </RequireRole>
            }
          />
          <Route
            path="/board/at-risk"
            element={
              <RequireRole allowedRoles={["Editorial Board", "Admin"]}>
                <BoardAtRiskSeriesPage />
              </RequireRole>
            }
          />
          <Route
            path="/board/all-series"
            element={
              <RequireRole allowedRoles={["Editorial Board", "Admin"]}>
                <AllSeriesPage />
              </RequireRole>
            }
          />
          <Route
            path="/page-history/:pageId"
            element={<PageVersionHistory />}
          />
          <Route
            path="/admin/series"
            element={
              <RequireRole allowedRoles={["Admin"]}>
                <BoardAtRiskSeriesPage />
              </RequireRole>
            }
          />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
