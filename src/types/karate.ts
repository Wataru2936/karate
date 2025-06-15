export type TechniqueType = '突き' | '蹴り' | 'こかし';
export type TargetArea = '上段' | '中段';
export type Point = 1 | 2 | 3;
export type PenaltyCategory = 'カテゴリ1' | 'カテゴリ2';
export type MatchType = '練習' | '大会';

export interface UserInfo {
  name: string;
  birthDate: string;
  age: number;
  grade: string;
}

export interface TechniqueRecord {
  matchId: string;
  date: string;
  matchType: MatchType;
  tournamentName?: string;
  opponentName?: string;
  actor: '自分' | '相手';
  technique: TechniqueType;
  subTechnique?: '突き' | '蹴り'; // for こかし only
  area: TargetArea;
  point: Point;
  penalty?: PenaltyCategory;
  isSenshu?: boolean;
}

export interface PenaltyRecord {
  matchId: string;
  actor: '自分' | '相手';
  category: PenaltyCategory;
}

export interface MatchRecord {
  id: string;
  date: string;
  matchType: MatchType;
  tournamentName?: string;
  opponentName?: string;
  techniques: TechniqueRecord[];
  penalties: PenaltyRecord[];
  senshu: '自分' | '相手' | null;
} 