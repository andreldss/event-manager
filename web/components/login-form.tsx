'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('')
    const router = useRouter()
    return (
        <div>
            <label className='block mb-4'>
                <span className='text-sm text-gray-600'>E-mail</span>
                <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className='mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400'
                />
            </label>

            <label className='block mb-6'>
                <span className='text-sm text-gray-600'>Senha</span>
                <input
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className='mt-1 w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:background-400'
                />
            </label>

            <div className='flex items-center justify-center mb-4'>
                {error && <p className='text-red-500 text-l font-bold mb-2'>{error}</p>}
            </div>

            <button type='submit' className='w-full py-2 px-4 bg-background hover:opacity-80 active:opacity-100 text-white font-semibold rounded-lg shadow cursor-pointer mb-2'>
                {loading ? 'Entrando..' : 'Entrar'}
            </button>
        </div>
    );
}