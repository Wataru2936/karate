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

  useEffect(() => {
    const opponentList = getOpponents();
    const tournamentList = getTournaments();
    setOpponents(opponentList);
    setTournaments(tournamentList);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ページ移動時の自動保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (techniques.length > 0) {
        const matchRecord: MatchRecord = {
          id: Date.now().toString(),
          date: matchInfo.date,
          matchType: matchInfo.matchType,
          tournamentName: matchInfo.tournamentName,
          opponentName: matchInfo.opponentName,
          techniques,
          penalties,
          senshu,
        };
        saveMatchRecord(matchRecord);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [techniques, penalties, matchInfo, senshu]);

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
    if (techniques.filter(t => t.actor === '自分').length === 0) {
      alert('自分の技を少なくとも1つ記録してください。');
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

  return (
    <div className="space-y-8 fade-in">
      {/* ヘッダー */}
      <div className="glass-card p-6">
        <div className="text-center">
          <div className="text-4xl mb-2">📝</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            試合記録
          </h1>
        </div>
      </div>

      {/* スコア表示 */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">自分</h3>
            <div className="score-display">{calculateScore('自分')}</div>
            <div className="text-sm text-gray-600 mt-2">
              反則: C1({getPenaltyCount('自分', 'カテゴリ1')}) C2({getPenaltyCount('自分', 'カテゴリ2')})
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600 mb-2">相手</h3>
            <div className="score-display">{calculateScore('相手')}</div>
            <div className="text-sm text-gray-600 mt-2">
              反則: C1({getPenaltyCount('相手', 'カテゴリ1')}) C2({getPenaltyCount('相手', 'カテゴリ2')})
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
                className="btn-primary py-6 text-xl"
              >
                自分
              </button>
              <button
                onClick={() => handleActorSelect('相手')}
                className="btn-danger py-6 text-xl"
              >
                相手
              </button>
            </div>
          </div>
        )}

        {recordStep === 'technique' && (
          <div className="space-y-4">
            <p className="text-center text-gray-600">
              <span className={currentTechnique.actor === '自分' ? 'text-blue-600' : 'text-red-600'}>
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
            className={`btn-primary py-6 text-xl ${senshu === '自分' ? 'ring-2 ring-blue-500' : ''}`}
          >
            自分
          </button>
          <button
            onClick={() => handleSenshuSelect('相手')}
            className={`btn-danger py-6 text-xl ${senshu === '相手' ? 'ring-2 ring-red-500' : ''}`}
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
              <h4 className="text-lg font-medium text-blue-600 mb-2">自分</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePenaltyAdd('自分', 'カテゴリ1')}
                  className="btn-secondary"
                >
                  カテゴリ1
                </button>
                <button
                  onClick={() => handlePenaltyAdd('自分', 'カテゴリ2')}
                  className="btn-secondary"
                >
                  カテゴリ2
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium text-red-600 mb-2">相手</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePenaltyAdd('相手', 'カテゴリ1')}
                  className="btn-secondary"
                >
                  カテゴリ1
                </button>
                <button
                  onClick={() => handlePenaltyAdd('相手', 'カテゴリ2')}
                  className="btn-secondary"
                >
                  カテゴリ2
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
            <h4 className="text-lg font-medium text-blue-600 mb-2">自分の技</h4>
            <div className="space-y-2">
              {techniques
                .filter(t => t.actor === '自分')
                .map((t, index) => (
                  <div key={index} className="technique-card flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center space-x-3">
                      <span className="text-blue-600 font-medium">{t.area}{t.technique}</span>
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
                    <span className="text-blue-600 font-medium">先取</span>
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
            <h4 className="text-lg font-medium text-red-600 mb-2">相手の技</h4>
            <div className="space-y-2">
              {techniques
                .filter(t => t.actor === '相手')
                .map((t, index) => (
                  <div key={index} className="technique-card flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center space-x-3">
                      <span className="text-red-600 font-medium">{t.area}{t.technique}</span>
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
                    <span className="text-red-600 font-medium">先取</span>
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
                    <span className={`font-medium ${p.actor === '自分' ? 'text-blue-600' : 'text-red-600'}`}>
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
            <select
              className="select-field"
              value={matchInfo.matchType}
              onChange={(e) => setMatchInfo({ ...matchInfo, matchType: e.target.value as MatchType })}
            >
              <option value="練習">練習</option>
              <option value="大会">大会</option>
            </select>
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
          </div>
        </div>
      </div>

      {/* 通知 */}
      {notification && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white shadow-xl rounded-lg p-6 max-w-md w-full mx-4">
          <div className="relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rotate-45"></div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">{notification.message}</span>
                <button
                  onClick={handleUndo}
                  className="text-red-600 hover:text-red-800 font-medium px-4 py-2 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
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