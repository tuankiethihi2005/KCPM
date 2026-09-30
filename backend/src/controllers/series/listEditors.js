const User = require("../../models/UserModel");
const { ROLES } = require("../../constants/roles");

// Liệt kê các Tantou Editor đang hoạt động để Mangaka chọn người phụ trách.
exports.listEditors = async (req, res) => {
  try {
    const editors = await User.find({
      role: ROLES.TANTOU_EDITOR,
      status: "Active",
    })
      .select("name email")
      .sort({ name: 1 });

    return res.status(200).json({ editors });
  } catch (err) {
    return res.status(500).json({ error: "Lỗi server", details: err.message });
  }
};
