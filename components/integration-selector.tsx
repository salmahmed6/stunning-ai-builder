"use client";

import {
  Check,
  CreditCard,
  Hash,
  Mail,
  Sheet,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { INTEGRATIONS, type Integration } from "@/lib/integrations";

const ICONS: Record<Integration, LucideIcon> = {
  Stripe: CreditCard,
  Shopify: ShoppingBag,
  Gmail: Mail,
  Slack: Hash,
  "Google Sheets": Sheet,
};

/** What each tool would be responsible for in the generated blueprint. */
const ROLES: Record<Integration, string> = {
  Stripe: "Payments",
  Shopify: "Storefront",
  Gmail: "Email",
  Slack: "Alerts",
  "Google Sheets": "Reporting",
};

type Props = {
  selected: Integration[];
  onToggle: (integration: Integration) => void;
  disabled?: boolean;
};

export function IntegrationSelector({ selected, onToggle, disabled }: Props) {
  return (
    <fieldset disabled={disabled} className="group">
      <legend className="annotation text-ink-soft">
        Available tools <span className="text-rule">/</span> optional
      </legend>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {INTEGRATIONS.map((integration) => {
          const Icon = ICONS[integration];
          const isSelected = selected.includes(integration);

          return (
            <button
              key={integration}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(integration)}
              className={[
                "relative flex flex-col items-start gap-2 rounded-md border p-3 text-left transition",
                "group-disabled:cursor-not-allowed group-disabled:opacity-60",
                "hover:border-blueprint/60 hover:shadow-[0_1px_0_0_rgba(11,29,51,0.06)]",
                isSelected
                  ? "border-blueprint bg-blueprint-soft"
                  : "border-rule bg-sheet",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "flex size-8 items-center justify-center rounded border",
                  isSelected
                    ? "border-blueprint/30 bg-sheet text-blueprint"
                    : "border-rule bg-paper text-ink-soft",
                ].join(" ")}
              >
                <Icon className="size-4" strokeWidth={1.75} />
              </span>

              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">
                  {integration}
                </span>
                <span className="annotation block text-ink-soft/80">
                  {ROLES[integration]}
                </span>
              </span>

              {isSelected && (
                <span
                  aria-hidden="true"
                  className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-sm bg-blueprint text-white"
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
