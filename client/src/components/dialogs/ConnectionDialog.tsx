import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useConnectionStore } from '@/stores/connection-store';
import { useAppStore } from '@/stores/app-store';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultForm = {
  name: 'Nouvelle connexion',
  host: 'localhost',
  port: 9091,
  ssl: false,
  username: '',
  password: '',
  rpc_path: '/transmission/rpc',
  auto_reconnect: true,
};

export function ConnectionDialog({ open, onOpenChange }: Props) {
  const { setActiveConnection } = useAppStore();
  const { connections, addConnection, updateConnection, deleteConnection } = useConnectionStore();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);

  const selected = connections.find((c) => c.id === selectedId);

  useEffect(() => {
    if (selected) {
      setForm({
        name: selected.name,
        host: selected.host,
        port: selected.port,
        ssl: selected.ssl,
        username: selected.username,
        password: selected.password,
        rpc_path: selected.rpc_path,
        auto_reconnect: selected.auto_reconnect,
      });
    }
  }, [selected]);

  useEffect(() => {
    if (open && connections.length > 0 && !selectedId) {
      setSelectedId(connections[0].id);
    }
  }, [open, connections, selectedId]);

  if (!open) return null;

  const handleNew = () => {
    try {
      const conn = addConnection(defaultForm);
      setSelectedId(conn.id);
    } catch { toast.error('Erreur de création'); }
  };

  const handleSave = () => {
    if (!selectedId) return;
    try {
      updateConnection(selectedId, form);
      setActiveConnection(selectedId);
      onOpenChange(false);
      toast.success('Connexion sauvegardée');
    } catch { toast.error('Erreur de sauvegarde'); }
  };

  const handleDelete = () => {
    if (!selectedId) return;
    if (!confirm('Supprimer cette connexion ?')) return;
    try {
      deleteConnection(selectedId);
      setSelectedId(null);
      setForm(defaultForm);
    } catch { toast.error('Erreur de suppression'); }
  };

  const handleRename = () => {
    const newName = prompt('Nouveau nom:', form.name);
    if (!newName || !selectedId) return;
    setForm({ ...form, name: newName });
    try {
      updateConnection(selectedId, { name: newName });
    } catch { toast.error('Erreur de renommage'); }
  };

  const set = (key: string, value: unknown) => setForm({ ...form, [key]: value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="bg-background rounded-lg shadow-xl w-[560px] max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Gérer les connexions à Transmission</h2>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-sm min-w-[130px]">Nom de la connexion:</label>
            <select
              className="flex-1 h-8 px-2 border border-border rounded bg-background text-sm"
              value={selectedId ?? ''}
              onChange={(e) => setSelectedId(Number(e.target.value) || null)}
            >
              {connections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 justify-center">
            <button onClick={handleNew} className="px-3 py-1 text-sm border border-border rounded hover:bg-accent">Nouveau</button>
            <button onClick={handleRename} className="px-3 py-1 text-sm border border-border rounded hover:bg-accent">Renommer</button>
            <button onClick={handleDelete} className="px-3 py-1 text-sm border border-border rounded hover:bg-accent text-destructive">Supprimer</button>
          </div>

          <hr className="border-border" />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm min-w-[130px]">Hôte distant:</label>
              <input value={form.host} onChange={(e) => set('host', e.target.value)} className="flex-1 h-8 px-2 border border-border rounded bg-background text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm min-w-[130px]">Port:</label>
              <input type="number" value={form.port} onChange={(e) => set('port', Number(e.target.value))} className="w-24 h-8 px-2 border border-border rounded bg-background text-sm" />
              <label className="flex items-center gap-1 text-sm ml-4">
                <input type="checkbox" checked={form.ssl} onChange={(e) => set('ssl', e.target.checked)} />
                Utiliser SSL
              </label>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm min-w-[130px]">Nom d'utilisateur:</label>
              <input value={form.username} onChange={(e) => set('username', e.target.value)} className="flex-1 h-8 px-2 border border-border rounded bg-background text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm min-w-[130px]">Mot de passe:</label>
              <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} className="flex-1 h-8 px-2 border border-border rounded bg-background text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm min-w-[130px]">Chemin RPC:</label>
              <input value={form.rpc_path} onChange={(e) => set('rpc_path', e.target.value)} className="flex-1 h-8 px-2 border border-border rounded bg-background text-sm" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.auto_reconnect} onChange={(e) => set('auto_reconnect', e.target.checked)} />
              Reconnexion automatique
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button onClick={handleSave} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">OK</button>
          <button onClick={() => onOpenChange(false)} className="px-4 py-1.5 text-sm border border-border rounded hover:bg-accent">Annuler</button>
        </div>
      </div>
    </div>
  );
}
