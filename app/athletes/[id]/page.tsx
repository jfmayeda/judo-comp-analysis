'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AthleteWithNotes, Coach, OpponentNote, Promotion, TournamentDayEntry } from '@/lib/types';
import {
  getAthleteWithNotes,
  updateAthlete,
  deleteAthlete,
  createOpponentNote,
  deleteOpponentNote,
  getPromotionsByAthleteId,
  createPromotion,
  deletePromotion,
  getAllCoaches,
  getDeletePreview,
  getTodaysTournamentAssignment,
} from '@/lib/supabase-store';
import { useAuth } from '@/lib/auth-context';
import { useCoachGate } from '@/lib/use-coach-gate';
import { athleteToForm } from '@/lib/athlete-form';
import { isSampleAthlete } from '@/lib/development';
import { AppFrame } from '@/components/AppFrame';
import { AdminCard } from '@/components/athlete/AdminCard';
import { athleteDisplayName } from '@/components/athlete/AthleteCard';
import { AthleteForm, coachDisplayName } from '@/components/athlete/AthleteForm';
import { AthleteHero } from '@/components/athlete/AthleteHero';
import { DevelopmentCard } from '@/components/athlete/DevelopmentCard';
import { FocusCard } from '@/components/athlete/FocusCard';
import { OpponentIntelCard } from '@/components/athlete/OpponentIntelCard';
import { PromotionsCard, type PromotionFormValues } from '@/components/athlete/PromotionsCard';
import { TechniqueCard } from '@/components/athlete/TechniqueCard';
import { TodayCard } from '@/components/athlete/TodayCard';
import OptOutDeleteModal from '@/components/OptOutDeleteModal';
import QuickCapture from '@/components/QuickCapture';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Notice } from '@/components/ui/Notice';

type PendingDelete = { kind: 'note'; note: OpponentNote } | { kind: 'promotion'; promotion: Promotion } | null;

export default function AthletePage() {
  const params = useParams();
  const router = useRouter();
  const athleteId = params.id as string;
  const { isAdmin } = useAuth();

  const [athlete, setAthlete] = useState<AthleteWithNotes | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [todaysAssignment, setTodaysAssignment] = useState<TournamentDayEntry | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const [flash, setFlash] = useState<{ tone: 'success' | 'danger'; title: string; body?: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePreview, setDeletePreview] = useState<{
    athleteName: string;
    opponentNotesCount: number;
    promotionsCount: number;
    tournamentEntriesCount: number;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const captureRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const loadAthlete = useCallback(async () => {
    try {
      setLoadError(null);
      const [data, coachesData, assignmentData] = await Promise.all([
        getAthleteWithNotes(athleteId),
        getAllCoaches(),
        getTodaysTournamentAssignment(athleteId),
      ]);
      setCoaches(coachesData);
      setTodaysAssignment(assignmentData);
      setAthlete(data);
      const promotionsData = await getPromotionsByAthleteId(athleteId);
      setPromotions(promotionsData);
    } catch (error) {
      console.error('Error loading athlete:', error);
      setLoadError('Could not load this athlete. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [athleteId]);

  const { ready, checking } = useCoachGate({ onReady: loadAthlete });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash === '#quick-capture') setShowQuickCapture(true);
  }, []);

  useEffect(() => {
    if (!showDeleteModal) return;
    const loadPreview = async () => {
      setIsLoadingPreview(true);
      setPreviewError(null);
      try {
        setDeletePreview(await getDeletePreview(athleteId));
      } catch (error: unknown) {
        console.error('Error loading delete preview:', error);
        setPreviewError(error instanceof Error ? error.message : 'Failed to load deletion preview');
      } finally {
        setIsLoadingPreview(false);
      }
    };
    loadPreview();
  }, [showDeleteModal, athleteId]);

  const openQuickCapture = () => {
    setFlash(null);
    setEditing(false);
    setShowQuickCapture(true);
    requestAnimationFrame(() => captureRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };

  const toggleEditing = () => {
    setFlash(null);
    setShowQuickCapture(false);
    setEditing((value) => !value);
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };

  const handleConfirmDelete = async () => {
    await deleteAthlete(athleteId);
    router.push('/');
  };

  const handleAddPromotion = async (values: PromotionFormValues) => {
    await createPromotion({ athleteId, ...values });
    // Keep the athlete's current belt in step with the promotion (existing behaviour).
    await updateAthlete(athleteId, { currentBelt: values.toBelt });
    await loadAthlete();
  };

  if (!ready || checking || loading) {
    return <LoadingScreen label="Loading athlete" />;
  }

  if (!athlete) {
    return (
      <AppFrame backHref="/" eyebrow="Athlete" narrow>
        <EmptyState
          title={loadError ? 'Athlete unavailable' : 'Athlete not found'}
          body={loadError ?? 'This athlete may have been deleted or the link is wrong.'}
          actions={<Button variant="secondary" onClick={() => router.push('/')}>Back to roster</Button>}
        />
      </AppFrame>
    );
  }

  const isSample = isSampleAthlete(athlete);
  const preferredCoach = athlete.preferredCoachId ? coaches.find((c) => c.id === athlete.preferredCoachId) ?? null : null;
  const assignedCoachName = todaysAssignment?.assignedCoachId
    ? (() => {
        const coach = coaches.find((c) => c.id === todaysAssignment.assignedCoachId);
        return coach ? coachDisplayName(coach) : null;
      })()
    : null;

  return (
    <AppFrame backHref="/" eyebrow={athleteDisplayName(athlete)} mainClassName="stack-lg">
      {flash ? (
        <Notice tone={flash.tone} title={flash.title} role={flash.tone === 'success' ? 'status' : 'alert'}>
          {flash.body}
        </Notice>
      ) : null}

      <AthleteHero
        athlete={athlete}
        isSample={isSample}
        onQuickCapture={openQuickCapture}
        onEdit={toggleEditing}
        captureOpen={showQuickCapture}
        editing={editing}
      />

      {showQuickCapture ? (
        <div ref={captureRef} className="scroll-mt-20">
          <QuickCapture
            athleteId={athlete.id}
            athleteName={athleteDisplayName(athlete)}
            onCancel={() => setShowQuickCapture(false)}
            onSaved={async (summary) => {
              setShowQuickCapture(false);
              setFlash({ tone: 'success', title: 'Capture saved', body: summary });
              await loadAthlete();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      ) : null}

      {editing ? (
        <div ref={editorRef} className="sheet scroll-mt-20 no-print" role="region" aria-labelledby="edit-athlete-title">
          <div className="sheet-header">
            <h2 id="edit-athlete-title" className="card-title">Edit {athleteDisplayName(athlete)}</h2>
          </div>
          <AthleteForm
            mode="edit"
            initial={athleteToForm(athlete)}
            coaches={coaches}
            onCancel={() => setEditing(false)}
            onSubmit={async (payload) => {
              await updateAthlete(athleteId, payload);
              setEditing(false);
              setFlash({ tone: 'success', title: 'Profile saved' });
              await loadAthlete();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      ) : null}

      {todaysAssignment ? <TodayCard assignment={todaysAssignment} coachName={assignedCoachName} /> : null}

      <FocusCard athlete={athlete} onEdit={toggleEditing} />

      <TechniqueCard athlete={athlete} onEdit={toggleEditing} />

      <OpponentIntelCard
        notes={athlete.opponentNotes}
        showAddForm={showAddNote}
        onToggleAdd={() => setShowAddNote((value) => !value)}
        onAdd={async (values) => {
          await createOpponentNote({
            athleteId,
            opponentLabel: values.opponentLabel,
            club: values.club || null,
            notes: values.notes,
            tournament: values.tournament || null,
            stance: values.stance || null,
            kumiKata: values.kumiKata,
            neWaza: values.neWaza,
            commonCounters: values.commonCounters,
            weightClass: values.weightClass,
            ageDivision: values.ageDivision,
            techniqueIds: values.techniqueIds,
            tokuiTechniqueIds: values.tokuiTechniqueIds,
            newazaTechniqueIds: values.newazaTechniqueIds,
          });
          setShowAddNote(false);
          await loadAthlete();
        }}
        onDelete={(note) => setPendingDelete({ kind: 'note', note })}
      />

      <DevelopmentCard athlete={athlete} isSample={isSample} onQuickCapture={openQuickCapture} />

      <PromotionsCard
        promotions={promotions}
        currentBelt={athlete.currentBelt}
        onAdd={handleAddPromotion}
        onDelete={(promotion) => setPendingDelete({ kind: 'promotion', promotion })}
      />

      <AdminCard
        preferredCoach={preferredCoach}
        isCoachLocked={athlete.isCoachLocked}
        coachIsExclusive={athlete.coachIsExclusive}
        isAdmin={isAdmin === true}
        onEdit={toggleEditing}
        onDelete={() => {
          setShowDeleteModal(true);
          setDeletePreview(null);
          setPreviewError(null);
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        destructive
        title={pendingDelete?.kind === 'note' ? 'Delete this opponent note?' : 'Delete this promotion record?'}
        body={
          pendingDelete?.kind === 'note'
            ? `The note about ${pendingDelete.note.opponentLabel} will be removed. Shared opponent records are kept.`
            : pendingDelete?.kind === 'promotion'
              ? 'The belt history entry will be removed. The current belt on the profile is not changed.'
              : null
        }
        confirmLabel="Delete"
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          if (pendingDelete.kind === 'note') await deleteOpponentNote(pendingDelete.note.id);
          else await deletePromotion(pendingDelete.promotion.id);
          await loadAthlete();
        }}
      />

      <OptOutDeleteModal
        athlete={athlete}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        deletePreview={deletePreview}
        isLoadingPreview={isLoadingPreview}
        previewError={previewError}
      />
    </AppFrame>
  );
}
