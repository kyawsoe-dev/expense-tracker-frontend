import api from "./axios";
import type { AdminOverviewResponse } from "@/types";

const adminHeaders = () => {
  const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
  return apiKey ? { "x-admin-api-key": apiKey } : undefined;
};

export const adminAPI = {
  overview: () =>
    api.get<AdminOverviewResponse>("/admin/overview", {
      headers: adminHeaders(),
    }),
};
