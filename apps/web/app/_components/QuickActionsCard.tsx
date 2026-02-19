"use client";

import Link from "next/link";
import React from "react";
import { Btn, Card, SectionTitle } from "../ui";

type Props = {
  showAdmin: boolean;
  onToggleAdmin: () => void;
  openStore: () => void;
};

function MSIcon({ name, filled }: { name: string; filled?: boolean }) {
  return (
    <span
      className="material-symbols-outlined text-[22px] leading-none text-[#7b00ff]"
      aria-hidden
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 600, 'GRAD' 0, 'opsz' 24`,
      }}
    >
      {name}
    </span>
  );
}

function Item({
  label,
  icon,
  href,
  onClick,
  title,
}: {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  title?: string;
}) {
  const content = (
    <div
      title={title}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      className={[
        "flex flex-col items-center justify-center text-center select-none",
        "gap-2.5 p-3.5 rounded-2xl",
        "bg-white shadow-[0_10px_24px_rgba(0,0,0,0.06)]",
        "border border-[rgba(123,0,255,0.10)]",
        onClick ? "cursor-pointer" : "cursor-default",
        "active:scale-[0.99] transition-transform",
      ].join(" ")}
    >
      <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center bg-[rgba(123,0,255,0.10)] border border-[rgba(123,0,255,0.18)]">
        {icon}
      </div>

      <div className="text-[12px] font-extrabold text-slate-900/90">{label}</div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="no-underline">
        {content}
      </Link>
    );
  }

  return content;
}

export default function QuickActionsCard({ showAdmin, onToggleAdmin, openStore }: Props) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <SectionTitle>Accesos rápidos</SectionTitle>
        <Btn onClick={onToggleAdmin} title="Panel técnico (demo)">
          {showAdmin ? "Ocultar admin" : "Mostrar admin"}
        </Btn>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        <Item label="Facturas" icon={<MSIcon name="receipt_long" filled />} href="/invoices" />
        <Item label="Servicios" icon={<MSIcon name="lan" />} href="/services" />
        <Item label="Beneficios" icon={<MSIcon name="workspace_premium" filled />} href="/benefits" />
        <Item
          label="SSStore"
          icon={<MSIcon name="shopping_bag" />}
          onClick={openStore}
          title="Abre SSStore en una pestaña nueva"
        />
        <Item label="Soporte" icon={<MSIcon name="support_agent" />} title="Próximo: soporte / tickets" />
        <Item label="Débito" icon={<MSIcon name="credit_card" />} title="Próximo: débito automático" />
        <Item label="Perfil" icon={<MSIcon name="person" />} title="Próximo: perfil y datos" />
        <Item label="Más" icon={<MSIcon name="add_circle" />} title="Más opciones (demo)" />
      </div>
    </Card>
  );
}
