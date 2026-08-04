import { createPortal } from 'react-dom';

export function Modal({ children }) {
  return createPortal(
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto py-6">
      {children}
    </div>,
    document.body
  );
}
