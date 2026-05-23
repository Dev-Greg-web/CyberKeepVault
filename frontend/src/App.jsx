import { useMemo, useState } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { Archive, FolderOpen, KeyRound, LockKeyhole, Plus, Search, TerminalSquare } from 'lucide-react';
import FolderDetails from './components/FolderDetails.jsx';
import ItemCard from './components/ItemCard.jsx';
import ItemEditorModal from './components/ItemEditorModal.jsx';
import Login from './components/Login.jsx';
import Sidebar from './components/Sidebar.jsx';
import Toast from './components/Toast.jsx';
import { useFolders } from './hooks/useFolders.js';
import { useItems } from './hooks/useItems.js';
import { useAuth } from './store/AuthContext.jsx';
import { getDescendantIds } from './utils/tree.js';

function Dashboard() {
  const folderState = useFolders();
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [itemModal, setItemModal] = useState(null);
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const { user, logout } = useAuth();
  const { items, loading: itemsLoading, createItem, updateItem, deleteItem } = useItems(activeFolderId);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const activeFolder = useMemo(
    () => folderState.folders.find((folder) => folder.id === activeFolderId) || null,
    [folderState.folders, activeFolderId],
  );

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }
    return items.filter((item) => {
      const searchable = [item.title, item.login, item.url, item.prompt_text, item.notes].join(' ').toLowerCase();
      return searchable.includes(normalized);
    });
  }, [items, query]);

  const stats = useMemo(() => {
    const folderCount = folderState.folders.length;
    const passwordCount = items.filter((item) => item.type === 'password').length;
    const promptCount = items.filter((item) => item.type === 'prompt').length;
    return { folderCount, passwordCount, promptCount };
  }, [folderState.folders.length, items]);

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const folderId = Number(active.id);
    const targetId = over.id === 'root-drop-zone' ? null : Number(over.id);
    const descendants = getDescendantIds(folderState.folders, folderId);

    if (targetId && descendants.has(targetId)) {
      setToast('Nie można przenieść folderu do jego podfolderu.');
      return;
    }

    try {
      await folderState.moveFolder(folderId, targetId);
      setToast(targetId ? 'Folder przeniesiony.' : 'Folder wrócił na główny poziom.');
    } catch (err) {
      setToast(err.response?.data?.message || 'Nie udało się przenieść folderu.');
    }
  }

  async function handleSaveItem(payload, existingItem) {
    if (!activeFolder) {
      return;
    }

    try {
      if (existingItem) {
        await updateItem(existingItem.id, payload);
        setToast('Wpis zaktualizowany.');
      } else {
        await createItem(payload);
        setToast(payload.type === 'password' ? 'Hasło zapisane.' : 'Prompt zapisany.');
      }
      setItemModal(null);
    } catch (err) {
      setToast(err.response?.data?.message || 'Nie udało się zapisać wpisu.');
    }
  }

  async function handleDeleteItem(itemId) {
    try {
      await deleteItem(itemId);
      setToast('Wpis usunięty.');
    } catch (err) {
      setToast(err.response?.data?.message || 'Nie udało się usunąć wpisu.');
    }
  }

  async function copyToClipboard(text, label = 'Skopiowano do schowka.') {
    await navigator.clipboard.writeText(text || '');
    setToast(label);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
        <Sidebar
          folderState={folderState}
          activeFolderId={activeFolderId}
          onSelectFolder={setActiveFolderId}
          user={user}
          onLogout={logout}
          onToast={setToast}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 backdrop-blur md:px-8">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">CyberKeep</p>
              <h1 className="truncate text-xl font-semibold text-white md:text-2xl">
                {activeFolder ? activeFolder.name : 'Biblioteka haseł i promptów'}
              </h1>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <Stat icon={FolderOpen} label="Foldery" value={stats.folderCount} />
              <Stat icon={KeyRound} label="Hasła" value={stats.passwordCount} />
              <Stat icon={TerminalSquare} label="Prompty" value={stats.promptCount} />
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
            {!activeFolder ? (
              <EmptyHome onCreateRoot={() => folderState.createFolder({ name: 'Nowy projekt' }).then((folder) => setActiveFolderId(folder.id))} />
            ) : (
              <div className="mx-auto flex max-w-7xl flex-col gap-6">
                <FolderDetails
                  folder={activeFolder}
                  folderState={folderState}
                  onDeleted={() => setActiveFolderId(null)}
                  onToast={setToast}
                />

                <div className="flex flex-col gap-3 border-y border-slate-800/80 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Szukaj w aktywnym folderze"
                      className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-10 pr-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setItemModal({ type: 'password' })}
                      className="inline-flex h-11 items-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      <KeyRound className="size-4" />
                      Hasło
                    </button>
                    <button
                      onClick={() => setItemModal({ type: 'prompt' })}
                      className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 text-sm font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-200"
                    >
                      <TerminalSquare className="size-4" />
                      Prompt
                    </button>
                  </div>
                </div>

                {itemsLoading ? (
                  <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">Ładowanie wpisów...</div>
                ) : filteredItems.length === 0 ? (
                  <EmptyFolder hasQuery={Boolean(query.trim())} onAddPassword={() => setItemModal({ type: 'password' })} />
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {filteredItems.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onCopy={copyToClipboard}
                        onEdit={() => setItemModal({ type: item.type, item })}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </main>

        {itemModal && (
          <ItemEditorModal
            mode={itemModal.item ? 'edit' : 'create'}
            type={itemModal.item?.type || itemModal.type}
            item={itemModal.item}
            onClose={() => setItemModal(null)}
            onSave={handleSaveItem}
          />
        )}

        <Toast message={toast} onClose={() => setToast('')} />
      </div>
    </DndContext>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
      <Icon className="size-4 text-cyan-300" />
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function EmptyHome({ onCreateRoot }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
        <LockKeyhole className="size-8" />
      </div>
      <h2 className="text-3xl font-semibold text-white">Twój skarbiec jest gotowy</h2>
      <p className="mt-3 max-w-xl text-slate-400">
        Zacznij od pustej struktury i utwórz pierwszy projekt. Foldery możesz potem zagnieżdżać, kolorować i przenosić.
      </p>
      <button
        onClick={onCreateRoot}
        className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-cyan-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
      >
        <Plus className="size-4" />
        Utwórz pierwszy folder
      </button>
    </div>
  );
}

function EmptyFolder({ hasQuery, onAddPassword }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
      <Archive className="mb-4 size-9 text-slate-500" />
      <h3 className="text-lg font-semibold text-slate-200">{hasQuery ? 'Brak wyników' : 'Ten folder jest pusty'}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        {hasQuery ? 'Zmień frazę wyszukiwania, aby zobaczyć inne wpisy.' : 'Dodaj pierwsze hasło lub prompt do tego projektu.'}
      </p>
      {!hasQuery && (
        <button
          onClick={onAddPassword}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-200"
        >
          <Plus className="size-4" />
          Dodaj wpis
        </button>
      )}
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="rounded-lg border border-slate-800 bg-slate-900 px-5 py-3 text-sm">Ładowanie CyberKeep...</div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}
