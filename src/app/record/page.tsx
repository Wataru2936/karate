'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TechniqueType, TargetArea, Point, PenaltyCategory, MatchType, TechniqueRecord, PenaltyRecord, MatchRecord } from '@/types/karate';
import { saveMatchRecord, getOpponents, getTournaments } from '@/utils/storage';

type RecordStep = 'actor' | 'technique' | 'area' | 'point';

interface Notification {
  message: string;
  type: 'technique' | 'penalty' | 'senshu';
  data: TechniqueRecord | PenaltyRecord | { actor: '自分' | '相手' | null };
}

export default function RecordPage() {
  const router = useRouter();
  const [techniques, setTechniques] = useState<TechniqueRecord[]>([]);
  const [penalties, setPenalties] = useState<PenaltyRecord[]>([]);
  const [opponents, setOpponents] = useState<string[]>([]);
  const [tournaments, setTournaments] = useState<string[]>([]);
  const [notification, setNotification] = useState<Notification | null>(null);
  
  // 得点記録のステップ管理
  const [recordStep, setRecordStep] = useState<RecordStep>('actor');
  const [currentTechnique, setCurrentTechnique] = useState<Partial<TechniqueRecord>>({});
  
  const [matchInfo, setMatchInfo] = useState({
    matchType: '練習' as MatchType,
    date: new Date().toISOString().split('T')[0],
    tournamentName: '',
    opponentName: '',
  });
  const [senshu, setSenshu] = useState<'自分' | '相手' | null>(null);
  const [isSwapped, setIsSwapped] = useState(false);
  const selfColor = isSwapped ? 'red' : 'blue';
  const opponentColor = isSwapped ? 'blue' : 'red';

  const [recentTournaments, setRecentTournaments] = useState<string[]>([]);
  const [recentOpponents, setRecentOpponents] = useState<string[]>([]);

  useEffect(() => {
    const opponentList = getOpponents();
    const tournamentList = getTournaments();
    setOpponents(opponentList);
    setTournaments(tournamentList);
  }, []);

  useEffect(() => {
    setRecentTournaments(getTournaments().slice(0, 5));
    setRecentOpponents(getOpponents().slice(0, 5));
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ページ遷移時の警告と自動保存
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const selfScore = calculateScore('自分');
      const opponentScore = calculateScore('相手');
      if (selfScore > 0 || opponentScore > 0) {
        const matchRecord: MatchRecord = {
          id: Date.now().toString(),
          date: matchInfo.date,
          matchType: matchInfo.matchType,
          tournamentName: matchInfo.tournamentName,
          opponentName: matchInfo.opponentName,
          techniques,
          penalties,
          senshu,
          isSwapped,
        };
        saveMatchRecord(matchRecord);
      } else if (techniques.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [techniques, penalties, matchInfo, senshu, isSwapped]);

  useEffect(() => {
    localStorage.setItem('karate_color_swapped', isSwapped.toString());
  }, [isSwapped]);

  const resetTechniqueForm = () => {
    setCurrentTechnique({});
    setRecordStep('actor');
  };

  const handleActorSelect = (actor: '自分' | '相手') => {
    setCurrentTechnique({ ...currentTechnique, actor });
    setRecordStep('technique');
  };

  const handleTechniqueSelect = (technique: TechniqueType) => {
    setCurrentTechnique({ ...currentTechnique, technique });
    if (technique === 'こかし') {
      setRecordStep('point');
    } else {
      setRecordStep('area');
    }
  };

  const handleAreaSelect = (area: TargetArea) => {
    setCurrentTechnique({ ...currentTechnique, area });
    setRecordStep('point');
  };

  const handlePointSelect = (point: Point) => {
    const newTechnique: TechniqueRecord = {
      matchId: Date.now().toString(),
      date: matchInfo.date,
      matchType: matchInfo.matchType,
      tournamentName: matchInfo.tournamentName,
      opponentName: matchInfo.opponentName,
      actor: currentTechnique.actor!,
      technique: currentTechnique.technique!,
      area: currentTechnique.area || '中段',
      point,
      subTechnique: currentTechnique.technique === 'こかし' ? '突き' : undefined,
    };

    setTechniques([...techniques, newTechnique]);
    setNotification({
      message: `${currentTechnique.actor}・${currentTechnique.area || ''}${currentTechnique.technique}${point}点と記録しました`,
      type: 'technique',
      data: newTechnique
    });
    resetTechniqueForm();
  };

  const handlePenaltyAdd = (actor: '自分' | '相手', category: PenaltyCategory) => {
    const newPenalty: PenaltyRecord = {
      matchId: Date.now().toString(),
      actor,
      category,
    };
    setPenalties([...penalties, newPenalty]);
    setNotification({
      message: `${actor}の${category}を記録しました`,
      type: 'penalty',
      data: newPenalty
    });
  };

  const handleSenshuSelect = (actor: '自分' | '相手' | null) => {
    setSenshu(actor);
    setNotification({
      message: actor ? `${actor}の先取を記録しました` : '先取なしを記録しました',
      type: 'senshu',
      data: { actor }
    });
  };

  const handleUndo = () => {
    if (!notification) return;
    
    if (notification.type === 'technique') {
      const technique = notification.data as TechniqueRecord;
      setTechniques(techniques.filter(t => t.matchId !== technique.matchId));
    } else if (notification.type === 'penalty') {
      const penalty = notification.data as PenaltyRecord;
      setPenalties(penalties.filter(p => p.matchId !== penalty.matchId));
    } else if (notification.type === 'senshu') {
      setSenshu(null);
    }
    setNotification(null);
  };

  const handleSave = () => {
    const selfScore = calculateScore('自分');
    const opponentScore = calculateScore('相手');
    if (selfScore === 0 && opponentScore === 0) {
      alert('自分または相手の技を少なくとも1つ記録してください。');
      return;
    }
    const matchRecord: MatchRecord = {
      id: Date.now().toString(),
      date: matchInfo.date,
      matchType: matchInfo.matchType,
      tournamentName: matchInfo.tournamentName,
      opponentName: matchInfo.opponentName,
      techniques,
      penalties,
      senshu,
      isSwapped,
    };
    saveMatchRecord(matchRecord);
    router.push('/records');
  };

  const calculateScore = (actor: '自分' | '相手') => {
    return techniques.filter(t => t.actor === actor).reduce((sum, t) => sum + t.point, 0);
  };

  const getPenaltyCount = (actor: '自分' | '相手', category: PenaltyCategory) => {
    return penalties.filter(p => p.actor === actor && p.category === category).length;
  };

  // 色判定用関数
  const getColor = (actor: '自分' | '相手') => {
    if (actor === '自分') return selfColor;
    return opponentColor;
  };

  // 色クラス取得
  const getBtnClass = (actor: '自分' | '相手') =>
    getColor(actor) === 'blue' ? 'btn-primary' : 'btn-danger';

  return (
    <div className="space-y-8 fade-in">
      {/* ヘッダー */}
      <div className="glass-card p-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="text-center md:text-left">
          <div className="text-4xl mb-2">📝</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            試合記録
          </h1>
        </div>
        <button
          className="mt-4 md:mt-0 btn-secondary px-6 py-2 text-base"
          onClick={() => setIsSwapped((prev) => !prev)}
        >
          赤と青を入れ替える
        </button>
      </div>

      {/* スコア表示 */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <h3 className={`text-lg font-semibold text-${getColor('自分')}-600 mb-2`}>{isSwapped ? '自分（赤）' : '自分（青）'}</h3>
            <div className={`score-display text-${getColor('自分')}-600`}>{calculateScore('自分')}</div>
            <div className="text-sm text-gray-600 mt-2">
              反則: C1({getPenaltyCount('自分', 'C1')}) C2({getPenaltyCount('自分', 'C2')})
            </div>
          </div>
          <div className="text-center">
            <h3 className={`text-lg font-semibold text-${getColor('相手')}-600 mb-2`}>{isSwapped ? '相手（青）' : '相手（赤）'}</h3>
            <div className={`score-display text-${getColor('相手')}-600`}>{calculateScore('相手')}</div>
            <div className="text-sm text-gray-600 mt-2">
              反則: C1({getPenaltyCount('相手', 'C1')}) C2({getPenaltyCount('相手', 'C2')})
            </div>
          </div>
        </div>
      </div>

      {/* 得点の記録 */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold mb-4">得点の記録</h3>
        
        {recordStep === 'actor' && (
          <div className="space-y-4">
            <p className="text-center text-gray-600">誰の得点ですか？</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleActorSelect('自分')}
                className={`${getBtnClass('自分')} py-6 text-xl`}
              >
                自分
              </button>
              <button
                onClick={() => handleActorSelect('相手')}
                className={`${getBtnClass('相手')} py-6 text-xl`}
              >
                相手
              </button>
            </div>
          </div>
        )}

        {recordStep === 'technique' && (
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              <span className={getColor(currentTechnique.actor as '自分' | '相手') === 'blue' ? 'text-blue-600' : 'text-red-600'}>
                {currentTechnique.actor}
              </span>
              の技の種類は？
            </p>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleTechniqueSelect('突き')}
                className="btn-secondary py-6"
              >
                突き
              </button>
              <button
                onClick={() => handleTechniqueSelect('蹴り')}
                className="btn-secondary py-6"
              >
                蹴り
              </button>
              <button
                onClick={() => handleTechniqueSelect('こかし')}
                className="btn-secondary py-6"
              >
                こかし
              </button>
            </div>
            <button onClick={resetTechniqueForm} className="btn-secondary w-full">
              戻る
            </button>
          </div>
        )}

        {recordStep === 'area' && (
          <div className="space-y-4">
            <p className="text-center text-gray-600">どこに当てましたか？</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAreaSelect('上段')}
                className="btn-secondary py-6"
              >
                上段
              </button>
              <button
                onClick={() => handleAreaSelect('中段')}
                className="btn-secondary py-6"
              >
                中段
              </button>
            </div>
            <button onClick={resetTechniqueForm} className="btn-secondary w-full">
              戻る
            </button>
          </div>
        )}

        {recordStep === 'point' && (
          <div className="space-y-4">
            <p className="text-center text-gray-600">何点ですか？</p>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handlePointSelect(1)}
                className="btn-secondary py-6"
              >
                1点
              </button>
              <button
                onClick={() => handlePointSelect(2)}
                className="btn-secondary py-6"
              >
                2点
              </button>
              <button
                onClick={() => handlePointSelect(3)}
                className="btn-secondary py-6"
              >
                3点
              </button>
            </div>
            <button onClick={resetTechniqueForm} className="btn-secondary w-full">
              戻る
            </button>
          </div>
        )}
      </div>

      {/* 先取 */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold mb-4">先取</h3>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleSenshuSelect('自分')}
            className={`${getBtnClass('自分')} py-6 text-xl ${senshu === '自分' ? 'ring-2 ring-blue-500' : ''}`}
          >
            自分
          </button>
          <button
            onClick={() => handleSenshuSelect('相手')}
            className={`${getBtnClass('相手')} py-6 text-xl ${senshu === '相手' ? 'ring-2 ring-red-500' : ''}`}
          >
            相手
          </button>
          <button
            onClick={() => handleSenshuSelect(null)}
            className={`btn-secondary py-6 text-xl ${senshu === null ? 'ring-2 ring-gray-500' : ''}`}
          >
            なし
          </button>
        </div>
      </div>

      {/* 反則の記録 */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold mb-4">反則の記録</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className={`text-lg font-medium text-${getColor('自分')}-600 mb-2`}>自分</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePenaltyAdd('自分', 'C1')}
                  className="btn-secondary"
                >
                  C1
                </button>
                <button
                  onClick={() => handlePenaltyAdd('自分', 'C2')}
                  className="btn-secondary"
                >
                  C2
                </button>
              </div>
            </div>
            <div>
              <h4 className={`text-lg font-medium text-${getColor('相手')}-600 mb-2`}>相手</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePenaltyAdd('相手', 'C1')}
                  className="btn-secondary"
                >
                  C1
                </button>
                <button
                  onClick={() => handlePenaltyAdd('相手', 'C2')}
                  className="btn-secondary"
                >
                  C2
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 記録済み */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold mb-4">記録済み</h3>
        <div className="space-y-6">
          <div>
            <h4 className={`text-lg font-medium text-${getColor('自分')}-600 mb-2`}>自分の技</h4>
            <div className="space-y-2">
              {techniques
                .filter(t => t.actor === '自分')
                .map((t, index) => (
                  <div key={index} className="technique-card flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center space-x-3">
                      <span className={`font-medium text-${getColor('自分')}-600`}>{t.area}{t.technique}</span>
                      <span className="text-lg font-bold">{t.point}点</span>
                    </div>
                    <button
                      onClick={() => setTechniques(techniques.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      削除
                    </button>
                  </div>
                ))}
              {senshu === '自分' && (
                <div className="technique-card flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center space-x-3">
                    <span className={`font-medium text-${getColor('自分')}-600`}>先取</span>
                    <span className="text-lg font-bold">0.1点</span>
                  </div>
                  <button
                    onClick={() => handleSenshuSelect(null)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className={`text-lg font-medium text-${getColor('相手')}-600 mb-2`}>相手の技</h4>
            <div className="space-y-2">
              {techniques
                .filter(t => t.actor === '相手')
                .map((t, index) => (
                  <div key={index} className="technique-card flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center space-x-3">
                      <span className={`font-medium text-${getColor('相手')}-600`}>{t.area}{t.technique}</span>
                      <span className="text-lg font-bold">{t.point}点</span>
                    </div>
                    <button
                      onClick={() => setTechniques(techniques.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      削除
                    </button>
                  </div>
                ))}
              {senshu === '相手' && (
                <div className="technique-card flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center space-x-3">
                    <span className={`font-medium text-${getColor('相手')}-600`}>先取</span>
                    <span className="text-lg font-bold">0.1点</span>
                  </div>
                  <button
                    onClick={() => handleSenshuSelect(null)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-lg font-medium mb-2">反則</h4>
            <div className="space-y-2">
              {penalties.map((p, index) => (
                <div key={index} className="technique-card flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center space-x-3">
                    <span className={`font-medium text-${getColor(p.actor)}-600`}>
                      {p.actor} - {p.category}
                    </span>
                  </div>
                  <button
                    onClick={() => setPenalties(penalties.filter((_, i) => i !== index))}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 試合情報 */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold mb-4">試合情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">試合種別</label>
            <div className="flex gap-4 mb-2">
              <button
                type="button"
                className={`btn-secondary px-4 py-2 ${matchInfo.matchType === '練習' ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setMatchInfo({ ...matchInfo, matchType: '練習' })}
              >
                練習
              </button>
              <button
                type="button"
                className={`btn-secondary px-4 py-2 ${matchInfo.matchType === '大会' ? 'ring-2 ring-purple-500' : ''}`}
                onClick={() => setMatchInfo({ ...matchInfo, matchType: '大会' })}
              >
                大会
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">日付</label>
            <input
              type="date"
              className="input-field"
              value={matchInfo.date}
              onChange={(e) => setMatchInfo({ ...matchInfo, date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">大会名</label>
            <input
              type="text"
              className="input-field"
              value={matchInfo.tournamentName}
              onChange={(e) => setMatchInfo({ ...matchInfo, tournamentName: e.target.value })}
              placeholder="大会名（任意）"
              list="tournaments"
            />
            <datalist id="tournaments">
              {tournaments.map((tournament, index) => (
                <option key={index} value={tournament} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-2 mt-2">
              {recentTournaments.map((name, idx) => (
                <button key={idx} type="button" className="btn-secondary px-3 py-1 text-sm" onClick={() => setMatchInfo({ ...matchInfo, tournamentName: name })}>{name}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">対戦相手</label>
            <input
              type="text"
              className="input-field"
              value={matchInfo.opponentName}
              onChange={(e) => setMatchInfo({ ...matchInfo, opponentName: e.target.value })}
              placeholder="対戦相手名（任意）"
              list="opponents"
            />
            <datalist id="opponents">
              {opponents.map((opponent, index) => (
                <option key={index} value={opponent} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-2 mt-2">
              {recentOpponents.map((name, idx) => (
                <button key={idx} type="button" className="btn-secondary px-3 py-1 text-sm" onClick={() => setMatchInfo({ ...matchInfo, opponentName: name })}>{name}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 通知 */}
      {notification && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 shadow-xl rounded-lg p-6 max-w-md w-full mx-4">
          <div className="relative">
            <div className="rounded-lg p-4 border border-gray-200"
              style={{ backgroundColor: notification.data && (notification.data as any).actor === '自分' ? (selfColor === 'blue' ? 'rgba(59,130,246,0.7)' : 'rgba(239,68,68,0.7)') : (notification.data && (notification.data as any).actor === '相手' ? (opponentColor === 'blue' ? 'rgba(59,130,246,0.7)' : 'rgba(239,68,68,0.7)') : 'rgba(107,114,128,0.7)' ) }}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-white">{notification.message}</span>
                <button
                  onClick={handleUndo}
                  className="text-white hover:text-gray-200 font-medium px-4 py-2 border border-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 保存ボタン */}
      <div className="glass-card p-6">
        <button
          onClick={handleSave}
          className="btn-primary w-full py-4 text-xl"
        >
          保存
        </button>
      </div>
    </div>
  );
} 