"use client";

import React from "react";
import { Btn, Card, SectionTitle } from "../ui";

type Props = {
  amount: string;
  desc: string;
  setAmount: (v: string) => void;
  setDesc: (v: string) => void;

  actionLoading: null | "purchase" | "reconcile";
  runPurchase: () => void;
  runReconcile: () => void;

  actionResult: any;

  inputStyle: React.CSSProperties;
};

export default function AdminPanel({
  amount,
  desc,
  setAmount,
  setDesc,
  actionLoading,
  runPurchase,
  runReconcile,
  actionResult,
  inputStyle,
}: Props) {
  return (
    <Card>
      <SectionTitle>Admin demo (técnico)</SectionTitle>
      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>
        Esto es para testear el flow sin ensuciar la vista de presentación.
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", alignItems: "end" }}>
        <div>
          <label style={{ display: "block", fontWeight: 900, marginBottom: 6 }}>Monto (ARS)</label>
          <input
            style={inputStyle}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            placeholder="120000"
          />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: 900, marginBottom: 6 }}>Descripción</label>
          <input
            style={inputStyle}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Compra Demo Pack X"
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <Btn onClick={runPurchase} disabled={actionLoading !== null}>
          {actionLoading === "purchase" ? "Procesando compra..." : "Simular compra financiada"}
        </Btn>

        <Btn onClick={runReconcile} disabled={actionLoading !== null}>
          {actionLoading === "reconcile" ? "Reconciliando..." : "Reconciliar órdenes"}
        </Btn>
      </div>

      <div style={{ marginTop: 14 }}>
        <h3 style={{ marginBottom: 8, fontSize: 14, fontWeight: 900 }}>Resultado</h3>
        <pre style={{ padding: 12, background: "#f7f7f7", borderRadius: 12, overflowX: "auto" }}>
          {actionResult ? JSON.stringify(actionResult, null, 2) : "— (todavía no ejecutaste ninguna acción) —"}
        </pre>
      </div>
    </Card>
  );
}
