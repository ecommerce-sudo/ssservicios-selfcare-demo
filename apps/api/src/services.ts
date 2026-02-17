export type ServiceStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";
export type ServiceType = "INTERNET" | "MOBILE" | "TV" | "OTHER";

export type Service = {
  id: string;
  type: ServiceType;
  name: string;
  status: ServiceStatus;
  extra?: string | null;
};

/**
 * DEMO:
 * - Hoy devolvemos un catálogo “mock” para poder mostrar pantallas.
 * - Próximo paso: reemplazar por datos reales desde Anatod/Aria (conexiones/servicios).
 */
export async function listServicesByClient(clientId: number): Promise<Service[]> {
  // Podés customizar por clientId si querés “demos” distintos
  void clientId;

  return [
    {
      id: "svc_internet_1",
      type: "INTERNET",
      name: "(YACIMIENTO) Abono Yacimiento",
      status: "ACTIVE",
      extra: "Internet Hogar",
    },
    {
      id: "svc_mobile_1",
      type: "MOBILE",
      name: "(IG1) SSMovil Plan 1.5GB Empleados",
      status: "ACTIVE",
      extra: "Línea móvil",
    },
    // Si querés un tercero para que se vea más completo:
    // { id: "svc_tv_1", type: "TV", name: "Pack TV (Demo)", status: "ACTIVE", extra: "TV" },
  ];
}
