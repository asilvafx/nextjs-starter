"use client";

import { useCallback, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { ChevronDown, CheckIcon, Languages } from "lucide-react";
import { cn } from "@/lib/utils";

const languages = [
  { id: "en", name: "English", flag: "🇺🇸" },
  { id: "fr", name: "Français", flag: "🇫🇷" },
  // Add more languages as needed
];

interface LanguageSelectorProps {
  slim?: boolean;
}

export function LanguageSelector({ slim = false }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const currentLanguage = languages.find((lang) => lang.id === currentLocale);

  const handleSelect = useCallback(
    (locale: string) => {
      setOpen(false);
      // Replace the locale segment in the pathname
      alert(locale)
    },
    [pathname, router]
  );

  const triggerClasses = cn(
    "dark:bg-input/30 hover:bg-input/30 dark:hover:bg-input/50 flex h-9 items-center justify-between whitespace-nowrap rounded-md border border-input px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
    slim === true && "w-16"
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={triggerClasses}>
        <Languages size={16}/> 
        {!slim && (
        <span className="text-sm">
            Select language
        </span>
        )} 
        <ChevronDown size={16} />
      </PopoverTrigger>
      <PopoverContent
        collisionPadding={10}
        side="bottom"
        className="min-w-[--radix-popper-anchor-width] max-w-[200px] p-0"
      >
        <Command>
          <CommandList> 
            {/* <CommandInput placeholder="Search language..." /> */}
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {languages.map((language) => (
                <CommandItem
                  key={language.id}
                  className="flex items-center gap-2"
                  onSelect={() => handleSelect(language.id)}
                >
                  <div className="flex flex-grow items-center gap-2">
                    <span className="text-base">{language.flag}</span>
                    <span>{language.name}</span>
                  </div>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      language.id === currentLocale
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}