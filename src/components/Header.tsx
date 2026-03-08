'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const links = [
    { href: '/partnerka', label: 'Партнерка', match: (p: string) => p.startsWith('/partnerka') },
    { href: '/sales', label: 'ОП', match: (p: string) => p.startsWith('/sales') },
    { href: '/callcenter', label: 'КЦ', match: (p: string) => p.startsWith('/callcenter') },
    { href: '/transcription', label: 'Транскрибация', match: (p: string) => p.startsWith('/transcription') },
    { href: '/employees', label: 'Сотрудники', match: (p: string) => p.startsWith('/employee') },
  ];

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="max-w-3xl mx-auto px-6 h-12 flex items-center justify-between">
        <Link href="/partnerka" className="text-sm font-semibold tracking-tight text-zinc-900">
          Анализ звонков
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const active = link.match(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'text-zinc-900 font-medium bg-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
