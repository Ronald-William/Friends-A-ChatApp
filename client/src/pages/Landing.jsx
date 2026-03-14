import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { Link } from "react-router-dom";
import { useRemoveBg } from "../hooks/useRemoveBg";

const FEATURES = [
  { icon: "⚡", title: "REAL-TIME MESSAGING", desc: "Messages delivered instantly. No refresh. No waiting. Just like passing notes, but cooler." },
  { icon: "👥", title: "GROUP CHATS", desc: "Create your own group. Add your people. Your couch, your rules." },
  { icon: "🟢", title: "LIVE PRESENCE", desc: "See who's online. Know who's lurking. The fountain is always running." },
  { icon: "🔔", title: "UNREAD COUNTS", desc: "Never miss a message. Badges tell you exactly what you missed while getting coffee." },
];

const QUOTES = [
  { text: "We were on a break!", sub: "— but your messages weren't" },
  { text: "How you doin'?", sub: "— the only opener you'll ever need" },
  { text: "I'll be there for you.", sub: "— and so will your notifications" },
  { text: "Could this BE any faster?", sub: "— Redis-cached. So no." },
];

export default function Landing() {
  
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [quoteKey, setQuoteKey] = useState(0);
  const { dark, toggleTheme } = useTheme();
  const sofaUrl = useRemoveBg("/friends-sofa.jpeg");

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx(prev => (prev + 1) % QUOTES.length);
      setQuoteKey(prev => prev + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle("in-view", e.isIntersecting)),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".feature-card").forEach(c => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`min-h-screen font-body transition-colors duration-500 ${dark ? "bg-dark-bg text-dark-text" : "bg-light-bg text-light-text"}`}>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 backdrop-blur-md border-b shadow-lg ${dark ? "bg-dark-bg/90 border-dark-border/30 shadow-black/10" : "bg-light-bg/90 border-light-border/30 shadow-black/10"}`}>
        <div className="font-brand text-2xl tracking-widest">
          YAPPER HUB
          <span className={`font-mono text-[10px] ml-2 align-middle ${dark ? "text-dark-muted" : "text-light-muted"}`}>v1.0</span>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <button
            onClick={toggleTheme}
            className={`font-mono text-[11px] tracking-widest px-3 py-1.5 rounded-lg border transition-all ${dark ? "bg-dark-surface border-dark-border text-dark-text hover:bg-dark-surface2" : "bg-light-surface border-light-border text-light-text hover:bg-light-surface2"}`}
          >
            {dark ? "☀ LIGHT" : "◑ DARK"}
          </button>
          <Link to="/login" className={`font-mono text-[11px] tracking-widest transition-colors hidden sm:block ${dark ? "text-dark-muted hover:text-dark-text" : "text-light-muted hover:text-light-text"}`}>
            LOGIN
          </Link>
          <Link to="/register" className={`font-mono text-[11px] tracking-widest font-bold px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5 ${dark ? "bg-dark-text text-dark-bg hover:shadow-[0_6px_20px_#D2C1B644]" : "bg-light-accent text-light-bg hover:shadow-[0_6px_20px_#D2535344]"}`}>
            JOIN FREE
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={`relative min-h-screen flex flex-col items-center justify-center pt-24 pb-20 px-6 text-center overflow-hidden ${dark ? "grid-bg-dark" : "grid-bg-light"}`}>

        {/* Sofa — bg removed via Canvas */}
        {sofaUrl && (
          <img
            src={sofaUrl}
            alt="Central Perk sofa"
            className="w-72 md:w-96 object-contain -mb-8"
          />
        )}

        {/* Rotating quotes */}
        <div className="h-36 sm:h-32 flex flex-col items-center justify-center mb-4 overflow-visible">
          <div key={quoteKey} className="animate-quote-slide text-center">
            <div className="font-bold text-3xl md:text-4xl tracking-wide leading-tight">
              "{QUOTES[quoteIdx].text}"
            </div>
            <div className={`font-body italic text-base md:text-xl mt-3 ${dark ? "text-dark-muted" : "text-light-muted"}`}>
              {QUOTES[quoteIdx].sub}
            </div>
          </div>
        </div>

        {/* Subheadline */}
        <p className={`font-body text-lg md:text-xl max-w-md mx-auto mb-10 leading-relaxed animate-float-up ${dark ? "text-dark-muted" : "text-light-muted"}`}>
          A place where everyone knows your name —<br />
          and your messages arrive in real time.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 justify-center animate-float-up">
          <Link to="/register" className={`font-mono text-sm font-bold px-8 py-3.5 rounded-xl transition-all hover:-translate-y-1 ${dark ? "bg-dark-text text-dark-bg hover:shadow-[0_8px_24px_#D2C1B655]" : "bg-light-accent text-light-bg hover:shadow-[0_8px_24px_#D2535355]"}`}>
            START CHATTING →
          </Link>
          <Link to="/login" className={`font-mono text-sm font-bold px-8 py-3.5 rounded-xl border transition-all hover:-translate-y-1 ${dark ? "border-dark-accent text-dark-text hover:bg-dark-surface/50" : "border-light-accent text-light-accent hover:bg-light-surface/50"}`}>
            LOGIN
          </Link>
        </div>

        {/* Scroll hint */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-widest animate-blink ${dark ? "text-dark-muted" : "text-light-muted"}`}>
          ↓ scroll
        </div>
      </section>

      {/* Features */}
      <section className={`py-24 px-6 ${dark ? "bg-dark-surface/50" : "bg-light-surface/50"}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className={`font-mono text-[11px] tracking-[0.2em] mb-3 ${dark ? "text-dark-muted" : "text-light-muted"}`}>// WHAT YOU GET</div>
            <h2 className="font-brand text-4xl md:text-5xl tracking-widest">BUILT DIFFERENT. BUILT BETTER.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className={`feature-card relative overflow-hidden rounded-xl p-8 border ${dark ? "bg-dark-surface border-dark-border" : "bg-light-surface border-light-border"}`}>
                <div className={`absolute top-0 right-0 w-12 h-12 ${dark ? "bg-dark-accent/20" : "bg-light-accent/20"}`} style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
                <div className="text-3xl mb-4">{f.icon}</div>
                <div className={`font-mono text-[11px] font-bold tracking-wider mb-3 ${dark ? "text-dark-text" : "text-light-text"}`}>{f.title}</div>
                <div className={`font-body text-base leading-relaxed ${dark ? "text-dark-muted" : "text-light-muted"}`}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Central Perk quote */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-4xl mb-6 text-center">☕</div>
          <blockquote className={`font-body italic text-2xl md:text-3xl leading-relaxed mb-4 pl-6 border-l-4 ${dark ? "border-dark-accent text-dark-text" : "border-light-accent text-light-text"}`}>
            "Welcome to the real world. It sucks. You're gonna love it."
          </blockquote>
          <p className={`font-mono text-[11px] tracking-widest pl-6 ${dark ? "text-dark-muted" : "text-light-muted"}`}>
            — Monica Geller · Friends S02E01
          </p>
          <p className={`font-body text-lg mt-8 leading-relaxed ${dark ? "text-dark-muted" : "text-light-muted"}`}>
            Yapper Hub is where your people are. Real-time, always on,
            with a warm cup of Redis-cached messages waiting for you.
          </p>
        </div>
      </section>

      {/* CTA banner */}
      <section className={`py-16 px-6 text-center border-y ${dark ? "bg-dark-surface border-dark-border/30" : "bg-light-surface border-light-border/30"}`}>
        <div className="max-w-xl mx-auto">
          <div className={`font-mono text-[11px] tracking-[0.2em] mb-4 ${dark ? "text-dark-muted" : "text-light-muted"}`}>// READY?</div>
          <h2 className="font-display text-5xl md:text-7xl tracking-widest leading-none mb-3">
            BE THERE FOR YOUR FRIENDS
          </h2>
          <p className={`font-body italic text-lg mb-10 ${dark ? "text-dark-muted" : "text-light-muted"}`}>
            — when the rain starts to pour
          </p>
          <Link to="/register" className={`inline-block font-mono text-sm font-bold px-12 py-4 rounded-xl transition-all hover:-translate-y-1 ${dark ? "bg-dark-text text-dark-bg hover:shadow-[0_8px_32px_#D2C1B655]" : "bg-light-accent text-light-bg hover:shadow-[0_8px_32px_#D2535355]"}`}>
            CREATE YOUR ACCOUNT →
          </Link>
        </div>
      </section>

      {/* About */}
      <section className={`py-24 px-6 border-t ${dark ? "bg-dark-bg border-dark-border/30" : "bg-light-bg border-light-border/30"}`}>
        <div className="max-w-3xl mx-auto">

          {/* Chandler quote */}
          <div className="mb-16 text-center">
            <div className={`font-mono text-[11px] tracking-[0.2em] mb-4 ${dark ? "text-dark-muted" : "text-light-muted"}`}>// ABOUT</div>
            <blockquote className={`font-display text-3xl md:text-4xl tracking-wide leading-tight ${dark ? "text-dark-text" : "text-light-text"}`}>
              "I am not great at the advice.<br />Can I interest you in a sarcastic comment?"
            </blockquote>
            <p className={`font-mono text-[11px] tracking-widest mt-3 ${dark ? "text-dark-muted" : "text-light-muted"}`}>
              — Chandler Bing · Friends
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

            {/* Project */}
            <div>
              <div className={`font-mono text-[10px] tracking-[0.2em] mb-4 ${dark ? "text-dark-muted" : "text-light-muted"}`}>// THE PROJECT</div>
              <h3 className={`font-brand text-2xl tracking-wide mb-3 ${dark ? "text-dark-text" : "text-light-text"}`}>YAPPER HUB</h3>
              <p className={`font-body text-base leading-relaxed mb-6 ${dark ? "text-dark-muted" : "text-light-muted"}`}>
                A full-featured real-time chat application supporting one-on-one and group conversations, live presence, unread counts, typing indicators, and message management.
              </p>
              <div className={`font-mono text-[10px] tracking-[0.2em] mb-3 ${dark ? "text-dark-muted" : "text-light-muted"}`}>// STACK</div>
              <div className="flex flex-wrap gap-2">
                {["MongoDB", "Express", "React", "Node.js", "Socket.IO", "Redis", "Tailwind CSS"].map(tech => (
                  <span key={tech} className={`font-mono text-[10px] tracking-wider px-3 py-1.5 rounded-lg border ${dark ? "border-dark-border text-dark-muted bg-dark-surface" : "border-light-border text-light-muted bg-light-surface"}`}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Developer */}
            <div>
              <div className={`font-mono text-[10px] tracking-[0.2em] mb-4 ${dark ? "text-dark-muted" : "text-light-muted"}`}>// THE DEVELOPER</div>
              <h3 className={`font-brand text-2xl tracking-wide mb-1 ${dark ? "text-dark-text" : "text-light-text"}`}>RONALD WILLIAM JOSEPH</h3>
              <p className={`font-mono text-[11px] tracking-widest mb-6 ${dark ? "text-dark-muted" : "text-light-muted"}`}>FULLSTACK DEVELOPER</p>
              <div className="flex flex-col gap-3">
                <a
                  href="mailto:ronaldjoseph439@gmail.com"
                  className={`flex items-center gap-3 font-mono text-[11px] tracking-wider transition-colors group ${dark ? "text-dark-muted hover:text-dark-text" : "text-light-muted hover:text-light-text"}`}
                >
                  <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-sm flex-shrink-0 transition-colors ${dark ? "border-dark-border group-hover:border-dark-accent" : "border-light-border group-hover:border-light-accent"}`}>✉</span>
                  ronaldjoseph439@gmail.com
                </a>
                <a
                  href="https://github.com/Ronald-William"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 font-mono text-[11px] tracking-wider transition-colors group ${dark ? "text-dark-muted hover:text-dark-text" : "text-light-muted hover:text-light-text"}`}
                >
                  <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-sm flex-shrink-0 transition-colors ${dark ? "border-dark-border group-hover:border-dark-accent" : "border-light-border group-hover:border-light-accent"}`}>⌥</span>
                  github.com/Ronald-William
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`px-6 py-6 flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4 text-center sm:text-left ${dark ? "text-dark-muted" : "text-light-muted"}`}>
        <div className="font-display text-xl tracking-widest">YAPPER HUB</div>
        <div className="font-mono text-[11px] tracking-wider">Built with ☕ · Not affiliated with Friends™</div>
        <div className="flex gap-6">
          <Link to="/login" className="font-mono text-[11px] tracking-widest hover:underline">LOGIN</Link>
          <Link to="/register" className="font-mono text-[11px] tracking-widest hover:underline">REGISTER</Link>
        </div>
      </footer>
    </div>
  );
}