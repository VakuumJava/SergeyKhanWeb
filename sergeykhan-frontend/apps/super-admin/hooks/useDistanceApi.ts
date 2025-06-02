import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface DistanceSettings {
  averageCheckThreshold: number;
  visiblePeriodStandard: number;
  dailyOrderSumThreshold: number;
  netTurnoverThreshold: number;
  visiblePeriodDaily: number;
}

interface MasterDistanceInfo {
  master_id: number;
  master_email: string;
  distance_level: number;
  distance_level_name: string;
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
      'Authorization': token ? `Token ${token}` : '',
    };
  };

  const fetchDistanceSettings = async (): Promise<DistanceSettings | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/distance/settings/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch distance settings');
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

  const updateDistanceSettings = async (settings: DistanceSettings): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/distance/settings/update/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update distance settings');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
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

  const fetchAllMastersDistance = async (): Promise<MasterDistanceInfo[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/distance/masters/all/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch all masters distance info');
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

  const forceUpdateAllMastersDistance = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/distance/force-update/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to force update masters distance');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterAvailableOrdersWithDistance = async () => {
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

  const setMasterDistanceManually = async (masterId: number, distanceLevel: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/distance/master/${masterId}/set/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ distance_level: distanceLevel }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set master distance manually');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const resetMasterDistanceToAutomatic = async (masterId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/distance/master/${masterId}/reset/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset master distance to automatic');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getAllMastersDistanceDetailed = async (): Promise<MasterDistanceInfo[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/distance/masters/all/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch masters distance info');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchDistanceSettings,
    updateDistanceSettings,
    fetchMasterDistanceInfo,
    fetchAllMastersDistance,
    forceUpdateAllMastersDistance,
    fetchMasterAvailableOrdersWithDistance,
    setMasterDistanceManually,
    resetMasterDistanceToAutomatic,
    getAllMastersDistanceDetailed
  };
};
