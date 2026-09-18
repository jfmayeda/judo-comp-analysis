'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { useCoachGate } from '@/lib/use-coach-gate';
import { getAllCoaches, inviteCoach, removeCoach, getAllTechniques, createTechnique, deleteTechnique } from '@/lib/supabase-store';
import { Technique } from '@/lib/types';
import { AppFrame } from '@/components/AppFrame';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Field } from '@/components/ui/Field';
import { IconPlus } from '@/components/ui/Icons';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionHeading } from '@/components/ui/SectionHeading';

type CoachRow = { id: string; email: string; invitedAt: string; isAdmin: boolean };
type Pending = { kind: 'coach'; coach: CoachRow } | { kind: 'technique'; technique: Technique } | null;

export default function InviteCoachPage() {
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [showAddTechnique, setShowAddTechnique] = useState(false);
  const [newTechnique, setNewTechnique] = useState({ name: '', category: 'Ne-waza' as 'Tachi-waza' | 'Ne-waza' });
  const [pending, setPending] = useState<Pending>(null);

  const loadTechniques = useCallback(async () => {
    try {
      const data = await getAllTechniques();
      setTechniques(data.filter((t) => t.isCustom));
    } catch (err) {
      console.error('Error loading techniques:', err);
    }
  }, []);

  const loadCoaches = useCallback(async () => {
    try {
      setCoaches(await getAllCoaches());
    } catch (err) {
      console.error('Error loading coaches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const { ready, checking } = useCoachGate({
    admin: true,
    onReady: () => {
      loadCoaches();
      loadTechniques();
    },
  });

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setMessage(null);
    try {
      await inviteCoach(email);
      setMessage(`Invitation sent to ${email}. They will receive a magic link to sign in.`);
      setEmail('');
      await loadCoaches();
    } catch (err: unknown) {
      console.error('Invite error:', err);
      setError(err instanceof Error ? err.message : 'Failed to invite coach');
    } finally {
      setSending(false);
    }
  };

  const handleAddTechnique = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createTechnique({ name: newTechnique.name, category: newTechnique.category });
      setMessage(`Custom technique "${newTechnique.name}" added.`);
      setNewTechnique({ name: '', category: 'Ne-waza' });
      setShowAddTechnique(false);
      await loadTechniques();
    } catch (err: unknown) {
      console.error('Error adding technique:', err);
      setError(err instanceof Error ? err.message : 'Failed to add technique');
    }
  };

  if (!ready || checking || loading) {
    return <LoadingScreen label="Loading coaches" />;
  }

  return (
    <AppFrame backHref="/" eyebrow="Coaches & techniques" narrow>
      <PageHeader kicker="Admin" title="Coaches & techniques" lead="Only invited coaches can see athlete data. Removed coaches lose access immediately." />

      <div className="stack-lg">
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {message ? <Notice tone="success">{message}</Notice> : null}

        <Card as="section" aria-labelledby="invite-heading">
          <SectionHeading id="invite-heading" title="Invite a coach" />
          <form onSubmit={handleInvite} className="stack">
            <Field label="Coach email" required hint="They receive a magic link to sign in.">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="form-input" placeholder="coach@example.com" autoComplete="off" inputMode="email" />
            </Field>
            <div>
              <Button type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send invitation'}</Button>
            </div>
          </form>
        </Card>

        <Card as="section" aria-labelledby="coaches-heading">
          <SectionHeading id="coaches-heading" title="Current coaches" count={coaches.length} />
          {coaches.length === 0 ? (
            <p className="text-sm text-muted">No coaches in the allowlist yet.</p>
          ) : (
            <ul>
              {coaches.map((coach) => (
                <li key={coach.id} className="list-row">
                  <div className="list-row-main">
                    <p className="list-row-title break-all">{coach.email}</p>
                    <p className="list-row-meta">Invited {new Date(coach.invitedAt).toLocaleDateString()}</p>
                  </div>
                  {coach.isAdmin ? <Pill tone="navy">Admin</Pill> : <Button variant="ghost-danger" size="sm" onClick={() => setPending({ kind: 'coach', coach })}>Remove</Button>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card as="section" aria-labelledby="techniques-admin-heading">
          <SectionHeading
            id="techniques-admin-heading"
            title="Custom techniques"
            count={techniques.length}
            action={!showAddTechnique ? <Button variant="ghost" size="sm" onClick={() => setShowAddTechnique(true)}><IconPlus size={16} /> Technique</Button> : null}
          />
          <p className="text-sm text-muted mb-3">Dojo-specific techniques that are not in the Kodokan list. They appear in every coach&apos;s technique picker.</p>
          {showAddTechnique ? (
            <form onSubmit={handleAddTechnique} className="panel stack mb-4">
              <div className="form-grid-2">
                <Field label="Technique name" required>
                  <input type="text" required value={newTechnique.name} onChange={(e) => setNewTechnique({ ...newTechnique, name: e.target.value })} className="form-input" placeholder="e.g. Cat wrench" />
                </Field>
                <Field label="Category">
                  <select value={newTechnique.category} onChange={(e) => setNewTechnique({ ...newTechnique, category: e.target.value as 'Tachi-waza' | 'Ne-waza' })} className="form-input">
                    <option value="Tachi-waza">Tachi-waza (standing)</option>
                    <option value="Ne-waza">Ne-waza (ground)</option>
                  </select>
                </Field>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddTechnique(false)}>Cancel</Button>
                <Button type="submit" size="sm">Add technique</Button>
              </div>
            </form>
          ) : null}
          {techniques.length === 0 ? (
            <p className="text-sm text-muted">No custom techniques yet.</p>
          ) : (
            <ul>
              {techniques.map((technique) => (
                <li key={technique.id} className="list-row">
                  <div className="list-row-main">
                    <p className="list-row-title">{technique.name}</p>
                    <p className="list-row-meta">{technique.category}</p>
                  </div>
                  <Button variant="ghost-danger" size="sm" onClick={() => setPending({ kind: 'technique', technique })}>Delete</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Notice tone="muted" title="Privacy & security">
          Only invited coaches can view athlete data. Removed coaches immediately lose access. Admins cannot be removed here.
        </Notice>
      </div>

      <ConfirmDialog
        open={pending !== null}
        destructive
        title={pending?.kind === 'coach' ? `Remove ${pending.coach.email}?` : pending?.kind === 'technique' ? `Delete "${pending.technique.name}"?` : ''}
        body={pending?.kind === 'coach' ? 'They will lose access to all athlete data immediately.' : 'This cannot be undone.'}
        confirmLabel={pending?.kind === 'coach' ? 'Remove coach' : 'Delete technique'}
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;
          if (pending.kind === 'coach') {
            await removeCoach(pending.coach.id);
            await loadCoaches();
          } else {
            await deleteTechnique(pending.technique.id);
            setMessage(`Technique "${pending.technique.name}" deleted.`);
            await loadTechniques();
          }
        }}
      />
    </AppFrame>
  );
}
