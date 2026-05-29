"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { GuideBlockRenderer } from "@/components/guide/guide-block-renderer";
import { GuideIntroPanel } from "@/components/guide/guide-intro-panel";
import { PageHeader } from "@/components/shared/page-header";
import {
  SectionBody,
  SectionCard,
  SectionHeader,
} from "@/components/shared/section-card";
import { GUIDE_INTRO, GUIDE_SECTIONS } from "@/lib/user-guide/guide-content";
import { cn } from "@/lib/utils";

export function GuideModule() {
  const [activeId, setActiveId] = React.useState(GUIDE_SECTIONS[0]?.id ?? "dashboard");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5] }
    );

    for (const section of GUIDE_SECTIONS) {
      const el = document.getElementById(`guide-${section.id}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    setActiveId(id);
    document.getElementById(`guide-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <>
      <PageHeader
        title={GUIDE_INTRO.title}
        description={GUIDE_INTRO.subtitle}
      />

      <SectionCard className="border-accent-blue/20 bg-accent-blue-soft/30">
        <SectionBody>
          <div className="flex gap-3">
            <BookOpen className="mt-0.5 h-6 w-6 shrink-0 text-accent-blue" />
            <GuideIntroPanel />
          </div>
        </SectionBody>
      </SectionCard>

      <div className="grid-contained gap-6 lg:grid-cols-[minmax(0,14rem)_1fr] lg:items-start">
        <nav
          aria-label="Sommaire du guide"
          className="lg:sticky lg:top-[calc(var(--topbar-height)+1rem)] lg:max-h-[calc(100dvh-var(--topbar-height)-2rem)] lg:overflow-y-auto"
        >
          <SectionCard>
            <SectionHeader title="Sommaire" />
            <SectionBody className="p-2">
              <ul className="space-y-0.5">
                {GUIDE_SECTIONS.map((section) => (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => scrollTo(section.id)}
                      className={cn(
                        "w-full rounded-sm px-2.5 py-2 text-left text-body-sm transition-colors",
                        activeId === section.id
                          ? "bg-accent-blue-soft font-semibold text-accent-blue"
                          : "text-muted hover:bg-card-muted hover:text-foreground"
                      )}
                    >
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </SectionBody>
          </SectionCard>
        </nav>

        <div className="min-w-0 space-y-6">
          {GUIDE_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={`guide-${section.id}`}
              className="scroll-mt-[calc(var(--topbar-height)+1rem)]"
            >
              <SectionCard>
                <SectionHeader title={section.title} />
                <SectionBody className="space-y-4">
                  {section.blocks.map((block, index) => (
                    <GuideBlockRenderer key={`${section.id}-${index}`} block={block} />
                  ))}
                </SectionBody>
              </SectionCard>
            </section>
          ))}

          <p className="text-center text-body-sm text-muted">
            Besoin d&apos;aller sur une page ?{" "}
            <Link href="/dashboard" className="font-medium text-accent-blue hover:underline">
              Retour au Dashboard
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
