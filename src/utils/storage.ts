import { MatchRecord, UserInfo } from '@/types/karate';

const STORAGE_KEY = 'karate_records';
const USER_INFO_KEY = 'karate_user_info';
const OPPONENTS_KEY = 'karate_opponents';
const TOURNAMENTS_KEY = 'karate_tournaments';

// ユーザー情報の管理
export const saveUserInfo = (userInfo: UserInfo): void => {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
};

export const getUserInfo = (): UserInfo | null => {
  const userInfo = localStorage.getItem(USER_INFO_KEY);
  return userInfo ? JSON.parse(userInfo) : null;
};

export const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const calculateGrade = (age: number): string => {
  if (age <= 6) return '幼稚園';
  if (age <= 12) return `小学${age - 5}年生`;
  if (age <= 15) return `中学${age - 11}年生`;
  if (age <= 18) return `高校${age - 14}年生`;
  if (age <= 22) return `大学${age - 17}年生`;
  return '一般';
};

// 対戦相手の管理
export const saveOpponent = (opponentName: string): void => {
  if (!opponentName.trim()) return;
  
  const opponents = getOpponents();
  if (!opponents.includes(opponentName)) {
    opponents.push(opponentName);
    localStorage.setItem(OPPONENTS_KEY, JSON.stringify(opponents));
  }
};

export const getOpponents = (): string[] => {
  const opponents = localStorage.getItem(OPPONENTS_KEY);
  return opponents ? JSON.parse(opponents) : [];
};

// 大会名の管理
export const saveTournament = (tournamentName: string): void => {
  if (!tournamentName.trim()) return;
  
  const tournaments = getTournaments();
  if (!tournaments.includes(tournamentName)) {
    tournaments.push(tournamentName);
    localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
  }
};

export const getTournaments = (): string[] => {
  const tournaments = localStorage.getItem(TOURNAMENTS_KEY);
  return tournaments ? JSON.parse(tournaments) : [];
};

// 試合記録の管理
export const saveMatchRecord = (record: MatchRecord): void => {
  const records = getAllMatchRecords();
  records.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  
  // 対戦相手を保存
  if (record.opponentName) {
    saveOpponent(record.opponentName);
  }
  
  // 大会名を保存
  if (record.tournamentName) {
    saveTournament(record.tournamentName);
  }
};

export const getAllMatchRecords = (): MatchRecord[] => {
  const records = localStorage.getItem(STORAGE_KEY);
  return records ? JSON.parse(records) : [];
};

export const getMatchRecord = (id: string): MatchRecord | undefined => {
  const records = getAllMatchRecords();
  return records.find(record => record.id === id);
};

export const updateMatchRecord = (updatedRecord: MatchRecord): void => {
  const records = getAllMatchRecords();
  const index = records.findIndex(record => record.id === updatedRecord.id);
  if (index !== -1) {
    records[index] = updatedRecord;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }
};

export const deleteMatchRecord = (id: string): void => {
  const records = getAllMatchRecords();
  const filteredRecords = records.filter(record => record.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecords));
};

export const exportToCSV = (): string => {
  const records = getAllMatchRecords();
  const headers = ['試合ID', '試合日', '試合種別', '大会名', '対戦相手', '技の記録', '先取', '自分反則カテゴリ1', '自分反則カテゴリ2', '相手反則カテゴリ1', '相手反則カテゴリ2'];
  
  const rows = records.map(record => {
    const techniques = record.techniques.map(t => 
      `${t.area}${t.technique}${t.point}点${t.actor}`
    ).join('、');
    
    const myCategory1 = record.penalties.filter(p => p.actor === '自分' && p.category === 'カテゴリ1').length;
    const myCategory2 = record.penalties.filter(p => p.actor === '自分' && p.category === 'カテゴリ2').length;
    const opponentCategory1 = record.penalties.filter(p => p.actor === '相手' && p.category === 'カテゴリ1').length;
    const opponentCategory2 = record.penalties.filter(p => p.actor === '相手' && p.category === 'カテゴリ2').length;
    
    return [
      record.id,
      record.date,
      record.matchType,
      record.tournamentName || '',
      record.opponentName || '',
      techniques,
      record.senshu || '',
      myCategory1,
      myCategory2,
      opponentCategory1,
      opponentCategory2
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}; 