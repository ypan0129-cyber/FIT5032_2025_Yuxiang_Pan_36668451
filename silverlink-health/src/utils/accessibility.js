export const APPLICATION_NAME = 'SilverLink Health'

export function getDocumentTitle(pageTitle = '') {
  const title = typeof pageTitle === 'string' ? pageTitle.trim() : ''

  return title ? `${title} | ${APPLICATION_NAME}` : APPLICATION_NAME
}

export function focusMainContent(documentRef) {
  const main = documentRef?.getElementById?.('main-content')

  if (!main || typeof main.focus !== 'function') {
    return false
  }

  main.focus({ preventScroll: true })
  return true
}
