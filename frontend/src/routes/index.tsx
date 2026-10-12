import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, Activity, Building2, Droplet, HeartPulse, Network, Shield, Radar, BrainCircuit, Cross } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APIStatusIndicator } from '@/features/aeroblood/components/common/APIStatusIndicator';
import { portalHead } from '@/features/aeroblood/route-head';
import clinicalImage from '@/assets/blood-clinical.jpg';
import donationImage from '@/assets/donation-care.jpg';
import laboratoryImage from '@/assets/clinical-lab.jpg';

export const Route = createFileRoute('/')({
  head: () => portalHead('AERO-BLOOD Clinical Emergency Network', 'Adaptive Emergency Redistribution & Optimization for Blood Systems. Access hospital, blood bank, and network admin operational portals.'),
  component: Index,
});

const portals = [
  { to: '/hospital' as const, number: '01', name: 'HOSPITAL', label: 'Request & Receive', icon: Building2, description: 'Manage patient blood requisitions, trigger rapid emergency workflows, and inspect allocation candidate availability in real time.', action: 'Enter Hospital Desk' },
  { to: '/bloodbank' as const, number: '02', name: 'BLOOD BANK', label: 'Manage & Respond', icon: Shield, description: 'Operational command center for physical blood unit inventory, expiry radar, quarantine execution, shortage/surplus, and donor intelligence.', action: 'Enter Command Center' },
  { to: '/admin' as const, number: '03', name: 'NETWORK ADMIN', label: 'Monitor & Optimize', icon: Network, description: 'Strategic oversight across all 2,823 blood banks, emergency demand patterns, inter-bank transfers, and live system health diagnostics.', action: 'Enter Network Admin' },
];

function Index() {
  return <div className="blood-home">
    <header className="brand-bar">
      <Link to="/" className="brand-lockup" aria-label="AERO-BLOOD home"><span className="brand-symbol"><Droplet size={23} fill="currentColor" /><Cross className="brand-cross" size={11} /></span><span><span className="brand-name">AERO<span>-BLOOD</span></span><span className="brand-caption">CLINICAL EMERGENCY NETWORK</span></span></Link>
      <nav className="home-nav" aria-label="Portal navigation"><a href="#portals">Operational portals <ArrowRight size={14} /></a><span className="nav-divider" /><APIStatusIndicator /></nav>
    </header>
    <main>
      <section className="clinical-hero">
        <img className="clinical-image" src={clinicalImage} alt="Blood donation packets suspended on a hospital IV stand" width={1920} height={1024} />
        <div className="clinical-hero-inner">
          <div className="hero-eyebrow"><span className="signal-mark" /><span>AUTONOMOUS CLINICAL DECISION SUPPORT</span></div>
          <h1>AERO<span>-BLOOD</span><span className="title-period">.</span></h1>
          <p className="hero-editorial">Every drop. <span>A connection.</span></p>
          <p className="hero-tagline">ADAPTIVE EMERGENCY REDISTRIBUTION<br className="desktop-break" /> & OPTIMIZATION FOR BLOOD SYSTEMS</p>
          <div className="workflow"><span><Radar size={16} /> DETECT</span><ArrowRight size={15} /><span><BrainCircuit size={16} /> DECIDE</span><ArrowRight size={15} /><span><Activity size={16} /> RESPOND</span></div>
          <Button asChild size="lg" variant="clinical"><a href="#portals">ENTER AERO-BLOOD <ArrowRight size={17} /></a></Button>
          <div className="hero-footnote"><HeartPulse size={16} /><span>CLINICAL EMERGENCY NETWORK</span></div>
        </div>
        <div className="image-annotation"><span className="annotation-cross">+</span><span>BLOOD SYSTEMS<br />CONNECTED CARE</span><span className="annotation-line" /></div>
        <div className="hero-index">A / B &nbsp; — &nbsp; 001</div>
        <div className="specimen-stamp" aria-hidden="true"><span>CONNECTED CARE</span><Cross size={28} strokeWidth={1.4} /><strong>HANDLE<br />WITH CARE</strong><span>AERO-BLOOD / 001</span></div>
      </section>
      <div className="blood-type-strip" aria-label="Blood groups"><span className="blood-strip-label"><Droplet size={16} /> EVERY TYPE.<br /> ONE NETWORK.</span><div>{['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'].map(type => <span className="blood-type" key={type}>{type}</span>)}</div><Cross className="blood-strip-cross" size={28} aria-hidden="true" /></div>
      <div className="pulse-divider" aria-hidden="true"><span>DETECT</span><svg viewBox="0 0 1000 60" preserveAspectRatio="none"><path d="M0 30 H120 L132 23 L144 30 H260 L274 30 L284 8 L298 52 L310 20 L322 30 H495 L510 24 L522 30 H655 L670 30 L680 8 L694 52 L706 20 L718 30 H1000" /></svg><span>RESPOND</span></div>
      <section className="network-band" aria-label="Clinical network">
        <div className="network-stat"><Building2 /><div><strong>1,348<span> Hospitals Connected</span></strong><span className="stat-label">HOSPITAL NETWORK</span></div></div>
        <div className="network-stat"><Droplet /><div><strong>2,823<span> Regional Blood Banks</span></strong><span className="stat-label">BLOOD BANK NETWORK</span></div></div>
        <div className="network-stat"><Network /><div><strong className="network-ai">Multi-Facility AI Redistribution</strong><span className="stat-label">INTELLIGENT COORDINATION</span></div></div>
      </section>
      <section id="portals" className="portal-section">
        <div className="section-heading"><div><h2>Your role. <span>One connected network.</span></h2><div className="clinical-seal" aria-hidden="true"><Cross size={30} strokeWidth={1} /><span>AERO-BLOOD<br />CONNECTED CARE</span></div></div><span className="section-number">[ 01 — 03 ]</span></div>
        <div className="packet-rack">{portals.map(({ to, number, name, label, icon: Icon, description, action }) => <Link to={to} className="packet-portal" key={to}><span className="packet-hanger" aria-hidden="true" /><div className="packet-body"><div className="packet-top"><Droplet size={18} /><span>A / B — {number}</span><Icon size={20} strokeWidth={1.5} /></div><div className="packet-label"><span className="packet-label-caption">AERO-BLOOD / {label}</span><h3>{name}</h3><p>{description}</p><div className="packet-barcode" aria-hidden="true" /><div className="packet-label-bottom"><span>PORTAL {number}</span><Cross size={14} /></div></div><div className="packet-action"><span>{action}</span><ArrowRight size={19} /></div></div><span className="packet-outlet" aria-hidden="true" /></Link>)}</div>
      </section>
      <section className="care-gallery" aria-label="Clinical care imagery">
        <figure className="care-photo"><img src={donationImage} alt="Gloved clinician holding a blood donation bag" loading="lazy" width={1024} height={768} /><figcaption><Droplet size={18} /><span>Every drop matters.</span><span className="care-photo-index">01 / CARE</span></figcaption></figure>
        <figure className="care-photo"><img src={laboratoryImage} alt="Blood sample tubes and a teal stethoscope in a clinical laboratory" loading="lazy" width={1024} height={768} /><figcaption><HeartPulse size={18} /><span>Connected at every step.</span><span className="care-photo-index">02 / CONNECTION</span></figcaption></figure>
      </section>
      <section className="response-sequence" aria-label="Emergency coordination workflow"><div className="sequence-title"><HeartPulse size={24} /><h2>From signal<br /><span>to response.</span></h2></div><div className="sequence-step"><span className="sequence-number">01 /</span><Radar size={26} /><h3>DETECT</h3><p>Emergency demand.</p></div><div className="sequence-step"><span className="sequence-number">02 /</span><BrainCircuit size={26} /><h3>DECIDE</h3><p>Allocation intelligence.</p></div><div className="sequence-step"><span className="sequence-number">03 /</span><Activity size={26} /><h3>RESPOND</h3><p>Connected clinical care.</p></div></section>
    </main>
    <footer className="home-footer"><span className="footer-brand"><Droplet size={15} /> AERO-BLOOD <span>Emergency Platform</span></span><span>FastAPI Backend Authority · MySQL 8.4</span><span className="footer-workflow">DETECT <span>→</span> DECIDE <span>→</span> RESPOND</span></footer>
  </div>;
}
