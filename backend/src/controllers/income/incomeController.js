const AssistantIncome = require("../../models/AssistantIncomeModel");

exports.getAssistantIncome = async (req, res) => {
  try {
    const assistantId = req.user.id;

    // Fetch income details populated with task information
    const incomeRecords = await AssistantIncome.find({ assistant_id: assistantId })
      .populate({
        path: "task_id",
        select: "task_type price deadline status page_id",
        populate: {
          path: "page_id",
          select: "page_number chapter_id",
          populate: {
            path: "chapter_id",
            select: "title series_id",
            populate: {
              path: "series_id",
              select: "title"
            }
          }
        }
      })
      .sort({ createdAt: -1 });

    // Calculate aggregated statistics
    let totalEarned = 0;
    let pendingAmount = 0;
    let paidAmount = 0;
    let approvedTasksCount = 0;

    incomeRecords.forEach((record) => {
      // Amount is added if it's approved or paid
      if (record.status === "Approved" || record.status === "Paid") {
        totalEarned += record.amount;
      }
      
      if (record.status === "Paid") {
        paidAmount += record.amount;
      } else if (record.status === "Approved" || record.status === "Pending") {
        pendingAmount += record.amount;
      }

      if (record.status === "Approved" || record.status === "Paid") {
        approvedTasksCount += 1;
      }
    });

    return res.status(200).json({
      success: true,
      statistics: {
        totalEarned,
        pendingAmount,
        paidAmount,
        approvedTasksCount,
        totalTasksCount: incomeRecords.length
      },
      records: incomeRecords
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
  }
};
