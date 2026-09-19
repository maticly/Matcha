'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function handleLogin() {
    await supabase.auth.signInWithOtp({ email });
    setSent(true);
  }

  if (sent) return <p>Check your email for a login link.</p>;

  return (
    <div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
      <button onClick={handleLogin}>Send magic link</button>
    </div>
  );
}