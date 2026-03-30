import React, { useEffect } from "react";

/**
 * Simple toast message. Closes automatically after timeout.
 */
export default function Toast({ kind = "ok", title, message, onClose, timeoutMs = 3500 }) {
  useEffect(() => {
    if (!onClose) return undefined;
    const t = setTimeout(() => onClose(), timeoutMs);
    return () => clearTimeout(t);
  }, [onClose, timeoutMs]);

  if (!title && !message) return null;

  return (
    <div className={`toast ${kind === "error" ? "toastErr" : "toastOk"}`} role="status" aria-live="polite">
      <div>
        <p className="toastTitle">{title || (kind === "error" ? "Error" : "OK")}</p>
        <p className="toastMsg">{message}</p>
      </div>
      <div className="spacer" />
      {onClose ? (
        <button className="btn btnSmall btnGhost" onClick={onClose} aria-label="Close message">
          Close
        </button>
      ) : null}
    </div>
  );
}
