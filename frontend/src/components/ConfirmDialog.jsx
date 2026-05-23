export default function ConfirmDialog({ title, body, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-950 p-5 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onCancel} className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-400 hover:text-white">
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            className="h-10 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-400"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

