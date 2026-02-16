type CreateAdicionalInput = {
  clientId: number | string;
  installmentValue: number; // valor de la cuota mensual (ej 40000)
  description: string;      // ej "Compra App Demo - Pack X"
};

export async function createAriaAdditionalStrict(input: CreateAdicionalInput): Promise<{
  ok: boolean;
  status: number;
  bodyText: string;
}> {
  const base = process.env.ANATOD_BASE_URL; // https://api.anatod.ar/api
  const apiKey = process.env.ANATOD_API_KEY;
  const ariaUserId = process.env.ARIA_USER_ID;

  if (!base) throw new Error("Missing env ANATOD_BASE_URL");
  if (!apiKey) throw new Error("Missing env ANATOD_API_KEY");
  if (!ariaUserId) throw new Error("Missing env ARIA_USER_ID");

  const url = `${base}/adicional`;

  const payload = {
    adicional_usuario: Number(ariaUserId),
    adicional_cliente: String(input.clientId),
    adicional_descripcion: input.description,
    adicional_tipo: "M",
    adicional_moneda: "ML",
    adicional_importe: Number(input.installmentValue).toFixed(2),
    adicional_meses: "3",
    adicional_cotizacion: "0",
    adicional_iva: "21"
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "accept": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const bodyText = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, bodyText };
}
