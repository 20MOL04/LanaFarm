"use client";

import * as React from "react";
import {
  AlertTriangle,
  Building2,
  ListChecks,
  Settings2,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { SectionListes } from "@/components/settings/section-listes";
import { SectionPreferences } from "@/components/settings/section-preferences";
import { SectionProfil } from "@/components/settings/section-profil";
import { SectionSeuils } from "@/components/settings/section-seuils";
import {
  SettingsNav,
  type SettingsNavItem,
  type SettingsSectionId,
} from "@/components/settings/settings-nav";
import { useUnsavedNavigation } from "@/contexts/unsaved-navigation-context";

const NAV: SettingsNavItem[] = [
  { id: "profil", label: "Profil de la ferme", icon: Building2 },
  { id: "preferences", label: "Préférences", icon: Settings2 },
  { id: "seuils", label: "Seuils & alertes", icon: AlertTriangle },
  { id: "listes", label: "Listes métier", icon: ListChecks },
];

/**
 * Module Paramètres — centre de configuration opérationnelle.
 *
 * Sections actives : Profil, Préférences, Seuils, Listes.
 * Navigation verticale (desktop) / pills (mobile) avec rendu conditionnel.
 */
export function SettingsModule() {
  const [activeSection, setActiveSection] =
    React.useState<SettingsSectionId>("profil");
  const { guardNavigation } = useUnsavedNavigation();

  const handleSectionChange = React.useCallback(
    (id: SettingsSectionId) => {
      if (id === activeSection) return;
      guardNavigation(() => setActiveSection(id));
    },
    [activeSection, guardNavigation]
  );

  return (
    <>
      <PageHeader title="Paramètres" />

      <div className="grid-contained flex flex-col gap-4 md:flex-row">
        <div className="w-full shrink-0 md:w-48">
          <SettingsNav
            items={NAV}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
        </div>

        <div className="min-w-0 flex-1">
          {activeSection === "profil" ? <SectionProfil /> : null}
          {activeSection === "preferences" ? <SectionPreferences /> : null}
          {activeSection === "seuils" ? <SectionSeuils /> : null}
          {activeSection === "listes" ? <SectionListes /> : null}
        </div>
      </div>
    </>
  );
}
