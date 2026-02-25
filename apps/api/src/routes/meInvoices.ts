// apps/api/src/routes/meInvoices.ts
import type { Express, Request, Response } from "express";

import {
  anatodGetClienteById,
  anatodListFacturasByCliente,
  mapFacturaToDTO,
} from "../anatod.js";

import { anatodGetFacturaById, anatodFacturaPrintLink } from "../integrations/anatodClient.js";

type Options = {
  demoClientId: number;
};

function parseMoneyLike(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const s = String(value).trim();
  if (!s) return 0;
  const n = Number(s.replace(/"/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function safeDate(value: any): string | null {
  const s = String(value ?? "").trim();
  if (!s || s === "0000-00-00") return null;
  return s;
}

function escapeHtml(input: any): string {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function registerMeInvoicesRoutes(app: Express, opts: Options) {
  const DEMO_CLIENT_ID = opts.demoClientId;

  // ---------- FACTURAS ----------
  app.get("/v1/me/invoices", async (req: Request, res: Response) => {
    try {
      const me = await anatodGetClienteById(DEMO_CLIENT_ID);
      const anatodClientId = Number(me.clienteId);

      const limit = Math.min(Math.max(Number(req.query.limit ?? 10), 1), 50);

      const raw = await anatodListFacturasByCliente(anatodClientId);
      const mapped = (raw.data ?? []).map(mapFacturaToDTO);

      // Orden: vencimiento asc (null al final)
      mapped.sort((a: any, b: any) => {
        const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
        const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
        return ad - bd;
      });

      res.json({
        clientId: Number(DEMO_CLIENT_ID),
        anatodClientId,
        invoices: mapped.slice(0, limit),
        source: "anatod:/cliente/{id}/facturas",
      });
    } catch (err: any) {
      console.error(err);
      res.status(502).json({
        ok: false,
        error: "ANATOD_INVOICES_ERROR",
        detail: String(err?.message ?? err),
      });
    }
  });

  app.get("/v1/me/invoices/next", async (_req: Request, res: Response) => {
    try {
      const me = await anatodGetClienteById(DEMO_CLIENT_ID);
      const anatodClientId = Number(me.clienteId);

      const raw = await anatodListFacturasByCliente(anatodClientId);
      const mapped = (raw.data ?? []).map(mapFacturaToDTO);

      const candidates = mapped
        .filter((x: any) => x.status !== "VOIDED" && !!x.dueDate)
        .sort(
          (a: any, b: any) =>
            new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime()
        );

      res.json({
        clientId: Number(DEMO_CLIENT_ID),
        anatodClientId,
        nextInvoice: candidates[0] ?? null,
        source: "anatod:/cliente/{id}/facturas",
      });
    } catch (err: any) {
      console.error(err);
      res.status(502).json({
        ok: false,
        error: "ANATOD_NEXT_INVOICE_ERROR",
        detail: String(err?.message ?? err),
      });
    }
  });

  // Factura puntual (DTO)
  app.get("/v1/me/invoices/:facturaId", async (req: Request, res: Response) => {
    try {
      const facturaId = String(req.params.facturaId ?? "").trim();
      if (!facturaId) return res.status(400).json({ ok: false, error: "MISSING_FACTURA_ID" });

      const raw = await anatodGetFacturaById(facturaId);
      const item = Array.isArray(raw) ? raw[0] : raw;
      if (!item) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

      const dto = mapFacturaToDTO(item);

      res.json({
        clientId: Number(DEMO_CLIENT_ID),
        invoice: dto,
        source: "anatod:/factura/{id}",
      });
    } catch (err: any) {
      console.error(err);
      res.status(502).json({
        ok: false,
        error: "ANATOD_INVOICE_DETAIL_ERROR",
        detail: String(err?.message ?? err),
      });
    }
  });

  /**
   * ✅ PDF nativo (Anatod → S3) vía redirect:
   * - tu API NO proxynea bytes
   * - NO expone API key
   */
  app.get("/v1/me/invoices/:facturaId/print", async (req: Request, res: Response) => {
    try {
      const facturaId = String(req.params.facturaId ?? "").trim();
      if (!facturaId) return res.status(400).json({ ok: false, error: "MISSING_FACTURA_ID" });

      // sanity: demo only ids numéricos
      if (!/^\d+$/.test(facturaId)) {
        return res.status(400).json({ ok: false, error: "INVALID_FACTURA_ID" });
      }

      // Validación de pertenencia (safe)
      const me = await anatodGetClienteById(DEMO_CLIENT_ID);
      const anatodClientId = Number(me.clienteId);

      const rawList = await anatodListFacturasByCliente(anatodClientId);
      const list = Array.isArray((rawList as any)?.data) ? (rawList as any).data : [];

      const found = list.find(
        (f: any) => String(f?.factura_id ?? f?.id ?? f?.facturaId) === facturaId
      );
      if (!found) {
        return res.status(404).json({ ok: false, error: "INVOICE_NOT_FOUND_FOR_CLIENT" });
      }

      const print = await anatodFacturaPrintLink(facturaId);

      if (!print.urlFactura) {
        return res.status(502).json({
          ok: false,
          error: "PRINT_LINK_MISSING",
          raw: print.raw,
        });
      }

      return res.redirect(302, print.urlFactura);
    } catch (err: any) {
      console.error(err);
      return res.status(502).json({
        ok: false,
        error: "ANATOD_PRINT_ERROR",
        detail: String(err?.message ?? err),
      });
    }
  });

  /**
   * ✅ Descarga de “comprobante” sin dependencias:
   * - retorna HTML como attachment (el usuario puede imprimir “Guardar como PDF”)
   */
  app.get("/v1/me/invoices/:facturaId/receipt", async (req: Request, res: Response) => {
    try {
      const facturaId = String(req.params.facturaId ?? "").trim();
      if (!facturaId) return res.status(400).json({ ok: false, error: "MISSING_FACTURA_ID" });

      const me = await anatodGetClienteById(DEMO_CLIENT_ID);

      const raw = await anatodGetFacturaById(facturaId);
      const item = Array.isArray(raw) ? raw[0] : raw;
      if (!item) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

      const dto: any = mapFacturaToDTO(item);

      const tipo = dto.type ?? item.factura_tipo ?? "-";
      const ptoVta = dto.pointOfSale ?? item.factura_puntoventa ?? "-";
      const nro = dto.number ?? item.factura_numero ?? "-";
      const issueDate = dto.issueDate ?? safeDate(item.factura_fecha) ?? "-";
      const dueDate = dto.dueDate ?? safeDate(item.factura_1vencimiento) ?? null;
      const amount = dto.amount ?? parseMoneyLike(item.factura_importe);
      const currency = dto.currency ?? "ARS";
      const detail = dto.description ?? dto.detail ?? item.factura_detalle ?? "";
      const status = dto.status ?? (item.factura_anulada ? "VOIDED" : "OPEN");

      const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Comprobante Factura ${escapeHtml(facturaId)}</title>
  <style>
    body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto; background:#f5f7fa; margin:0; padding:24px;}
    .wrap{max-width:720px; margin:0 auto;}
    .card{background:#fff; border-radius:16px; box-shadow:0 10px 40px rgba(0,0,0,.10); padding:18px;}
    .top{display:flex; justify-content:space-between; gap:12px; align-items:flex-start;}
    .brand{font-weight:900; font-size:18px;}
    .pill{display:inline-flex; align-items:center; padding:6px 10px; border-radius:999px; font-weight:800; font-size:12px; background:#eef2ff; border:1px solid #c7d2fe; color:#1e3a8a;}
    h1{margin:0; font-size:18px;}
    .muted{opacity:.7; font-size:12px; margin-top:4px;}
    .grid{margin-top:14px; display:grid; gap:10px;}
    .row{display:flex; justify-content:space-between; gap:12px; font-size:14px; padding:10px 12px; background:#fafbfc; border:1px solid #eef0f3; border-radius:12px;}
    .k{font-weight:900;}
    .amt{font-size:26px; font-weight:900; letter-spacing:-.5px; margin-top:12px;}
    .note{margin-top:12px; font-size:12px; opacity:.8; line-height:1.4; background:#f8fafc; border:1px solid #e2e8f0; padding:12px; border-radius:12px;}
    .footer{margin-top:14px; font-size:11px; opacity:.7; text-align:center;}
    @media print { body{background:#fff; padding:0;} .card{box-shadow:none; border:1px solid #e2e8f0;} }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="top">
        <div>
          <div class="brand">SSServicios</div>
          <div class="muted">Comprobante de factura (demo) · Generado: ${escapeHtml(
            new Date().toISOString()
          )}</div>
        </div>
        <div class="pill">${escapeHtml(status)}</div>
      </div>

      <div style="margin-top:14px;">
        <h1>Factura ${escapeHtml(tipo)} ${escapeHtml(String(ptoVta))}-${escapeHtml(String(nro))}</h1>
        <div class="muted">Factura ID: ${escapeHtml(facturaId)} · Cliente (Selfcare): ${escapeHtml(
        String(DEMO_CLIENT_ID)
      )} · Anatod: ${escapeHtml(String(me.clienteId))}</div>
      </div>

      <div class="amt">$ ${escapeHtml(Number(amount).toLocaleString("es-AR"))} ${escapeHtml(currency)}</div>

      <div class="grid">
        <div class="row"><span class="k">Fecha de emisión</span><span>${escapeHtml(issueDate)}</span></div>
        <div class="row"><span class="k">Vencimiento</span><span>${escapeHtml(dueDate ?? "—")}</span></div>
        <div class="row"><span class="k">Detalle</span><span style="text-align:right; max-width:420px;">${escapeHtml(
        detail || "—"
      )}</span></div>
      </div>

      <div class="note">
        <b>Importante:</b> este comprobante es una representación para demo. Para un “PDF nativo” se puede generar con un motor de PDF
        (ej. pdfkit/puppeteer) cuando lo prioricemos en roadmap.
      </div>

      <div class="footer">SSServicios Selfcare Demo · Facturación / Estado de cuenta</div>
    </div>
  </div>
</body>
</html>`;

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="factura_${facturaId}.html"`);
      res.status(200).send(html);
    } catch (err: any) {
      console.error(err);
      res.status(502).json({
        ok: false,
        error: "ANATOD_RECEIPT_ERROR",
        detail: String(err?.message ?? err),
      });
    }
  });
}
