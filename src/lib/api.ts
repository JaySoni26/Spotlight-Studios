async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Batches
  listBatches: () => request<any[]>("/api/batches"),
  getBatch: (id: string) => request<any>(`/api/batches/${id}`),
  createBatch: (data: any) => request("/api/batches", { method: "POST", body: JSON.stringify(data) }),
  updateBatch: (id: string, data: any) => request(`/api/batches/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteBatch: (id: string, data: { code: string }) => request(`/api/batches/${id}`, { method: "DELETE", body: JSON.stringify(data) }),

  // Students
  listStudents: () => request<any[]>("/api/students"),
  getStudent: (id: string) => request<any>(`/api/students/${id}`),
  createStudent: (data: any) => request("/api/students", { method: "POST", body: JSON.stringify(data) }),
  updateStudent: (id: string, data: any) => request(`/api/students/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteStudent: (id: string, data: { code: string; refund_amount: number }) =>
    request(`/api/students/${id}`, { method: "DELETE", body: JSON.stringify(data) }),
  renewStudent: (id: string, data: any) => request(`/api/students/${id}/renew`, { method: "POST", body: JSON.stringify(data) }),
  recordStudentLeave: (id: string, data: { leave_days: number; transfer_days?: number; notes?: string | null }) =>
    request(`/api/students/${id}/leave`, { method: "POST", body: JSON.stringify(data) }),
  updateStudentLeave: (studentId: string, leaveId: string, data: { leave_days: number; transfer_days: number; notes?: string | null }) =>
    request(`/api/students/${studentId}/leave/${leaveId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteStudentLeave: (studentId: string, leaveId: string) =>
    request(`/api/students/${studentId}/leave/${leaveId}`, { method: "DELETE" }),
  changeStudentBatch: (id: string, data: any) => request(`/api/students/${id}/batch-change`, { method: "POST", body: JSON.stringify(data) }),
  getBatchHistory: (id: string) => request<any[]>(`/api/students/${id}/batch-change`),

  // Analytics
  analytics: () => request<any>("/api/analytics"),

  // Settings
  getSettings: () =>
    request<{ delete_admin_code: string; leave_transfer_percent: number; ui_theme: "light" | "dark" | "system" }>(
      "/api/settings",
    ),
  updateSettings: (data: {
    delete_admin_code?: string;
    leave_transfer_percent?: number;
    ui_theme?: "light" | "dark" | "system";
  }) => request("/api/settings", { method: "PATCH", body: JSON.stringify(data) }),

  // Freelance gigs
  listFreelance: () => request<any[]>("/api/freelance"),
  createFreelance: (data: any) => request("/api/freelance", { method: "POST", body: JSON.stringify(data) }),
  updateFreelance: (id: string, data: any) => request(`/api/freelance/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteFreelance: (id: string) => request(`/api/freelance/${id}`, { method: "DELETE" }),
  getFreelance: (id: string) => request<any>(`/api/freelance/${id}`),
};
