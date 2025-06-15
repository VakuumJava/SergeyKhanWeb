"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/ui";
import { Button } from "@workspace/ui/components/ui";
import { Badge } from "@workspace/ui/components/ui";
import { 
  Activity, 
  Users, 
  Clock, 
  Calendar, 
  User, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  BarChart3,
  Eye
} from 'lucide-react';
import { MasterWorkloadManagement } from '../master-workload/MasterWorkloadManagement';

interface WorkloadDistributionProps {
  userRole: 'curator' | 'super-admin';
}

const WorkloadDistributionManagement: React.FC<WorkloadDistributionProps> = ({ userRole }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Небольшая задержка для плавной загрузки
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Нагрузка мастеров</h1>
        <p className="text-muted-foreground">
          Анализ рабочей нагрузки и доступности мастеров
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Анализ рабочей нагрузки</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MasterWorkloadManagement />
        </CardContent>
      </Card>
    </div>
  );
};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Управление нагрузкой и распределением</h1>
        <p className="text-muted-foreground">
          Управляйте рабочей нагрузкой мастеров и распределяйте заказы эффективно
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workload" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Нагрузка мастеров</span>
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Распределение заказов</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Анализ рабочей нагрузки</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MasterWorkloadManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Распределение заказов</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderDistributionTable userRole={userRole} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkloadDistributionManagement;
