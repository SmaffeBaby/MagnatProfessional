import { queryClient } from '../queryClient'

export function invalidatePublicContent(path: string, method = 'GET') {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) return
  const resource = path.split('?')[0].split('/')[3]
  let keys: string[][]
  switch (resource) {
    case 'home-panels':
      keys = [['home-panels'], ['portfolio-detail'], ['portfolio-case'], ['seo']]
      break
    case 'legal-documents': {
      const documentKey = path.split('?')[0].split('/')[4]
      keys = [documentKey ? ['legal-document', documentKey] : ['legal-document']]
      break
    }
    case 'privacy':
      keys = [['legal-document', 'privacy']]
      break
    case 'main-text': case 'about-us': case 'description': case 'stats':
    case 'director-text': case 'hystory-company': case 'mission-values':
    case 'clients': case 'seo': case 'site-chrome':
      keys = [[resource]]
      break
    default:
      return
  }
  for (const queryKey of keys) {
    void queryClient.invalidateQueries({ queryKey })
  }
}
