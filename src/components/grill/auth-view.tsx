'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { useUI } from '@/store/ui';
import { Flame, ArrowLeft, Mail, Lock, User, Phone, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

type Mode = 'login' | 'register';

export function AuthView() {
  const { setView } = useUI();
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    newsletterSubscribed: false,
  });

  const update = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email: form.email,
        password: form.password,
      });
      if (error) {
        toast.error(error.message || 'Sign in failed');
      } else {
        toast.success('Welcome back!');
        setView('account');
      }
    } catch (err) {
      toast.error('Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z.object({
      name: z.string().min(2, 'Name is required'),
      email: z.string().email('Valid email required'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      phone: z.string().optional(),
      address: z.string().optional(),
    });
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Invalid input');
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.signUp.email({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone || undefined,
        address: form.address || undefined,
        newsletterSubscribed: form.newsletterSubscribed,
      });
      if (error) {
        toast.error(error.message || 'Registration failed');
        return;
      }
      toast.success('Account created! Welcome to 828 Grill.');
      setView('account');
    } catch (err) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-24 pb-16">
      <div className="w-full max-w-md">
        <button
          onClick={() => setView('home')}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#888888] transition-colors hover:text-[#e8531a]"
        >
          <ArrowLeft className="h-4 w-4" /> Back home
        </button>

        <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-7">
          {/* Logo */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8531a]">
              <Flame className="h-6 w-6 text-[#0d0d0d]" />
            </div>
            <h1 className="font-display text-3xl tracking-wider text-[#f5f0e8]">
              828 <span className="text-[#e8531a]">GRILL</span>
            </h1>
            <p className="mt-1 text-sm text-[#888888]">
              {mode === 'login' ? 'Sign in to order' : 'Create your account'}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="mb-6 flex rounded-lg border border-white/10 p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 rounded-md py-2 text-sm font-bold uppercase tracking-wider transition-colors ${
                mode === 'login'
                  ? 'bg-[#e8531a] text-[#0d0d0d]'
                  : 'text-[#888888] hover:text-[#f5f0e8]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 rounded-md py-2 text-sm font-bold uppercase tracking-wider transition-colors ${
                mode === 'register'
                  ? 'bg-[#e8531a] text-[#0d0d0d]'
                  : 'text-[#888888] hover:text-[#f5f0e8]'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-3">
            {mode === 'register' && (
              <Field
                icon={<User className="h-4 w-4" />}
                label="Full Name"
                type="text"
                value={form.name}
                onChange={(v) => update('name', v)}
                placeholder="Jane Doe"
                required
              />
            )}
            <Field
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => update('email', v)}
              placeholder="you@example.com"
              required
            />
            <Field
              icon={<Lock className="h-4 w-4" />}
              label="Password"
              type="password"
              value={form.password}
              onChange={(v) => update('password', v)}
              placeholder={mode === 'register' ? 'Min. 8 characters' : '••••••••'}
              required
            />
            {mode === 'register' && (
              <>
                <Field
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone (optional)"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => update('phone', v)}
                  placeholder="(555) 123-4567"
                />
                <Field
                  icon={<MapPin className="h-4 w-4" />}
                  label="Delivery Address (optional)"
                  type="text"
                  value={form.address}
                  onChange={(v) => update('address', v)}
                  placeholder="123 Main St, Springfield, IL"
                />
                {/* Newsletter opt-in */}
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-[#0d0d0d] p-3 transition-colors hover:border-[#e8531a]/30">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={form.newsletterSubscribed}
                      onChange={(e) => setForm((f) => ({ ...f, newsletterSubscribed: e.target.checked }))}
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-white/20 bg-[#1a1a1a] checked:border-[#e8531a] checked:bg-[#e8531a] transition-colors"
                    />
                    <svg className="pointer-events-none absolute inset-0 hidden h-4 w-4 peer-checked:block" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#f5f0e8]">Subscribe to newsletter</p>
                    <p className="text-xs text-[#666]">Get updates on new items, deals, and grill news.</p>
                  </div>
                </label>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8531a] py-3.5 text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-all hover:bg-[#ff6b2c] active:scale-[0.99] disabled:opacity-60 ember-glow"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-5 rounded-lg border border-white/10 bg-[#0d0d0d] p-3 text-center text-xs text-[#888888]">
              <p className="font-semibold text-[#f5f0e8]/80">Demo account</p>
              <p className="mt-1 font-data text-[#e8531a]">demo@828grill.com</p>
              <p className="font-data text-[#e8531a]">password123</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#888888]">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] py-2.5 pl-9 pr-3 text-sm text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a] placeholder:text-[#555]"
        />
      </div>
    </div>
  );
}
