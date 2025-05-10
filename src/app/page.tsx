import React, { useState, useEffect, useRef } from 'react';

const EnhancedFireworksConfession = () => {
  const [phase, setPhase] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // 烟花系统状态
  const fireworksRef = useRef<Array<{
    x: number;
    y: number;
    targetY: number;
    speed: number;
    color: string;
    size: number;
    hasExploded: boolean;
    particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      gravity: number;
      alpha: number;
      color: string;
      size: number;
    }>;
  }>>([]);

  // 烟花颜色
  const colors = [
    '#FF1E1E', '#FF9C1E', '#FFEC1E', '#37FF1E',
    '#1EFFEC', '#1E7BFF', '#9C1EFF', '#FF1E9C'
  ];

  // 烟花发射计时器
  const launcherRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化
  useEffect(() => {
    if (phase === 0) return;

    // 设置Canvas
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    // 开始动画
    startTimeRef.current = Date.now();
    startFireworks();

    // 10秒后显示信息
    const messageTimer = setTimeout(() => {
      if (phase === 1) setPhase(2);
    }, 10000);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
      if (launcherRef.current) clearInterval(launcherRef.current);
      clearTimeout(messageTimer);
    };
  }, [phase]);

  // 烟花动画循环
  useEffect(() => {
    if (phase < 1) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animateFireworks = () => {
      // 清屏（带残影效果）
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const fireworks = fireworksRef.current;

      // 更新并绘制每个烟花
      for (let i = 0; i < fireworks.length; i++) {
        const fw = fireworks[i];

        if (!fw.hasExploded) {
          // 绘制上升中的烟花
          ctx.beginPath();
          ctx.arc(fw.x, fw.y, fw.size, 0, Math.PI * 2);
          ctx.fillStyle = fw.color;
          ctx.fill();

          // 添加尾迹
          ctx.beginPath();
          ctx.moveTo(fw.x, fw.y);
          ctx.lineTo(fw.x, fw.y + 20);
          ctx.strokeStyle = fw.color;
          ctx.globalAlpha = 0.3;
          ctx.lineWidth = fw.size * 0.8;
          ctx.stroke();
          ctx.globalAlpha = 1;

          // 上升
          fw.y -= fw.speed;

          // 检查是否达到目标高度（爆炸点）
          if (fw.y <= fw.targetY) {
            fw.hasExploded = true;
            explodeFirework(fw);
          }
        } else {
          // 绘制爆炸后的粒子
          for (let j = 0; j < fw.particles.length; j++) {
            const p = fw.particles[j];

            if (p.alpha <= 0) continue;

            // 绘制粒子
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${hexToRgb(p.color)}, ${p.alpha})`;
            ctx.fill();

            // 更新粒子位置
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.alpha -= 0.005; // 逐渐消失
          }
        }
      }

      // 移除完全消失的烟花
      fireworksRef.current = fireworks.filter(fw => {
        if (!fw.hasExploded) return true;
        return fw.particles.some(p => p.alpha > 0);
      });

      // 继续动画
      animationRef.current = requestAnimationFrame(animateFireworks);
    };

    animateFireworks();

    return () => cancelAnimationFrame(animationRef.current);
  }, [phase]);

  // 将十六进制颜色转换为RGB
  const hexToRgb = (hex: string): string => {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
  };

  // 烟花爆炸效果
  const explodeFirework = (firework: any) => {
    const particleCount = Math.floor(Math.random() * 80) + 80; // 更多粒子
    const baseHue = Math.random() * 360;

    for (let i = 0; i < particleCount; i++) {
      // 创建爆炸粒子
      const angle = (Math.PI * 2) * (i / particleCount);
      const speed = Math.random() * 3 + 2;
      const size = Math.random() * 2 + 1;

      // 随机颜色变化
      let color;
      if (Math.random() < 0.3) {
        // 30%概率使用随机颜色
        color = colors[Math.floor(Math.random() * colors.length)];
      } else {
        // 70%概率使用原始烟花颜色
        color = firework.color;
      }

      firework.particles.push({
        x: firework.x,
        y: firework.y,
        vx: Math.cos(angle) * speed * (0.8 + Math.random() * 0.4),
        vy: Math.sin(angle) * speed * (0.8 + Math.random() * 0.4),
        gravity: 0.03, // 重力效果更明显
        alpha: 1,
        color: color,
        size: size
      });
    }

    // 添加声音效果（如果用户已经与页面交互）
    if (typeof Audio !== 'undefined') {
      try {
        const audio = new Audio();
        audio.volume = 0.2;
        // 使用不同音调的爆炸声
        const sounds = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88];
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = sounds[Math.floor(Math.random() * sounds.length)];
        gainNode.gain.value = 0.1;

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start(0);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.5);
        oscillator.stop(context.currentTime + 0.5);
      } catch (e) {
        // 静默处理音频错误
      }
    }
  };

  // 发射新烟花
  const launchFirework = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 2 + 2;
    const speed = Math.random() * 1 + 1.5; // 降低速度

    // 从底部随机位置发射
    fireworksRef.current.push({
      x: Math.random() * canvas.width,
      y: canvas.height,
      targetY: Math.random() * (canvas.height * 0.5) + canvas.height * 0.1, // 目标高度（爆炸点）
      speed: speed,
      color: color,
      size: size,
      hasExploded: false,
      particles: []
    });
  };

  // 开始烟花表演
  const startFireworks = () => {
    // 立即发射几个烟花
    for (let i = 0; i < 3; i++) {
      setTimeout(() => launchFirework(), i * 600);
    }

    // 间隔发射烟花
    launcherRef.current = setInterval(() => {
      if (fireworksRef.current.length < 10) { // 限制屏幕上的烟花数量
        launchFirework();
      }
    }, 800); // 间隔时间加长
  };

  // 启动动画
  const startAnimation = () => {
    setPhase(1);
  };

  // 重启动画
  const restartAnimation = () => {
    setPhase(0);
    fireworksRef.current = [];
    setTimeout(() => startAnimation(), 100);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {phase === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={startAnimation}
            className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full text-2xl font-light tracking-wider hover:bg-white hover:text-black transition-all duration-500 transform hover:scale-105"
          >
            点亮我的心
          </button>
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
          />

          {phase >= 2 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="bg-black bg-opacity-40 p-10 rounded-2xl backdrop-filter backdrop-blur-md text-center max-w-lg transform transition-all duration-1000 ease-out">
                <h1 className="text-5xl font-bold text-white mb-8 animate-pulse">
                  我爱你
                </h1>
                <p className="text-2xl text-white mb-10 leading-relaxed font-light">
                  你是我夜空中最闪耀的星
                  <br />
                  每一次心跳，都为你加速
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={restartAnimation}
                    className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-full text-lg hover:bg-white hover:text-black transition-all duration-300 backdrop-filter backdrop-blur-sm border border-white border-opacity-30"
                  >
                    再看一次
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.8; transform: scale(1); }
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default EnhancedFireworksConfession;