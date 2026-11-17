import React from "react";
import "./ConfirmActionModal.css"
import Loading from "../Loading/Loading";

const VARIANT_CLASSES = {
    primary: "btn-primary",
    success: "btn-success",
    warning: "btn-warning",
    danger: "btn-danger"
};

export default function ConfirmActionModal({
    isOpen,
    title,
    message,
    confirmText = "Xác nhận",
    cancleText = "Hủy",
    variant = "primary",
    isLoading = false,
    onConfirm,
    onClose
}) {
    if (!isOpen) return null;

    const variantClass = VARIANT_CLASSES[variant];

    return (
        <div
            className="overlay" onClick={!isLoading ? onClose : undefined}>
            <div
                className="dialog"
                onClick={(e) => e.stopPropagation}>
                <div className="header">
                    <h3 className="title">{title}</h3>
                </div>
                <p className="message">{message}</p>

                <div className="actions">
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onClose}
                        className="btn btn-cancle"
                    >{cancleText}</button>

                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onConfirm}
                        className={`btn ${variantClass}`}
                    >
                        {isLoading ? <Loading /> : confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}