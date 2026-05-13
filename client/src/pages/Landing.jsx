import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaComments, FaShieldAlt, FaBolt, FaUsers, FaMobileAlt, FaLock, FaArrowRight } from 'react-icons/fa'

const FEATURES = [
  {
    icon: <FaBolt className="text-3xl" />,
    title: 'Real-time Messaging',
    description: 'Instant message delivery with Socket.io. See typing indicators and read receipts in real-time.',
  },
  {
    icon: <FaUsers className="text-3xl" />,
    title: 'Group Chats',
    description: 'Create groups, add/remove members, and manage your conversations effortlessly.',
  },
  {
    icon: <FaShieldAlt className="text-3xl" />,
    title: 'End-to-End Security',
    description: 'JWT authentication, bcrypt encryption, and secure cookie-based sessions.',
  },
  {
    icon: <FaMobileAlt className="text-3xl" />,
    title: 'Responsive Design',
    description: 'Fully responsive UI that works beautifully on desktop, tablet, and mobile.',
  },
  {
    icon: <FaLock className="text-3xl" />,
    title: 'Privacy Controls',
    description: 'Block users, control visibility of your profile, and manage notification settings.',
  },
  {
    icon: <FaComments className="text-3xl" />,
    title: 'Rich Media Support',
    description: 'Share images, voice messages, emojis, and forward messages across conversations.',
  },
]

const STATS = [
  { value: '50+', label: 'Features' },
  { value: 'Real-time', label: 'Messaging' },
  { value: '24/7', label: 'Security' },
  { value: 'Online', label: 'Available' },
]

const Landing = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d1721 0%, #162029 50%, #0d1721 100%)',
      color: 'white',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      overflowX: 'hidden',
    }}>
      {/* Animated background orbs */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)',
          top: '-100px', right: '-100px',
          animation: 'float 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
          bottom: '10%', left: '-50px',
          animation: 'float 10s ease-in-out infinite reverse',
        }} />
        <div style={{
          position: 'absolute', width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          top: '50%', left: '40%',
          animation: 'float 12s ease-in-out infinite',
        }} />
      </div>

      {/* Navbar */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 40px', maxWidth: '1200px', margin: '0 auto',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(14,165,233,0.3)',
          }}>
            <FaComments style={{ color: 'white', fontSize: '20px' }} />
          </div>
          <span style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            Chat<span style={{ color: '#0ea5e9' }}>Sphere</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link to="/login" style={{
            color: '#9ca3af', textDecoration: 'none', padding: '10px 20px',
            borderRadius: '10px', fontSize: '14px', fontWeight: '500',
            transition: 'color 0.3s',
          }}>
            Sign In
          </Link>
          <Link to="/register" style={{
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            color: 'white', textDecoration: 'none', padding: '10px 24px',
            borderRadius: '10px', fontSize: '14px', fontWeight: '600',
            boxShadow: '0 4px 15px rgba(14,165,233,0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        maxWidth: '1200px', margin: '0 auto', padding: '80px 40px 60px',
        textAlign: 'center', position: 'relative', zIndex: 10,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.8s ease-out',
      }}>
        <div style={{
          display: 'inline-block', padding: '6px 16px', borderRadius: '20px',
          background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)',
          fontSize: '13px', color: '#0ea5e9', fontWeight: '500', marginBottom: '24px',
        }}>
          ✨ Built with MERN Stack + Socket.io
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: '800',
          lineHeight: '1.1',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-1px',
        }}>
          Connect & Chat in<br />
          <span style={{
            background: 'linear-gradient(135deg, #0ea5e9, #06b6d4, #10b981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Real-Time
          </span>
        </h1>

        <p style={{
          fontSize: '18px', color: '#94a3b8', maxWidth: '600px',
          margin: '0 auto 40px', lineHeight: '1.7',
        }}>
          A production-ready full-stack chat application featuring real-time messaging,
          group chats, voice messages, and advanced privacy controls.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" style={{
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            color: 'white', textDecoration: 'none', padding: '16px 32px',
            borderRadius: '12px', fontSize: '16px', fontWeight: '600',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 8px 30px rgba(14,165,233,0.3)',
            transition: 'transform 0.2s',
          }}>
            Start Chatting <FaArrowRight />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section style={{
        maxWidth: '900px', margin: '0 auto', padding: '0 40px',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px', padding: '30px',
          backdropFilter: 'blur(10px)',
        }}>
          {STATS.map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '28px', fontWeight: '800', color: '#0ea5e9',
                marginBottom: '4px',
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{
        maxWidth: '1200px', margin: '0 auto', padding: '100px 40px',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{
            fontSize: '36px', fontWeight: '700', marginBottom: '16px',
          }}>
            Everything You Need
          </h2>
          <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
            Packed with features that make ChatSphere a complete, production-ready messaging platform.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}>
          {FEATURES.map((feature, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              padding: '32px',
              transition: 'transform 0.3s, border-color 0.3s',
              cursor: 'default',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.borderColor = 'rgba(14,165,233,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'rgba(14,165,233,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#0ea5e9', marginBottom: '16px',
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: '18px', fontWeight: '600', marginBottom: '8px',
              }}>
                {feature.title}
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section style={{
        maxWidth: '1200px', margin: '0 auto', padding: '0 40px 100px',
        position: 'relative', zIndex: 10,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(16,185,129,0.05))',
          border: '1px solid rgba(14,165,233,0.2)',
          borderRadius: '24px', padding: '60px 40px', textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '12px' }}>
            Built with Modern Tech Stack
          </h2>
          <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '16px' }}>
            Industry-standard technologies used by top companies
          </p>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '12px',
            justifyContent: 'center',
          }}>
            {['React 19', 'Node.js', 'Express.js', 'MongoDB', 'Socket.io',
              'JWT', 'TailwindCSS', 'Passport.js', 'Twilio', 'Google OAuth',
              'Helmet', 'Winston', 'Bcrypt', 'Mongoose'].map((tech) => (
              <span key={tech} style={{
                padding: '8px 20px', borderRadius: '20px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '14px', fontWeight: '500', color: '#cbd5e1',
              }}>
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        textAlign: 'center', padding: '0 40px 80px',
        position: 'relative', zIndex: 10,
      }}>
        <h2 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '16px' }}>
          Ready to Start Chatting?
        </h2>
        <p style={{ color: '#64748b', marginBottom: '32px', fontSize: '16px' }}>
          Join ChatSphere today and experience seamless communication.
        </p>
        <Link to="/register" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
          color: 'white', textDecoration: 'none', padding: '16px 40px',
          borderRadius: '12px', fontSize: '18px', fontWeight: '600',
          boxShadow: '0 8px 30px rgba(14,165,233,0.3)',
        }}>
          Create Free Account <FaArrowRight />
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '30px 40px', textAlign: 'center',
        position: 'relative', zIndex: 10,
      }}>
        <p style={{ color: '#475569', fontSize: '14px' }}>
          © {new Date().getFullYear()} ChatSphere. Built as a Full-Stack Portfolio Project.
        </p>
      </footer>

      {/* Global Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        @media (max-width: 768px) {
          nav { padding: 16px 20px !important; }
          section { padding-left: 20px !important; padding-right: 20px !important; }
          h1 { font-size: 2rem !important; }
        }
        @media (max-width: 500px) {
          nav > div:last-child > a:first-child { display: none; }
        }
      `}</style>
    </div>
  )
}

export default Landing
