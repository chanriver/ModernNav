import React, { useState, useEffect } from 'react';

export const ClockWidget: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // 每秒更新一次状态
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // 清除定时器，防止内存泄漏
    return () => clearInterval(timer);
  }, []);

  // 格式化时间：15:30
  const timeString = time.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // 格式化秒：:45
  const secondsString = time.toLocaleTimeString('zh-CN', {
    second: '2-digit'
  });

  // 格式化日期：12月31日 星期三
  const dateString = time.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  });

  return (
    <div className="flex flex-col items-center justify-center py-1">
      <div className="flex items-baseline">
        <span className="text-3xl font-black text-white tracking-tighter">
          {timeString}
        </span>
        <span className="text-sm font-bold text-[var(--theme-primary)] ml-1 opacity-80">
          {secondsString}
        </span>
      </div>
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mt-1">
        {dateString}
      </div>
    </div>
  );
};
