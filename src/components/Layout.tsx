'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaClipboardList, FaChartBar, FaFileCsv } from 'react-icons/fa';
import { getUserInfo } from '@/utils/storage';
import { UserInfo } from '@/types/karate';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const info = getUserInfo();
    setUserInfo(info);
  }, []);

  const menuItems = [
    { href: '/', label: 'ホーム', icon: FaHome },
    { href: '/record', label: '記録', icon: FaClipboardList },
    { href: '/analysis', label: '分析', icon: FaChartBar },
    { href: '/export', label: 'CSV', icon: FaFileCsv },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="container mx-auto px-4 py-4">
          {userInfo && (
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-800">
                押忍👊 {userInfo.name} ({userInfo.age}歳 / {userInfo.grade})さん
              </h1>
            </div>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 pt-24 pb-32">
        {children}
      </main>

      {/* フッター */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            空手道記録&分析
          </Link>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-6 h-5 relative">
              <span className={`absolute w-6 h-0.5 bg-gray-600 transition-all ${isMenuOpen ? 'top-2 rotate-45' : 'top-0'}`}></span>
              <span className={`absolute w-6 h-0.5 bg-gray-600 top-2 transition-all ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
              <span className={`absolute w-6 h-0.5 bg-gray-600 transition-all ${isMenuOpen ? 'top-2 -rotate-45' : 'top-4'}`}></span>
            </div>
          </button>
        </div>

        {/* メニュー */}
        <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl transform transition-transform duration-300 ${isMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="p-4">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center space-x-3 p-4 rounded-lg transition-colors ${
                        pathname === item.href
                          ? 'bg-blue-50 text-blue-600'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="text-xl" />
                      <span className="text-lg">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 