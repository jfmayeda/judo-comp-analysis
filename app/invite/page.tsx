'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getAllCoaches, inviteCoach, removeCoach, getAllTechniques, createTechnique, deleteTechnique } from '@/lib/supabase-store';
import { Technique } from '@/lib/types';

export default function InviteCoachPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAllowlisted, isAdmin } = useAuth();
  const [coaches, setCoaches] = useState<Array<{ id: string; email: string; invitedAt: string; isAdmin: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [showAddTechnique, setShowAddTechnique] = useState(false);
  const [newTechnique, setNewTechnique] = useState({
    name: '',
    category: 'Ne-waza' as 'Tachi-waza' | 'Ne-waza',
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (isAllowlisted === false) {
      router.push('/unauthorized');
      return;
    }

    if (isAdmin === false) {
      router.push('/');
      return;
    }

    if (isAllowlisted === true && isAdmin === true) {
      loadCoaches();
      loadTechniques();
    }
  }, [user, authLoading, isAllowlisted, isAdmin, router]);

  const loadTechniques = async () => {
    try {
      const data = await getAllTechniques();
      setTechniques(data.filter(t => t.isCustom));
    } catch (error) {
      console.error('Error loading techniques:', error);
    }
  };

  const loadCoaches = async () => {
    try {
      const data = await getAllCoaches();
      setCoaches(data);
    } catch (error) {
      console.error('Error loading coaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setMessage(null);

    try {
      await inviteCoach(email);
      setMessage(`Invitation sent to ${email}! They will receive a magic link to sign in.`);
      setEmail('');
      await loadCoaches();
    } catch (err: unknown) {
      console.error('Invite error:', err);
      setError(err instanceof Error ? err.message : 'Failed to invite coach');
    } finally {
      setSending(false);
    }
  };

  const handleRemove = async (coachId: string, coachEmail: string) => {
    if (!confirm(`Remove ${coachEmail} from the allowlist? They will lose access to all athlete data.`)) {
      return;
    }

    try {
      await removeCoach(coachId);
      await loadCoaches();
    } catch (error: any) {
      console.error('Error removing coach:', error);
      alert(`Error: ${error.message || 'Failed to remove coach'}`);
    }
  };

  const handleAddTechnique = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTechnique({
        name: newTechnique.name,
        category: newTechnique.category,
      });
      setNewTechnique({ name: '', category: 'Ne-waza' });
      setShowAddTechnique(false);
      await loadTechniques();
      setMessage(`Custom technique "${newTechnique.name}" added successfully!`);
    } catch (error: any) {
      console.error('Error adding technique:', error);
      setError(error.message || 'Failed to add technique');
    }
  };

  const handleDeleteTechnique = async (techniqueId: string, techniqueName: string) => {
    if (!confirm(`Delete custom technique "${techniqueName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteTechnique(techniqueId);
      await loadTechniques();
      setMessage(`Technique "${techniqueName}" deleted successfully!`);
    } catch (error: any) {
      console.error('Error deleting technique:', error);
      alert(`Error: ${error.message || 'Failed to delete technique'}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen navy-field flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="app-header">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <Link href="/" className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity">
            <span className="text-xl">←</span>
            <img 
              src="/svj-logo-white.png" 
              alt="Silicon Valley Judo" 
              className="app-header-logo"
            />
            <p className="eyebrow text-white text-xs uppercase">COMPETITOR ANALYSIS</p>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <p className="eyebrow mb-2">Coach Management</p>
          <h2 className="text-3xl mb-2">Invite Coaches</h2>
          <p className="text-gray-700">
            Only invited coaches can access athlete data. Send an invitation to add a new coach.
          </p>
        </div>

        <div className="card p-6 mb-8">
          <h3 className="text-xl mb-4 uppercase tracking-wide">Send Invitation</h3>
          
          {error && (
            <div className="mb-4 p-3 rounded text-sm bg-red-50 text-red-800 border border-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 rounded text-sm bg-green-50 text-green-800 border border-green-200">
              {message}
            </div>
          )}

          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="form-label block mb-2">
                Coach Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input w-full"
                placeholder="coach@example.com"
              />
              <p className="text-sm text-gray-600 mt-2">
                The coach will receive a magic link via email to sign in and access the app.
              </p>
            </div>
            <button
              type="submit"
              disabled={sending}
              className="btn-primary"
            >
              {sending ? 'Sending Invitation...' : 'Send Invitation'}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h3 className="text-xl mb-4 uppercase tracking-wide">Current Coaches ({coaches.length})</h3>
          
          {coaches.length === 0 ? (
            <p className="text-gray-600">No coaches in the allowlist yet.</p>
          ) : (
            <div className="space-y-3">
              {coaches.map((coach) => (
                <div
                  key={coach.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-200"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{coach.email}</p>
                    <p className="text-sm text-gray-600">
                      Invited {new Date(coach.invitedAt).toLocaleDateString()}
                      {coach.isAdmin && <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded uppercase font-semibold">Admin</span>}
                    </p>
                  </div>
                  {!coach.isAdmin && (
                    <button
                      onClick={() => handleRemove(coach.id, coach.email)}
                      className="btn-secondary border-red-600 text-red-600 hover:bg-red-600 hover:text-white text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl uppercase tracking-wide">Custom Techniques ({techniques.length})</h3>
            <button
              onClick={() => setShowAddTechnique(!showAddTechnique)}
              className="btn-primary text-sm"
            >
              {showAddTechnique ? 'Cancel' : 'Add Custom Technique'}
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Add dojo-specific techniques that aren't in the standard Kodokan list. These will appear in the technique picker for all coaches.
          </p>

          {showAddTechnique && (
            <form onSubmit={handleAddTechnique} className="mb-6 p-4 bg-gray-50 rounded space-y-4">
              <div>
                <label className="form-label block mb-2">Technique Name</label>
                <input
                  type="text"
                  required
                  value={newTechnique.name}
                  onChange={(e) => setNewTechnique({ ...newTechnique, name: e.target.value })}
                  className="form-input w-full"
                  placeholder="e.g., Cat Wrench"
                />
              </div>
              <div>
                <label className="form-label block mb-2">Category</label>
                <select
                  value={newTechnique.category}
                  onChange={(e) => setNewTechnique({ ...newTechnique, category: e.target.value as 'Tachi-waza' | 'Ne-waza' })}
                  className="form-input w-full"
                >
                  <option value="Tachi-waza">Tachi-waza (Standing)</option>
                  <option value="Ne-waza">Ne-waza (Ground)</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">
                Add Technique
              </button>
            </form>
          )}

          {techniques.length === 0 ? (
            <p className="text-gray-600">No custom techniques yet. Add dojo-specific techniques here.</p>
          ) : (
            <div className="space-y-2">
              {techniques.map((technique) => (
                <div
                  key={technique.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{technique.name}</p>
                    <p className="text-sm text-gray-600">{technique.category}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteTechnique(technique.id, technique.name)}
                    className="btn-secondary border-red-600 text-red-600 hover:bg-red-600 hover:text-white text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
          <p className="font-semibold mb-2">Privacy & Security</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Only invited coaches can view athlete data</li>
            <li>Removed coaches immediately lose all access</li>
            <li>Admins cannot be removed through this interface</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
