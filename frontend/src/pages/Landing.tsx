import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { UserMenu } from '../components/UserMenu';
import { useAuth } from '../context/AuthContext';
import React from 'react';

// FIX A: useCountUp hook defined OUTSIDE Landing component
function useCountUp(target: number, duration: number = 2000) {
  const [count, setCount] = React.useState(0);
  const [hasStarted, setHasStarted] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !hasStarted) setHasStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  React.useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [hasStarted, target, duration]);

  return { count, ref };
}

export function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // STEP 1: Scroll progress bar
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // STEP 3a: Canvas refs for particle system
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const mouseRef = React.useRef({ x: -9999, y: -9999 });

  // STEP 4: Mouse parallax on glow blobs
  const blob1X = useSpring(0, { stiffness: 50, damping: 20 });
  const blob1Y = useSpring(0, { stiffness: 50, damping: 20 });
  const blob2X = useSpring(0, { stiffness: 50, damping: 20 });
  const blob2Y = useSpring(0, { stiffness: 50, damping: 20 });
  const heroRef = React.useRef<HTMLElement>(null);

  // STEP 3b: Canvas particle effect
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const PARTICLE_COUNT = 120;
    const REPULSION_RADIUS = 90;
    const REPULSION_STRENGTH = 2.0;
    const RETURN_SPEED = 0.04;
    const CONNECTION_DIST = 80;

    type Particle = {
      originX: number; originY: number;
      x: number; y: number;
      vx: number; vy: number;
      floatOffset: number; floatSpeed: number; floatAmplitude: number;
      size: number; color: string;
      opacity: number; opacitySpeed: number; opacityPhase: number;
    };

    const colors = ['rgba(15,184,128,', 'rgba(14,165,233,'];

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      originX: Math.random() * canvas.width,
      originY: Math.random() * canvas.height,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: 0, vy: 0,
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.003 + Math.random() * 0.004,
      floatAmplitude: 20 + Math.random() * 30,
      size: Math.random() * 3 + 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.3 + Math.random() * 0.5,
      opacitySpeed: 0.005 + Math.random() * 0.008,
      opacityPhase: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      const prevW = canvas.width || canvas.offsetWidth;
      const prevH = canvas.height || canvas.offsetHeight;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Rescale particle origins proportionally to new canvas size
      const scaleX = canvas.width / prevW;
      const scaleY = canvas.height / prevH;
      particles.forEach(p => {
        p.originX *= scaleX;
        p.originY *= scaleY;
        p.x *= scaleX;
        p.y *= scaleY;
      });
    };
    resize();
    window.addEventListener('resize', resize);

    let frame = 0;
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Draw connection lines first (behind particles)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const ddx = particles[i].x - particles[j].x;
          const ddy = particles[i].y - particles[j].y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < CONNECTION_DIST) {
            const alpha = (1 - d / CONNECTION_DIST) * 0.10;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(15,184,128,${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw and update particles
      particles.forEach(p => {
        const floatY = Math.sin(frame * p.floatSpeed + p.floatOffset) * p.floatAmplitude;
        const floatX = Math.cos(frame * p.floatSpeed * 0.7 + p.floatOffset) * (p.floatAmplitude * 0.4);
        const targetX = p.originX + floatX;
        const targetY = p.originY + floatY;

        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPULSION_RADIUS && dist > 0) {
          const force = (REPULSION_RADIUS - dist) / REPULSION_RADIUS;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force * REPULSION_STRENGTH;
          p.vy += Math.sin(angle) * force * REPULSION_STRENGTH;
        }

        p.vx += (targetX - p.x) * RETURN_SPEED;
        p.vy += (targetY - p.y) * RETURN_SPEED;
        p.vx *= 0.88;
        p.vy *= 0.88;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        const opacityNow = p.opacity *
          (0.5 + 0.5 * Math.sin(frame * p.opacitySpeed + p.opacityPhase));

        // Faint glow halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${(opacityNow * 0.15).toFixed(3)})`;
        ctx.fill();

        // Core particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${opacityNow.toFixed(3)})`;
        ctx.fill();
      });
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // STEP 5: Stats count-up hooks
  const commutersCount = useCountUp(15000, 2000);
  const co2Count = useCountUp(45, 2000);
  const citiesCount = useCountUp(4, 2000);
  const fasterCount = useCountUp(38, 2000);

  // STEP 8: Cities array for marquee
  const cities = [
    { name: 'CHANDIGARH METRO', icon: 'subway', font: 'font-serif' },
    { name: 'RAJPURA LINK', icon: 'directions_bus', font: 'font-black tracking-tighter' },
    { name: 'PATIALA SPEED', icon: 'electric_rickshaw', font: 'font-mono' },
    { name: 'AMBALA TRANSIT', icon: 'train', font: 'font-bold italic' },
    { name: 'MOHALI CONNECT', icon: 'tram', font: 'font-semibold' },
    { name: 'ZIRAKPUR EXPRESS', icon: 'directions_bus', font: 'font-extrabold' },
  ];

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  // STEP 4: Mouse move handler with blob parallax + canvas mouse tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    blob1X.set(x * 0.01);
    blob1Y.set(y * 0.01);
    blob2X.set(x * -0.008);
    blob2Y.set(y * -0.008);

    // STEP 3c: Update canvas mouse ref
    const canvasEl = canvasRef.current;
    const canvasRect = canvasEl?.getBoundingClientRect();
    if (canvasRect) {
      mouseRef.current = {
        x: e.clientX - canvasRect.left,
        y: e.clientY - canvasRect.top,
      };
    }
  };

  // STEP 3d: Mouse leave handler
  const handleMouseLeave = () => {
    mouseRef.current = { x: -9999, y: -9999 };
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-display antialiased overflow-x-hidden selection:bg-primary selection:text-white">
      {/* STEP 1: Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-primary z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* FIX C: Style tag for gridDrift animation (plain <style>, no jsx) */}
      <style>{`
        @keyframes gridDrift {
          0% { background-position: 0 0; }
          100% { background-position: 0 -40px; }
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed w-full z-50 glass-card border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="material-icons text-white text-lg">directions_bus</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-white">CommuteSmart</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <a className="text-sm font-medium text-gray-300 hover:text-primary transition-colors" href="#features">Features</a>
              <a className="text-sm font-medium text-gray-300 hover:text-primary transition-colors" href="#how-it-works">How it Works</a>
              <a className="text-sm font-medium text-gray-300 hover:text-primary transition-colors" href="#cities">Cities</a>
              {user ? (
                <UserMenu />
              ) : (
                <>
                  <Link className="text-sm font-medium text-primary hover:text-primary-dark transition-colors" to="/login">Login</Link>
                  <Link
                    className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-all shadow-lg shadow-primary/20"
                    to="/register"
                  >
                    Get App
                  </Link>
                </>
              )}
            </div>
            <div className="md:hidden flex items-center">
              <button type="button" className="text-gray-300 hover:text-white" aria-label="Menu">
                <span className="material-icons">menu</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - STEP 2: Animated dot-grid background + STEP 3: Canvas particles + STEP 4: Mouse parallax */}
      <section
        ref={heroRef}
        className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(15,184,128,0.18) 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
          animation: 'gridDrift 5s linear infinite'
        }}
      >
        {/* STEP 3e: Canvas as first child */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          style={{ opacity: 0.85 }}
        />

        <div className="absolute inset-0 hero-bg-pattern pointer-events-none" />

        {/* FIX E: Glow Blob 1 - style for movement, animate for pulse only */}
        <motion.div
          className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"
          style={{ x: blob1X, y: blob1Y }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* FIX E: Glow Blob 2 - style for movement, animate for pulse only */}
        <motion.div
          className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[80px] pointer-events-none"
          style={{ x: blob2X, y: blob2Y }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-primary/20 mb-8"
            {...fadeInUp}
            transition={{ delay: 0.2 }}
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </span>
            <span className="text-sm font-medium text-primary tracking-wide uppercase">Live in Rajpura & Chandigarh</span>
          </motion.div>
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-tight"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
          >
            Optimize Your Commute, <br />
            <span className="text-gradient">Save the Planet</span>
          </motion.h1>
          <motion.p
            className="mt-4 max-w-2xl mx-auto text-xl text-gray-400 mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Join the largest community-driven transit network in the region. Real-time updates, eco-tracking, and rewards for every mile you save.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <motion.div
              className="w-full sm:w-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.button
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-white font-bold text-lg btn-glow flex items-center justify-center gap-2 group"
              >
                {user ? 'Go to Dashboard' : 'Get Started Free'}
                <motion.span
                  className="material-icons text-sm group-hover:translate-x-1 transition-transform"
                >
                  {user ? 'dashboard' : 'arrow_forward'}
                </motion.span>
              </motion.button>
            </motion.div>
            <motion.div
              className="w-full sm:w-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <a
                className="w-full sm:w-auto px-8 py-4 rounded-full glass-card text-white font-medium hover:bg-white/5 transition-colors border border-white/10 flex items-center justify-center gap-2 group"
                href="#how-it-works"
              >
                <motion.span
                  className="material-icons text-primary group-hover:scale-110 transition-transform"
                >
                  play_circle
                </motion.span>
                See How It Works
              </a>
            </motion.div>
          </motion.div>

          {/* Floating Abstract UI Element - Map/App */}
          <motion.div
            className="mt-20 relative mx-auto max-w-5xl rounded-2xl overflow-hidden glass-card shadow-2xl shadow-primary/10 border border-white/5 group"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            whileHover={{ y: -10 }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent z-10" />
            <div className="h-64 md:h-96 w-full relative bg-surface-dark overflow-hidden map-lines opacity-60">
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <motion.path
                  className="opacity-80"
                  d="M100,300 Q250,100 400,200 T800,150"
                  fill="none"
                  stroke="#0fb880"
                  strokeDasharray="10 5"
                  strokeLinecap="round"
                  strokeWidth="3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1.2, duration: 2, ease: 'easeInOut' }}
                />
                <motion.path
                  className="opacity-60"
                  d="M50,150 Q200,400 500,300 T900,350"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeDasharray="8 8"
                  strokeLinecap="round"
                  strokeWidth="3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1.4, duration: 2, ease: 'easeInOut' }}
                />
                {/* FIX B: motion.circle instead of motion.div for SVG */}
                <motion.circle
                  r="5"
                  fill="#0fb880"
                  style={{ offsetPath: "path('M100,300 Q250,100 400,200 T800,150')" } as React.CSSProperties}
                  animate={{ offsetDistance: ['0%', '100%'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear', delay: 1.5 }}
                />
                <motion.circle
                  r="4"
                  fill="#0ea5e9"
                  style={{ offsetPath: "path('M50,150 Q200,400 500,300 T900,350')" } as React.CSSProperties}
                  animate={{ offsetDistance: ['0%', '100%'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear', delay: 2.5 }}
                />
                <motion.circle
                  className=""
                  cx="100"
                  cy="300"
                  fill="#0fb880"
                  r="6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.6, type: 'spring', stiffness: 500 }}
                />
                <circle cx="100" cy="300" fill="#fff" r="4" />
                <motion.circle
                  cx="800"
                  cy="150"
                  fill="#0ea5e9"
                  r="6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.8, type: 'spring', stiffness: 500 }}
                />
                <circle cx="800" cy="150" fill="#fff" r="4" />
              </svg>
            </div>
            <motion.div
              className="absolute bottom-0 left-0 right-0 p-8 z-20 flex justify-between items-end"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 0.6 }}
            >
              <div className="text-left">
                <h3 className="text-2xl font-bold text-white">Active Route: Sector 17 to Rajpura Bus Stand</h3>
                <p className="text-primary flex items-center gap-1">
                  <motion.span
                    className="material-icons text-sm"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    eco
                  </motion.span>
                  2.4kg CO2 Saved Today
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-background-dark/80 backdrop-blur-md p-4 rounded-xl border border-white/10 flex gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase">Time Saved</p>
                    <motion.p
                      className="text-xl font-bold text-white"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 2.2, type: 'spring', stiffness: 500 }}
                    >
                      14 min
                    </motion.p>
                  </div>
                  <div className="w-px bg-white/10" />
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase">Points</p>
                    <motion.p
                      className="text-xl font-bold text-primary"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 2.4, type: 'spring', stiffness: 500 }}
                    >
                      +450
                    </motion.p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STEP 5: Stats Ticker with Count-Up Animation */}
      <motion.div
        className="border-y border-white/5 bg-background-dark/50 backdrop-blur-sm overflow-hidden py-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: '-100px' }}
      >
        <motion.div
          className="flex justify-center items-center gap-8 md:gap-16 text-gray-400 text-sm font-medium uppercase tracking-widest whitespace-nowrap flex-wrap"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
        >
          <motion.div variants={fadeInUp} className="flex items-center gap-2" ref={commutersCount.ref}>
            <motion.span
              className="text-primary font-bold text-lg"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
              viewport={{ once: true, margin: '-100px' }}
            >
              {commutersCount.count.toLocaleString()}+
            </motion.span>
            Daily Commuters
          </motion.div>
          {/* Pulsing dot separator */}
          <motion.span
            className="w-1.5 h-1.5 bg-primary/50 rounded-full hidden md:inline-block"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div variants={fadeInUp} className="flex items-center gap-2" ref={co2Count.ref}>
            <motion.span
              className="text-secondary font-bold text-lg"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, delay: 0.1 }}
              viewport={{ once: true, margin: '-100px' }}
            >
              {co2Count.count} Tons
            </motion.span>
            CO2 Reduced
          </motion.div>
          {/* Pulsing dot separator */}
          <motion.span
            className="w-1.5 h-1.5 bg-primary/50 rounded-full hidden md:inline-block"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
          <motion.div variants={fadeInUp} className="flex items-center gap-2" ref={citiesCount.ref}>
            <motion.span
              className="text-primary font-bold text-lg"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, delay: 0.2 }}
              viewport={{ once: true, margin: '-100px' }}
            >
              {citiesCount.count} Cities
            </motion.span>
            Covered
          </motion.div>
          {/* Pulsing dot separator */}
          <motion.span
            className="w-1.5 h-1.5 bg-primary/50 rounded-full hidden md:inline-block"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          />
          <motion.div variants={fadeInUp} className="flex items-center gap-2" ref={fasterCount.ref}>
            <motion.span
              className="text-secondary font-bold text-lg"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, delay: 0.3 }}
              viewport={{ once: true, margin: '-100px' }}
            >
              {fasterCount.count}%
            </motion.span>
            Faster Routes
          </motion.div>
        </motion.div>
      </motion.div>

      {/* STEP 6: How It Works - Animated connector line + rotating rings + step badge pulse */}
      <section className="py-24 relative" id="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: '-100px' }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Smart Commuting in <span className="text-primary">3 Steps</span></h2>
            <p className="text-gray-400 max-w-xl mx-auto">Our algorithm processes thousands of data points to find you the quickest, greenest path.</p>
          </motion.div>
          <div className="relative grid md:grid-cols-3 gap-8">
            {/* STEP 6a: Animated connector line */}
            <motion.div
              className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5
                         bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 z-0 origin-left"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.3 }}
              viewport={{ once: true, margin: '-100px' }}
            />

            {/* Step 1 */}
            <motion.div
              className="relative z-10 flex flex-col items-center text-center group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              viewport={{ once: true, margin: '-100px' }}
            >
              <div className="relative">
                {/* STEP 6b: Rotating dashed ring */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-dashed border-primary/0
                             group-hover:border-primary/40 transition-colors duration-300"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  style={{ width: '6rem', height: '6rem' }}
                />
                <motion.div
                  className="w-24 h-24 rounded-2xl glass-card border border-primary/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(15,184,128,0.15)] group-hover:shadow-[0_0_30px_rgba(15,184,128,0.3)] transition-all duration-500"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <span className="material-icons text-4xl text-primary">add_location_alt</span>
                </motion.div>
              </div>
              {/* STEP 6c: Step badge pulse on scroll */}
              <motion.div
                className="bg-background-dark px-4 py-1 rounded-full text-xs font-bold text-primary border border-primary/20 mb-4 uppercase tracking-wider"
                whileInView={{ scale: [0.8, 1.1, 1] }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5 }}
              >
                Step 01
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">Share Location</h3>
              <p className="text-gray-400 text-sm leading-relaxed px-4">Input your start and end points. We utilize community data to pinpoint exact stop locations.</p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              className="relative z-10 flex flex-col items-center text-center group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true, margin: '-100px' }}
            >
              <div className="relative">
                {/* STEP 6b: Rotating dashed ring */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-dashed border-secondary/0
                             group-hover:border-secondary/40 transition-colors duration-300"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear', delay: 2 }}
                  style={{ width: '6rem', height: '6rem' }}
                />
                <motion.div
                  className="w-24 h-24 rounded-2xl glass-card border border-secondary/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(14,165,233,0.15)] group-hover:shadow-[0_0_30px_rgba(14,165,233,0.3)] transition-all duration-500"
                  whileHover={{ scale: 1.05, rotate: -5 }}
                >
                  <span className="material-icons text-4xl text-secondary">alt_route</span>
                </motion.div>
              </div>
              {/* STEP 6c: Step badge pulse on scroll */}
              <motion.div
                className="bg-background-dark px-4 py-1 rounded-full text-xs font-bold text-secondary border border-secondary/20 mb-4 uppercase tracking-wider"
                whileInView={{ scale: [0.8, 1.1, 1] }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Step 02
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">Get Optimized Routes</h3>
              <p className="text-gray-400 text-sm leading-relaxed px-4">Receive real-time suggestions combining bus, metro, and walking for the fastest trip.</p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              className="relative z-10 flex flex-col items-center text-center group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              viewport={{ once: true, margin: '-100px' }}
            >
              <div className="relative">
                {/* STEP 6b: Rotating dashed ring */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-dashed border-primary/0
                             group-hover:border-primary/40 transition-colors duration-300"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear', delay: 4 }}
                  style={{ width: '6rem', height: '6rem' }}
                />
                <motion.div
                  className="w-24 h-24 rounded-2xl glass-card border border-primary/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(15,184,128,0.15)] group-hover:shadow-[0_0_30px_rgba(15,184,128,0.3)] transition-all duration-500"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <span className="material-icons text-4xl text-primary">savings</span>
                </motion.div>
              </div>
              {/* STEP 6c: Step badge pulse on scroll */}
              <motion.div
                className="bg-background-dark px-4 py-1 rounded-full text-xs font-bold text-primary border border-primary/20 mb-4 uppercase tracking-wider"
                whileInView={{ scale: [0.8, 1.1, 1] }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Step 03
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">Track & Earn</h3>
              <p className="text-gray-400 text-sm leading-relaxed px-4">Monitor your carbon savings and earn points redeemable at local partner stores.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STEP 7: Features - Glassmorphism cards + floating live alert */}
      <section className="py-24 bg-surface-dark/30 relative overflow-hidden" id="features">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Technology that Moves <br />
                <span className="text-gradient">With You</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-md">
                CommuteSmart isn&apos;t just a map. It&apos;s a living ecosystem of commuters improving the city one trip at a time.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-icons text-primary mt-1">check_circle</span>
                  <span className="text-gray-300">Predictive arrival times using AI</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-icons text-primary mt-1">check_circle</span>
                  <span className="text-gray-300">Crowdsourced congestion reporting</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-icons text-primary mt-1">check_circle</span>
                  <span className="text-gray-300">Offline mode for low connectivity zones</span>
                </li>
              </ul>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* STEP 7a: Upgraded feature cards with glassmorphism */}
              <div className="glass-card p-8 rounded-2xl backdrop-blur-md bg-white/[0.03] border border-white/[0.08] hover:border-primary/20 hover:bg-white/[0.06] hover:shadow-[0_0_40px_rgba(15,184,128,0.08)] transition-all duration-500 cursor-default group">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-icons text-primary">groups</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Community Data</h3>
                <p className="text-gray-400 text-sm">Real-time feedback from thousands of users ensures you never miss a bus or get stuck in a jam.</p>
              </div>
              <div className="glass-card p-8 rounded-2xl backdrop-blur-md bg-white/[0.03] border border-white/[0.08] hover:border-secondary/20 hover:bg-white/[0.06] hover:shadow-[0_0_40px_rgba(14,165,233,0.08)] transition-all duration-500 cursor-default group sm:translate-y-8">
                <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-icons text-secondary">forest</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Eco-Tracker</h3>
                <p className="text-gray-400 text-sm">Visualize your environmental impact. See exactly how much CO2 you save compared to driving.</p>
              </div>
              <div className="glass-card p-8 rounded-2xl backdrop-blur-md bg-white/[0.03] border border-white/[0.08] hover:border-purple-500/20 hover:bg-white/[0.06] hover:shadow-[0_0_40px_rgba(168,85,247,0.08)] transition-all duration-500 cursor-default group">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-icons text-purple-400">emoji_events</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Gamification</h3>
                <p className="text-gray-400 text-sm">Turn your daily commute into a game. Climb the leaderboards and unlock exclusive badges.</p>
              </div>
              <div className="glass-card p-8 rounded-2xl backdrop-blur-md bg-white/[0.03] border border-white/[0.08] hover:border-orange-500/20 hover:bg-white/[0.06] hover:shadow-[0_0_40px_rgba(249,115,22,0.08)] transition-all duration-500 cursor-default group sm:translate-y-8">
                <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-icons text-orange-400">security</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Safety First</h3>
                <p className="text-gray-400 text-sm">Share your live trip status with family and get alerts for safe routes at night.</p>
              </div>
            </div>
          </div>

          {/* STEP 7b: Floating live alert card */}
          <motion.div
            className="mt-10 mx-auto max-w-sm glass-card border border-orange-500/20
                       rounded-xl p-4 flex items-start gap-3"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
          >
            <span className="relative flex h-3 w-3 mt-1 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-400" />
            </span>
            <div>
              <p className="text-white text-sm font-semibold">
                🚨 Live Alert: Heavy traffic near Zirakpur
              </p>
              <p className="text-gray-400 text-xs mt-0.5">Reported by 3 commuters · 2 min ago</p>
              <p className="text-primary text-xs mt-1">Alternative route suggested ↗</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STEP 8: Cities - Infinite scrolling marquee */}
      <section className="py-20 border-t border-white/5" id="cities">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-10">Optimizing Transport in the Region</h3>
          <div className="relative overflow-hidden mt-8">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r
                            from-background-dark to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l
                            from-background-dark to-transparent z-10 pointer-events-none" />
            <motion.div
              className="flex gap-16 items-center whitespace-nowrap"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              {[...cities, ...cities].map((city, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 text-white/40
                              hover:text-white/80 transition-colors cursor-default ${city.font}`}
                >
                  <span className="material-icons text-primary/60 text-sm">{city.icon}</span>
                  <span className="text-xl">{city.name}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* STEP 9: CTA - Animated sweep + social proof + shimmer buttons */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />

        {/* STEP 9a: Animated sweep line */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, #0fb880, transparent)' }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          {/* STEP 9b: Social proof badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                       glass-card border border-yellow-500/20 mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
          >
            <div className="flex -space-x-1">
              {['#0fb880', '#0ea5e9', '#a855f7', '#f97316'].map((color, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-background-dark"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-sm text-gray-300">
              <span className="text-yellow-400 font-bold">★★★★★</span>{' '}
              Loved by 2,400+ commuters
            </span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to change how you move?</h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Download CommuteSmart today and join the movement towards a cleaner, faster, and smarter commute in Chandigarh, Rajpura, Patiala & Ambala.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {/* STEP 9c: App Store button with shimmer */}
            <motion.a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="relative overflow-hidden bg-white text-background-dark hover:bg-gray-100 px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-colors shadow-lg mx-auto"
              whileHover="hover"
              initial="initial"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent
                           via-white/10 to-transparent -translate-x-full"
                variants={{ hover: { translateX: '200%' } }}
                transition={{ duration: 0.6 }}
              />
              <span className="material-icons text-2xl">apple</span>
              <div className="text-left leading-tight">
                <span className="block text-xs font-normal">Download on the</span>
                <span>App Store</span>
              </div>
            </motion.a>

            {/* STEP 9c: Google Play button with shimmer */}
            <motion.a
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="relative overflow-hidden glass-card border border-white/20 hover:bg-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-colors shadow-lg mx-auto"
              whileHover="hover"
              initial="initial"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent
                           via-white/10 to-transparent -translate-x-full"
                variants={{ hover: { translateX: '200%' } }}
                transition={{ duration: 0.6 }}
              />
              <span className="material-icons text-2xl">android</span>
              <div className="text-left leading-tight">
                <span className="block text-xs font-normal">Get it on</span>
                <span>Google Play</span>
              </div>
            </motion.a>
          </div>
        </div>
      </section>

      {/* STEP 10: Footer - Fixed encoding (already correct in original) */}
      <footer className="bg-gradient-to-br from-background-dark via-background-dark to-primary/5 border-t border-white/10 py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230fb880' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="material-icons text-white text-sm">directions_bus</span>
                </div>
                <span className="font-bold text-xl text-white">CommuteSmart</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Building the future of sustainable urban mobility. Join thousands of commuters making smarter choices across Punjab.
              </p>
              <div className="flex gap-3">
                <a className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all hover:scale-110" href="#" aria-label="Twitter">
                  <span className="material-icons text-lg">flutter_dash</span>
                </a>
                <a className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all hover:scale-110" href="#" aria-label="Facebook">
                  <span className="material-icons text-lg">facebook</span>
                </a>
                <a className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all hover:scale-110" href="#" aria-label="Instagram">
                  <span className="material-icons text-lg">photo_camera</span>
                </a>
                <a className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all hover:scale-110" href="#" aria-label="LinkedIn">
                  <span className="material-icons text-lg">work</span>
                </a>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <span className="material-icons text-primary">rocket_launch</span>
                Product
              </h4>
              <ul className="space-y-3 text-sm">
                <li><a className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2" href="#features">
                  <span className="material-icons text-xs">chevron_right</span> Features
                </a></li>
                <li><a className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2" href="#cities">
                  <span className="material-icons text-xs">chevron_right</span> Cities
                </a></li>
                <li><a className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2" href="#">
                  <span className="material-icons text-xs">chevron_right</span> Pricing
                </a></li>
                <li><a className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2" href="#">
                  <span className="material-icons text-xs">chevron_right</span> API
                </a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <span className="material-icons text-primary">business</span>
                Company
              </h4>
              <ul className="space-y-3 text-sm">
                <li><a className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2" href="#">
                  <span className="material-icons text-xs">chevron_right</span> About Us
                </a></li>
                <li><a className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2" href="#">
                  <span className="material-icons text-xs">chevron_right</span> Careers
                </a></li>
                <li><a className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2" href="#">
                  <span className="material-icons text-xs">chevron_right</span> Blog
                </a></li>
                <li><a className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2" href="#">
                  <span className="material-icons text-xs">chevron_right</span> Contact
                </a></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                <span className="material-icons text-primary">gavel</span>
                Legal
              </h4>
              <ul className="space-y-3 text-sm">
                <li><a className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2" href="#">
                  <span className="material-icons text-xs">chevron_right</span> Privacy Policy
                </a></li>
                <li><a className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2" href="#">
                  <span className="material-icons text-xs">chevron_right</span> Terms of Service
                </a></li>
                <li><a className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2" href="#">
                  <span className="material-icons text-xs">chevron_right</span> Cookie Policy
                </a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <span className="material-icons text-xs">copyright</span>
              © 2026 CommuteSmart. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <span className="material-icons text-xs">location_on</span>
                Chandigarh, Punjab
              </span>
              <span className="flex items-center gap-1">
                <span className="material-icons text-xs">email</span>
                hello@commutesmart.com
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
