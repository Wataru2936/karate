'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { MatchRecord } from '@/types/karate';
import { getAllMatchRecords } from '@/utils/storage';

ChartJS.register(ArcElement, Tooltip, Legend);

type AnalysisPeriod = 'all' | 'recent' | 'custom';
type MatchTypeFilter = 'all' | '練習' | '大会';

export default function AnalysisPage() {
  const [records, setRecords] = useState<MatchRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MatchRecord[]>([]);
  const [analysisPeriod, setAnalysisPeriod] = useState<AnalysisPeriod>('all');
  const [matchTypeFilter, setMatchTypeFilter] = useState<MatchTypeFilter>('all');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: '',
  });

  useEffect(() => {
    const loadRecords = () => {
      const allRecords = getAllMatchRecords();
      setRecords(allRecords);
      setFilteredRecords(allRecords);
    };

    loadRecords();
  }, []);

  useEffect(() => {
    let filtered = [...records];

    // 試合種別でフィルタリング
    if (matchTypeFilter !== 'all') {
      filtered = filtered.filter(record => record.matchType === matchTypeFilter);
    }

    // 期間でフィルタリング
    switch (analysisPeriod) {
      case 'recent':
        filtered = filtered.slice(0, 10);
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          filtered = filtered.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= new Date(customDateRange.start) && recordDate <= new Date(customDateRange.end);
          });
        }
        break;
    }

    setFilteredRecords(filtered);
  }, [records, analysisPeriod, matchTypeFilter, customDateRange]);

  // 技の得点割合を計算（円グラフ用）
  const calculateTechniqueScoreDistribution = () => {
    const scoreDistribution: { [key: string]: number } = {};
    
    filteredRecords.forEach(record => {
      record.techniques.forEach(technique => {
        const key = `${technique.technique} - ${technique.area}`;
        scoreDistribution[key] = (scoreDistribution[key] || 0) + technique.point;
      });
    });

    const labels = Object.keys(scoreDistribution);
    const data = Object.values(scoreDistribution);
    const total = data.reduce((sum, value) => sum + value, 0);
    
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];

    return {
      labels: labels.map((label, index) => {
        const percentage = total > 0 ? ((data[index] / total) * 100).toFixed(1) : '0.0';
        return `${label} (${percentage}%)`;
      }),
      datasets: [
        {
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: colors.slice(0, labels.length),
          borderWidth: 2,
        },
      ],
    };
  };

  // 技の使用頻度を計算
  const calculateTechniqueFrequency = () => {
    const frequency: { [key: string]: number } = {};
    filteredRecords.forEach(record => {
      record.techniques.forEach(technique => {
        const key = `${technique.technique}${technique.subTechnique ? ` (${technique.subTechnique})` : ''} - ${technique.area}`;
        frequency[key] = (frequency[key] || 0) + 1;
      });
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
  };

  // 反則傾向を計算
  const calculatePenaltyTrend = () => {
    const penalties = {
      category1: 0,
      category2: 0,
    };

    filteredRecords.forEach(record => {
      record.penalties.forEach(penalty => {
        if (penalty.category === 'カテゴリ1') penalties.category1++;
        if (penalty.category === 'カテゴリ2') penalties.category2++;
      });
    });

    const totalMatches = filteredRecords.length;
    return {
      category1: totalMatches ? (penalties.category1 / totalMatches).toFixed(2) : 0,
      category2: totalMatches ? (penalties.category2 / totalMatches).toFixed(2) : 0,
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            return `${label}: ${value}点`;
          }
        }
      }
    },
  };

  return (
    <div className="space-y-8 fade-in">
      {/* ヘッダー */}
      <div className="glass-card p-6">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            分析
          </h1>
        </div>
      </div>

      {/* フィルター */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold mb-4">分析条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">期間</label>
            <select
              className="select-field"
              value={analysisPeriod}
              onChange={(e) => setAnalysisPeriod(e.target.value as AnalysisPeriod)}
            >
              <option value="all">全期間</option>
              <option value="recent">直近10試合</option>
              <option value="custom">期間指定</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">試合種別</label>
            <select
              className="select-field"
              value={matchTypeFilter}
              onChange={(e) => setMatchTypeFilter(e.target.value as MatchTypeFilter)}
            >
              <option value="all">すべて</option>
              <option value="練習">練習</option>
              <option value="大会">大会</option>
            </select>
          </div>

          {analysisPeriod === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">開始日</label>
                <input
                  type="date"
                  className="input-field"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">終了日</label>
                <input
                  type="date"
                  className="input-field"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 技の得点割合（円グラフ） */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold mb-4">技の得点割合</h3>
        <div className="h-96">
          <Pie data={calculateTechniqueScoreDistribution()} options={chartOptions} />
        </div>
      </div>

      {/* 技の使用頻度ランキング */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold mb-4">技の使用頻度ランキング</h3>
        <div className="space-y-3">
          {calculateTechniqueFrequency().map(([technique, count], index) => (
            <div key={index} className="technique-card flex justify-between items-center">
              <span className="font-medium">{index + 1}. {technique}</span>
              <span className="text-blue-600 font-bold">{count}回</span>
            </div>
          ))}
          {calculateTechniqueFrequency().length === 0 && (
            <p className="text-center text-gray-500 py-8">データがありません</p>
          )}
        </div>
      </div>

      {/* 反則傾向 */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold mb-4">反則傾向（1試合平均）</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="penalty-card text-center">
            <h4 className="font-medium text-yellow-800 mb-2">カテゴリ1</h4>
            <p className="text-3xl font-bold text-yellow-600">{calculatePenaltyTrend().category1}</p>
            <p className="text-sm text-yellow-700">回/試合</p>
          </div>
          <div className="penalty-card text-center">
            <h4 className="font-medium text-orange-800 mb-2">カテゴリ2</h4>
            <p className="text-3xl font-bold text-orange-600">{calculatePenaltyTrend().category2}</p>
            <p className="text-sm text-orange-700">回/試合</p>
          </div>
        </div>
      </div>
    </div>
  );
} 