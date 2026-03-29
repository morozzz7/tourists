const formatNumber = (value) => value.toLocaleString('ru-RU')

const normalizeName = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[ё]/g, 'е')
    .replace(/[^a-zа-я0-9 ]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export { formatNumber, normalizeName }
