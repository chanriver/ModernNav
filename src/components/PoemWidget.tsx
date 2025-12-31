import React, { useState, useEffect } from 'react';

export const PoemWidget: React.FC = () => {
  const [poemData, setPoemData] = useState({ title: '', author: '', origin: '', content: '' });
  const [displayLines, setDisplayLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPoem = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch('https://v1.jinrishici.com/all.json');
      const data = await response.json();
      
      // 这里的正则表达式会自动识别逗号、句号、感叹号、问号，将长诗切分成短句
      const lines = data.content.split(/[，。？！；]/).filter((l: string) => l.trim().length > 0);
      
      setPoemData({
        title: data.origin,
        author: data.author,
        origin: data.origin,
        content: data.content
      });

      setDisplayLines([]);
      
      // 1. 先出标题作者
      const header = `${data.origin} · ${data.author}`;
      setTimeout(() => setDisplayLines([header]), 200);

      // 2. 逐句输出，确保所有句子都能进入数组
      lines.forEach((line: string, index: number) => {
        setTimeout(() => {
          setDisplayLines(prev => [...prev, line]);
        }, (index + 1) * 800); 
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
    /* h-auto 确保容器高度随内容自适应，不会被切断 */
    <div 
      className="flex flex-col items-end gap-5 cursor-pointer select-none group w-full h-auto min-h-[500px]"
      onClick={fetchPoem}
    >
      {displayLines.map((line, index) => {
        const isHeader = index === 0;
        return (
          <div 
            key={index}
            className={`
              transition-all duration-1000 ease-out animate-in fade-in slide-in-from-right-10
              ${isHeader 
                ? "text-sm font-bold opacity-30 tracking-[0.5em] mb-6 border-r-2 border-white/20 pr-4 py-1" 
                : "text-2xl md:text-4xl font-serif text-white/90 tracking-[0.25em] leading-snug text-right"
              }
            `}
            style={{ 
              textShadow: '0 4px 20px rgba(0,0,0,0.6)',
              // 关键：强制不换行，让每句诗占一行
              whiteSpace: 'nowrap' 
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};
