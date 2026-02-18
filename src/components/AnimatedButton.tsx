import { motion } from 'framer-motion';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  type?: 'button' | 'submit';
  icon?: React.ReactNode;
}

export function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  type = 'button',
  icon,
}: AnimatedButtonProps) {
  const base = 'rounded-xl font-semibold px-6 py-3 inline-flex items-center gap-2 transition-all';
  const variants = {
    primary: 'gradient-eco text-white shadow-lg hover:shadow-glow',
    secondary: 'bg-white/10 text-white hover:bg-white/20',
    outline: 'border-2 border-eco-emerald text-eco-emerald hover:bg-eco-emerald/10',
    ghost: 'text-white/90 hover:bg-white/10',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
      {icon}
    </motion.button>
  );
}
