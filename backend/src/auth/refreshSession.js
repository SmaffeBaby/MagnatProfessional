export function createRefreshSessionHandler(createAuthClient) {
  return async (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    try {
      const refreshToken = req.body?.refresh_token
      if (typeof refreshToken !== 'string' || !refreshToken || refreshToken.length > 4096) {
        res.status(400).json({ error: 'Refresh token is required' })
        return
      }
      // Each operation uses a separate client to isolate users' sessions.
      const { data, error } = await createAuthClient().auth.refreshSession({ refresh_token: refreshToken })
      if (error || !data.session) {
        const status = error?.status
        const invalid = [400, 401, 403].includes(status) && error?.name !== 'AuthRetryableFetchError'
        res.status(status === 429 ? 429 : invalid ? 401 : 503).json({ error: 'Unable to refresh session' })
        return
      }
      res.json({ session: data.session })
    } catch (error) {
      next(error)
    }
  }
}
