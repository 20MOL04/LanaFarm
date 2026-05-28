"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Hourglass,
  Inbox,
  ShieldCheck,
} from "lucide-react";

import { TransferStatusBadge } from "@/components/transfers/transfer-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricValue } from "@/components/shared/metric-value";
import {
  SectionBody,
  SectionCard,
  SectionHeader,
} from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFarmConfig, useTransfersStore } from "@/contexts/farm-store";
import { useTransfersInRange } from "@/hooks/use-transfers-in-range";
import { formatDay } from "@/lib/date-ranges";
import { formatNumber } from "@/lib/format";
import { aggregateTransfers } from "@/lib/transfers-calc";
import { eggsToTrays } from "@/lib/units";
import { cn } from "@/lib/utils";
import type { TransfertStock } from "@/types/domain";

function formatAlv(eggs: number, cap: number): string {
  return `${formatNumber(eggsToTrays(eggs, cap))} alv.`;
}

/**
 * Réceptions — couche de visibilité légère sur les mouvements de stock
 * Ferme → Magasin créés automatiquement par le module Production.
 *
 * V1 mono-site : auto-confirm activé → l'écrasante majorité des transferts
 * apparaît directement « Reçu ». Le bouton « Confirmer » et le panneau de
 * contestation existent pour la suite (V1.5 multi-utilisateur), invisibles
 * tant qu'aucun transfert n'est en attente.
 *
 * Lecture seule sur la plage globale du calendrier.
 */
export function ReceptionsPanel() {
  const transferts = useTransfersInRange();
  const totals = aggregateTransfers(transferts);
  const { confirmTransfer } = useTransfersStore();
  const config = useFarmConfig();
  const cap = config.preferences.capacitePlateau;

  // Tri : les anomalies remontent (en attente, contesté), puis date desc.
  const ordered = React.useMemo(() => {
    const score = (t: TransfertStock) =>
      t.statut === "en_attente" ? 0 : t.statut === "conteste" ? 1 : 2;
    return [...transferts].sort((a, b) => {
      const sa = score(a);
      const sb = score(b);
      if (sa !== sb) return sa - sb;
      return new Date(b.jourEnvoiISO).getTime() - new Date(a.jourEnvoiISO).getTime();
    });
  }, [transferts]);

  return (
    <SectionCard id="receptions-panel">
      <SectionHeader
        title="Réceptions"
        actions={
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            <SummaryBadge
              icon={CheckCircle2}
              tone="success"
              label="reçus"
              value={totals.parStatut.recu}
            />
            <SummaryBadge
              icon={Hourglass}
              tone="warning"
              label="en attente"
              value={totals.parStatut.en_attente}
            />
            <SummaryBadge
              icon={AlertTriangle}
              tone="danger"
              label="contestés"
              value={totals.parStatut.conteste}
            />
          </div>
        }
      />
      <SectionBody>
        {ordered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Aucune réception sur la période"
            description="Les transferts apparaîtront ici dès qu'une saisie Production sera enregistrée."
          />
        ) : (
          <div className="space-y-3">
            <HealthBanner totals={totals} cap={cap} />

            <ul
              role="list"
              className={cn(
                "divide-y divide-border rounded-card border border-border shadow-card",
                "max-h-72 overflow-y-auto"
              )}
            >
              {ordered.map((t) => (
                <TransferRow
                  key={t.id}
                  transfert={t}
                  cap={cap}
                  onConfirm={() => confirmTransfer(t.id)}
                />
              ))}
            </ul>
          </div>
        )}
      </SectionBody>
    </SectionCard>
  );
}

/* ===========================================================
   Sous-composants locaux
   =========================================================== */

function SummaryBadge({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: React.ElementType;
  tone: "success" | "warning" | "danger";
  label: string;
  value: number;
}) {
  if (value === 0) return null;
  return (
    <Badge tone={tone}>
      <Icon className="h-3 w-3" />
      {value} {label}
    </Badge>
  );
}

function HealthBanner({
  totals,
  cap,
}: {
  totals: ReturnType<typeof aggregateTransfers>;
  cap: number;
}) {
  const allHealthy =
    totals.parStatut.en_attente === 0 && totals.parStatut.conteste === 0;

  if (allHealthy) {
    return (
      <div className="flex items-center gap-2 rounded-card border border-success/20 bg-success-soft/60 px-3 py-2 text-xs text-success">
        <ShieldCheck className="h-4 w-4" />
        <span>
          {totals.total} transfert{totals.total > 1 ? "s" : ""} synchronisé
          {totals.total > 1 ? "s" : ""} automatiquement —{" "}
          <MetricValue
            amount={formatAlv(totals.totalRecu, cap)}
            amountClassName="font-medium"
          />
          {" reçues"}.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-card border border-warning/20 bg-warning-soft/60 px-3 py-2 text-xs text-warning">
      <AlertTriangle className="h-4 w-4" />
      <span>
        {totals.parStatut.en_attente > 0
          ? `${totals.parStatut.en_attente} en attente de confirmation`
          : null}
        {totals.parStatut.en_attente > 0 && totals.parStatut.conteste > 0
          ? " · "
          : null}
        {totals.parStatut.conteste > 0
          ? `${totals.parStatut.conteste} contesté${totals.parStatut.conteste > 1 ? "s" : ""}`
          : null}
      </span>
    </div>
  );
}

function TransferRow({
  transfert,
  cap,
  onConfirm,
}: {
  transfert: TransfertStock;
  cap: number;
  onConfirm: () => void;
}) {
  const recu = transfert.quantiteRecue ?? transfert.quantiteEnvoyee;
  const ecart = typeof transfert.ecart === "number" ? transfert.ecart : 0;
  const hasEcart = transfert.statut === "recu" && ecart !== 0;
  const dateRef = transfert.jourReceptionISO ?? transfert.jourEnvoiISO;

  return (
    <li className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-pill",
            transfert.statut === "recu" && "bg-success-soft text-success",
            transfert.statut === "en_attente" && "bg-warning-soft text-warning",
            transfert.statut === "conteste" && "bg-danger-soft text-danger"
          )}
        >
          {transfert.statut === "recu" ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : transfert.statut === "en_attente" ? (
            <Hourglass className="h-3.5 w-3.5" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5" />
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium capitalize text-foreground">
            {formatDay(new Date(dateRef))}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted tabular-nums">
            <span>{formatAlv(transfert.quantiteEnvoyee, cap)} envoyées</span>
            <ArrowRight className="h-3 w-3" />
            <span
              className={cn(
                "font-medium",
                transfert.statut === "recu" ? "text-foreground" : "text-muted"
              )}
            >
              {transfert.statut === "en_attente"
                ? "à confirmer"
                : `${formatAlv(recu, cap)} reçues`}
            </span>
            {hasEcart ? (
              <span
                className={cn(
                  "ml-1 font-medium",
                  ecart < 0 ? "text-danger" : "text-warning"
                )}
              >
                · écart {ecart > 0 ? "+" : ""}
                {formatAlv(Math.abs(ecart), cap)}
              </span>
            ) : null}
          </p>
          {transfert.noteEcart ? (
            <p className="mt-0.5 truncate text-[11px] italic text-muted">
              « {transfert.noteEcart} »
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:justify-end">
        <TransferStatusBadge status={transfert.statut} />
        {transfert.statut === "en_attente" ? (
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={onConfirm}
            title="Confirmer la réception"
          >
            Confirmer
          </Button>
        ) : null}
      </div>
    </li>
  );
}
