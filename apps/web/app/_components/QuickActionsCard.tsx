"use client";

import Link from "next/link";
import React from "react";
import { Btn, Card, SectionTitle } from "../ui";

type Props = {
  showAdmin: boolean;
  onToggleAdmin: () => void;
  openStore: () => void;

  quickGridStyle: React.CSSProperties;
  quickItemStyle: React.CSSProperties;
  quickIconStyle: React.CSSProperties;
  quickTextStyle: React.CSSProperties;
};

export default function QuickActionsCard({
  showAdmin,
  onToggleAdmin,
  openStore,
  quickGridStyle,
  quickItemStyle,
  quickIconStyle,
  quickTextStyle,
}: Props) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <SectionTitle>Accesos rápidos</SectionTitle>
        <Btn onClick={onToggleAdmin} title="Panel técnico (demo)">
          {showAdmin ? "Ocultar admin" : "Mostrar admin"}
        </Btn>
      </div>

      <div style={quickGridStyle}>
        <Link href="/invoices" style={{ textDecoration: "none" }}>
          <div style={quickItemStyle}>
            <div style={quickIconStyle}>🧾</div>
            <div style={quickTextStyle}>Facturas</div>
          </div>
        </Link>

        <Link href="/services" style={{ textDecoration: "none" }}>
          <div style={quickItemStyle}>
            <div style={quickIconStyle}>🌐</div>
            <div style={quickTextStyle}>Servicios</div>
          </div>
        </Link>

        <Link href="/benefits" style={{ textDecoration: "none" }}>
          <div style={quickItemStyle}>
            <div style={quickIconStyle}>🎁</div>
            <div style={quickTextStyle}>Beneficios</div>
          </div>
        </Link>

        <div style={quickItemStyle} onClick={openStore} role="button" title="Abre SSStore en una pestaña nueva">
          <div style={quickIconStyle}>🛒</div>
          <div style={quickTextStyle}>SSStore</div>
        </div>

        <div style={quickItemStyle} title="Próximo: soporte / tickets">
          <div style={quickIconStyle}>🛠️</div>
          <div style={quickTextStyle}>Soporte</div>
        </div>

        <div style={quickItemStyle} title="Próximo: débito automático">
          <div style={quickIconStyle}>💳</div>
          <div style={quickTextStyle}>Débito</div>
        </div>

        <div style={quickItemStyle} title="Próximo: perfil y datos">
          <div style={quickIconStyle}>👤</div>
          <div style={quickTextStyle}>Perfil</div>
        </div>

        <div style={quickItemStyle} title="Más opciones (demo)">
          <div style={quickIconStyle}>➕</div>
          <div style={quickTextStyle}>Más</div>
        </div>
      </div>
    </Card>
  );
}
