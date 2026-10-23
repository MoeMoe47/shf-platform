import React, { useEffect, useRef } from "react";

export default function FoundationDonationDialog({ content, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!content) return;
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [content]);
  return (
    <dialog
      ref={ref}
      className="shf-donation-dialog"
      aria-labelledby="donation-dialog-title"
      aria-describedby="donation-dialog-description"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <h2 id="donation-dialog-title">{content?.title}</h2>
      <p id="donation-dialog-description">{content?.description}</p>
      <button type="button" autoFocus onClick={onClose}>
        Close and return
      </button>
    </dialog>
  );
}
