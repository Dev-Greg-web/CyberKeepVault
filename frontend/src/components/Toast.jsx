import { useEffect } from 'react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) {
      return undefined;
    }
    const id = window.setTimeout(onClose, 2600);
    return () => window.clearTimeout(id);
  }, [message, onClose]);

  if (!message) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[70] max-w-sm rounded-lg border border-cyan-400/30 bg-slate-950 px-4 py-3 text-sm font-medium text-cyan-100 shadow-2xl shadow-black/40">
      {message}
    </div>
  );
}

