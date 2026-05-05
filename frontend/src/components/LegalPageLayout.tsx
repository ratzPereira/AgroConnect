import { type ReactNode, useState, useEffect } from 'react';
import { AnimatedPage } from '@/components/AnimatedPage';

interface TocItem {
  id: string;
  label: string;
}

interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  toc: TocItem[];
  sections: LegalSection[];
}

export function LegalPageLayout({ title, lastUpdated, toc, sections }: LegalPageLayoutProps) {
  const [activeSection, setActiveSection] = useState('');
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    const elements = document.querySelectorAll('[data-section]');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleTocClick = () => {
    setTocOpen(false);
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
            <p className="mt-2 text-sm text-neutral-500">
              {lastUpdated}
            </p>
          </div>

          {/* Mobile TOC toggle */}
          <div className="mb-6 lg:hidden">
            <button
              type="button"
              onClick={() => setTocOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              <span>Indice</span>
              <svg
                className={`h-4 w-4 transform transition-transform ${tocOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {tocOpen && (
              <nav className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <ul className="space-y-2">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        onClick={handleTocClick}
                        className={`block text-sm transition-colors ${
                          activeSection === item.id
                            ? 'font-medium text-green-700'
                            : 'text-neutral-500 hover:text-neutral-700'
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>

          {/* Two-column layout */}
          <div className="lg:flex lg:gap-12">
            {/* Desktop sidebar TOC */}
            <aside className="hidden lg:block">
              <nav className="sticky top-20 w-56">
                <ul className="space-y-2 border-l border-neutral-200">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`block border-l-2 py-1 pl-4 text-sm transition-colors ${
                          activeSection === item.id
                            ? 'border-green-700 font-medium text-green-700'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Content */}
            <main className="max-w-3xl flex-1">
              <div className="space-y-12">
                {sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    data-section=""
                    className="scroll-mt-24"
                  >
                    <h2 className="mb-4 text-xl font-semibold text-neutral-900">
                      {section.title}
                    </h2>
                    <div className="space-y-3 text-neutral-700 leading-relaxed">
                      {section.content}
                    </div>
                  </section>
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
