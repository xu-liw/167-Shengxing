import { ExhibitionTabId } from '../data/exhibitionData';

export type ExhibitionStage = 'prologue' | 'ticket-machine' | 'main';

export interface AppRoute {
  stage: ExhibitionStage;
  tab: ExhibitionTabId;
  modalId: string | null;
}

const VALID_STAGES: readonly ExhibitionStage[] = ['prologue', 'ticket-machine', 'main'];
const VALID_TABS: readonly ExhibitionTabId[] = ['explore', 'archive', 'about', 'links'];

export const INITIAL_ROUTE: AppRoute = {
  stage: 'prologue',
  tab: 'explore',
  modalId: null,
};

export function isValidRoute(value: unknown): value is AppRoute {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AppRoute>;
  if (!candidate.stage || !VALID_STAGES.includes(candidate.stage)) return false;
  if (!candidate.tab || !VALID_TABS.includes(candidate.tab)) return false;
  if (candidate.modalId !== null && typeof candidate.modalId !== 'string') return false;
  return true;
}

export function isSameRoute(a: AppRoute, b: AppRoute): boolean {
  return a.stage === b.stage && a.tab === b.tab && a.modalId === b.modalId;
}

export function getDocumentTitle(route: AppRoute): string {
  if (route.stage === 'prologue') {
    return '167次-勝興｜「回憶舊山線」線上展覽';
  }
  if (route.stage === 'ticket-machine') {
    return '自動售票機｜167次-勝興';
  }
  switch (route.tab) {
    case 'explore':
      return '01. 探索舊山線｜167次-勝興';
    case 'archive':
      return '02. 沿線圖鑑｜167次-勝興';
    case 'about':
      return '03. 關於本展｜167次-勝興';
    case 'links':
      return '04. 勝興連結｜167次-勝興';
    default:
      return '167次-勝興｜「回憶舊山線」線上展覽';
  }
}
