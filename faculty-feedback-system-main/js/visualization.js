// Visualization Functionality

let selectedDepartments = [];
let chartInstance = null;

const currentUser = checkAuth('admin');
if (!currentUser) {
    // User will be redirected by checkAuth function
} else {
    initializeVisualization();
}

function initializeVisualization() {
    // Load available departments into dropdown
    loadAvailableDepartmentsDropdown();
    
    // Refresh data when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadAvailableDepartmentsDropdown();
        }
    });
}

function loadAvailableDepartmentsDropdown() {
    const departments = Storage.getDepartments();
    const dropdown = document.getElementById('departmentDropdown');
    
    // Clear existing options except the first one
    dropdown.innerHTML = '<option value="">-- Select a Department --</option>';
    
    // Add departments to dropdown
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.name;
        option.textContent = dept.name;
        dropdown.appendChild(option);
    });
    
    window.availableDepartments = departments.map(d => d.name);
}

function onDepartmentChange() {
    const dropdown = document.getElementById('departmentDropdown');
    const selectedDept = dropdown.value;
    
    if (!selectedDept) {
        selectedDepartments = [];
        updateSelectedDisplay();
        updateButtonStates();
        return;
    }
    
    // Set selected department (single selection)
    selectedDepartments = [selectedDept];
    updateSelectedDisplay();
    updateButtonStates();
    showAlert(`Department "${selectedDept}" selected!`, 'success');
}

function removeDepartment(dept) {
    selectedDepartments = selectedDepartments.filter(d => d !== dept);
    document.getElementById('departmentDropdown').value = '';
    updateSelectedDisplay();
    updateButtonStates();
}

function updateSelectedDisplay() {
    const container = document.getElementById('selectedDepartments');
    container.innerHTML = '';

    selectedDepartments.forEach(dept => {
        const tag = document.createElement('div');
        tag.className = 'selected-tag';
        tag.innerHTML = `
            ${dept}
            <button onclick="removeDepartment('${dept}')">✕</button>
        `;
        container.appendChild(tag);
    });
}

function updateButtonStates() {
    const hasSelection = selectedDepartments.length > 0;
    document.getElementById('piechartBtn').disabled = !hasSelection;
    document.getElementById('histogramBtn').disabled = !hasSelection;
    document.getElementById('linechartBtn').disabled = !hasSelection;
}

function calculateDepartmentYearStats() {
    const allFeedbacks = Storage.getFeedbacks();
    const stats = {};

    selectedDepartments.forEach(dept => {
        stats[dept] = {
            '1st Year': { ratings: [], label: `${dept} - 1st Year` },
            '2nd Year': { ratings: [], label: `${dept} - 2nd Year` },
            '3rd Year': { ratings: [], label: `${dept} - 3rd Year` }
        };
    });

    // Filter feedbacks for selected departments
    allFeedbacks.forEach(feedback => {
        const dept = feedback.studentDepartment || feedback.department;

        if (!selectedDepartments.includes(dept)) {
            return;
        }

        const year = feedback.studentYear;
        const yearLabel = year === 1 ? '1st Year' : year === 2 ? '2nd Year' : '3rd Year';

        if (feedback.responses) {
            feedback.responses.forEach(response => {
                if (stats[dept] && stats[dept][yearLabel]) {
                    stats[dept][yearLabel].ratings.push(response.rating || 0);
                }
            });
        }
    });

    // Calculate averages
    const labels = [];
    const averages = [];
    const colors = [
        '#667eea',
        '#764ba2',
        '#f093fb',
        '#f5576c',
        '#11998e',
        '#38ef7d',
        '#ffa502',
        '#ff6b35',
        '#004e89',
        '#1a7f64'
    ];

    let colorIndex = 0;

    selectedDepartments.forEach(dept => {
        Object.keys(stats[dept]).forEach(year => {
            const ratings = stats[dept][year].ratings;
            if (ratings.length > 0) {
                const average = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2);
                labels.push(`${dept} ${year}`);
                averages.push(average);
                colorIndex++;
            }
        });
    });

    return {
        labels: labels,
        data: averages,
        colors: colors.slice(0, labels.length)
    };
}

function createPieChart() {
    if (selectedDepartments.length === 0) {
        showAlert('Please select at least one department', 'warning');
        return;
    }

    const stats = calculateDepartmentYearStats();

    if (stats.labels.length === 0) {
        showAlert('No feedback data available for selected departments', 'warning');
        return;
    }

    showLoadingSpinner();

    // Destroy previous chart if exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    setTimeout(() => {
        const ctx = document.getElementById('myChart').getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: stats.labels,
                datasets: [{
                    data: stats.data,
                    backgroundColor: stats.colors,
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 13,
                                weight: '600'
                            },
                            padding: 15,
                            color: '#333'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + ' / 10';
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Average Ratings by Department & Year',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#333',
                        padding: 20
                    }
                }
            }
        });

        hideLoadingSpinner();
        displayStatistics(stats.data);
        enableExportBtn();
        showAlert('Pie chart created successfully!', 'success');
    }, 500);
}

function createHistogram() {
    if (selectedDepartments.length === 0) {
        showAlert('Please select at least one department', 'warning');
        return;
    }

    const stats = calculateDepartmentYearStats();

    if (stats.labels.length === 0) {
        showAlert('No feedback data available for selected departments', 'warning');
        return;
    }

    showLoadingSpinner();

    // Destroy previous chart if exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    setTimeout(() => {
        const ctx = document.getElementById('myChart').getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stats.labels,
                datasets: [{
                    label: 'Average Rating (out of 10)',
                    data: stats.data,
                    backgroundColor: stats.colors,
                    borderColor: stats.colors.map(c => c.replace(')', ', 0.8)')),
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: {
                                size: 13,
                                weight: '600'
                            },
                            color: '#333'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Average: ' + context.parsed.x + ' / 10';
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Average Ratings by Department & Year',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#333',
                        padding: 20
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            color: '#666',
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#333',
                            font: {
                                size: 12,
                                weight: '600'
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        hideLoadingSpinner();
        displayStatistics(stats.data);
        enableExportBtn();
        showAlert('Histogram created successfully!', 'success');
    }, 500);
}

function showChart() {
    document.getElementById('chartContainer').classList.add('show');
    document.getElementById('emptyState').style.display = 'none';
}

function createLineChart() {
    if (selectedDepartments.length === 0) {
        showAlert('Please select at least one department', 'warning');
        return;
    }

    const stats = calculateDepartmentYearStats();

    if (stats.labels.length === 0) {
        showAlert('No feedback data available for selected departments', 'warning');
        return;
    }

    showLoadingSpinner();

    // Destroy previous chart if exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    setTimeout(() => {
        const ctx = document.getElementById('myChart').getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: stats.labels,
                datasets: [{
                    label: 'Average Rating (out of 10)',
                    data: stats.data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: stats.colors,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#667eea',
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: {
                                size: 13,
                                weight: '600'
                            },
                            color: '#333',
                            padding: 15
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: function(context) {
                                return 'Rating: ' + context.parsed.y + ' / 10';
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Average Ratings Trend by Department & Year',
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#333',
                        padding: 20
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: {
                            color: '#666',
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: true
                        }
                    },
                    x: {
                        ticks: {
                            color: '#333',
                            font: {
                                size: 12,
                                weight: '600'
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        hideLoadingSpinner();
        displayStatistics(stats.data);
        enableExportBtn();
        showAlert('Line chart created successfully!', 'success');
    }, 500);
}

function showAlert(message, type = 'danger') {
    const alertDiv = document.getElementById('alertMessage');
    if (alertDiv) {
        alertDiv.textContent = message;
        alertDiv.className = `alert alert-${type} show`;

        setTimeout(() => {
            alertDiv.className = 'alert';
        }, 5000);
    }
}

function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('show');
    document.getElementById('chartContainer').classList.remove('show');
    document.getElementById('statsSummary').classList.remove('show');
    document.getElementById('emptyState').style.display = 'none';
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('show');
    document.getElementById('chartContainer').classList.add('show');
}

function calculateStatistics(data) {
    if (!data || data.length === 0) {
        return {
            min: 0,
            max: 0,
            avg: 0,
            median: 0
        };
    }

    const sortedData = [...data].sort((a, b) => a - b);
    const min = Math.min(...data);
    const max = Math.max(...data);
    const avg = (data.reduce((a, b) => a + parseFloat(b), 0) / data.length).toFixed(2);
    
    let median;
    const mid = Math.floor(sortedData.length / 2);
    if (sortedData.length % 2 !== 0) {
        median = sortedData[mid].toFixed(2);
    } else {
        median = ((parseFloat(sortedData[mid - 1]) + parseFloat(sortedData[mid])) / 2).toFixed(2);
    }

    return {
        min: min.toFixed(2),
        max: max.toFixed(2),
        avg: avg,
        median: median
    };
}

function displayStatistics(data) {
    const stats = calculateStatistics(data);
    
    document.getElementById('maxRating').textContent = stats.max;
    document.getElementById('minRating').textContent = stats.min;
    document.getElementById('avgRating').textContent = stats.avg;
    document.getElementById('medianRating').textContent = stats.median;
    
    document.getElementById('statsSummary').classList.add('show');
}

function exportChart() {
    if (!chartInstance) {
        showAlert('No chart to export. Please create a chart first.', 'warning');
        return;
    }

    // Get the canvas and convert to image
    const canvas = document.getElementById('myChart');
    const image = canvas.toDataURL('image/png');

    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = image;
    link.download = `chart_${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert('Chart exported successfully!', 'success');
}

function enableExportBtn() {
    document.getElementById('exportBtn').disabled = false;
}

// ===== Faculty Ratings by Year =====
function displayFacultyRatingsByYear() {
    const allFeedbacks = Storage.getFeedbacks();
    const container = document.getElementById('facultyRatingsContainer');
    
    if (allFeedbacks.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No feedback data available</p>';
        return;
    }

    // Organize data by department, then faculty and year
    const departmentData = {};

    allFeedbacks.forEach(feedback => {
        if (feedback.responses) {
            feedback.responses.forEach(response => {
                const facultyId = response.teacherId || 'unknown';
                const facultyName = response.teacherName || 'Unknown Faculty';
                const year = feedback.studentYear || '1';
                const department = feedback.studentDepartment || feedback.department || 'Unknown';
                const rating = response.rating || 0;

                // Initialize department if not exists
                if (!departmentData[department]) {
                    departmentData[department] = {};
                }

                // Initialize faculty if not exists
                if (!departmentData[department][facultyId]) {
                    departmentData[department][facultyId] = {
                        name: facultyName,
                        '1': { ratings: [], count: 0 },
                        '2': { ratings: [], count: 0 },
                        '3': { ratings: [], count: 0 },
                        combined: { ratings: [], count: 0 }
                    };
                }

                departmentData[department][facultyId][year].ratings.push(rating);
                departmentData[department][facultyId][year].count++;
                departmentData[department][facultyId].combined.ratings.push(rating);
                departmentData[department][facultyId].combined.count++;
            });
        }
    });

    // Generate HTML
    container.innerHTML = '';
    
    if (Object.keys(departmentData).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No faculty data available</p>';
        return;
    }

    // Create sections for each department
    Object.keys(departmentData).sort().forEach(department => {
        const facultyInDept = departmentData[department];
        
        // Department header
        const deptHeader = document.createElement('div');
        deptHeader.style.cssText = 'margin-top: 30px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 3px solid #667eea;';
        deptHeader.innerHTML = `<h3 style="color: #1a202c; margin: 0; font-size: 18px; font-weight: 700;">📚 ${department} Department</h3>`;
        container.appendChild(deptHeader);

        // Create table for this department
        const table = document.createElement('div');
        table.style.cssText = 'overflow-x: auto; margin-bottom: 20px;';
        
        let html = `
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <th style="padding: 15px; text-align: left; font-weight: 700; border-right: 1px solid rgba(255,255,255,0.2);">Faculty Name</th>
                        <th style="padding: 15px; text-align: center; font-weight: 700; border-right: 1px solid rgba(255,255,255,0.2);">1st Year Avg</th>
                        <th style="padding: 15px; text-align: center; font-weight: 700; border-right: 1px solid rgba(255,255,255,0.2);">2nd Year Avg</th>
                        <th style="padding: 15px; text-align: center; font-weight: 700; border-right: 1px solid rgba(255,255,255,0.2);">3rd Year Avg</th>
                        <th style="padding: 15px; text-align: center; font-weight: 700;">Combined Avg</th>
                    </tr>
                </thead>
                <tbody>
        `;

        Object.values(facultyInDept).forEach((faculty, index) => {
            const year1Avg = faculty['1'].count > 0 
                ? (faculty['1'].ratings.reduce((a, b) => a + b, 0) / faculty['1'].count).toFixed(2)
                : '-';

            const year2Avg = faculty['2'].count > 0 
                ? (faculty['2'].ratings.reduce((a, b) => a + b, 0) / faculty['2'].count).toFixed(2)
                : '-';

            const year3Avg = faculty['3'].count > 0 
                ? (faculty['3'].ratings.reduce((a, b) => a + b, 0) / faculty['3'].count).toFixed(2)
                : '-';

            const combinedAvg = faculty.combined.count > 0 
                ? (faculty.combined.ratings.reduce((a, b) => a + b, 0) / faculty.combined.count).toFixed(2)
                : '-';

            const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9ff';
            const borderBottom = '1px solid #e0e0e0';

            html += `
                <tr style="background: ${bgColor}; border-bottom: ${borderBottom};">
                    <td style="padding: 15px; text-align: left; font-weight: 600; color: #1a202c; border-right: 1px solid #e0e0e0;">👨‍🏫 ${faculty.name}</td>
                    <td style="padding: 15px; text-align: center; color: #667eea; font-weight: 600; border-right: 1px solid #e0e0e0;">
                        <span style="background: rgba(102, 126, 234, 0.1); padding: 6px 12px; border-radius: 20px; display: inline-block;">
                            ${year1Avg} / 10
                        </span>
                    </td>
                    <td style="padding: 15px; text-align: center; color: #667eea; font-weight: 600; border-right: 1px solid #e0e0e0;">
                        <span style="background: rgba(102, 126, 234, 0.1); padding: 6px 12px; border-radius: 20px; display: inline-block;">
                            ${year2Avg} / 10
                        </span>
                    </td>
                    <td style="padding: 15px; text-align: center; color: #667eea; font-weight: 600; border-right: 1px solid #e0e0e0;">
                        <span style="background: rgba(102, 126, 234, 0.1); padding: 6px 12px; border-radius: 20px; display: inline-block;">
                            ${year3Avg} / 10
                        </span>
                    </td>
                    <td style="padding: 15px; text-align: center; color: #11998e; font-weight: 700; font-size: 16px;">
                        <span style="background: linear-gradient(135deg, rgba(17, 153, 142, 0.1) 0%, rgba(56, 239, 125, 0.1) 100%); padding: 8px 14px; border-radius: 20px; display: inline-block;">
                            ${combinedAvg} / 10
                        </span>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        table.innerHTML = html;
        container.appendChild(table);
    });
    
    showAlert('Faculty ratings report by department generated!', 'success');
}
