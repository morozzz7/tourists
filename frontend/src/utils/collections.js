const parseSet = (value) => new Set(Array.isArray(value) ? value : [])

const parseRouteStamps = (value) => {
  if (!value || typeof value !== 'object') return {}
  const next = {}
  Object.entries(value).forEach(([key, items]) => {
    next[key] = new Set(Array.isArray(items) ? items : [])
  })
  return next
}

const serializeRouteStamps = (value) => {
  const next = {}
  if (!value || typeof value !== 'object') return next
  Object.entries(value).forEach(([key, items]) => {
    next[key] = Array.from(items || [])
  })
  return next
}

export { parseSet, parseRouteStamps, serializeRouteStamps }
