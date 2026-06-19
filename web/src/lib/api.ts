const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

interface ApiRequest {
  method?: string
  body?: unknown
}

/**
 * Thin client for the API. Prefixes the base URL, always sends the httpOnly auth
 * cookie, JSON-encodes the body when present, and throws an Error carrying the
 * server's `message` on a non-2xx response so thunks can surface it.
 */
export async function apiFetch<T>(path: string, { method = "GET", body }: ApiRequest = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.message ?? "Request failed.")
  }
  return data as T
}
