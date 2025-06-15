'use client';

import { useEffect, useState } from 'react';
import { exportToCSV } from '@/utils/storage';

export default function ExportPage() {
  const [csvContent, setCsvContent] = useState('');

  useEffect(() => {
    const content = exportToCSV();
    setCsvContent(content);
  }, []);

  const handleDownload = () => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `karate_records_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 fade-in">
      {/* ヘッダー */}
      <div className="glass-card p-6">
        <div className="text-center">
          <div className="text-4xl mb-2">📄</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CSV出力
          </h1>
        </div>
      </div>

      {/* エクスポート機能 */}
      <div className="glass-card p-8">
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold mb-4">記録データのエクスポート</h3>
          <p className="text-gray-600 mb-6">
            保存されているすべての記録データを1試合ごとにCSV形式でダウンロードできます。
          </p>
          
          <button
            onClick={handleDownload}
            className="btn-primary px-8 py-4 text-lg"
            disabled={!csvContent}
          >
            📥 CSVをダウンロード
          </button>
        </div>

        {/* データ概要 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <h4 className="font-medium text-blue-600 mb-1">出力形式</h4>
            <p className="text-sm text-blue-700">1試合ごと</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <h4 className="font-medium text-green-600 mb-1">データ項目</h4>
            <p className="text-sm text-green-700">得点・反則・先取</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <h4 className="font-medium text-purple-600 mb-1">ファイル形式</h4>
            <p className="text-sm text-purple-700">CSV (UTF-8)</p>
          </div>
        </div>

        {/* プレビュー */}
        {csvContent && (
          <div>
            <h4 className="font-medium text-gray-700 mb-3">📋 プレビュー</h4>
            <div className="bg-gray-50 p-4 rounded-xl overflow-x-auto border">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                {csvContent.split('\n').slice(0, 10).join('\n')}
                {csvContent.split('\n').length > 10 && '\n...（以下省略）'}
              </pre>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {csvContent.split('\n').length - 1}件の記録が含まれています
            </p>
          </div>
        )}

        {!csvContent && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-500">エクスポートするデータがありません</p>
          </div>
        )}
      </div>
    </div>
  );
} 