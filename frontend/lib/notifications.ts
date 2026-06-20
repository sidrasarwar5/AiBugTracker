import { api } from "./api";
import type { Notification } from "@/types/api";

export async function listNotifications(): Promise<Notification[]> {
  return api.get<Notification[]>("/notifications/");
}
