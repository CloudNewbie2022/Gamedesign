import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

export default function HabitChart({ data, isDarkMode = false }) {
  const chartData = {
    labels: data.map(h => h.date),
    datasets: [{
      label: 'Pages Read',
      data: data.map(h => h.pages),
      fill: false,
      tension: 0.3,
      borderColor: isDarkMode ? '#83C5BE' : '#006D77',
      backgroundColor: isDarkMode ? 'rgba(131, 197, 190, 0.1)' : 'rgba(0, 109, 119, 0.1)',
      pointBackgroundColor: isDarkMode ? '#83C5BE' : '#006D77',
      pointBorderColor: isDarkMode ? '#e2e8f0' : '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        labels: {
          color: isDarkMode ? '#e2e8f0' : '#2E2E3A',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#374151' : '#ffffff',
        titleColor: isDarkMode ? '#e2e8f0' : '#2E2E3A',
        bodyColor: isDarkMode ? '#e2e8f0' : '#2E2E3A',
        borderColor: isDarkMode ? '#4B5563' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context) => `Date: ${context[0].label}`,
          label: (context) => `Pages: ${context.parsed.y}`
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: isDarkMode ? '#e2e8f0' : '#2E2E3A',
          maxTicksLimit: 7,
          maxRotation: 45,
          minRotation: 0
        },
        grid: {
          color: isDarkMode ? '#2d3748' : '#e9ecef'
        }
      },
      y: {
        ticks: {
          color: isDarkMode ? '#e2e8f0' : '#2E2E3A'
        },
        grid: {
          color: isDarkMode ? '#2d3748' : '#e9ecef'
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm">
      <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Reading Progress</h3>
      <div className="h-48 sm:h-64">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
} 