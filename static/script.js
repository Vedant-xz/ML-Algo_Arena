document.addEventListener('DOMContentLoaded', () => {
    const runBtn = document.getElementById('run-btn');
    const initialState = document.getElementById('initial-state');
    const loadingState = document.getElementById('loading-state');
    const resultsState = document.getElementById('results-state');
    
    const winnerName = document.getElementById('winner-name');
    const winnerAccuracy = document.getElementById('winner-accuracy');
    const winnerTime = document.getElementById('winner-time');
    const leaderboardBody = document.getElementById('leaderboard-body');

    function switchState(stateId) {
        // Hide all states
        document.querySelectorAll('.state-container').forEach(el => {
            el.classList.remove('active');
        });
        
        // Show target state
        document.getElementById(stateId).classList.add('active');
    }

    function formatAccuracy(acc) {
        return (acc * 100).toFixed(2) + '%';
    }

    function getAccuracyClass(acc) {
        if (acc >= 0.96) return 'acc-high';
        if (acc >= 0.92) return 'acc-med';
        return 'acc-low';
    }

    runBtn.addEventListener('click', async () => {
        // Disable button during run
        runBtn.disabled = true;
        runBtn.style.opacity = '0.5';
        runBtn.style.cursor = 'not-allowed';
        
        // Change text
        const btnText = runBtn.querySelector('.btn-text');
        const originalText = btnText.innerText;
        btnText.innerText = 'Running...';
        
        // Show loading state
        switchState('loading-state');

        const selectedDataset = document.getElementById('dataset-select').value;

        try {
            const response = await fetch(`/api/run?dataset=${selectedDataset}`);
            const result = await response.json();

            if (result.status === 'success' && result.data.length > 0) {
                const data = result.data;
                
                // Update Winner Card
                const winner = data[0];
                winnerName.innerText = winner.Model;
                winnerAccuracy.innerText = formatAccuracy(winner.Accuracy);
                winnerTime.innerText = winner.Time.toFixed(2) + 's';

                // Clear previous table data
                leaderboardBody.innerHTML = '';

                // Populate Table with cascading animation delay
                data.forEach((row, index) => {
                    const tr = document.createElement('tr');
                    tr.className = `rank-${row.Rank}`;
                    tr.style.opacity = '0';
                    tr.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.1}s`;
                    
                    tr.innerHTML = `
                        <td><span class="rank-badge">${row.Rank}</span></td>
                        <td class="model-name">${row.Model}</td>
                        <td class="${getAccuracyClass(row.Accuracy)} font-semibold">${(row.Accuracy).toFixed(4)}</td>
                        <td>${(row.Precision).toFixed(4)}</td>
                        <td>${(row.Recall).toFixed(4)}</td>
                        <td>${(row.F1).toFixed(4)}</td>
                        <td>${row.Time.toFixed(2)}s</td>
                    `;
                    leaderboardBody.appendChild(tr);
                });

                // Render Chart.js
                renderChart(data);

                // Show results
                switchState('results-state');
            } else {
                throw new Error(result.message || 'Failed to fetch data');
            }
        } catch (error) {
            console.error('Error running arena:', error);
            alert('An error occurred while running the arena. Please check the console.');
            switchState('initial-state');
        } finally {
            // Re-enable button
            runBtn.disabled = false;
            runBtn.style.opacity = '1';
            runBtn.style.cursor = 'pointer';
            btnText.innerText = originalText;
        }
    });

    let chartInstance = null;

    function renderChart(data) {
        const ctx = document.getElementById('metricsChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (chartInstance) {
            chartInstance.destroy();
        }

        // Sort data logically for the chart (maybe reverse rank so worst is left, best is right, or keep as is)
        // Let's keep it sorted by Rank (best to worst)
        const labels = data.map(d => d.Model);
        const accuracyData = data.map(d => d.Accuracy);
        const f1Data = data.map(d => d.F1);

        Chart.defaults.color = '#adb5bd';
        Chart.defaults.font.family = "'Outfit', sans-serif";

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Accuracy',
                        data: accuracyData,
                        backgroundColor: 'rgba(0, 255, 255, 0.6)',
                        borderColor: 'rgba(0, 255, 255, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'F1-Score',
                        data: f1Data,
                        backgroundColor: 'rgba(138, 43, 226, 0.6)',
                        borderColor: 'rgba(138, 43, 226, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: Math.max(0, Math.min(...accuracyData, ...f1Data) - 0.05),
                        max: 1.0,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 14, family: "'Outfit', sans-serif" },
                        bodyFont: { size: 13, family: "'Outfit', sans-serif" },
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
});

// Add animation keyframes dynamically
const style = document.createElement('style');
style.innerHTML = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .font-semibold { font-weight: 600; }
`;
document.head.appendChild(style);
