// @/components/ui/language-selector.tsx

'use client';

import { CheckIcon, ChevronDown, Languages } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useCallback, useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const defaultLanguages = [
    { id: 'en', name: 'English', flag: '🇺🇸' },
    { id: 'fr', name: 'Français', flag: '🇫🇷' }
    // Add more languages as needed
];

interface LanguageSelectorProps {
    languages?: Array<{ id: string; name: string; flag?: string; code?: string }>;
    onChange?: (languageId: string) => void;
    value?: string;
    slim?: boolean;
}

export function LanguageSelector({
    languages = defaultLanguages,
    onChange,
    value,
    slim = false
}: LanguageSelectorProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const currentLocale = useLocale();

    // Use the form value if provided, otherwise use the current locale
    const selectedLanguageId = value || currentLocale;
    const currentLanguage = languages.find((lang) => (lang.id || lang.code) === selectedLanguageId);

    const handleSelect = useCallback(
        (locale: string) => {
            setOpen(false);
            if (onChange) {
                // If onChange is provided (form mode), call it
                onChange(locale);
            } else {
                // Otherwise, handle route navigation (standalone mode)
                // Replace the locale segment in the pathname
                alert(locale); // You can implement actual route navigation here
            }
        },
        [onChange, pathname, router]
    );

    const triggerClasses = cn(
        'dark:bg-input/30 hover:bg-input/30 dark:hover:bg-input/50 flex h-9 items-center justify-between whitespace-nowrap rounded-md border border-input px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        slim === true && 'w-16'
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className={triggerClasses}>
                <Languages size={16} />
                {!slim && <span className="text-sm">{currentLanguage ? currentLanguage.name : 'Select language'}</span>}
                <ChevronDown size={16} />
            </PopoverTrigger>
            <PopoverContent
                collisionPadding={10}
                side="bottom"
                className="min-w-[--radix-popper-anchor-width] max-w-[200px] p-0">
                <Command>
                    <CommandList>
                        {/* <CommandInput placeholder="Search language..." /> */}
                        <CommandEmpty>No language found.</CommandEmpty>
                        <CommandGroup>
                            {languages.map((language) => {
                                const languageId = language.id || language.code;
                                if (!languageId) return null; // Skip languages without id or code
                                return (
                                    <CommandItem
                                        key={languageId}
                                        className="flex items-center gap-2"
                                        onSelect={() => handleSelect(languageId)}>
                                        <div className="flex flex-grow items-center gap-2">
                                            {language.flag && <span className="text-base">{language.flag}</span>}
                                            <span>{language.name}</span>
                                        </div>
                                        <CheckIcon
                                            className={cn(
                                                'ml-auto h-4 w-4',
                                                languageId === selectedLanguageId ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
