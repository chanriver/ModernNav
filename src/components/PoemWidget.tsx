import React, { useState, useEffect } from 'react';

export const PoemWidget: React.FC = () => {
  const [poemData, setPoemData] = useState({ title: '', author: '', origin: '', content: '' });
  const [displayLines, setDisplayLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPoem = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // 使用今日诗词 API
      const response = await fetch('https://v1.jinrishici.com/all.json');
      const data = await response.json();
      
      // 1. 解析数据
      const fullContent = data.content;
      // 按照标点拆分，但保留完整性
      const lines = fullContent.split(/[，。？！；]/).filter((l: string) => l.trim().length > 0);
      
      setPoemData({
        title: data.origin,
        author: data.author,
        origin: data.origin,
        content: data.content
      });

      // 2. 逐句动画逻辑
      setDisplayLines([]);
      
      // 第一步：先显示标题和作者
      const header = `${data.origin} · ${data.author}`;
      setTimeout(() => {
        setDisplayLines([header]);
      }, 200);

      // 第二步：随后逐句显示正文
      lines.forEach((line: string, index: number) => {
        setTimeout(() => {
          setDisplayLines(prev => [...prev, line]);
        }, (index + 1) * 1000); // 每秒出一句，节奏更有仙侠气
      });

    } catch (error) {
      console.error("诗词加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoem();
  }, []);

  return (
    <div 
      className="flex flex-col items-end gap-6 cursor-pointer select-none group min-h-[300px]"
      onClick={fetchPoem}
    >
      {displayLines.map((line, index) => {
        // 第一行是标题作者，样式稍有不同
        const isHeader = index === 0;
        
        return (
          <div 
            key={index}
            className={`
              transition-all duration-1000 ease-out animate-in fade-in slide-in-from-right-8
              ${isHeader 
                ? "text-sm font-bold opacity-40 tracking-[0.4em] mb-4 border-b border-white/10 pb-2" 
                : "text-2xl md:text-3xl font-serif text-white/90 tracking-[0.2em] leading-relaxed"
              }
            `}
            style={{ 
              textShadow: '0 2px 15px rgba(0,0,0,0.5)',
              fontFamily: '"Noto Serif SC", "Source Han Serif SC", "SimSun", serif'
            }}
          >
            {line}
            {!isHeader && <span className="ml-2 opacity-20">。</span>}
          </div>
        );
      })}

      {/* 刷新提示 - 仅在悬停时显示 */}
      <div className="mt-4 opacity-0 group-hover:opacity-20 transition-opacity text-[10px] text-white tracking-widest">
        点击意境处 换一卷诗书
      </div>
    </div>
  );
};
