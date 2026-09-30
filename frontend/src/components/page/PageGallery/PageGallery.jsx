import React from "react";
import PageItemCard from "../PageItemCard/PageItemCard";
import "./PageGallery.css";

export default function PageGallery({
  pages,
  isTrashView,
  onDelete,
  onRestore,
  ...props
}) {
  if (pages.length === 0) {
    return (
      <div className="pg-empty-state">
        {isTrashView ? "THÙNG RÁC TRỐNG RỖNG!" : "CHƯA CÓ TRANG NÀO!"}
      </div>
    );
  }

  return (
    <div className="pg-grid-container">
      {pages.map((page, index) => (
        <PageItemCard
          key={page._id}
          page={page}
          displayPageNumber={
            isTrashView ? `Cũ: ${page.page_number}` : index + 1
          }
          isTrashView={isTrashView}
          onDelete={onDelete}
          onRestore={onRestore}
          {...props}
        />
      ))}
    </div>
  );
}
