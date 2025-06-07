
import React from 'react';
import { Brain, Lightbulb, FolderOpen, CircleHelp } from 'lucide-react';

const FloatingBackground = () => {
  const icons = [
    { Icon: Brain, delay: '0s', x: '10%', y: '20%' },
    { Icon: Lightbulb, delay: '2s', x: '80%', y: '15%' },
    { Icon: FolderOpen, delay: '4s', x: '20%', y: '70%' },
    { Icon: CircleHelp, delay: '6s', x: '75%', y: '60%' },
    { Icon: Brain, delay: '8s', x: '50%', y: '80%' },
    { Icon: Lightbulb, delay: '10s', x: '90%', y: '40%' }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {icons.map((item, index) => (
        <div
          key={index}
          className="absolute opacity-5 dark:opacity-10"
          style={{
            left: item.x,
            top: item.y,
            animation: `float 8s ease-in-out infinite`,
            animationDelay: item.delay
          }}
        >
          <item.Icon className="h-12 w-12 text-blue-500 dark:text-blue-400" />
        </div>
      ))}
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
};

export default FloatingBackground;
