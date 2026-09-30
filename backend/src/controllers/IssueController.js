const RankingService = require("../services/RankingService");
const ReleaseIssue = require("../models/ReleaseIssueModel");
const xlsx = require('xlsx');

const getReleaseIssues = async (req, res) => {
    try {
        const issues = await ReleaseIssue.find({}).populate("series_list");
        res.status(200).json({ success: true, data: issues });
    } catch (error) {
        res.status(500).json({ error: "Lỗi hệ thống khi lấy danh sách kỳ phát hành: " + error.message });
    }
};

// Tạo Kỳ phát hành mới kèm Validate đầu vào
const createReleaseIssue = async (req, res) => {
    try {
        const { id, name, releaseDate, seriesList, type } = req.body;

        // Kiểm tra dữ liệu: Không trùng kỳ
        const isDuplicate = await ReleaseIssue.findOne({
            $or: [{ custom_id: id }, { title: name }]
        });
        if (isDuplicate) {
            return res.status(400).json({ error: "Kỳ phát hành hoặc tên kỳ này đã tồn tại!" });
        }

        // Giải quyết seriesList thành ObjectIds
        const resolvedSeriesIds = [];
        for (const sId of (seriesList || [])) {
            const objId = await RankingService.resolveSeriesId(sId);
            if (objId) {
                resolvedSeriesIds.push(objId);
            }
        }

        const newIssue = await ReleaseIssue.create({
            custom_id: id,
            title: name,
            release_date: new Date(releaseDate),
            type,
            series_list: resolvedSeriesIds,
            status: "Planned"
        });

        res.status(201).json({
            message: "Tạo kỳ phát hành thành công!",
            data: {
                id: newIssue.custom_id,
                name: newIssue.title,
                releaseDate: newIssue.release_date,
                type: newIssue.type,
                status: newIssue.status
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Lỗi hệ thống khi tạo kỳ phát hành: " + error.message });
    }
};

const importVoteData = async (req, res) => {
    const { issueId } = req.params;
    if (!req.file) {
        return res.status(400).json({ error: "Vui lòng đính kèm file Excel hoặc CSV mẫu." });
    }

    try {
        // 1. Kiểm tra kỳ phát hành tồn tại
        const issue = await ReleaseIssue.findOne({ custom_id: issueId }).populate("series_list");
        if (!issue) {
            return res.status(404).json({ error: `Không tìm thấy kỳ phát hành với mã: ${issueId}` });
        }

        // Lấy danh sách ID các bộ truyện được lên kế hoạch trong kỳ phát hành này
        const plannedSeriesIds = issue.series_list.map(s => s._id.toString());

        // 2. Đọc dữ liệu từ file
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Kiểm tra các cột bắt buộc
        const headers = xlsx.utils.sheet_to_json(sheet, { header: 1 })[0] || [];
        const requiredHeaders = ["seriesId", "votes", "avgScore"];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
            return res.status(400).json({ 
                error: `Cấu trúc file CSV không hợp lệ. Thiếu các cột bắt buộc: ${missingHeaders.join(", ")}` 
            });
        }

        const rawData = xlsx.utils.sheet_to_json(sheet);
        if (rawData.length === 0) {
            return res.status(400).json({ error: "File CSV không chứa dòng dữ liệu nào." });
        }

        const seriesStore = await RankingService.getSeriesStore();
        const validVotes = [];
        const csvSeriesIds = new Set();

        // 3. Kiểm tra chi tiết từng dòng trong file CSV
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const rowNum = i + 2; // Dòng 1 là tiêu đề, data bắt đầu từ dòng 2

            if (!row.seriesId) {
                return res.status(400).json({ 
                    error: `Lỗi dòng ${rowNum}: Cột 'seriesId' không được để trống.` 
                });
            }

            // Tìm kiếm series tương ứng trong DB
            const matchedSeries = seriesStore.find(s => 
                s.id === row.seriesId || 
                (s.slug && s.slug.toLowerCase() === row.seriesId.toString().toLowerCase()) ||
                (s.name && s.name.toLowerCase() === row.seriesId.toString().toLowerCase())
            );

            if (!matchedSeries) {
                return res.status(400).json({ 
                    error: `Lỗi dòng ${rowNum}: Không tìm thấy bộ truyện có mã/tên '${row.seriesId}' trong hệ thống.` 
                });
            }

            // Kiểm tra số phiếu (votes)
            const votes = parseInt(row.votes);
            if (isNaN(votes) || votes < 0) {
                return res.status(400).json({ 
                    error: `Lỗi dòng ${rowNum}: Số phiếu bầu 'votes' phải là số nguyên không âm (nhận được: '${row.votes}').` 
                });
            }

            // Kiểm tra điểm số trung bình (avgScore)
            const avgScore = parseFloat(row.avgScore);
            if (isNaN(avgScore) || avgScore < 0 || avgScore > 10) {
                return res.status(400).json({ 
                    error: `Lỗi dòng ${rowNum}: Điểm trung bình 'avgScore' phải là số từ 0 đến 10 (nhận được: '${row.avgScore}').` 
                });
            }

            const seriesIdStr = matchedSeries.id;
            csvSeriesIds.add(seriesIdStr);

            validVotes.push({
                seriesId: seriesIdStr,
                votes: votes,
                avgScore: avgScore,
                comments: parseInt(row.comments || 0),
                views: parseInt(row.views || 0)
            });
        }

        // 4. Kiểm tra số lượng truyện có khớp với kỳ phát hành hay không
        if (csvSeriesIds.size !== plannedSeriesIds.length) {
            return res.status(400).json({
                error: `Số lượng bộ truyện trong file CSV (${csvSeriesIds.size} bộ) không khớp với số lượng được lên kế hoạch của kỳ phát hành này (${plannedSeriesIds.length} bộ).`
            });
        }

        // 5. Kiểm tra tính trùng khớp của danh sách truyện
        for (const id of csvSeriesIds) {
            if (!plannedSeriesIds.includes(id)) {
                const nonPlannedSeries = seriesStore.find(s => s.id === id);
                return res.status(400).json({
                    error: `Bộ truyện '${nonPlannedSeries ? nonPlannedSeries.name : id}' không nằm trong kế hoạch phát hành của kỳ này.`
                });
            }
        }

        // Thực thi thuật toán xếp hạng và lưu DB
        const result = await RankingService.calculateRankingAndTrends(issueId, validVotes);
        
        // Trả về kết quả sau cùng
        res.status(200).json({ message: "Import dữ liệu độc giả và xử lý xếp hạng thành công!", data: result });
    } catch (error) {
        res.status(500).json({ error: "Lỗi hệ thống khi đọc cấu trúc file hoặc xử lý xếp hạng: " + error.message });
    }
};

module.exports = { getReleaseIssues, createReleaseIssue, importVoteData };
