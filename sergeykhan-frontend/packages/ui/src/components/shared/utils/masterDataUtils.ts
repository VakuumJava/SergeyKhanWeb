/**
 * Утилиты для форматирования данных для мастеров
 * Скрывает конфиденциальную информацию на уровне фронтенда
 */

import type { Order } from "@shared/constants/orders";

/**
 * Маскирует номер телефона для мастеров
 * @param phone Номер телефона
 * @returns Замаскированный номер
 */
export function maskPhoneForMaster(phone: string | null | undefined): string {
  if (!phone) return 'Скрыто для мастеров';
  
  // Убираем все данные и возвращаем постоянную строку
  return 'Скрыто для мастеров';
}

/**
 * Фильтрует адрес, показывая только улицу и дом для мастеров
 * @param order Объект заказа
 * @param userRole Роль пользователя
 * @param isAssignedToUser Назначен ли заказ текущему пользователю
 * @returns Отфильтрованный адрес
 */
export function getAddressForMaster(
  order: Order, 
  userRole: string = 'master',
  isAssignedToUser: boolean = false
): string {
  // Для super-admin показываем полный адрес
  if (userRole === 'super-admin' || userRole === 'curator') {
    return order.address || order.full_address || 'Не указан';
  }

  // Для мастера, если заказ ему назначен, показываем полный адрес
  if (isAssignedToUser && order.full_address) {
    return order.full_address;
  }

  // Для мастера, если заказ не назначен, показываем только улицу и дом
  if (order.public_address) {
    return order.public_address;
  }

  // Если есть отдельные поля улицы и дома
  if (order.street && order.house_number) {
    return `${order.street}, ${order.house_number}`;
  }

  // Фолбек - пытаемся извлечь только улицу и дом из полного адреса
  if (order.address) {
    return extractStreetAndHouse(order.address);
  }

  return 'Не указан';
}

/**
 * Извлекает улицу и дом из полного адреса
 * @param fullAddress Полный адрес
 * @returns Улица и дом
 */
function extractStreetAndHouse(fullAddress: string): string {
  // Убираем упоминания квартир, подъездов и других деталей
  const cleaned = fullAddress
    .replace(/,?\s*(кв\.?|квартира)\s*\d+/gi, '')
    .replace(/,?\s*(под\.?|подъезд)\s*\d+/gi, '')
    .replace(/,?\s*(эт\.?|этаж)\s*\d+/gi, '')
    .replace(/,?\s*(оф\.?|офис)\s*\d+/gi, '')
    .trim()
    .replace(/,$/, ''); // Убираем висящую запятую

  return cleaned || fullAddress;
}

/**
 * Форматирует данные заказа для мастера, скрывая конфиденциальную информацию
 * @param order Исходный заказ
 * @param userRole Роль пользователя
 * @param currentUserId ID текущего пользователя
 * @returns Отформатированный заказ
 */
export function formatOrderForMaster(
  order: Order, 
  userRole: string = 'master',
  currentUserId?: number | string
): Order {
  // Для super-admin и curator возвращаем данные без изменений
  if (userRole === 'super-admin' || userRole === 'curator') {
    return order;
  }

  const isAssignedToUser = order.assigned_master === currentUserId?.toString();

  return {
    ...order,
    client_phone: maskPhoneForMaster(order.client_phone),
    address: getAddressForMaster(order, userRole, isAssignedToUser),
    // Сохраняем оригинальные поля для внутренней логики, но не показываем в UI
    _original_phone: order.client_phone,
    _original_address: order.address,
  } as Order & { _original_phone?: string; _original_address?: string };
}
