import { useEffect, useState } from 'react';
import { FolderPen, Palette, Save, Trash2 } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function FolderDetails({ folder, folderState, onDeleted, onToast }) {
  const [name, setName] = useState(folder.name);
  const [iconColor, setIconColor] = useState(folder.icon_color);
  const [nameColor, setNameColor] = useState(folder.name_color);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = name !== folder.name || iconColor !== folder.icon_color || nameColor !== folder.name_color;

  useEffect(() => {
    setName(folder.name);
    setIconColor(folder.icon_color);
    setNameColor(folder.name_color);
  }, [folder]);

  async function saveChanges(event) {
    event.preventDefault();
    try {
      await folderState.updateFolder(folder.id, {
        name: name.trim(),
        icon_color: iconColor,
        name_color: nameColor,
      });
      onToast('Folder zaktualizowany.');
    } catch (err) {
      onToast(err.response?.data?.message || 'Nie udało się zapisać folderu.');
    }
  }

  async function deleteFolder() {
    try {
      await folderState.deleteFolder(folder.id);
      onDeleted();
      onToast('Folder usunięty.');
    } catch (err) {
      onToast(err.response?.data?.message || 'Nie udało się usunąć folderu.');
    }
  }

  return (
    <>
      <form onSubmit={saveChanges} className="grid gap-4 rounded-lg border border-slate-800 bg-slate-900/65 p-4 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
            <FolderPen className="size-4 text-cyan-300" />
            Folder aktywny
          </div>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-12 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 text-lg font-semibold outline-none transition focus:border-cyan-400"
            style={{ color: nameColor }}
            required
          />
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <ColorField label="Ikona" value={iconColor} onChange={setIconColor} />
          <ColorField label="Nazwa" value={nameColor} onChange={setNameColor} />
          <button
            disabled={!dirty}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
          >
            <Save className="size-4" />
            Zapisz
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-red-500/40 px-4 text-sm font-semibold text-red-200 transition hover:bg-red-500/10"
          >
            <Trash2 className="size-4" />
            Usuń
          </button>
        </div>
      </form>

      {confirmDelete && (
        <ConfirmDialog
          title="Usunąć folder?"
          body={`Folder "${folder.name}" oraz wszystkie podfoldery i wpisy w środku zostaną usunięte.`}
          confirmLabel="Usuń folder"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={deleteFolder}
        />
      )}
    </>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3">
      <Palette className="size-4 text-slate-500" />
      <span className="text-xs text-slate-400">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="size-7 rounded border-0 bg-transparent p-0"
      />
    </label>
  );
}

