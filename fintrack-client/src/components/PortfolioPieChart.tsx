import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { PortfolioSummary } from '../types/portfolio';

// Chart.js için gerekli bileşenleri kaydet
ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface PortfolioPieChartProps {
  portfolioSummary: PortfolioSummary | null;
}

const PortfolioPieChart: React.FC<PortfolioPieChartProps> = ({ portfolioSummary }) => {
  const theme = useTheme();

  if (!portfolioSummary || !portfolioSummary.positions || portfolioSummary.positions.length === 0) {
    return null; // Veri yoksa grafiği gösterme
  }

  // Grafik için veriyi hazırla
  const labels = portfolioSummary.positions.map(p => p.symbol);
  const dataValues = portfolioSummary.positions.map(p => p.currentValue);
  
  // Dinamik ve çeşitli renkler oluştur
  const backgroundColors = portfolioSummary.positions.map((_, index) => {
    const colors = [
      '#42A5F5', '#66BB6A', '#FFA726', '#26A69A', '#AB47BC', '#FF7043', 
      '#8D6E63', '#EC407A', '#78909C', '#5C6BC0', '#29B6F6', '#D4E157'
    ];
    return colors[index % colors.length];
  });

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Varlık Değeri (TRY)',
        data: dataValues,
        backgroundColor: backgroundColors,
        borderColor: theme.palette.background.paper,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: theme.palette.text.primary,
          boxWidth: 20,
          padding: 15,
        },
      },
      title: {
        display: true,
        text: 'Portföy Varlık Dağılımı',
        color: theme.palette.text.primary,
        font: {
          size: 16,
        },
        padding: {
            bottom: 20,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            const value = context.raw as number;
            const total = context.chart.getDatasetMeta(0).total || 1;
            const percentage = ((value / total) * 100).toFixed(2);
            label += `${value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} (${percentage}%)`;
            return label;
          }
        }
      }
    },
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, height: { xs: 300, md: 400 } }}>
        <Pie data={chartData} options={options} />
    </Paper>
  );
};

export default PortfolioPieChart;
