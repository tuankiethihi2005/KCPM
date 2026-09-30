const http = require("http");
const fs = require("fs");
const path = require("path");

const issueId = process.argv[2];
if (!issueId) {
  console.error("Vui lòng cung cấp mã kỳ phát hành làm tham số (ví dụ: node scripts/create_csv_for_issue.js TAIL-2026-2308)");
  process.exit(1);
}

function post(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error("Failed to parse response: " + body));
        }
      });
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: "GET",
      headers
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error("Failed to parse response: " + body));
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function run() {
  try {
    console.log("Đang đăng nhập hệ thống...");
    const loginRes = await post("http://localhost:5000/api/auth/login", {
      email: "admin@example.com",
      password: "password123"
    });
    
    const token = loginRes.accessToken || (loginRes.data && loginRes.data.accessToken);
    if (!token) {
      console.error("Đăng nhập thất bại:", loginRes);
      process.exit(1);
    }
    
    console.log("Lấy danh sách các kỳ phát hành...");
    const issuesRes = await get("http://localhost:5000/api/issues", token);
    
    if (!issuesRes || !issuesRes.data) {
      console.error("Không thể lấy danh sách kỳ phát hành:", issuesRes);
      process.exit(1);
    }
    
    const matchedIssue = issuesRes.data.find(issue => issue.custom_id === issueId);
    if (!matchedIssue) {
      console.error(`Không tìm thấy kỳ phát hành với mã: ${issueId}`);
      console.log("Các kỳ phát hành hiện có:", issuesRes.data.map(i => i.custom_id).join(", "));
      process.exit(1);
    }
    
    console.log(`Tìm thấy kỳ phát hành: ${matchedIssue.title} (${matchedIssue.custom_id})`);
    const seriesList = matchedIssue.series_list || [];
    
    if (seriesList.length === 0) {
      console.log(`Cảnh báo: Kỳ phát hành này không có bộ truyện nào.`);
    }
    
    // Tạo nội dung CSV
    let csvContent = "seriesId,votes,avgScore,comments,views\n";
    seriesList.forEach((s, index) => {
      // Tạo dữ liệu ngẫu nhiên nhưng hợp lý và thực tế
      const votes = 500 + Math.floor(Math.random() * 800);
      const avgScore = (7.0 + Math.random() * 2.5).toFixed(1);
      const comments = Math.floor(votes * 0.25);
      const views = votes * 40 + Math.floor(Math.random() * 5000);
      
      const seriesIdVal = s._id || s;
      csvContent += `${seriesIdVal},${votes},${avgScore},${comments},${views}\n`;
      console.log(`- Thêm truyện: ${s.title || seriesIdVal} (ID: ${seriesIdVal})`);
    });
    
    const targetDir = path.join(__dirname, "../../test-data");
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const targetFile = path.join(targetDir, `votes_${issueId}.csv`);
    fs.writeFileSync(targetFile, csvContent, "utf8");
    console.log(`\nĐã tạo thành công file CSV tại: ${targetFile}`);
    console.log("Nội dung file:");
    console.log(csvContent);
    
    process.exit(0);
  } catch (err) {
    console.error("Lỗi:", err.message);
    process.exit(1);
  }
}

run();
