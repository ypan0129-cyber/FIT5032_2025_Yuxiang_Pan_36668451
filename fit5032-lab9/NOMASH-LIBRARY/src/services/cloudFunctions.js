const defaultFunctionsBaseUrl = 'http://127.0.0.1:9100'

const functionsBaseUrl = (
  import.meta.env.VITE_FUNCTIONS_BASE_URL || defaultFunctionsBaseUrl
).replace(/\/$/, '')

export const cloudFunctionUrls = {
  countBooks: `${functionsBaseUrl}/countBooks`,
  sellBookData: `${functionsBaseUrl}/sellBookData`
}
