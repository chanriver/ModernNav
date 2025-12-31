import React, { useState, useEffect } from "react";

const QUOTES = [
  " Stay Hungry, Stay Foolish. —— Steve Jobs",
  "凡是过往，皆为序章。 —— 莎士比亚",
  " The journey of a thousand miles begins with one step. —— Lao Tzu",
  "生活不止眼前的苟且，还有诗和远方的田野。 —— 卧龙",
  " Success is not final, failure is not fatal. —— Winston Churchill",
  "人生的磨难是上天最好的安排。 —— 莫言",
  " Keep looking, don't settle. —— Apple"
];

export const ConsoleLog: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      // 第一步：先触发淡出动画
      setFade(false);
      
      // 第二步：延迟一段时间（等淡出完成）切换文字并触发淡入
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % QUOTES.length);
        setFade(true);
      }, 800); 

    }, 5000); // 每5秒切换一句名言

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-12 flex items-center overflow-hidden">
      <div 
        className={`font-serif italic transition-all duration-1000 ease-in-out select-none
          ${fade ? "opacity-70 translate-y-0" : "opacity-0 -translate-y-4"}
          text-lg md:text-2xl font-medium tracking-wide
        `}
        style={{ color: 'var(--theme-primary)' }}
      >
        <span className="mr-3 opacity-40">“</span>
        {QUOTES[index]}
        <span className="ml-3 opacity-40">”</span>
      </div>
    </div>
  );
};
