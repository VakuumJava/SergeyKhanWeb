"use client";

import React from 'react';
import { WorkloadDistributionManagement } from '@workspace/ui/components/shared';

const WorkloadDistributionPage: React.FC = () => {
  return <WorkloadDistributionManagement userRole="super-admin" />;
};

export default WorkloadDistributionPage;
