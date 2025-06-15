/**
 * Utility functions for master schedule management and order assignment
 */

import { api } from '../utils/api'

// Types
interface MasterSchedule {
  id: number
  master_id: number
  date: string
  start_time: string
  end_time: string
  is_available: boolean
  max_orders: number
  assigned_orders_count: number
}

interface MasterWorkload {
  master_id: number
  master_name: string
  total_slots: number
  occupied_slots: number
  free_slots: number
  workload_percentage: number
  schedule: MasterSchedule[]
}

/**
 * Get master's availability for a specific date
 */
export const getMasterAvailability = async (masterId: number, date: string): Promise<MasterSchedule | null> => {
  try {
    const response = await api.get(`/api/schedule/master/${masterId}/date/${date}/`)
    return response.data
  } catch (error) {
    console.error('Error fetching master availability:', error)
    return null
  }
}

/**
 * Get master's workload information
 */
export const getMasterWorkload = async (masterId: number): Promise<MasterWorkload | null> => {
  try {
    const response = await api.get(`/api/workload/master/${masterId}/`)
    return response.data
  } catch (error) {
    console.error('Error fetching master workload:', error)
    return null
  }
}

/**
 * Get all masters with their current workload
 */
export const getAllMastersWorkload = async (): Promise<MasterWorkload[]> => {
  try {
    const response = await api.get('/api/workload/masters/')
    return response.data
  } catch (error) {
    console.error('Error fetching masters workload:', error)
    return []
  }
}

/**
 * Check if master has free slots for new order
 */
export const checkMasterAvailability = async (masterId: number, orderDate?: string): Promise<boolean> => {
  try {
    const date = orderDate || new Date().toISOString().split('T')[0]
    const workload = await getMasterWorkload(masterId)
    
    if (!workload) return false
    
    // Check if master has free slots
    return workload.free_slots > 0
  } catch (error) {
    console.error('Error checking master availability:', error)
    return false
  }
}

/**
 * Get best available master for assignment based on workload
 */
export const getBestAvailableMaster = async (masters: any[]): Promise<number | null> => {
  try {
    const mastersWorkload = await getAllMastersWorkload()
    
    // Filter masters that have free slots
    const availableMasters = mastersWorkload.filter(master => 
      master.free_slots > 0 && masters.some(m => m.id === master.master_id)
    )
    
    if (availableMasters.length === 0) return null
    
    // Sort by workload percentage (ascending) to get least loaded master
    availableMasters.sort((a, b) => a.workload_percentage - b.workload_percentage)
    
    const bestMaster = availableMasters[0]
    return bestMaster ? bestMaster.master_id : null
  } catch (error) {
    console.error('Error getting best available master:', error)
    return null
  }
}

/**
 * Assign order to master with workload check
 */
export const assignOrderToMaster = async (
  orderId: number, 
  masterId: number, 
  slotData?: { scheduled_date: string; scheduled_time: string }
): Promise<boolean> => {
  try {
    // Prepare assignment data
    const assignmentData: any = {
      assigned_master: masterId
    }
    
    // Add slot data if provided
    if (slotData) {
      assignmentData.scheduled_date = slotData.scheduled_date
      assignmentData.scheduled_time = slotData.scheduled_time
    } else {
      // If no specific slot, first check if master has available slots
      const isAvailable = await checkMasterAvailability(masterId)
      
      if (!isAvailable) {
        throw new Error('Мастер не имеет свободных слотов')
      }
    }
    
    // Assign the order
    await api.patch(`/assign/${orderId}/`, assignmentData)
    
    return true
  } catch (error) {
    console.error('Error assigning order to master:', error)
    throw error
  }
}

/**
 * Format workload percentage for display
 */
export const formatWorkloadPercentage = (percentage: number): string => {
  if (percentage >= 90) return '🔴 Перегружен'
  if (percentage >= 70) return '🟡 Загружен'
  if (percentage >= 40) return '🟢 Средняя загрузка'
  return '⚪ Свободен'
}

/**
 * Get workload color class for styling
 */
export const getWorkloadColorClass = (percentage: number): string => {
  if (percentage >= 90) return 'text-red-600 bg-red-50'
  if (percentage >= 70) return 'text-yellow-600 bg-yellow-50'
  if (percentage >= 40) return 'text-green-600 bg-green-50'
  return 'text-gray-600 bg-gray-50'
}
