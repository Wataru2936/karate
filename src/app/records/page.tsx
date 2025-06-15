'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MatchRecord } from '@/types/karate';
import { getAllMatchRecords, deleteMatchRecord } from '@/utils/storage';

export default function RecordsPage() {
  const [records, setRecords] = useState<MatchRecord[]>([]);

  useEffect(() => {
    const loadRecords = () => {
      const allRecords = getAllMatchRecords();
      setRecords(allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

    loadRecords();
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('この記録を削除してもよろしいですか？')) {
      deleteMatchRecord(id);
      setRecords(records.filter(record => record.id !== id));
    }
  };

  const calculateScore = (record: MatchRecord, actor: '自分' | '相手') => {
    return record.techniques.filter(t => t.actor === actor).reduce((sum, t) => sum + t.point, 0);
  };

  return (
    <div className="space-y-8 fade-in">
      {/* ヘッダー */}
      <div className="glass-card p-6">
        <div className="text-center">
          <div className="text-4xl mb-2">📋</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            記録一覧
          </h1>
        </div>
      </div>

      {/* 新規記録ボタン */}
      <div className="flex justify-center">
        <Link href="./record" className="btn-primary px-8 py-4 text-lg">
          ➕ 新規記録
        </Link>
      </div>

      {/* 記録一覧 */}
      <div className="space-y-4">
        {records.map((record) => (
          <div key={record.id} className="glass-card p-6 hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {record.matchType} - {record.date}
                </h3>
                {record.tournamentName && (
                  <p className="text-blue-600 font-medium">{record.tournamentName}</p>
                )}
                {record.opponentName && (
                  <p className="text-gray-600">対戦相手: {record.opponentName}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <Link
                  href={`./record/${record.id}`}
                  className="btn-secondary px-4 py-2 text-sm"
                >
                  編集
                </Link>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="btn-danger px-4 py-2 text-sm"
                >
                  削除
                </button>
              </div>
            </div>

            {/* スコア表示 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <h4 className="text-sm font-medium text-blue-600">自分</h4>
                <p className="text-2xl font-bold text-blue-700">{calculateScore(record, '自分')}</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-xl">
                <h4 className="text-sm font-medium text-red-600">相手</h4>
                <p className="text-2xl font-bold text-red-700">{calculateScore(record, '相手')}</p>
              </div>
            </div>

            {/* 技の詳細 */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">技の記録</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {record.techniques.map((technique, index) => (
                  <div key={index} className="text-sm p-2 rounded bg-gray-50">
                    <span className={technique.actor === '自分' ? 'text-blue-600' : 'text-red-600'}>
                      {technique.actor}
                    </span>
                    {' - '}
                    {technique.technique} - {technique.area} - {technique.point}点
                  </div>
                ))}
              </div>
            </div>

            {/* 先取表示 */}
            {record.senshu && (
              <div className="text-center">
                <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  先取: {record.senshu}
                </span>
              </div>
            )}
          </div>
        ))}

        {records.length === 0 && (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">記録がありません</h3>
            <p className="text-gray-500 mb-6">新規記録を追加してください</p>
            <Link href="./record" className="btn-primary">
              最初の記録を追加
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 