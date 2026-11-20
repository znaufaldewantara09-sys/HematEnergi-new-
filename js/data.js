document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var errorMessage = document.getElementById('dataError');
  var dataPeriod = document.getElementById('dataPeriod');
  var dataSource = document.getElementById('dataSource');
  var chartInstances = [];
  var chartResizeTimer;

  window.addEventListener('resize', function () {
    window.clearTimeout(chartResizeTimer);
    chartResizeTimer = window.setTimeout(function () {
      chartInstances.forEach(function (chart) {
        chart.stop();
        chart.resize();
      });
    }, 150);
  });

  function showError() {
    errorMessage.hidden = false;
  }

  function formatDate(dateString) {
    var date = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }

  function renderCharts(data) {
    var categories = data.ringkasan.kategori;
    var categoryLabels = Object.keys(categories);
    var categoryColors = ['#D8B65C', '#4C8A68', '#A8B6AA', '#385445'];
    var categoryPercentages = data.ringkasan.kategori_persen;
    Chart.defaults.color = '#A8B6AA';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
    Chart.defaults.plugins.tooltip.backgroundColor = '#122D23';
    Chart.defaults.plugins.tooltip.titleColor = '#F4F3E9';
    Chart.defaults.plugins.tooltip.bodyColor = '#A8B6AA';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.14)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 10;
    var categoryCenterLabel = {
      id: 'category-center-label',
      afterDraw: function (chart) {
        var context = chart.ctx;
        var centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
        var centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
        context.save();
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#F4F3E9';
        context.font = '700 24px Inter, sans-serif';
        context.fillText(data.meta.jumlah_responden.toLocaleString('id-ID'), centerX, centerY - 8);
        context.fillStyle = '#A8B6AA';
        context.font = '600 11px Inter, sans-serif';
        context.fillText('RESPONDEN', centerX, centerY + 13);
        context.restore();
      }
    };

    var barValueLabels = {
      id: 'bar-value-labels',
      afterDatasetsDraw: function (chart) {
        var context = chart.ctx;
        var bars = chart.getDatasetMeta(0).data;
        var values = chart.data.datasets[0].data;
        var isHorizontal = chart.options.indexAxis === 'y';

        context.save();
        context.font = '600 12px Inter, sans-serif';
        context.textBaseline = 'middle';
        bars.forEach(function (bar, index) {
          var label = values[index].toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          if (isHorizontal) {
            var useInside = bar.x + context.measureText(label).width + 12 > chart.chartArea.right;
            context.textAlign = useInside ? 'right' : 'left';
            context.fillStyle = useInside ? '#071C16' : '#F4F3E9';
            context.fillText(label, useInside ? bar.x - 7 : bar.x + 7, bar.y);
          } else {
            context.textAlign = 'center';
            context.fillStyle = '#F4F3E9';
            context.fillText(label, bar.x, bar.y - 10);
          }
        });
        context.restore();
      }
    };

    document.getElementById('respondentCount').textContent = data.meta.jumlah_responden.toLocaleString('id-ID');
    document.getElementById('participationRate').textContent = data.meta.persen_partisipasi.toLocaleString('id-ID') + '%';
    document.getElementById('averageScore').textContent = data.ringkasan.rata_rata_skor.toLocaleString('id-ID') + ' / 4';
    document.getElementById('oftenRate').textContent = data.ringkasan.persen_sering_rata_rata.toLocaleString('id-ID') + '%';
    dataPeriod.textContent = 'Periode pengisian: ' + formatDate(data.meta.tanggal_pengisian.awal) + ' – ' +
      formatDate(data.meta.tanggal_pengisian.akhir) + ' · ' + data.meta.jumlah_siswa_terdata.toLocaleString('id-ID') + ' siswa terdata';
    dataSource.textContent = 'Sumber data: ' + data.meta.sumber + ' · Skala Likert 1–4.';

    chartInstances.push(new Chart(document.getElementById('categoryChart'), {
      type: 'doughnut',
      data: {
        labels: categoryLabels,
        datasets: [{
          data: categoryLabels.map(function (label) { return categories[label]; }),
          backgroundColor: categoryColors,
          borderColor: '#122D23',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#A8B6AA', padding: 18, usePointStyle: true, pointStyle: 'circle', font: { size: 14 } }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                var label = context.label || '';
                return label + ': ' + context.raw.toLocaleString('id-ID') + ' siswa (' +
                  categoryPercentages[label].toLocaleString('id-ID') + '%)';
              }
            }
          }
        }
      },
      plugins: [categoryCenterLabel]
    }));

    var indicators = data.per_butir;
    var indicatorLabels = indicators.map(function (item) { return item.kode + ' · ' + item.label; });
    chartInstances.push(new Chart(document.getElementById('indicatorChart'), {
      type: 'bar',
      data: {
        labels: indicatorLabels,
        datasets: [{
          label: 'Rata-rata skor',
          data: indicators.map(function (item) { return item.rata_rata; }),
          backgroundColor: indicators.map(function (item) {
            return item.kode === 'P01' ? '#D8B65C' : (item.rata_rata === 3.22 ? '#4C8A68' : '#9EC4A5');
          }),
          borderRadius: 5,
          barThickness: 19
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            min: 1,
            max: 4,
            ticks: { stepSize: 0.5, color: '#A8B6AA' },
            grid: { color: 'rgba(255, 255, 255, 0.08)' }
          },
          y: {
            ticks: { color: '#D4DBD2', autoSkip: false, font: { size: 13 } },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return 'Rata-rata: ' + context.raw.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' / 4';
              }
            }
          }
        }
      },
      plugins: [barValueLabels]
    }));

    var departmentLabels = { PMN: 'Pemasaran', HTL: 'Perhotelan', KLN: 'Kuliner', TJKT: 'TJKT', DKV: 'DKV', MPLB: 'MPLB', PPLG: 'PPLG' };
    var departments = data.per_jurusan;
    chartInstances.push(new Chart(document.getElementById('departmentChart'), {
      type: 'bar',
      data: {
        labels: departments.map(function (item) { return departmentLabels[item.kode] || item.nama; }),
        datasets: [{
          label: 'Rata-rata skor',
          data: departments.map(function (item) { return item.rata_rata_skor; }),
          backgroundColor: departments.map(function (item) {
            return item.kode === 'PMN' ? '#D8B65C' : (item.rata_rata_skor === 3.24 ? '#4C8A68' : '#9EC4A5');
          }),
          borderRadius: 5,
          maxBarThickness: 46
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 1,
            max: 4,
            ticks: { stepSize: 0.5, color: '#A8B6AA' },
            grid: { color: 'rgba(255, 255, 255, 0.08)' }
          },
          x: { ticks: { color: '#D4DBD2' }, grid: { display: false } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return 'Rata-rata: ' + context.raw.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' / 4';
              }
            }
          }
        }
      },
      plugins: [barValueLabels]
    }));

    var scoreDistribution = data.sebaran_skor_total;
    chartInstances.push(new Chart(document.getElementById('distributionChart'), {
      type: 'bar',
      data: {
        labels: scoreDistribution.map(function (item) { return item.skor_total; }),
        datasets: [{
          label: 'Jumlah siswa',
          data: scoreDistribution.map(function (item) { return item.jumlah; }),
          backgroundColor: '#D8B65C',
          hoverBackgroundColor: '#E8D18B',
          borderRadius: 4,
          maxBarThickness: 28
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: 'Skor total', color: '#A8B6AA' },
            ticks: { color: '#A8B6AA', maxRotation: 0, autoSkip: false, font: { size: 12 } },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Jumlah siswa', color: '#A8B6AA' },
            ticks: { color: '#A8B6AA' },
            grid: { color: 'rgba(255, 255, 255, 0.08)' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) { return context.raw.toLocaleString('id-ID') + ' siswa'; }
            }
          }
        }
      }
    }));

    var rombelRows = data.per_rombel;
    var rombelSelect = document.getElementById('rombelIndicator');
    var rombelSummary = document.getElementById('rombelSummary');
    var rombelInterpretation = document.getElementById('rombelInterpretation');
    var rombelTableCaption = document.getElementById('rombelTableCaption');
    var rombelTableBody = document.getElementById('rombelTableBody');
    var rombelChart;
    var currentRombelRows = [];

    indicators.forEach(function (item, index) {
      var option = document.createElement('option');
      option.value = String(index);
      option.textContent = item.kode + ' · ' + item.label;
      rombelSelect.appendChild(option);
    });

    document.querySelector('.data-chart-rombel').style.height =
      Math.max(580, rombelRows.length * 32 + 100) + 'px';

    function getRombelScore(row, selection) {
      return selection === 'overall' ? row.rata_rata_skor : row.rata_rata_per_butir[Number(selection)];
    }

    function formatScore(score) {
      return score.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    var rombelValueLabels = {
      id: 'rombel-value-labels',
      afterDatasetsDraw: function (chart) {
        var context = chart.ctx;
        var bars = chart.getDatasetMeta(0).data;
        var scores = chart.data.datasets[0].data;

        context.save();
        context.font = '600 13px Inter, sans-serif';
        context.textBaseline = 'middle';
        bars.forEach(function (bar, index) {
          var label = formatScore(scores[index]);
          var useInside = bar.x + context.measureText(label).width + 12 > chart.chartArea.right;
          context.textAlign = useInside ? 'right' : 'left';
          context.fillStyle = useInside ? '#071C16' : '#F4F3E9';
          context.fillText(label, useInside ? bar.x - 7 : bar.x + 7, bar.y);
        });
        context.restore();
      }
    };

    function updateRombelResults() {
      var selection = rombelSelect.value;
      var selectedIndicator = selection === 'overall' ? null : indicators[Number(selection)];
      var measureName = selectedIndicator ? selectedIndicator.kode + ' · ' + selectedIndicator.label : 'rata-rata keseluruhan';
      var sortedRows = rombelRows.slice().sort(function (first, second) {
        return getRombelScore(second, selection) - getRombelScore(first, selection) ||
          first.rombel.localeCompare(second.rombel);
      });
      currentRombelRows = sortedRows;
      var scores = sortedRows.map(function (row) { return getRombelScore(row, selection); });
      var highest = scores[0];
      var lowest = scores[scores.length - 1];
      var colors = scores.map(function (score) {
        if (score === highest) {
          return '#D8B65C';
        }
        return score === lowest ? '#4C8A68' : '#9EC4A5';
      });

      if (!rombelChart) {
        rombelChart = new Chart(document.getElementById('rombelChart'), {
          type: 'bar',
          data: {
            labels: [],
            datasets: [{
              label: 'Rata-rata skor',
              data: [],
              backgroundColor: [],
              borderRadius: 6,
              barThickness: 22,
              maxBarThickness: 25
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 350 },
            scales: {
              x: {
                min: 1,
                max: 4,
                ticks: { stepSize: 0.5, color: '#A8B6AA', font: { size: 13 } },
                grid: { color: 'rgba(255, 255, 255, 0.08)' }
              },
              y: {
                ticks: { color: '#D4DBD2', autoSkip: false, font: { size: 13 } },
                grid: { display: false }
              }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    var row = currentRombelRows[context.dataIndex];
                    return 'Skor: ' + formatScore(context.raw) + ' / 4 · ' +
                      row.jumlah_responden.toLocaleString('id-ID') + ' responden';
                  }
                }
              }
            }
          },
          plugins: [rombelValueLabels]
        });
        chartInstances.push(rombelChart);
      }

      rombelChart.data.labels = sortedRows.map(function (row) { return row.rombel; });
      rombelChart.data.datasets[0].data = scores;
      rombelChart.data.datasets[0].backgroundColor = colors;
      rombelChart.update();

      var fragment = document.createDocumentFragment();
      sortedRows.forEach(function (row, index) {
        var tr = document.createElement('tr');
        var rank = document.createElement('td');
        var className = document.createElement('td');
        var respondentCount = document.createElement('td');
        var score = document.createElement('td');

        rank.className = 'rombel-rank-cell';
        rank.textContent = String(index + 1);
        className.textContent = row.rombel;
        respondentCount.textContent = row.jumlah_responden.toLocaleString('id-ID');
        score.textContent = formatScore(scores[index]);
        score.className = 'rombel-score-cell';
        tr.appendChild(rank);
        tr.appendChild(className);
        tr.appendChild(respondentCount);
        tr.appendChild(score);
        fragment.appendChild(tr);
      });
      rombelTableBody.replaceChildren(fragment);

      rombelSummary.textContent = rombelRows.length.toLocaleString('id-ID') + ' rombel · ' +
        rombelRows.reduce(function (total, row) { return total + row.jumlah_responden; }, 0).toLocaleString('id-ID') +
        ' responden';
      rombelInterpretation.textContent = measureName + ': ' + sortedRows[0].rombel + ' memiliki skor tertinggi (' +
        formatScore(highest) + '), sedangkan ' + sortedRows[sortedRows.length - 1].rombel +
        ' terendah (' + formatScore(lowest) + ').';
      rombelTableCaption.textContent = 'Peringkat rombel untuk ' + measureName + ', diurutkan dari skor tertinggi.';
    }

    updateRombelResults();
    rombelSelect.addEventListener('change', updateRombelResults);
  }

  fetch('js/data-perilaku-energi.json')
    .then(function (response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.json();
    })
    .then(function (data) {
      if (!window.Chart || !data.meta || !data.ringkasan || !Array.isArray(data.per_butir) ||
        !Array.isArray(data.per_jurusan) || !Array.isArray(data.per_rombel) ||
        !Array.isArray(data.sebaran_skor_total)) {
        throw new Error('Struktur data tidak lengkap atau Chart.js tidak tersedia.');
      }
      renderCharts(data);
    })
    .catch(function (error) {
      console.error('Gagal memuat data kuesioner:', error);
      showError();
    });
});
