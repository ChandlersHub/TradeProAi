import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in · Trade Pro AI" };

export default function LoginPage() {
  return (
    <main className="login-page">
      <style>{`
        .login-page { min-height: 100vh; display: grid; grid-template-columns: 1.1fr 1fr; }
        .login-hero { background: var(--ink); color: var(--ink-contrast); padding: 48px; display: flex; flex-direction: column; justify-content: space-between; }
        .login-hero h1 { font-size: 34px; line-height: 1.15; max-width: 460px; margin-top: 48px; }
        .login-hero p { opacity: .8; max-width: 440px; margin-top: 14px; font-size: 15px; }
        .login-brands { display: flex; flex-direction: column; gap: 10px; margin-top: 36px; }
        .login-brands div { display: flex; align-items: center; gap: 10px; font-weight: 550; }
        .login-form-wrap { display: grid; place-items: center; padding: 32px 16px; background: var(--surface-1); }
        .login-card { width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 16px; }
        @media (max-width: 860px) {
          .login-page { grid-template-columns: 1fr; }
          .login-hero { padding: 28px 16px; }
          .login-hero h1 { font-size: 24px; margin-top: 20px; }
          .login-brands { margin-top: 20px; }
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .login-hero { background: #14213d; color: #fff; }
        }
      `}</style>
      <section className="login-hero">
        <div className="logo" style={{ padding: 0 }}>
          <div className="logo-mark" style={{ background: "#fff", color: "#14213d" }}>TP</div>
          <div>Trade Pro AI</div>
        </div>
        <div>
          <h1>One AI back office for three Phoenix trade companies.</h1>
          <p>Every call answered 24/7 in each company's name, jobs booked straight onto the board, and work passed between partners automatically.</p>
          <div className="login-brands">
            <div><span className="brand-dot" style={{ background: "#3987e5" }} />LJ&apos;s Cleaning Solutions</div>
            <div><span className="brand-dot" style={{ background: "#eb6834" }} />All Faze Electric</div>
            <div><span className="brand-dot" style={{ background: "#1baf7a" }} />Platinum Refrigeration</div>
          </div>
        </div>
        <p style={{ fontSize: 12, opacity: 0.6 }}>Demo environment. Sample data only.</p>
      </section>
      <section className="login-form-wrap">
        <Suspense>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
