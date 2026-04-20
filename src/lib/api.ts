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
  createBatch: (data: any) => request("/api/batches", { method: "POST", body: JSON.stringify(data) }),
  updateBatch: (id: string, data: any) => request(`/api/batches/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteBatch: (id: string) => request(`/api/batches/${id}`, { method: "DELETE" }),

  // Students
  listStudents: () => request<any[]>("/api/students"),
  createStudent: (data: any) => request("/api/students", { method: "POST", body: JSON.stringify(data) }),
  updateStudent: (id: string, data: any) => request(`/api/students/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteStudent: (id: string) => request(`/api/students/${id}`, { method: "DELETE" }),
  renewStudent: (id: string, data: any) => request(`/api/students/${id}/renew`, { method: "POST", body: JSON.stringify(data) }),
  changeStudentBatch: (id: string, data: any) => request(`/api/students/${id}/batch-change`, { method: "POST", body: JSON.stringify(data) }),
  getBatchHistory: (id: string) => request<any[]>(`/api/students/${id}/batch-change`),

  // Analytics
  analytics: () => request<any>("/api/analytics"),
};
