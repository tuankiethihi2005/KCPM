import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Trash, Pencil, Lock, LockOpen } from "lucide-react";
import RequirePermission from "../../components/security/RequirePermission";
import {
  createUser,
  deleteUser,
  listUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus,
} from "../../services/auth/adminUserService";
import { useToast } from "../../contexts/ToastContext";
import Loading from "../../common/Loading/Loading";
import { useAuthStore } from "../../stores/authStore";
import "./AdminUsersPage.css";

const ROLE_OPTIONS = [
  "Mangaka",
  "Assistant",
  "Tantou Editor",
  "Editorial Board",
  "Admin",
];

const STATUS_OPTIONS = ["Active", "Inactive", "Suspended"];

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "Assistant",
  status: "Active",
};

export default function AdminUsersPage() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({ search: "", role: "", status: "" });
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "" });
  const [activeTab, setActiveTab] = useState("list");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const result = await listUsers({
      page: pagination.page,
      limit: pagination.limit,
      ...filters,
    });
    if (result.success === false) {
      toast.error("Không thể tải danh sách user: " + result.message);
      setUsers([]);
    } else {
      setUsers(result.users || []);
      setPagination((prev) => ({ ...prev, ...result.pagination }));
    }
    setIsLoading(false);
  }, [pagination.page, pagination.limit, filters, toast]);

  useEffect(() => {
    if (user?.role === "Admin") {
      fetchUsers();
    }
  }, [fetchUsers, user?.role]);

  if (user?.role !== "Admin") {
    return <Navigate to="/" replace />;
  }

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateEditForm = (field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // ===== CREATE USER =====
  const handleCreateUser = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    const result = await createUser(form);
    if (result.success === false) {
      toast.error("Không thể tạo tài khoản: " + result.message);
    } else {
      toast.success("Da tao tai khoan nhan vien.");
      setForm(initialForm);
      await fetchUsers();
      setActiveTab("list");
    }

    setIsSubmitting(false);
  };

  // ===== UPDATE USER =====
  const handleOpenEdit = (target) => {
    setEditTarget(target);
    setEditForm({ name: target.name, email: target.email, role: target.role });
  };

  const handleUpdateUser = async (event) => {
    event.preventDefault();
    if (!editTarget) return;

    setIsSubmitting(true);
    const result = await updateUser(editTarget.id, editForm);
    if (result.success === false) {
      toast.error("Không thể cập nhật: " + result.message);
    } else {
      toast.success("Đã cập nhật thông tin user.");
      setEditTarget(null);
      await fetchUsers();
    }
    setIsSubmitting(false);
  };

  // ===== UPDATE STATUS (KHÓA/MỞ KHÓA) =====
  const handleUpdateStatus = async (target, newStatus) => {
    const actionText =
      newStatus === "Suspended"
        ? "khóa"
        : newStatus === "Active"
          ? "mở khóa"
          : "vô hiệu hóa";
    const result = await updateUserStatus(target.id, newStatus);
    if (result.success === false) {
      toast.error("Không thể " + actionText + ": " + result.message);
    } else {
      toast.success("Đã " + actionText + " tài khoản.");
      await fetchUsers();
    }
  };

  // ===== DELETE USER =====
  const handleDeleteUser = async (target) => {
    const result = await deleteUser(target.id);
    if (result.success === false) {
      toast.error("Không thể xóa: " + result.message);
    } else {
      toast.success("Đã xóa tài khoản.");
      await fetchUsers();
    }
  };

  // ===== RESET PASSWORD =====
  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (!resetTarget) return;

    setIsSubmitting(true);
    const result = await resetUserPassword(resetTarget.id, newPassword);
    if (result.success === false) {
      toast.error("Không thể reset mật khẩu: " + result.message);
    } else {
      toast.success("Đã reset mật khẩu và thu hồi session hiện tại.");
      setResetTarget(null);
      setNewPassword("");
    }
    setIsSubmitting(false);
  };

  return (
    <RequirePermission required="CAN_MANAGE_USERS">
      <div className="admin-users-page">
        <div className="page-container">
          {isLoading && <Loading text="Đang tải danh sách tài khoản..." />}

          <header className="page-header">
            <h1 className="page-title">Quản lý tài khoản</h1>
            <p className="page-subtitle">
              Tạo, chỉnh sửa, khóa/mở khóa và xóa tài khoản nhân viên.
            </p>
          </header>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`tab-btn ${activeTab === "list" ? "tab-active" : "tab-inactive"}`}
            >
              Danh sách tài khoản
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`tab-btn ${activeTab === "create" ? "tab-active" : "tab-inactive"}`}
            >
              Tạo tài khoản mới
            </button>
          </div>

          <div className="tab-content-area">
            {/* Tab 1: Danh sách tài khoản */}
            {activeTab === "list" && (
              <>
                {/* Filter Bar */}
                <div className="filter-bar">
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    className="filter-input"
                  />
                  <select
                    value={filters.role}
                    onChange={(e) => handleFilterChange("role", e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Tất cả role</option>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                    className="filter-select"
                  >
                    <option value="">Tất cả trạng thái</option>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Table */}
                <section className="table-card">
                  <div className="table-wrapper">
                    <table className="neo-table">
                      <thead>
                        <tr className="tr-head">
                          <Th>Tên</Th>
                          <Th>Email</Th>
                          <Th>Role</Th>
                          <Th>Trạng thái</Th>
                          <Th>Hành động</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="tr-body">
                            <Td>{u.name}</Td>
                            <Td>{u.email}</Td>
                            <Td>{u.role}</Td>
                            <Td>
                              <span
                                className={`status-badge status-${u.status.toLowerCase()}`}
                              >
                                {u.status}
                              </span>
                            </Td>
                            <Td>
                              <div className="action-buttons">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="btn-icon btn-delete"
                                  title="Xóa tài khoản"
                                >
                                  <Trash size={18} strokeWidth={2.5} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(u)}
                                  className="btn-icon btn-edit"
                                  title="Sửa thông tin"
                                >
                                  <Pencil size={18} strokeWidth={2.5} />
                                </button>

                                {u.status === "Active" ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateStatus(u, "Suspended")
                                    }
                                    className="btn-icon btn-suspend"
                                    title="Khóa tài khoản"
                                  >
                                    <Lock size={18} strokeWidth={2.5} />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateStatus(u, "Active")
                                    }
                                    className="btn-icon btn-activate"
                                    title="Mở khóa tài khoản"
                                  >
                                    <LockOpen size={18} strokeWidth={2.5} />
                                  </button>
                                )}
                              </div>
                            </Td>
                          </tr>
                        ))}
                        {!isLoading && users.length === 0 ? (
                          <tr>
                            <Td colSpan={5}>Không có tài khoản nào.</Td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="pagination">
                      <button
                        type="button"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="page-btn"
                      >
                        &lt;
                      </button>
                      <span className="page-info">
                        Trang {pagination.page} / {pagination.totalPages} (
                        {pagination.total} tai khoan)
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="page-btn"
                      >
                        &gt;
                      </button>
                    </div>
                  )}
                </section>
              </>
            )}

            {/* Tab 2: Form Tạo tài khoản */}
            {activeTab === "create" && (
              <form onSubmit={handleCreateUser} className="form-card">
                <h2 className="card-title">Nhap thong tin nhan vien</h2>

                <div className="form-grid">
                  <Field label="Họ tên">
                    <input
                      value={form.name}
                      onChange={(event) =>
                        updateForm("name", event.target.value)
                      }
                      required
                      className="input-field"
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateForm("email", event.target.value)
                      }
                      required
                      className="input-field"
                    />
                  </Field>

                  <Field label="Mật khẩu khởi tạo">
                    <input
                      type="password"
                      value={form.password}
                      onChange={(event) =>
                        updateForm("password", event.target.value)
                      }
                      required
                      minLength={8}
                      className="input-field"
                    />
                  </Field>

                  <Field label="Role">
                    <select
                      value={form.role}
                      onChange={(event) =>
                        updateForm("role", event.target.value)
                      }
                      className="select-field"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Trạng thái">
                    <select
                      value={form.status}
                      onChange={(event) =>
                        updateForm("status", event.target.value)
                      }
                      className="select-field"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Modal Reset Password */}
        {resetTarget ? (
          <div className="modal-overlay">
            <form onSubmit={handleResetPassword} className="modal-card">
              <div className="tape-deco"></div>
              <h2 className="modal-title">Reset mật khẩu</h2>
              <p className="modal-subtitle">Target: {resetTarget.email}</p>

              <Field label="Mật khẩu mới">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength={8}
                  required
                  className="input-field"
                />
              </Field>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setResetTarget(null);
                    setNewPassword("");
                  }}
                  className="btn-cancel"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-confirm"
                >
                  {isSubmitting ? "Dang reset..." : "Reset"}
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {/* Modal Edit User */}
        {editTarget ? (
          <div className="modal-overlay">
            <form onSubmit={handleUpdateUser} className="modal-card">
              <div className="tape-deco"></div>
              <h2 className="modal-title">Cập nhật thông tin user</h2>
              <p className="modal-subtitle">Đang sửa: {editTarget.email}</p>

              <div className="form-grid">
                <Field label="Họ tên">
                  <input
                    value={editForm.name}
                    onChange={(e) => updateEditForm("name", e.target.value)}
                    required
                    className="input-field"
                  />
                </Field>

                <Field label="Email">
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => updateEditForm("email", e.target.value)}
                    required
                    className="input-field"
                  />
                </Field>

                <Field label="Role">
                  <select
                    value={editForm.role}
                    onChange={(e) => updateEditForm("role", e.target.value)}
                    className="select-field"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="btn-cancel"
                >
                  Huy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-confirm"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </RequirePermission>
  );
}

function Field({ label, children }) {
  return (
    <label className="input-group">
      <span className="input-label">{label}</span>
      {children}
    </label>
  );
}

function Th({ children }) {
  return <th className="th-neo">{children}</th>;
}

function Td({ children, colSpan }) {
  return (
    <td colSpan={colSpan} className="td-neo">
      {children}
    </td>
  );
}
