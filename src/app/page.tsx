'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo, saveUserInfo, calculateAge, calculateGrade } from '@/utils/storage';
import { UserInfo } from '@/types/karate';
import { FaHome, FaClipboardList, FaChartBar, FaFileCsv } from 'react-icons/fa';

export default function HomePage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
  });

  useEffect(() => {
    const info = getUserInfo();
    if (info) {
      setUserInfo(info);
    } else {
      setIsFirstTime(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birthDate) return;

    const age = calculateAge(formData.birthDate);
    const grade = calculateGrade(age);
    
    const newUserInfo: UserInfo = {
      name: formData.name,
      birthDate: formData.birthDate,
      age,
      grade,
    };

    saveUserInfo(newUserInfo);
    setUserInfo(newUserInfo);
    setIsFirstTime(false);
  };

  const menuItems = [
    { href: '/record', label: '試合記録', icon: FaClipboardList, color: 'from-blue-500 to-blue-600' },
    { href: '/analysis', label: '試合分析', icon: FaChartBar, color: 'from-purple-500 to-purple-600' },
    { href: '/export', label: 'CSV出力', icon: FaFileCsv, color: 'from-green-500 to-green-600' },
  ];

  if (isFirstTime) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 w-full max-w-md fade-in">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🥋</div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              空手道記録ツール
            </h1>
            <p className="text-gray-600">初回設定を行います</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                お名前
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="山田太郎"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                生年月日
              </label>
              <input
                type="date"
                className="input-field"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              設定を保存
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* ヘッダー */}
      <div className="glass-card p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🥋</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            押忍
          </h1>
          {userInfo && (
            <p className="text-gray-600">
              {userInfo.name} ({userInfo.age}歳 / {userInfo.grade})
            </p>
          )}
        </div>
      </div>

      {/* メニュー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="glass-card p-6 hover:scale-105 transition-transform"
            >
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className={`p-4 rounded-full bg-gradient-to-r ${item.color} text-white`}>
                    <Icon className="text-3xl" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">{item.label}</h2>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
} 