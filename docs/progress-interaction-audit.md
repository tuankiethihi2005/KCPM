# Progress Interaction Audit

This note records manual checks for the editor progress workflow after the
latest frontend and backend merge.

## Scope

- Editor login flow with the seeded Tantou Editor account.
- Assigned series list, search, status filters, and chapter navigation.
- Studio progress filters, dashboard summaries, task cards, and workspace links.
- Task status updates through the progress board.

## Baseline

- Backend runs on port 5000.
- Frontend runs on port 5173.
- Development data is seeded from the in-memory MongoDB fallback.
- The editor account used for local verification is `editor@example.com`.

## Current Result

- Series list loads from the backend.
- Progress board loads series, chapters, annotations, and task counts.
- Workspace links stay inside the authenticated app session.
- Task status changes update both the Kanban columns and dashboard metrics.

## Series Page Checklist

- Open `/editor/series` from the Tantou Editor sidebar.
- Confirm the summary counters render after backend data loads.
- Confirm the list contains the seeded editor series.
- Search by a Vietnamese title fragment such as `Rồng`.
- Clear the search field and confirm the full list returns.
- Apply the `ACTIVE` filter and confirm active series remain visible.
- Open a chapter list from a series card.
- Confirm the chapter list route receives the selected series id.
- Confirm chapter action links render for page management and publish review.
- Return to the series list through navigation without losing auth state.

## Progress Page Checklist

- Open `/editor/progress` from the Tantou Editor sidebar.
- Confirm the series selector lists all editor-visible series.
- Confirm the chapter selector updates when the selected series changes.
- Confirm the default chapter selection shows annotation and task metrics.
- Select `Tất cả các chương` and confirm aggregate metrics do not reset to zero.
- Click `Tải lại dữ liệu` and confirm the selected filters remain stable.
- Open a task `Workspace` link and confirm the workspace route keeps auth state.
- Return to the progress board and confirm the board still renders.

## Status Update Checklist

- Locate a task card with a visible status selector.
- Change a task from a done state to `Đang vẽ`.
- Confirm the task moves to the in-progress column.
- Confirm the dashboard completion percentage and counts update.
- Change the same task back to its original status.
- Confirm the dashboard and columns return to their prior values.

## Follow-Up Notes

- Dashboard counts should be checked after every status update.
- Workspace navigation should remain a client-side route change.
- Mobile layout should be checked when changing the board controls.
- Mongoose deprecation warnings are non-blocking but worth cleaning later.

## Quick Smoke Test

1. Start backend and frontend.
2. Log in as the seeded Tantou Editor user.
3. Open the editor series page and confirm the five seeded series are visible.
4. Open the progress board and switch between at least two series.
5. Change one task status and then restore the original status.
6. Open a workspace link and verify the app does not redirect to login.
7. Confirm there are no new console errors after the route transitions.
