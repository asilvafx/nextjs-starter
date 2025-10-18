// components/ui/loading-spinner.tsx
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'sm' | 'default' | 'lg' | 'xl';
    className?: string;
}

export function LoadingSpinner({
    size = 'default',
    className,
    ...props
}: LoadingSpinnerProps & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'animate-spin rounded-full border-2 border-accent-foreground border-t-accent',
                {
                    'h-4 w-4': size === 'sm',
                    'h-6 w-6': size === 'default',
                    'h-8 w-8': size === 'lg',
                    'h-12 w-12': size === 'xl'
                },
                className
            )}
            {...props}
        />
    );
}

interface LoadingPageProps {
    message?: string;
    className?: string;
}

export function LoadingPage({ message = '', className }: LoadingPageProps) {
    return (
        <div className={cn('flex h-full min-h-[200px] flex-col items-center justify-center space-y-4', className)}>
            <LoadingSpinner size="lg" />
            <p className="animate-pulse text-muted-foreground text-sm">{message}</p>
        </div>
    );
}
