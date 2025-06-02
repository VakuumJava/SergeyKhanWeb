import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface Order {
  id: number;
  client_name: string;
  client_phone: string;
  description: string;
  address?: string;
  status: string;
  estimated_cost?: number;
  created_at: string;
}

interface DistanceInfo {
  distance_level: number;
  distance_level_name: string;
  orders_count: number;
}

interface OrdersWithDistance {
  orders: Order[];
  distance_info: DistanceInfo;
}

interface MasterDistanceInfo {
  distance_info: {
    distance_level: number;
    distance_level_name: string;
    visibility_hours: number;
    statistics: {
      average_check: number;
      daily_revenue: number;
      net_turnover_10_days: number;
    };
    thresholds: {
      average_check_threshold: number;
      daily_revenue_threshold: number;
      net_turnover_threshold: number;
    };
    meets_requirements: {
      level_1: boolean;
      level_2: boolean;
    };
  };
  orders: Order[];
  total_orders: number;
}

export const useDistanceApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Token ${token}` : '',
    };
  };

  const fetchMasterAvailableOrdersWithDistance = async (): Promise<OrdersWithDistance | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/distance/orders/available/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available orders');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterDistanceWithOrders = async (): Promise<MasterDistanceInfo | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/distance/master/orders/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch master distance info with orders');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const takeOrder = async (orderId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/assign/${orderId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          assigned_master: localStorage.getItem('user_id') // The master takes their own order
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to take order');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while taking the order');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchMasterAvailableOrdersWithDistance,
    fetchMasterDistanceWithOrders,
    takeOrder
  };
};
