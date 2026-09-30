import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import RequirePermission from "../../components/security/RequirePermission";
import PublishScanner from "../../components/publish/PublishScanner/PublishScanner";
import publishChapter from "../../services/publish/publishChapterService";
import getChapterById from "../../services/chapter/getChapterByIdService";
import { useToast } from "../../contexts/ToastContext";
import "./PublishApprovalPage.css";

const SCAN_STEPS = [
  { id: "check_pages", label: "Kiem tra so luong trang truyen" },
  { id: "check_approve", label: "Kiem tra trang thai phe duyet" },
  { id: "check_tasks", label: "Kiem tra tien do cong viec" },
  { id: "check_annotations", label: "Kiem tra annotation" },
];

export default function PublishApprovalPage() {
  const { chapterId } = useParams();
  const toast = useToast();
  const [scanStatus, setScanStatus] = useState("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const [chapterTitle, setChapterTitle] = useState("Đang tải dữ liệu...");
  const [seriesId, setSeriesId] = useState(null);

  useEffect(() => {
    const fetchChapterInfo = async () => {
      const res = await getChapterById(chapterId);
      // Tùy theo cấu trúc API trả về, lấy title tương ứng
      if (res && res.chapter && res.chapter.title) {
        setChapterTitle(res.chapter.title);
        setSeriesId(res.chapter.series_id);
      } else {
        setChapterTitle("Không tìm thấy tên chapter");
      }
    };
    fetchChapterInfo();
  }, [chapterId]);

  const handleStartPublish = async () => {
    setScanStatus("scanning");
    setCurrentStep(0);
    setErrorMessage("");
    const result = await publishChapter(chapterId);
    let failAtStep = -1;
    if (result.success === false) {
      const msg = (result.message || "").toLowerCase();
      if (msg.includes("chua co trang")) failAtStep = 0;
      else if (msg.includes("chua duoc phe duyet")) failAtStep = 1;
      else if (msg.includes("task")) failAtStep = 2;
      else if (msg.includes("annotation")) failAtStep = 3;
      else failAtStep = 0;
    }
    for (let i = 0; i < SCAN_STEPS.length; i += 1) {
      setCurrentStep(i);
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (i === failAtStep) {
        setScanStatus("failed");
        setErrorMessage(result.message);
        toast.error("Xuat ban that bai. Vui long kiem tra dieu kien.");
        return;
      }
    }
    if (result.success === false) {
      setScanStatus("failed");
      setErrorMessage(result.message);
      toast.error("Xuat ban that bai.");
      return;
    }
    setScanStatus("success");
    toast.success("Chapter da duoc xuat ban.");
  };

  return (
    <div className="publish-page-container">
      <header className="publish-page-header">
        {/* Bọc nút quay lại và tiêu đề vào chung 1 hàng */}
        <div className="header-top-row">
          <Link to={`/chapter-list/${seriesId}`} className="publish-back-link">
            ← Quay lại
          </Link>
          <h1 className="publish-title">Trạm xuất bản chapter</h1>
        </div>

        <p className="publish-subtitle">
          Tên Chapter: <span className="publish-badge">{chapterTitle}</span>
        </p>
      </header>

      <PublishScanner
        steps={SCAN_STEPS}
        currentStep={currentStep}
        scanStatus={scanStatus}
        errorMessage={errorMessage}
      />

      <div className="publish-action-area">
        <RequirePermission required="CAN_PUBLISH_CHAPTER">
          <button
            onClick={handleStartPublish}
            disabled={scanStatus === "scanning" || scanStatus === "success"}
            className={`btn-massive-publish state-${scanStatus}`}
          >
            {scanStatus === "scanning"
              ? "DANG XU LY..."
              : scanStatus === "success"
                ? "DA XUAT BAN!"
                : scanStatus === "failed"
                  ? "QUET LAI HE THONG"
                  : "KHOI DONG KIEM TRA"}
          </button>
        </RequirePermission>
        <div className="publish-warning-box">
          <p className="publish-warning-note">
            Hanh dong nay se cong khai chapter den toan bo doc gia!
          </p>
        </div>
      </div>
    </div>
  );
}
