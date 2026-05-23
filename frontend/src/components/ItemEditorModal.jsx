import { useEffect, useMemo, useState } from 'react';
import { KeyRound, Save, TerminalSquare, X } from 'lucide-react';

const emptyPassword = {
  type: 'password',
  title: '',
  login: '',
  url: '',
  password: '',
  notes: '',
};

const emptyPrompt = {
  type: 'prompt',
  title: '',
  prompt_text: '',
  notes: '',
};

export default function ItemEditorModal({ mode, type, item, onClose, onSave }) {
  const initial = useMemo(() => item || (type === 'password' ? emptyPassword : emptyPrompt), [item, type]);
  const [form, setForm] = useState(initial);
  const isPassword = form.type === 'password';

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const payload = isPassword
      ? {
          type: 'password',
          title: form.title,
          login: form.login || '',
          url: form.url || '',
          password: form.password || '',
          notes: form.notes || '',
          prompt_text: '',
        }
      : {
          type: 'prompt',
          title: form.title,
          prompt_text: form.prompt_text || '',
          notes: form.notes || '',
          login: '',
          url: '',
          password: '',
        };

    onSave(payload, item);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-200">
              {isPassword ? <KeyRound className="size-5" /> : <TerminalSquare className="size-5" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {mode === 'edit' ? 'Edytuj wpis' : isPassword ? 'Nowe hasło' : 'Nowy prompt'}
              </h2>
              <p className="text-sm text-slate-500">{isPassword ? 'Dane logowania i notatki' : 'Treść promptu i kontekst'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <Field label="Tytuł">
            <input
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
              className="form-input"
              placeholder={isPassword ? 'Gmail, GitHub, serwer...' : 'Prompt do Gemini, analiza dokumentu...'}
              required
            />
          </Field>

          {isPassword ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Login">
                  <input value={form.login || ''} onChange={(event) => updateField('login', event.target.value)} className="form-input" />
                </Field>
                <Field label="URL">
                  <input value={form.url || ''} onChange={(event) => updateField('url', event.target.value)} className="form-input" />
                </Field>
              </div>
              <Field label="Hasło">
                <input
                  type="password"
                  value={form.password || ''}
                  onChange={(event) => updateField('password', event.target.value)}
                  className="form-input font-mono"
                  required
                />
              </Field>
            </>
          ) : (
            <Field label="Treść promptu">
              <textarea
                value={form.prompt_text || ''}
                onChange={(event) => updateField('prompt_text', event.target.value)}
                className="form-input min-h-56 font-mono leading-6"
                required
              />
            </Field>
          )}

          <Field label="Notatki">
            <textarea
              value={form.notes || ''}
              onChange={(event) => updateField('notes', event.target.value)}
              className="form-input min-h-24"
              placeholder="Opcjonalny kontekst, instrukcje, przypomnienia..."
            />
          </Field>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-lg px-4 text-sm font-semibold text-slate-400 hover:text-white">
            Anuluj
          </button>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
            <Save className="size-4" />
            Zapisz
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}

