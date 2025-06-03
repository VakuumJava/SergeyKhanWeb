/**
 * Утилиты для обработки адресов
 */

/**
 * Фильтрует адрес, убирая детали квартиры и подъезда для отображения мастерам
 * @param address Полный адрес
 * @returns Отфильтрованный адрес без квартиры и подъезда
 */
export function filterAddressForMaster(address: string | null | undefined): string {
  if (!address) {
    return 'Не указан';
  }

  // Удаляем информацию о квартире и подъезде
  let filteredAddress = address
    // Убираем квартиру (кв., квартира, apt., apartment)
    .replace(/,?\s*(кв\.?\s*\d+|квартира\s*\d+|apt\.?\s*\d+|apartment\s*\d+)/gi, '')
    // Убираем подъезд (подъезд, подъ., под, entrance, ent.)
    .replace(/,?\s*(подъезд\s*\d+|подъ\.?\s*\d+|под\s+\d+|entrance\s*\d+|ent\.?\s*\d+)/gi, '')
    // Убираем этаж (этаж, эт., floor, fl.)
    .replace(/,?\s*(этаж\s*\d+|эт\.?\s*\d+|floor\s*\d+|fl\.?\s*\d+)/gi, '')
    // Убираем лишние запятые и пробелы
    .replace(/,\s*,/g, ',')
    .replace(/,\s*$/, '')
    .replace(/^\s*,/, '')
    .trim();

  return filteredAddress || 'Не указан';
}

/**
 * Проверяет, содержит ли адрес конфиденциальную информацию
 * @param address Адрес для проверки
 * @returns true если содержит номер квартиры или подъезда
 */
export function addressContainsPrivateInfo(address: string | null | undefined): boolean {
  if (!address) {
    return false;
  }

  const privateInfoRegex = /(кв\.?\s*\d+|квартира\s*\d+|подъезд\s*\d+|подъ\.?\s*\d+|под\s+\d+|apt\.?\s*\d+|apartment\s*\d+|entrance\s*\d+|ent\.?\s*\d+)/gi;
  return privateInfoRegex.test(address);
}
