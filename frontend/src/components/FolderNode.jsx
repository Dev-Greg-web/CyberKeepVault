import { useState } from 'react';
import { Check, ChevronRight, Folder, FolderPlus, X } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

export default function FolderNode({ folder, level, activeFolderId, onSelectFolder, folderState, onToast }) {
  const [expanded, setExpanded] = useState(true);
  const [creatingChild, setCreatingChild] = useState(false);
  const [childName, setChildName] = useState('');
  const isActive = activeFolderId === folder.id;
  const hasChildren = folder.children?.length > 0;

  const draggable = useDraggable({ id: folder.id, data: { folder } });
  const droppable = useDroppable({ id: folder.id });

  function setRefs(node) {
    draggable.setNodeRef(node);
    droppable.setNodeRef(node);
  }

  async function submitChild(event) {
    event.preventDefault();
    const name = childName.trim();
    if (!name) {
      return;
    }

    try {
      const child = await folderState.createFolder({ name, parent_id: folder.id });
      setExpanded(true);
      setCreatingChild(false);
      setChildName('');
      onSelectFolder(child.id);
      onToast('Podfolder utworzony.');
    } catch (err) {
      onToast(err.response?.data?.message || 'Nie udało się utworzyć podfolderu.');
    }
  }

  const transform = CSS.Translate.toString(draggable.transform);

  return (
    <div className="select-none">
      <div
        ref={setRefs}
        style={{ transform }}
        className={`group flex items-center gap-1 rounded-lg pr-2 transition ${
          droppable.isOver ? 'bg-cyan-400/15 ring-1 ring-cyan-400/50' : ''
        } ${draggable.isDragging ? 'opacity-40' : ''} ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900'}`}
      >
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex size-7 shrink-0 items-center justify-center text-slate-500"
          style={{ marginLeft: `${level * 14}px` }}
          title={expanded ? 'Zwiń folder' : 'Rozwiń folder'}
        >
          <ChevronRight className={`size-4 transition ${expanded ? 'rotate-90' : ''} ${hasChildren ? 'opacity-100' : 'opacity-0'}`} />
        </button>

        <button
          type="button"
          {...draggable.listeners}
          {...draggable.attributes}
          onClick={() => onSelectFolder(folder.id)}
          className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
        >
          <Folder className="size-4 shrink-0" style={{ color: folder.icon_color }} />
          <span className="truncate text-sm font-medium" style={{ color: folder.name_color }}>
            {folder.name}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCreatingChild(true);
            setExpanded(true);
          }}
          className="flex size-7 items-center justify-center rounded-md text-slate-500 opacity-0 transition hover:bg-slate-800 hover:text-cyan-200 group-hover:opacity-100"
          title="Dodaj podfolder"
        >
          <FolderPlus className="size-4" />
        </button>
      </div>

      {creatingChild && (
        <form onSubmit={submitChild} className="mt-1 flex gap-2" style={{ paddingLeft: `${(level + 1) * 14 + 28}px` }}>
          <input
            autoFocus
            value={childName}
            onChange={(event) => setChildName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setCreatingChild(false);
                setChildName('');
              }
            }}
            onBlur={() => {
              if (!childName.trim()) {
                setCreatingChild(false);
              }
            }}
            placeholder="Nazwa podfolderu"
            className="h-9 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
          />
          <button
            type="submit"
            title="Utwórz podfolder"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-slate-950 transition hover:bg-cyan-300"
          >
            <Check className="size-4" />
          </button>
          <button
            type="button"
            title="Anuluj"
            onClick={() => {
              setCreatingChild(false);
              setChildName('');
            }}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition hover:text-white"
          >
            <X className="size-4" />
          </button>
        </form>
      )}

      {expanded && hasChildren && (
        <div className="mt-1 space-y-1">
          {folder.children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              level={level + 1}
              activeFolderId={activeFolderId}
              onSelectFolder={onSelectFolder}
              folderState={folderState}
              onToast={onToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}
