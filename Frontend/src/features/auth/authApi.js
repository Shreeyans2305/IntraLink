import apiClient from '../../services/apiClient'

export async function loginApi(credentials) {
  const response = await apiClient.post('/auth/login', credentials)
  return response.data
}

export async function registerApi(payload) {
  const response = await apiClient.post('/auth/register', payload)
  return response.data
}

export async function getMeApi() {
  const response = await apiClient.get('/auth/me')
  return response.data
}

// ── Org ───────────────────────────────────────────────────────────────────────

export async function orgStatusApi() {
  const response = await apiClient.get('/org/')
  return response.data
}

export async function orgSetupApi(payload) {
  const response = await apiClient.post('/org/setup', payload)
  return response.data
}

// ── Admin: invites ───────────────────────────────────────────────────────────

export async function listInvitesApi() {
  const response = await apiClient.get('/admin/invites')
  return response.data
}

export async function inviteUserApi(payload) {
  const response = await apiClient.post('/admin/invite', payload)
  return response.data
}

export async function revokeInviteApi(email) {
  const response = await apiClient.delete(`/admin/invite/${encodeURIComponent(email)}`)
  return response.data
}

// ── Admin: lockdown ─────────────────────────────────────────────────────────

export async function getLockdownApi() {
  const response = await apiClient.get('/admin/lockdown')
  return response.data
}

export async function setLockdownApi(active) {
  const response = await apiClient.post('/admin/lockdown', { active })
  return response.data
}

// ── Admin: blast ───────────────────────────────────────────────────────────────

export async function blastApi(passphrase) {
  // Returns a binary blob (the .inm file)
  const response = await apiClient.post('/admin/blast', { passphrase }, { responseType: 'blob' })
  return response.data
}

export async function importBlueprintApi(fileBase64, passphrase) {
  const response = await apiClient.post('/admin/import-blueprint', {
    data: fileBase64,
    passphrase,
  })
  return response.data
}

// ── Admin: metrics ──────────────────────────────────────────────────────────

export async function getMetricsApi() {
  const response = await apiClient.get('/admin/metrics')
  return response.data
}
