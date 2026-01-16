// src/renderer/pages/Reports/index.tsx
import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import SalesReport from './SalesReport';
import StockReport from './StockReport';
import GSTReport from './GSTReport';

const Reports: React.FC = () => {
  const tabs = [
    { name: 'Sales Reports', component: SalesReport },
    { name: 'Stock Reports', component: StockReport },
    { name: 'GST Reports', component: GSTReport },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Generate and export business reports</p>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-primary-100 p-1">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                ${
                  selected
                    ? 'bg-white text-primary-700 shadow'
                    : 'text-primary-600 hover:bg-white/[0.12] hover:text-primary-800'
                }`
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-6">
          {tabs.map((tab, idx) => (
            <Tab.Panel key={idx}>
              <tab.component />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default Reports;
