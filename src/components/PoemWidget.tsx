import React, { useState, useEffect } from 'react';

export const PoemWidget: React.FC = () => {
  const [poem, setPoem] = useState({ content: '正在寻觅诗句...', author: '', origin: '' });
  const [loading, setLoading] = useState(false);

  const fetchPoem = async () => {
    setLoading(true);
    try {
      // 使用今日诗词 API
      const response = await fetch('https://v1.jinrishici.com/all.json');
      const data = await response.json();
      setPoem({
        content: data.content,
        author: data.author,
        origin: data.origin
      });
    } catch (error) {
      setPoem({ content: '此间无声，唯有清风。', author: '无名', origin: '自然' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoem();
  }, []);

  return (
    <div 
      className="flex flex-col items-start gap-2 cursor-pointer group/poem"
      onClick={fetchPoem}
      title="点击刷新诗词"
    >
      {/* 诗词正文 */}
      <div className={`text-sm font-medium leading-relaxed transition-opacity duration-300 ${loading ? 'opacity-30' : 'opacity-100'}`}>
        {poem.content}
      </div>
      
      {/* 作者信息 */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-[1px] bg-[var(--theme-primary)] opacity-50"></div>
        <span className="text-[10px] opacity-40 font-bold tracking-wider">
          {poem.author} · 《{poem.origin}》
        </span>
      </div>

      {/* 刷新提示 - 仅在悬停时微弱显示 */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover/poem:opacity-20 transition-opacity">
        <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    </div>
  );
};
