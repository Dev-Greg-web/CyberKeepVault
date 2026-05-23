import { useState } from 'react';
import { Copy, Eye, EyeOff, Globe2, KeyRound, Pencil, TerminalSquare, Trash2, UserRound } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function ItemCard({ item, onCopy, onEdit, onDelete }) {
  const [visible, setVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isPassword = item.type === 'password';

  return (
    <>
      <article className="rounded-lg border border-slate-800 bg-slate-900/70 p-5 transition hover:border-slate-700">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              {isPassword ? <KeyRound className="size-5 text-amber-300" /> : <TerminalSquare className="size-5 text-emerald-300" />}
              <span className="rounded-md border border-slate-700 px-2 py-0.5 text-xs uppercase tracking-[0.14em] text-slate-400">
                {isPassword ? 'Hasło' : 'Prompt'}
              </span>
            </div>
            <h3 className="truncate text-lg font-semibold text-white">{item.title}</h3>
          </div>

          <div className="flex shrink-0 gap-2">
            <IconButton title="Edytuj" onClick={onEdit} icon={Pencil} />
            <IconButton title="Usuń" onClick={() => setConfirmDelete(true)} icon={Trash2} danger />
          </div>
        </div>

        {isPassword ? (
          <div className="space-y-3">
            {item.login && <InfoRow icon={UserRound} value={item.login} onCopy={() => onCopy(item.login, 'Login skopiowany.')} />}
            {item.url && <InfoRow icon={Globe2} value={item.url} onCopy={() => onCopy(item.url, 'Adres URL skopiowany.')} />}
            <div className="rounded-lg bg-slate-950 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Hasło</span>
                <div className="flex gap-2">
                  <IconButton title={visible ? 'Ukryj hasło' : 'Pokaż hasło'} onClick={() => setVisible((value) => !value)} icon={visible ? EyeOff : Eye} />
                  <IconButton title="Kopiuj hasło" onClick={() => onCopy(item.password, 'Hasło skopiowane.')} icon={Copy} />
                </div>
              </div>
              <p className="break-words font-mono text-sm text-slate-200">{visible ? item.password : '••••••••••••••••••••'}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-slate-950 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Treść promptu</span>
              <IconButton title="Kopiuj prompt" onClick={() => onCopy(item.prompt_text, 'Prompt skopiowany.')} icon={Copy} />
            </div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{item.prompt_text}</pre>
          </div>
        )}

        {item.notes && (
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-400">
            {item.notes}
          </div>
        )}
      </article>

      {confirmDelete && (
        <ConfirmDialog
          title="Usunąć wpis?"
          body={`Wpis "${item.title}" zostanie trwale usunięty.`}
          confirmLabel="Usuń wpis"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => onDelete(item.id)}
        />
      )}
    </>
  );
}

function InfoRow({ icon: Icon, value, onCopy }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
      <Icon className="size-4 text-slate-500" />
      <span className="min-w-0 flex-1 truncate text-sm text-slate-300">{value}</span>
      <IconButton title="Kopiuj" onClick={onCopy} icon={Copy} />
    </div>
  );
}

function IconButton({ title, onClick, icon: Icon, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex size-9 items-center justify-center rounded-lg border transition ${
        danger
          ? 'border-red-500/30 text-red-300 hover:bg-red-500/10'
          : 'border-slate-800 text-slate-400 hover:border-cyan-400 hover:text-cyan-200'
      }`}
    >
      <Icon className="size-4" />
    </button>
  );
}

