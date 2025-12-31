import React, { useState, useEffect } from 'react';

export const PoemWidget: React.FC = () => {
  const [poemData, setPoemData] = useState({ content: '', author: '', origin: '' });
  const [displayLines, setDisplayLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPoem = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://v1.jinrishici.com/all.json');
      const data = await response.json();
      
      // 处理诗句：按标点符号拆分成多行
      const lines = data.content.split(/[，。？！；]/).filter((l: string) => l.trim().length > 0);
      
      setPoemData({
        content: data.content,
        author: data.author,
        origin: data.origin
      });
      
      // 重置并逐句显示
      setDisplayLines([]);
      lines.forEach((line: string, index: number) => {
        setTimeout(() => {
          setDisplayLines(prev => [...prev, line]);
        }, index * 800); // 每隔 800ms 输出下一句
      });
    } catch (error) {
      console.error("获取诗词失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoem();
  }, []);

  return (
    <div 
      className="flex flex-col items-start gap-4 cursor-pointer select-none group"
      onClick={fetchPoem}
    >
      {/* 诗词正文：逐行渲染 */}
      <div className="space-y-3">
        {displayLines.map((line, index) => (
          <div 
            key={index}
            className="text-2xl md:text-3xl font-serif text-white/90 tracking-[0.15em] animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards"
            style={{ 
              textShadow: '0 2px 10px rgba(0,0,0,0.5)', // 确保在亮色背景下也清晰
              fontFamily: 'serif' 
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* 作者信息：在最后一句出现后淡入 */}
      <div 
        className={`flex items-center gap-3 transition-all duration-1000 delay-1000 ${
          displayLines.length > 0 ? 'opacity-40' : 'opacity-0'
        }`}
      >
        <div className="w-8 h-[1px] bg-white"></div>
        <span className="text-xs font-light tracking-[0.3em]">
          {poemData.author} · 《{poemData.origin}》
        </span>
      </div>
    </div>
  );
};
