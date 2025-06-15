"use client";

import React from 'react';
import { WorkloadDistributionManagement } from '@workspace/ui/components/shared';

const WorkloadDistributionPage: React.FC = () => {
  return <WorkloadDistributionManagement userRole="curator" />;
};

export default WorkloadDistributionPage;
