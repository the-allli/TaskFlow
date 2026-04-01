import React from 'react'

const StatCard = ({ label, count, icon: Icon, colorClass }) => (
  <div className="bg-white dark:bg-zinc-900/40 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 hover:border-blue-500/30 transition-all duration-200 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
          {label}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {count}
        </p>
      </div>
      <div className={`p-2.5 rounded-lg ${colorClass.bg}`}>
        <Icon className={`size-5 ${colorClass.icon}`} />
      </div>
    </div>
  </div>
);

export default StatCard
