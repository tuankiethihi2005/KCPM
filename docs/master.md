MANGA EDITORIAL & PRODUCTION
MANAGEMENT SYSTEM
Hồ sơ triển khai project: chức năng, role, workflow và MVP


Thông tin	Nội dung
Tên tiếng Việt	Hệ thống quản lý sáng tác, sản xuất, biên tập và xếp hạng manga
Loại dự án	Web/App quản lý quy trình sản xuất và xuất bản manga
Đối tượng sử dụng	Mangaka, Assistant, Tantou Editor, Editorial Board, Admin
Mục tiêu	Tập trung hóa quy trình từ đề xuất series đến xuất bản, xếp hạng và quyết định tiếp tục/huỷ series



1. Tổng quan dự án
Dự án xây dựng một hệ thống quản lý toàn bộ vòng đời của một series manga: từ lúc Mangaka tạo hồ sơ series mới, nộp bản thảo sơ bộ, hội đồng xét duyệt, sản xuất chapter, phân công trợ lý, biên tập bản thảo, xuất bản, nhập dữ liệu bình chọn độc giả, tổng hợp bảng xếp hạng và đưa ra quyết định tiếp tục hoặc huỷ series.
Hệ thống giúp thay thế quy trình làm việc rời rạc qua email, tin nhắn và file lẻ bằng một nền tảng cộng tác có phân quyền, quản lý version, comment trực tiếp trên trang truyện và dashboard theo dõi tiến độ.
1.1. Mục tiêu chính
Quản lý hồ sơ series và quy trình duyệt series mới.
Hỗ trợ Mangaka phân vùng trực tiếp trên trang truyện và giao việc cho Assistant.
Cho phép Assistant nhận việc, tải tài nguyên, nộp kết quả và theo dõi thu nhập.
Cho phép Tantou Editor đánh dấu, góp ý và theo dõi tiến độ studio theo thời gian thực.
Cho phép Editorial Board nhập dữ liệu bình chọn, xem bảng xếp hạng và ra quyết định xuất bản.
Tùy chọn tích hợp AI để tô màu hoặc hỗ trợ phân đoạn vùng trên trang truyện.
2. Các role trong hệ thống
Role	Chú thích	Nhiệm vụ chính
Mangaka	Tác giả chính của series manga.	Tạo hồ sơ series, nộp bản thảo, upload trang, giao task, duyệt kết quả, xem xếp hạng và cảnh báo nguy cơ huỷ.
Assistant	Trợ lý sản xuất/vẽ kỹ thuật.	Nhận task, tải file/tài nguyên, hoàn thiện phần việc, upload kết quả, theo dõi số task được duyệt và thu nhập.
Tantou Editor	Biên tập viên phụ trách series.	Xem bản thảo, annotation trực tiếp, yêu cầu sửa nội dung/thoại/kịch bản, theo dõi tiến độ và chuẩn bị hồ sơ bảo vệ series.
Editorial Board	Hội đồng biên tập/quản lý xuất bản.	Duyệt series mới, quyết định lịch xuất bản, nhập bình chọn, xem ranking, quyết định tiếp tục/huỷ/đổi lịch.
Admin	Quản trị hệ thống.	Quản lý tài khoản, role, loại task, đơn giá, kỳ phát hành, cấu hình AI và log hệ thống.

3. Danh sách module và chức năng cần làm
Module 1: Đăng nhập, đăng ký và phân quyền
Chức năng cần làm:
Đăng nhập bằng email/mật khẩu.
Đăng xuất, quên mật khẩu, đổi mật khẩu.
Quản lý session/token.
Phân quyền theo role: Mangaka, Assistant, Tantou Editor, Editorial Board, Admin.
Chú thích role: Tất cả role dùng; Admin quản lý tài khoản và quyền.
Module 2: Quản lý hồ sơ series manga
Chức năng cần làm:
Tạo hồ sơ series: tên, tác giả, thể loại, đối tượng độc giả, mô tả, nhân vật, phong cách hình ảnh.
Upload bản thảo sơ bộ, cover/concept art.
Lưu trạng thái: Draft, Submitted, Under Review, Approved, Rejected, Need Revision.
Mangaka nộp hồ sơ lên hội đồng và xem trạng thái xét duyệt.
Chú thích role: Mangaka tạo/nộp; Tantou Editor hỗ trợ; Editorial Board đánh giá; Assistant không truy cập.
Module 3: Duyệt series mới
Chức năng cần làm:
Danh sách series chờ duyệt.
Xem chi tiết hồ sơ và bản thảo sơ bộ.
Editorial Board bỏ phiếu Approve, Reject hoặc Need Revision.
Hệ thống tổng hợp phiếu và cập nhật trạng thái.
Chọn lịch xuất bản: weekly, monthly, one-shot, online only.
Chú thích role: Editorial Board quyết định; Mangaka và Tantou Editor xem kết quả.
Module 4: Quản lý chapter và trang truyện
Chức năng cần làm:
Mangaka tạo chapter mới: series, số chương, tên chương, deadline, trạng thái.
Upload nhiều trang truyện cho một chapter.
Cập nhật version khi upload mới.
Theo dõi trạng thái chapter: Draft, In Production, Waiting Review, Approved, Published.
Chú thích role: Mangaka quản lý; Assistant xem trang được giao; Editor review; Board xem tổng hợp khi cần.
Module 5: Phân vùng trang truyện và giao việc
Chức năng cần làm:
Công cụ chọn vùng: rectangle, polygon, free draw, panel, background, SFX, bóng đổ.
Tạo task theo vùng: loại công việc, người nhận, deadline, tài nguyên, ghi chú, mức giá.
Giao task cho Assistant và gửi thông báo.
Theo dõi trạng thái task: Assigned, In Progress, Submitted, Approved, Revision Requested, Rejected, Paid.
Chú thích role: Mangaka chọn vùng/giao việc; Assistant nhận việc; Editor theo dõi tiến độ.
Module 6: Dashboard công việc của Assistant
Chức năng cần làm:
Xem danh sách task được giao theo series/chapter/page.
Tải file gốc, vùng được giao, brush, texture, reference, bảng màu.
Upload kết quả: preview, source file, layer, ghi chú.
Nhận yêu cầu chỉnh sửa và deadline sửa.
Xem số task được duyệt và thu nhập theo tháng.
Chú thích role: Assistant sử dụng chính; Mangaka kiểm duyệt; Admin cấu hình đơn giá.
Module 7: Review và phê duyệt kết quả Assistant
Chức năng cần làm:
Xem bản tổng hợp trước/sau.
Approve, Request Revision hoặc Reject.
Comment trực tiếp trên vùng cần sửa.
Khi approve: cập nhật version trang và ghi nhận thu nhập Assistant.
Khi yêu cầu sửa: chuyển task về Revision Requested và thông báo Assistant.
Chú thích role: Mangaka phê duyệt; Assistant chỉnh sửa; Editor có thể xem lịch sử.
Module 8: Công cụ biên tập của Tantou Editor
Chức năng cần làm:
Xem series/chapter/page và lịch sử version.
Annotation trực tiếp trên trang truyện.
Phân loại feedback: nội dung, kịch bản, thoại, nhịp truyện, bố cục, biểu cảm, logic hành động.
Yêu cầu chỉnh sửa và theo dõi trạng thái feedback: Open, In Progress, Resolved, Reopened.
Theo dõi tiến độ studio, số trang hoàn thành, task trễ deadline.
Chú thích role: Tantou Editor là người dùng chính; Mangaka xử lý feedback; Board xem báo cáo khi cần.
Module 9: Quản lý deadline và tiến độ sản xuất
Chức năng cần làm:
Timeline sản xuất theo series/chapter/page/task/người phụ trách.
Kanban board: To Do, In Progress, Submitted, Need Revision, Approved, Ready for Publish.
Cảnh báo task sắp đến hạn, quá hạn, chapter có nguy cơ trễ.
Báo cáo % hoàn thành, số trang đã duyệt, số task trễ và dự đoán kịp deadline.
Chú thích role: Mangaka, Assistant, Editor và Board xem theo phạm vi quyền.
Module 10: Xuất bản chapter
Chức năng cần làm:
Kiểm tra điều kiện xuất bản: trang hoàn thành, task duyệt, feedback xử lý, bản cuối xác nhận.
Chuyển trạng thái chapter sang Published.
Lưu ngày phát hành, kỳ phát hành, hình thức phát hành, file bản cuối, người duyệt cuối.
Chú thích role: Mangaka xác nhận bản cuối; Editor duyệt trước xuất bản; Board theo dõi lịch.
Module 11: Nhập dữ liệu bình chọn độc giả
Chức năng cần làm:
Tạo kỳ phát hành: tên kỳ, ngày phát hành, danh sách series, loại kỳ.
Nhập dữ liệu: số phiếu, điểm trung bình, thứ hạng, lượt đọc, bình luận.
Hỗ trợ nhập tay hoặc import CSV/Excel.
Kiểm tra dữ liệu: không trùng kỳ, series/chapter hợp lệ, số phiếu hợp lệ.
Chú thích role: Editorial Board nhập và xác nhận; Mangaka/Editor xem theo phạm vi.
Module 12: Bảng xếp hạng series
Chức năng cần làm:
Hiển thị hạng hiện tại, hạng kỳ trước, tăng/giảm, số phiếu, điểm, lượt đọc, xu hướng.
Lọc theo kỳ phát hành, tháng, thể loại, lịch xuất bản, tác giả, trạng thái.
Biểu đồ hiệu suất theo thời gian.
Cảnh báo nguy cơ huỷ nếu xếp hạng thấp hoặc giảm liên tục.
Chú thích role: Mangaka xem series của mình; Editor xem series phụ trách; Board/Admin xem toàn bộ.
Module 13: Quyết định tiếp tục, huỷ hoặc đổi lịch
Chức năng cần làm:
Danh sách series có nguy cơ.
Hồ sơ quyết định gồm ranking, bình chọn, lịch sử xuất bản, nhận xét Editor, phản hồi Mangaka.
Board voting: Continue, Cancel, Hiatus, Change Schedule, Online Only, Need Improvement Plan.
Cập nhật trạng thái: Active, At Risk, Hiatus, Cancelled, Completed, Changed Schedule.
Chú thích role: Editorial Board quyết định; Tantou Editor chuẩn bị hồ sơ; Mangaka xem kết quả.
Module 14: Quản lý thu nhập Assistant
Chức năng cần làm:
Ghi nhận công việc được duyệt sau khi Mangaka approve task.
Assistant xem tổng task, tổng tiền tháng, chờ thanh toán, đã thanh toán.
Admin cấu hình đơn giá theo loại task, độ khó, số trang hoặc từng Assistant.
Trạng thái thanh toán: Pending, Approved, Paid, Cancelled.
Chú thích role: Assistant xem thu nhập cá nhân; Admin quản lý đơn giá/thanh toán.
Module 15: Thông báo hệ thống
Chức năng cần làm:
Thông báo series được duyệt/từ chối, task mới, task sắp hạn, yêu cầu sửa, task được duyệt.
Thông báo chapter sắp deadline, series tụt hạng, kỳ phát hành cần nhập dữ liệu.
Kênh thông báo: trong hệ thống, email, push notification nếu có app mobile.
Chú thích role: Tất cả role nhận thông báo theo quyền và trách nhiệm.
Module 16: Tích hợp AI tùy chọn
Chức năng cần làm:
AI tự động tô màu trang truyện từ bản trắng đen, bảng màu và style mẫu.
AI hỗ trợ phân đoạn vùng: panel, nhân vật, background, SFX, speech bubble, bóng, hiệu ứng.
Mangaka chỉnh lại vùng AI đề xuất trước khi giao task.
Admin cấu hình model AI và giới hạn sử dụng.
Chú thích role: AI hỗ trợ, không thay thế quyền duyệt cuối của Mangaka/Editor/Board.
4. Ma trận phân quyền tổng quát
Chức năng	Mangaka	Assistant	Tantou Editor	Editorial Board	Admin
Tạo hồ sơ series	Có	Không	Hỗ trợ	Không	Có
Nộp series xét duyệt	Có	Không	Không	Không	Có
Duyệt series	Không	Không	Góp ý	Có	Có
Tạo chapter	Có	Không	Xem	Không	Có
Upload trang truyện	Có	Theo task	Xem	Không	Có
Giao task	Có	Không	Không	Không	Có
Nhận task	Không	Có	Không	Không	Không
Review task Assistant	Có	Không	Xem	Không	Có
Comment bản thảo	Có	Theo task	Có	Xem	Có
Nhập bình chọn	Không	Không	Không	Có	Có
Xem bảng xếp hạng	Series của mình	Không	Series phụ trách	Toàn bộ	Toàn bộ
Huỷ series	Không	Không	Đề xuất	Có	Có
Xem thu nhập Assistant	Không	Cá nhân	Không	Không	Có
Quản lý user	Không	Không	Không	Không	Có

5. Luồng nghiệp vụ chính
Flow 1: Duyệt series mới
1.Mangaka tạo hồ sơ series.
2.Mangaka upload bản thảo sơ bộ.
3.Mangaka gửi hồ sơ lên hội đồng.
4.Editorial Board xem hồ sơ và bỏ phiếu.
5.Hệ thống tổng hợp kết quả.
6.Nếu được duyệt, Board chọn lịch xuất bản.
7.Mangaka nhận thông báo kết quả.
Flow 2: Sản xuất một chapter
8.Mangaka tạo chapter mới.
9.Mangaka upload trang truyện.
10.Mangaka chọn vùng trên từng trang.
11.Mangaka giao task cho Assistant.
12.Assistant tải file, xử lý và upload kết quả.
13.Mangaka review, approve hoặc yêu cầu sửa.
14.Editor review nội dung.
15.Chapter được duyệt cuối và sẵn sàng xuất bản.
Flow 3: Biên tập bản thảo
16.Tantou Editor mở chapter cần review.
17.Editor đánh dấu trực tiếp trên trang.
18.Editor ghi chú lỗi hoặc đề xuất chỉnh sửa.
19.Mangaka xử lý feedback.
20.Editor xác nhận đã xử lý.
21.Chapter chuyển sang bước xuất bản.
Flow 4: Xếp hạng sau phát hành
22.Chapter được xuất bản.
23.Editorial Board tạo kỳ phát hành.
24.Board nhập dữ liệu bình chọn độc giả.
25.Hệ thống tính bảng xếp hạng.
26.Mangaka và Editor xem hiệu suất.
27.Nếu series xếp hạng thấp, hệ thống cảnh báo.
28.Board xem xét tiếp tục, đổi lịch hoặc huỷ.
6. Danh sách màn hình cần làm
Nhóm màn hình	Màn hình/chức năng
Chung	Login, Register nếu cần, Forgot Password, Dashboard theo role, Notification Center, Profile Settings
Mangaka	Dashboard, danh sách series, tạo hồ sơ, chi tiết series, tạo chapter, upload trang, giao task, review task, feedback Editor, ranking series của tôi
Assistant	Dashboard, danh sách task, chi tiết task, download tài nguyên, upload kết quả, yêu cầu chỉnh sửa, thu nhập theo tháng
Tantou Editor	Dashboard, series phụ trách, xem bản thảo/chapter, annotation, quản lý feedback, tiến độ studio, hồ sơ bảo vệ series
Editorial Board	Dashboard, series chờ duyệt, bỏ phiếu, chọn lịch xuất bản, tạo kỳ phát hành, nhập bình chọn, ranking, quyết định huỷ/đổi lịch
Admin	Quản lý user, role, series, loại task, đơn giá Assistant, kỳ phát hành, cấu hình AI, system logs

7. Entity/database chính
Entity	Trường dữ liệu đề xuất
User	id, name, email, password, role, avatar, status, created_at, updated_at
Series	id, title, description, genre, target_audience, author_id, editor_id, status, approved_schedule, risk_status
SeriesProposal	id, series_id, summary, characters, art_style, manuscript_file, cover_image, status, submitted_at
BoardVote	id, series_id, board_member_id, vote, comment, created_at
Chapter	id, series_id, chapter_number, title, status, deadline, published_at
Page	id, chapter_id, page_number, file_url, version, status
PageRegion	id, page_id, coordinates, region_type, created_by
Task	id, page_id, region_id, assigned_to, assigned_by, task_type, description, deadline, status, price
TaskSubmission	id, task_id, submitted_by, file_url, note, status, submitted_at
Annotation	id, page_id, created_by, role, coordinates, comment, category, status
ReleaseIssue	id, title, release_date, type, status
ReaderVote	id, release_issue_id, series_id, chapter_id, vote_count, average_score, rank, reader_comments
Ranking	id, release_issue_id, series_id, rank, previous_rank, score, trend
AssistantIncome	id, assistant_id, task_id, amount, month, status
Notification	id, user_id, title, message, type, is_read, created_at

8. Lộ trình MVP đề xuất
Giai đoạn	Phạm vi triển khai
Phase 1: Core system	Đăng nhập/phân quyền, quản lý user, tạo hồ sơ series, nộp xét duyệt, Board duyệt series, tạo chapter, upload trang truyện.
Phase 2: Production workflow	Chọn vùng trên trang, giao task, Assistant nhận task, upload kết quả, Mangaka review/approve, theo dõi tiến độ chapter.
Phase 3: Editorial & ranking	Editor comment trực tiếp trên trang, nhập bình chọn, tạo bảng xếp hạng, cảnh báo nguy cơ huỷ, Board ra quyết định.
Phase 4: Advanced	Quản lý thu nhập Assistant, biểu đồ hiệu suất, AI phân vùng, AI tô màu, import CSV/Excel, mobile notification.

9. Kết luận
Project này phù hợp để triển khai thành một hệ thống web quản lý studio manga hoặc đồ án tốt nghiệp. Điểm mạnh của hệ thống là kết hợp quản lý quy trình sản xuất, cộng tác trực quan trên trang truyện, biên tập nội dung, theo dõi dữ liệu độc giả và ra quyết định xuất bản dựa trên số liệu.
Trong bản MVP, nên ưu tiên quy trình cốt lõi: tạo hồ sơ series, duyệt series, quản lý chapter/trang, giao task theo vùng, Assistant nộp kết quả và Mangaka phê duyệt. Các phần ranking, quyết định huỷ series và AI có thể triển khai ở các giai đoạn sau.