import { Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <div
            className={cn(
                'inline-flex gap-1 rounded-lg bg-neutral-100 p-1',
                className,
            )}
            {...props}
        >
            <button
                onClick={() => updateAppearance('light')}
                className={cn(
                    'flex items-center rounded-md px-3.5 py-1.5 transition-colors',
                    appearance === 'light'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black',
                )}
            >
                <Sun className="-ml-1 h-4 w-4" />
                <span className="ml-1.5 text-sm">Light</span>
            </button>
        </div>
    );
}
