// HTML to PDF - Works immediately without library installation
export function generateHTMLReport(data: any): string {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>School Report - ${data.schoolName || 'QuranAkh'}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #1f2937;
      background: white;
      margin: 0;
      padding: 0;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 0 auto;
      background: white;
      page-break-after: always;
    }

    /* Header Styles */
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 30px;
      margin: -20mm -20mm 20px -20mm;
      text-align: center;
      position: relative;
    }

    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
      font-weight: bold;
    }

    .header p {
      font-size: 14px;
      opacity: 0.95;
    }

    .header .date {
      position: absolute;
      right: 30px;
      top: 30px;
      font-size: 12px;
      opacity: 0.9;
    }

    /* Section Styles */
    .section {
      margin-bottom: 30px;
    }

    .section-title {
      font-size: 20px;
      color: #1f2937;
      border-bottom: 3px solid #10b981;
      padding-bottom: 8px;
      margin-bottom: 20px;
      font-weight: bold;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }

    .metric-card {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      border-left: 4px solid;
      padding: 20px;
      border-radius: 8px;
    }

    .metric-card.blue { border-left-color: #3b82f6; }
    .metric-card.purple { border-left-color: #9333ea; }
    .metric-card.green { border-left-color: #10b981; }
    .metric-card.pink { border-left-color: #ec4899; }

    .metric-value {
      font-size: 36px;
      font-weight: bold;
      color: #1f2937;
      line-height: 1;
    }

    .metric-label {
      font-size: 14px;
      color: #6b7280;
      margin-top: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    thead {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    th {
      font-weight: bold;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      font-size: 14px;
      color: #374151;
    }

    tbody tr:nth-child(even) {
      background: #f9fafb;
    }

    tbody tr:hover {
      background: #f3f4f6;
    }

    /* Progress Bar */
    .progress-container {
      width: 100%;
      background: #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      margin: 10px 0;
      height: 30px;
      position: relative;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }

    /* Charts */
    .chart-container {
      display: flex;
      align-items: flex-end;
      height: 200px;
      gap: 10px;
      margin: 20px 0;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
    }

    .chart-bar {
      flex: 1;
      background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
      border-radius: 4px 4px 0 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      padding-bottom: 5px;
      color: white;
      font-size: 12px;
      font-weight: bold;
      position: relative;
    }

    .chart-label {
      position: absolute;
      bottom: -25px;
      color: #6b7280;
      font-size: 11px;
    }

    /* Info Box */
    .info-box {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }

    .info-box h3 {
      color: #1e40af;
      font-size: 16px;
      margin-bottom: 10px;
    }

    .info-box p {
      color: #1f2937;
      font-size: 14px;
      line-height: 1.6;
    }

    /* Footer */
    .footer {
      text-align: center;
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      color: #6b7280;
      font-size: 12px;
    }

    @media print {
      body { margin: 0; }
      .page { margin: 0; page-break-after: always; }
      .header { margin: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="date">Generated: ${new Date().toLocaleString()}</div>
      <h1>${data.schoolName || 'QuranAkh School'}</h1>
      <p>Comprehensive Performance Report</p>
      <p>Period: ${data.period || 'Last 30 Days'}</p>
    </div>

    <!-- Key Metrics -->
    <div class="section">
      <h2 class="section-title">Key Performance Metrics</h2>
      <div class="metrics-grid">
        <div class="metric-card blue">
          <div class="metric-value">${data.students || 0}</div>
          <div class="metric-label">Total Students</div>
        </div>
        <div class="metric-card purple">
          <div class="metric-value">${data.teachers || 0}</div>
          <div class="metric-label">Total Teachers</div>
        </div>
        <div class="metric-card green">
          <div class="metric-value">${data.classes || 0}</div>
          <div class="metric-label">Total Classes</div>
        </div>
        <div class="metric-card pink">
          <div class="metric-value">${data.parents || 0}</div>
          <div class="metric-label">Total Parents</div>
        </div>
      </div>
    </div>

    <!-- Assignment Analytics -->
    <div class="section">
      <h2 class="section-title">Assignment Analytics</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total Assignments</td>
            <td><strong>${data.totalAssignments || 0}</strong></td>
            <td>100%</td>
          </tr>
          <tr>
            <td>Completed</td>
            <td style="color: #10b981;"><strong>${data.completedAssignments || 0}</strong></td>
            <td>${data.completedAssignments && data.totalAssignments ? Math.round((data.completedAssignments / data.totalAssignments) * 100) : 0}%</td>
          </tr>
          <tr>
            <td>Pending</td>
            <td style="color: #f59e0b;"><strong>${data.pendingAssignments || 0}</strong></td>
            <td>${data.pendingAssignments && data.totalAssignments ? Math.round((data.pendingAssignments / data.totalAssignments) * 100) : 0}%</td>
          </tr>
          <tr>
            <td>Overdue</td>
            <td style="color: #ef4444;"><strong>${data.overdueAssignments || 0}</strong></td>
            <td>${data.overdueAssignments && data.totalAssignments ? Math.round((data.overdueAssignments / data.totalAssignments) * 100) : 0}%</td>
          </tr>
        </tbody>
      </table>

      <!-- Completion Rate Progress Bar -->
      <div>
        <strong>Overall Completion Rate</strong>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${data.completionRate || 0}%;">
            ${data.completionRate || 0}%
          </div>
        </div>
      </div>
    </div>

    <!-- Attendance Overview -->
    <div class="section">
      <h2 class="section-title">Attendance Overview</h2>
      <div>
        <strong>Current Attendance Rate</strong>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${data.attendanceRate || 0}%; background: ${data.attendanceRate > 80 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : data.attendanceRate > 60 ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'};">
            ${data.attendanceRate || 0}%
          </div>
        </div>
      </div>
      <p style="margin-top: 10px; color: #6b7280;">Total Records: ${data.attendanceRecords || 0}</p>
    </div>
  </div>

  <!-- Page 2 -->
  <div class="page">
    <!-- Teacher Performance -->
    <div class="section">
      <h2 class="section-title">Teacher Performance Report</h2>
      <table>
        <thead>
          <tr>
            <th>Teacher Name</th>
            <th>Classes</th>
            <th>Assignments</th>
            <th>Completion Rate</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${(data.teacherData || []).map((teacher: any) => `
            <tr>
              <td><strong>${teacher.name || 'Unknown'}</strong></td>
              <td style="text-align: center;">${teacher.class_count || 0}</td>
              <td style="text-align: center;">${teacher.assignmentsCreated || 0}</td>
              <td style="text-align: center; color: ${teacher.completionRate > 70 ? '#10b981' : teacher.completionRate > 50 ? '#f59e0b' : '#ef4444'};">
                <strong>${teacher.completionRate || 0}%</strong>
              </td>
              <td>${teacher.class_count > 0 ? '✅ Active' : '⏳ No Classes'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${data.teacherData?.length === 0 ? '<p style="text-align: center; color: #6b7280; padding: 20px;">No teacher data available yet</p>' : ''}
    </div>

    <!-- Class Performance -->
    <div class="section">
      <h2 class="section-title">Class Performance Report</h2>
      <table>
        <thead>
          <tr>
            <th>Class Name</th>
            <th>Students</th>
            <th>Assignments</th>
            <th>Average Grade</th>
          </tr>
        </thead>
        <tbody>
          ${(data.classData || []).map((cls: any) => `
            <tr>
              <td><strong>${cls.name || 'Unknown'}</strong></td>
              <td style="text-align: center;">${cls.student_count || 0}</td>
              <td style="text-align: center;">${cls.assignment_count || 0}</td>
              <td style="text-align: center;">
                <strong>${cls.average_grade || 0}%</strong>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${data.classData?.length === 0 ? '<p style="text-align: center; color: #6b7280; padding: 20px;">No class data available yet</p>' : ''}
    </div>

    <!-- Summary -->
    <div class="info-box">
      <h3>Report Summary</h3>
      <p>This comprehensive report was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}.</p>
      <p>All metrics shown are real-time data from your school management system database.</p>
      <p>As your school continues to use the system, these metrics will automatically update to reflect current performance.</p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>© ${new Date().getFullYear()} QuranAkh School Management System</p>
      <p>Professional Performance Report - Confidential</p>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

export function downloadHTMLReport(data: any) {
  const html = generateHTMLReport(data);

  // Create a new window for the report
  const reportWindow = window.open('', '_blank');
  if (reportWindow) {
    reportWindow.document.write(html);
    reportWindow.document.close();

    // Auto-trigger print dialog after a short delay
    setTimeout(() => {
      reportWindow.print();
    }, 500);
  }
}