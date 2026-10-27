export const adminNavigation = [
  { id: 'general', label: 'Общие элементы сайта', path: '/', icon: 'grid', items: [
    { id: 'site-sidebar', label: 'Сайдбар' },
    { id: 'site-header', label: 'Хедер и меню' },
    { id: 'site-footer', label: 'Футер' },
    { id: 'site-cookie', label: 'Cookie-баннер' },
  ] },
  { id: 'home', label: 'Главная страница', path: '/', icon: 'home', items: [
    { id: 'home-panels', label: 'Панели на главной' },
    { id: 'about-us', label: 'О компании' },
    { id: 'description', label: 'Описание' },
    { id: 'stats', label: 'Компания в цифрах' },
  ] },
  { id: 'about', label: 'О компании', path: '/about', icon: 'building', items: [
    { id: 'about-us', label: 'Вступление' },
    { id: 'description', label: 'Описание' },
    { id: 'stats', label: 'Компания в цифрах' },
    { id: 'director-text', label: 'Слово директора' },
    { id: 'hystory-company', label: 'История компании' },
    { id: 'mission-values', label: 'Миссия и ценности' },
    { id: 'clients', label: 'Клиенты' },
  ] },
  { id: 'legal', label: 'Документы', path: '/privacy', icon: 'file', items: [
    { id: 'privacy', label: 'Политика в отношении ПДн' },
    { id: 'cookie-consent', label: 'Согласие на cookie-файлы' },
    { id: 'user-agreement', label: 'Пользовательское соглашение' },
    { id: 'policy', label: 'Политика сайта' },
  ] },
  { id: 'settings', label: 'Управление', path: '/', icon: 'settings', items: [
    { id: 'project-requests', label: 'Заявки' },
    { id: 'seo', label: 'SEO и метаданные' },
  ] },
]
