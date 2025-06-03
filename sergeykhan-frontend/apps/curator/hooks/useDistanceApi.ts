"use client";

import { useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export interface MasterDistanceInfo {
  master_id: number;
  master_email: string;
  distance_level: number;
  distance_level_name: string;
  manual_override: boolean;
  statistics: {
    average_check: number;
    daily_revenue: number;
    net_turnover_10_days: number;
  };
  thresholds: {
    average_check_threshold: number;
    daily_order_sum_threshold: number;
    net_turnover_threshold: number;
  };
  meets_requirements: {
    standard_distance: boolean;
    daily_distance_by_revenue: boolean;
    daily_distance_by_turnover: boolean;
  };
}

export const useDistanceApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
    };
  };

  const fetchMasterDistanceInfo = async (masterId: number): Promise<MasterDistanceInfo | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/distance/master/${masterId}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch master distance info');
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

  const fetchMasterDistanceWithOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/distance/master/orders/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch master distance with orders');
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

  return {
    loading,
    error,
    fetchMasterDistanceInfo,
    fetchMasterDistanceWithOrders,
  };
};
