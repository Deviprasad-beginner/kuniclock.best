'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] gap-4">
                <div className="w-10 h-10 rounded-full border-[3px] border-border border-t-purple animate-spin" />
                <p className="text-muted text-sm">Loading...</p>
            </div>
        );
    }

    if (!user) return null;

    return <>{children}</>;
}
