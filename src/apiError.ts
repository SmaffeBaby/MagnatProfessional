export class ApiError extends Error {
  constructor(public status: number, path: string) {
    super(`Failed to load ${path}: ${status}`)
    this.name = 'ApiError'
  }
}
