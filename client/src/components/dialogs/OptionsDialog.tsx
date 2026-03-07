import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/hooks/useSession';
import { setSession } from '@/api/transmission';
import { useAppStore } from '@/stores/app-store';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Tab = 'download' | 'network' | 'bandwidth' | 'queue';

export function OptionsDialog({ open, onOpenChange }: Props) {
  const connectionId = useAppStore((s) => s.activeConnectionId);
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('download');
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (session) setForm(JSON.parse(JSON.stringify(session)));
  }, [session]);

  if (!open || !session) return null;

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));
  const val = <T,>(key: string, def: T): T => (form[key] as T) ?? def;

  const sessionRecord = JSON.parse(JSON.stringify(session)) as Record<string, unknown>;
  const handleSave = async () => {
    if (!connectionId) return;
    try {
      const changes: Record<string, unknown> = {};
      for (const key of Object.keys(form)) {
        if (JSON.stringify(form[key]) !== JSON.stringify(sessionRecord[key])) {
          changes[key] = form[key];
        }
      }
      if (Object.keys(changes).length > 0) {
        await setSession(connectionId, changes);
        queryClient.invalidateQueries({ queryKey: ['session'] });
      }
      toast.success('Options sauvegardées');
      onOpenChange(false);
    } catch (err) {
      toast.error(`Erreur: ${err instanceof Error ? err.message : 'Inconnu'}`);
    }
  };

  const tabClass = (t: Tab) =>
    `px-3 py-1.5 text-sm border-b-2 ${tab === t ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="bg-background rounded-lg shadow-xl w-[520px] max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold">Options de Transmission</h2>
        </div>

        <div className="flex border-b border-border">
          <button onClick={() => setTab('download')} className={tabClass('download')}>Télécharger</button>
          <button onClick={() => setTab('network')} className={tabClass('network')}>Réseau</button>
          <button onClick={() => setTab('bandwidth')} className={tabClass('bandwidth')}>Bande passante</button>
          <button onClick={() => setTab('queue')} className={tabClass('queue')}>File</button>
        </div>

        <div className="p-4 space-y-3 text-sm">
          {tab === 'download' && (
            <>
              <div>
                <label className="block mb-1">Dossier de téléchargement par défaut:</label>
                <input value={val('download-dir', '')} onChange={(e) => set('download-dir', e.target.value)} className="w-full h-8 px-2 border border-border rounded bg-background" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={val('rename-partial-files', false)} onChange={(e) => set('rename-partial-files', e.target.checked)} />
                Ajouter l'extension .part aux fichiers incomplets
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={val('incomplete-dir-enabled', false)} onChange={(e) => set('incomplete-dir-enabled', e.target.checked)} />
                Dossier des fichiers incomplets
              </label>
              {val('incomplete-dir-enabled', false) && (
                <input value={val('incomplete-dir', '')} onChange={(e) => set('incomplete-dir', e.target.value)} className="w-full h-8 px-2 border border-border rounded bg-background" />
              )}
              <hr className="border-border" />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={val('seedRatioLimited', false)} onChange={(e) => set('seedRatioLimited', e.target.checked)} />
                Taux de partage:
              </label>
              {val('seedRatioLimited', false) && (
                <input type="number" step="0.1" value={val('seedRatioLimit', 2)} onChange={(e) => set('seedRatioLimit', Number(e.target.value))} className="w-24 h-8 px-2 border border-border rounded bg-background" />
              )}
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={val('idle-seeding-limit-enabled', false)} onChange={(e) => set('idle-seeding-limit-enabled', e.target.checked)} />
                Arrêter si inactif depuis:
              </label>
              {val('idle-seeding-limit-enabled', false) && (
                <div className="flex items-center gap-1">
                  <input type="number" value={val('idle-seeding-limit', 30)} onChange={(e) => set('idle-seeding-limit', Number(e.target.value))} className="w-20 h-8 px-2 border border-border rounded bg-background" />
                  <span>minutes</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <label>Taille du cache disque:</label>
                <input type="number" value={val('cache-size-mb', 4)} onChange={(e) => set('cache-size-mb', Number(e.target.value))} className="w-20 h-8 px-2 border border-border rounded bg-background" />
                <span>Mo</span>
              </div>
            </>
          )}

          {tab === 'network' && (
            <>
              <div className="flex items-center gap-2">
                <label className="min-w-[140px]">Port d'écoute:</label>
                <input type="number" value={val('peer-port', 51413)} onChange={(e) => set('peer-port', Number(e.target.value))} className="w-24 h-8 px-2 border border-border rounded bg-background" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={val('peer-port-random-on-start', false)} onChange={(e) => set('peer-port-random-on-start', e.target.checked)} />
                Port aléatoire au démarrage
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={val('port-forwarding-enabled', false)} onChange={(e) => set('port-forwarding-enabled', e.target.checked)} />
                Redirection de port (UPnP / NAT-PMP)
              </label>
              <hr className="border-border" />
              <div className="flex items-center gap-2">
                <label className="min-w-[140px]">Pairs max global:</label>
                <input type="number" value={val('peer-limit-global', 200)} onChange={(e) => set('peer-limit-global', Number(e.target.value))} className="w-24 h-8 px-2 border border-border rounded bg-background" />
              </div>
              <div className="flex items-center gap-2">
                <label className="min-w-[140px]">Pairs max par torrent:</label>
                <input type="number" value={val('peer-limit-per-torrent', 60)} onChange={(e) => set('peer-limit-per-torrent', Number(e.target.value))} className="w-24 h-8 px-2 border border-border rounded bg-background" />
              </div>
              <hr className="border-border" />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={val('dht-enabled', true)} onChange={(e) => set('dht-enabled', e.target.checked)} />
                DHT
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={val('pex-enabled', true)} onChange={(e) => set('pex-enabled', e.target.checked)} />
                PEX
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={val('lpd-enabled', false)} onChange={(e) => set('lpd-enabled', e.target.checked)} />
                LPD
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={val('utp-enabled', true)} onChange={(e) => set('utp-enabled', e.target.checked)} />
                uTP
              </label>
            </>
          )}

          {tab === 'bandwidth' && (
            <>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={val('speed-limit-down-enabled', false)} onChange={(e) => set('speed-limit-down-enabled', e.target.checked)} />
                Limite de téléchargement:
              </label>
              {val('speed-limit-down-enabled', false) && (
                <div className="flex items-center gap-1 ml-6">
                  <input type="number" value={val('speed-limit-down', 100)} onChange={(e) => set('speed-limit-down', Number(e.target.value))} className="w-24 h-8 px-2 border border-border rounded bg-background" />
                  <span>Ko/s</span>
                </div>
              )}
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={val('speed-limit-up-enabled', false)} onChange={(e) => set('speed-limit-up-enabled', e.target.checked)} />
                Limite d'envoi:
              </label>
              {val('speed-limit-up-enabled', false) && (
                <div className="flex items-center gap-1 ml-6">
                  <input type="number" value={val('speed-limit-up', 100)} onChange={(e) => set('speed-limit-up', Number(e.target.value))} className="w-24 h-8 px-2 border border-border rounded bg-background" />
                  <span>Ko/s</span>
                </div>
              )}
              <hr className="border-border" />
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={val('alt-speed-enabled', false)} onChange={(e) => set('alt-speed-enabled', e.target.checked)} />
                Vitesse alternative activée
              </label>
              <div className="flex items-center gap-2 ml-6">
                <label className="min-w-[100px]">Alt DL:</label>
                <input type="number" value={val('alt-speed-down', 50)} onChange={(e) => set('alt-speed-down', Number(e.target.value))} className="w-24 h-8 px-2 border border-border rounded bg-background" />
                <span>Ko/s</span>
              </div>
              <div className="flex items-center gap-2 ml-6">
                <label className="min-w-[100px]">Alt UL:</label>
                <input type="number" value={val('alt-speed-up', 50)} onChange={(e) => set('alt-speed-up', Number(e.target.value))} className="w-24 h-8 px-2 border border-border rounded bg-background" />
                <span>Ko/s</span>
              </div>
            </>
          )}

          {tab === 'queue' && (
            <>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={val('download-queue-enabled', true)} onChange={(e) => set('download-queue-enabled', e.target.checked)} />
                File de téléchargement:
              </label>
              {val('download-queue-enabled', true) && (
                <div className="flex items-center gap-1 ml-6">
                  <input type="number" value={val('download-queue-size', 5)} onChange={(e) => set('download-queue-size', Number(e.target.value))} className="w-20 h-8 px-2 border border-border rounded bg-background" />
                  <span>torrents max</span>
                </div>
              )}
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={val('seed-queue-enabled', false)} onChange={(e) => set('seed-queue-enabled', e.target.checked)} />
                File d'envoi:
              </label>
              {val('seed-queue-enabled', false) && (
                <div className="flex items-center gap-1 ml-6">
                  <input type="number" value={val('seed-queue-size', 10)} onChange={(e) => set('seed-queue-size', Number(e.target.value))} className="w-20 h-8 px-2 border border-border rounded bg-background" />
                  <span>torrents max</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button onClick={handleSave} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">OK</button>
          <button onClick={() => onOpenChange(false)} className="px-4 py-1.5 text-sm border border-border rounded hover:bg-accent">Annuler</button>
        </div>
      </div>
    </div>
  );
}
