// apps/api/src/routes/meServices.ts
import type { Express, Request, Response } from "express";
import { anatodGetClienteById } from "../anatod.js";
import {
  anatodListConexionesInternetByCliente,
  anatodListConexionesTelefoniaByCliente,
  anatodListConexionesTelevisionByCliente,
  mapConexionToServiceDTO,
} from "../integrations/anatodClient.js";

type Options = {
  demoClientId: number;
};

export function registerMeServicesRoutes(app: Express, opts: Options) {
  const DEMO_CLIENT_ID = opts.demoClientId;

  // ---------- Servicios (REAL: Internet + Telefonía + TV, best-effort) ----------
  app.get("/v1/me/services", async (_req: Request, res: Response) => {
    try {
      // 1) Cliente real (para obtener anatodClientId)
      const me = await anatodGetClienteById(DEMO_CLIENT_ID);
      const anatodClientId = Number(me.clienteId);

      // 2) Llamadas best-effort en paralelo
      const results = await Promise.allSettled([
        anatodListConexionesInternetByCliente(anatodClientId),
        anatodListConexionesTelefoniaByCliente(anatodClientId),
        anatodListConexionesTelevisionByCliente(anatodClientId),
      ]);

      const [internetRes, phoneRes, tvRes] = results;

      const errors: Array<{ type: string; message: string }> = [];
      const services: Array<any> = [];

      // Internet
      if (internetRes.status === "fulfilled") {
        const list = Array.isArray(internetRes.value?.data) ? internetRes.value.data : [];
        const active = list.filter(
          (x: any) =>
            String(x?.conexion_cortado ?? "").toUpperCase() === "N" ||
            String(x?.conexion_cortado ?? "").trim() === ""
        );
        for (const item of active) services.push(mapConexionToServiceDTO(item, "INTERNET"));
      } else {
        errors.push({
          type: "INTERNET",
          message: String(internetRes.reason?.message ?? internetRes.reason),
        });
      }

      // Telefonía
      if (phoneRes.status === "fulfilled") {
        const list = Array.isArray(phoneRes.value?.data) ? phoneRes.value.data : [];
        const active = list.filter((x: any) => {
          const v = x?.conexion_cortado ?? x?.cortado ?? x?.servicio_cortado;
          if (v === null || v === undefined || String(v).trim() === "") return true;
          return String(v).toUpperCase() === "N";
        });
        for (const item of active) services.push(mapConexionToServiceDTO(item, "PHONE"));
      } else {
        errors.push({
          type: "PHONE",
          message: String(phoneRes.reason?.message ?? phoneRes.reason),
        });
      }

      // TV
      if (tvRes.status === "fulfilled") {
        const list = Array.isArray(tvRes.value?.data) ? tvRes.value.data : [];
        const active = list.filter((x: any) => {
          const v = x?.conexion_cortado ?? x?.cortado ?? x?.servicio_cortado;
          if (v === null || v === undefined || String(v).trim() === "") return true;
          return String(v).toUpperCase() === "N";
        });
        for (const item of active) services.push(mapConexionToServiceDTO(item, "TV"));
      } else {
        errors.push({ type: "TV", message: String(tvRes.reason?.message ?? tvRes.reason) });
      }

      // 3) Respuesta consolidada
      res.json({
        clientId: Number(DEMO_CLIENT_ID),
        anatodClientId,
        services,
        source: "anatod:/cliente/{id}/conexiones/*",
        meta: {
          fetched: {
            internet: internetRes.status === "fulfilled",
            telefonia: phoneRes.status === "fulfilled",
            television: tvRes.status === "fulfilled",
          },
          errors,
        },
      });
    } catch (err: any) {
      console.error(err);
      res.status(502).json({
        ok: false,
        error: "ANATOD_SERVICES_ERROR",
        detail: String(err?.message ?? err),
      });
    }
  });
}
