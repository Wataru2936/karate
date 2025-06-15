'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserInfo, saveUserInfo, calculateAge, calculateGrade } from '@/utils/storage';
import { UserInfo } from '@/types/karate';

export default function SettingsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
  });

  useEffect(() => {
    const info = getUserInfo();
    if (info) {
      setUserInfo(info);
      setFormData({
        name: info.name,
        birthDate: info.birthDate,
      });
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birthDate) return;

    const age = calculateAge(formData.birthDate);
    const grade = calculateGrade(age);
    
    const updatedUserInfo: UserInfo = {
      name: formData.name,
      birthDate: formData.birthDate,
      age,
      grade,
    };

    saveUserInfo(updatedUserInfo);
    setUserInfo(updatedUserInfo);
    alert('設定を更新しました！');
    router.push('/');
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="glass-card p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚙️</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            設定
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
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

          {userInfo && (
            <div className="bg-blue-50 p-4 rounded-xl">
              <h3 className="font-medium text-blue-800 mb-2">現在の情報</h3>
              <p className="text-blue-600">
                {userInfo.name} ({userInfo.age}歳 / {userInfo.grade})
              </p>
            </div>
          )}

          <div className="flex space-x-4">
            <button type="submit" className="btn-primary flex-1">
              設定を保存
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="btn-secondary flex-1"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 