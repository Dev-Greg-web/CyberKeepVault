import { useMemo, useState } from 'react';
import { Check, LogOut, Plus, Shield, Settings, X } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import FolderNode from './FolderNode.jsx';

export default function Sidebar({ folderState, activeFolderId, onSelectFolder, user, onLogout, onToast }) {
  const [creatingRoot, setCreatingRoot] = useState(false);
  const [newName, setNewName] = useState('');
  const rootDrop = useDroppable({ id: 'root-drop-zone' });
  const totalFolders = folderState.folders.length;

  const rootDropClass = useMemo(
    () =>
      rootDrop.isOver
        ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200'
        : 'border-slate-800 bg-slate-950/70 text-slate-500',
    [rootDrop.isOver],
  );

  async function submitRoot(event) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) {
      return;
    }
    try {
      const folder = await folderState.createFolder({ name });
      onSelectFolder(folder.id);
      setNewName('');
      setCreatingRoot(false);
      onToast('Folder utworzony.');
    } catch (err) {
      onToast(err.response?.data?.message || 'Nie udało się utworzyć folderu.');
    }
  }

  return (
    <aside className="flex w-[19rem] shrink-0 flex-col border-r border-slate-800 bg-slate-950/95 max-md:hidden">
      <div className="border-b border-slate-800 p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
            <Shield className="size-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">
              <span className="text-cyan-300">Cyber</span>Keep
            </p>
            <p className="text-xs text-slate-500">Private Vault</p>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Projekty</p>
            <p className="text-xs text-slate-600">{totalFolders} folderów</p>
          </div>
          <button
            onClick={() => setCreatingRoot(true)}
            title="Nowy folder główny"
            className="flex size-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <div
          ref={rootDrop.setNodeRef}
          className={`mb-3 rounded-lg border border-dashed px-3 py-2 text-xs transition ${rootDropClass}`}
        >
          Upuść tutaj, aby przenieść na główny poziom
        </div>

        {creatingRoot && (
          <form onSubmit={submitRoot} className="mb-3 flex gap-2">
            <input
              autoFocus
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setCreatingRoot(false);
                  setNewName('');
                }
              }}
              onBlur={() => {
                if (!newName.trim()) {
                  setCreatingRoot(false);
                }
              }}
              placeholder="Nazwa folderu"
              className="h-10 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
            />
            <button
              type="submit"
              title="Utwórz folder"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-slate-950 transition hover:bg-cyan-300"
            >
              <Check className="size-4" />
            </button>
            <button
              type="button"
              title="Anuluj"
              onClick={() => {
                setCreatingRoot(false);
                setNewName('');
              }}
              className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition hover:text-white"
            >
              <X className="size-4" />
            </button>
          </form>
        )}

        <nav className="min-h-0 flex-1 overflow-y-auto pr-1">
          {folderState.loading ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-500">Ładowanie folderów...</div>
          ) : folderState.tree.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-500">
              Brak folderów. Dodaj pierwszy projekt przyciskiem plus.
            </div>
          ) : (
            <div className="space-y-1">
              {folderState.tree.map((folder) => (
                <FolderNode
                  key={folder.id}
                  folder={folder}
                  level={0}
                  activeFolderId={activeFolderId}
                  onSelectFolder={onSelectFolder}
                  folderState={folderState}
                  onToast={onToast}
                />
              ))}
            </div>
          )}
        </nav>
      </div>

      <div className="border-t border-slate-800 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-900/70 p-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-400/15 font-bold text-cyan-200">
            {user?.username?.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-100">{user?.username}</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
        </div>
        <button className="mb-1 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-slate-100">
          <Settings className="size-4" />
          Ustawienia
        </button>
        <button
          onClick={onLogout}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
        >
          <LogOut className="size-4" />
          Wyloguj
        </button>
      </div>
    </aside>
  );
}
