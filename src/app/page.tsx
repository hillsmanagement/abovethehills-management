'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      await new Promise(resolve => setTimeout(resolve, 2000));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
      {/* Full-screen loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 animate-spin mx-auto">
              <div className="w-full h-full border-t-2 border-b-2 border-blue-500 rounded-full"></div>
            </div>
            <h3 className="text-xl text-white font-semibold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Logging you in...
            </h3>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="bg-gray-800/40 backdrop-blur-sm py-4 px-6 shadow-lg border-b border-gray-700/50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Logo with fallback */}
            <div className="w-14 h-14 relative">
              {logoError ? (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg font-bold">A</span>
                </div>
              ) : (
                <Image
                  src="/images/church-logo.png"
                  alt="Abovethehills Logo"
                  width={56}
                  height={56}
                  className="rounded-full object-cover shadow-lg ring-2 ring-gray-700/50"
                  onError={() => setLogoError(true)}
                  priority
                />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Abovethehills</h1>
              <p className="text-sm font-bold text-gray-400 tracking-wide">MANAGEMENT</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center space-y-3 mb-8">
            <h2 className="text-4xl font-bold relative">
              <span className="typing-text uppercase bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                WELCOME
              </span>
            </h2>
            <style jsx>{`
              .typing-text {
                position: relative;
                border-right: 3px solid #60A5FA;
                white-space: nowrap;
                overflow: hidden;
                width: 0;
                animation: typing 2.5s steps(7, end) forwards,
                         blink-caret 0.75s step-end infinite;
                animation-delay: 0.5s;
              }

              @keyframes typing {
                from { 
                  width: 0;
                  border-right-color: #60A5FA;
                }
                to { 
                  width: 7ch;
                  border-right-color: #60A5FA;
                }
              }

              @keyframes blink-caret {
                from, to { border-color: transparent }
                50% { border-color: #60A5FA }
              }
            `}</style>
            <p className="text-gray-400 text-sm tracking-wide">
              Please enter your password to access the management system
            </p>
          </div>

          <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-gray-700/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-gray-700/50 text-white border border-gray-600 
                      focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
                      focus:outline-none transition-all placeholder:text-gray-400 pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                      px-2 py-1 rounded-md text-sm"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all
                  ${isLoading 
                    ? 'bg-blue-600/50 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-blue-500/25'}`}
              >
                {isLoading ? 'Verifying...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <footer className="py-6 text-center text-gray-400">
        <p className="text-sm tracking-wide">Powered by MobisGo</p>
      </footer>
    </div>
  );
}
