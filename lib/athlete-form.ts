import type { Athlete, JudoBelt, Stance } from './types';

/** Form state shared by athlete create and edit. Mirrors createAthlete/updateAthlete inputs. */
export type AthleteFormValues = {
  firstName: string;
  lastInitial: string;
  currentBelt: JudoBelt;
  stance: Stance | '';
  weightClass: string;
  ageDivision: string;
  tokuiTechniqueIds: string[];
  tokuiWaza: string;
  newazaTechniqueIds: string[];
  neWaza: string;
  kumiKata: string;
  developmentAreas: string;
  notes: string;
  preferredCoachId: string | null;
  isCoachLocked: boolean;
  coachIsExclusive: boolean;
};

export type AthleteFormErrors = Partial<Record<'firstName' | 'lastInitial', string>>;

export function emptyAthleteForm(): AthleteFormValues {
  return {
    firstName: '',
    lastInitial: '',
    currentBelt: 'unset',
    stance: '',
    weightClass: '',
    ageDivision: '',
    tokuiTechniqueIds: [],
    tokuiWaza: '',
    newazaTechniqueIds: [],
    neWaza: '',
    kumiKata: '',
    developmentAreas: '',
    notes: '',
    preferredCoachId: null,
    isCoachLocked: false,
    coachIsExclusive: false,
  };
}

export function athleteToForm(athlete: Athlete): AthleteFormValues {
  return {
    firstName: athlete.firstName,
    lastInitial: athlete.lastInitial,
    currentBelt: athlete.currentBelt || 'unset',
    stance: athlete.stance || '',
    weightClass: athlete.weightClass,
    ageDivision: athlete.ageDivision,
    tokuiTechniqueIds: athlete.tokuiTechniqueIds || [],
    tokuiWaza: athlete.tokuiWaza,
    newazaTechniqueIds: athlete.newazaTechniqueIds || [],
    neWaza: athlete.neWaza,
    kumiKata: athlete.kumiKata,
    developmentAreas: athlete.developmentAreas,
    notes: athlete.notes,
    preferredCoachId: athlete.preferredCoachId || null,
    isCoachLocked: athlete.isCoachLocked || false,
    coachIsExclusive: athlete.coachIsExclusive || false,
  };
}

/** Privacy rule: first name + a single last initial. */
export function normalizeLastInitial(raw: string): string {
  return raw.replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase();
}

export function validateAthleteForm(values: AthleteFormValues): AthleteFormErrors {
  const errors: AthleteFormErrors = {};
  if (!values.firstName.trim()) {
    errors.firstName = 'First name is required.';
  }
  if (normalizeLastInitial(values.lastInitial).length !== 1) {
    errors.lastInitial = 'Use one letter — never the full last name.';
  }
  return errors;
}

/** Payload for createAthlete/updateAthlete. `techniqueIds` is the union, as the pages always sent. */
export function athleteFormToPayload(values: AthleteFormValues) {
  const tokui = values.tokuiTechniqueIds;
  const newaza = values.newazaTechniqueIds;
  const union = [...tokui, ...newaza.filter((id) => !tokui.includes(id))];
  return {
    firstName: values.firstName.trim(),
    lastInitial: normalizeLastInitial(values.lastInitial),
    tokuiWaza: values.tokuiWaza,
    developmentAreas: values.developmentAreas,
    notes: values.notes,
    stance: (values.stance || null) as Stance,
    kumiKata: values.kumiKata,
    neWaza: values.neWaza,
    weightClass: values.weightClass,
    ageDivision: values.ageDivision,
    currentBelt: values.currentBelt,
    techniqueIds: union,
    tokuiTechniqueIds: tokui,
    newazaTechniqueIds: newaza,
    preferredCoachId: values.preferredCoachId,
    isCoachLocked: values.isCoachLocked,
    coachIsExclusive: values.coachIsExclusive,
  };
}

/** True when any optional competition detail is filled (used to open that group when editing). */
export function hasCompetitionDetails(values: AthleteFormValues): boolean {
  return Boolean(values.stance || values.weightClass || values.ageDivision);
}

export function hasTechniqueDetails(values: AthleteFormValues): boolean {
  return Boolean(
    values.tokuiTechniqueIds.length ||
      values.newazaTechniqueIds.length ||
      values.tokuiWaza ||
      values.neWaza ||
      values.kumiKata ||
      values.developmentAreas ||
      values.notes,
  );
}
