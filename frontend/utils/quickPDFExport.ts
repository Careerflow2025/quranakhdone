// Quick PDF Export with Beautiful Formatting
export async function generateBeautifulPDF(data: any) {
  try {
    // Dynamically import jsPDF
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Professional Colors
    const emerald: [number, number, number] = [16, 185, 129]
    const blue: [number, number, number] = [59, 130, 246]
    const purple: [number, number, number] = [147, 51, 234]
    const gray: [number, number, number] = [31, 41, 55]
    const lightBg: [number, number, number] = [248, 250, 252]

    // PAGE 1: COVER & SUMMARY
    // ========================

    // Header Background
    doc.setFillColor(...emerald);
    doc.rect(0, 0, 210, 50, 'F');

    // School Logo Area (white circle)
    doc.setFillColor(255, 255, 255);
    doc.circle(30, 25, 12, 'F');
    doc.setTextColor(...emerald);
    doc.setFontSize(16);
    doc.text('QA', 30, 28, { align: 'center' });

    // School Name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(data.schoolName || 'QuranAkh School', 50, 22);

    // Report Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprehensive Performance Report', 50, 32);

    // Period
    doc.setFontSize(11);
    doc.text(`Period: ${data.period || 'Last 30 Days'}`, 50, 40);

    // Generated Date
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 40);

    // Key Metrics Section
    doc.setTextColor(...gray);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Performance Metrics', 20, 70);

    // Metrics Cards
    const metrics: Array<{label: string; value: number; color: [number, number, number]}> = [
      { label: 'Total Students', value: data.students || 0, color: blue },
      { label: 'Total Teachers', value: data.teachers || 0, color: purple },
      { label: 'Total Classes', value: data.classes || 0, color: emerald },
      { label: 'Total Parents', value: data.parents || 0, color: [236, 72, 153] as [number, number, number] }
    ];

    let xPos = 20;
    let yPos = 80;

    metrics.forEach((metric, index) => {
      // Card shadow effect
      doc.setFillColor(200, 200, 200);
      doc.roundedRect(xPos + 1, yPos + 1, 85, 30, 5, 5, 'F');

      // Card background
      doc.setFillColor(...lightBg);
      doc.roundedRect(xPos, yPos, 85, 30, 5, 5, 'F');

      // Colored accent bar
      doc.setFillColor(...metric.color);
      doc.rect(xPos, yPos, 3, 30, 'F');

      // Metric value (big number)
      doc.setTextColor(...metric.color);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(String(metric.value), xPos + 44, yPos + 14, { align: 'center' });

      // Metric label
      doc.setTextColor(...gray);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(metric.label, xPos + 44, yPos + 24, { align: 'center' });

      // Position next card
      if (index === 1) {
        xPos = 20;
        yPos += 35;
      } else {
        xPos += 90;
      }
    });

    // Assignment Analytics Section
    yPos += 40;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gray);
    doc.text('Assignment Analytics', 20, yPos);

    // Assignment Table
    const assignmentData = [
      ['Total Assignments', String(data.totalAssignments || 0), data.totalAssignments > 0 ? '📊' : '⏳'],
      ['Completed', String(data.completedAssignments || 0), data.completedAssignments > 0 ? '✅' : '⏳'],
      ['Pending', String(data.pendingAssignments || 0), data.pendingAssignments > 0 ? '⏰' : '✅'],
      ['Overdue', String(data.overdueAssignments || 0), data.overdueAssignments > 0 ? '⚠️' : '✅'],
      ['Completion Rate', `${data.completionRate || 0}%`, data.completionRate > 70 ? '🎯' : '📈']
    ];

    (doc as any).autoTable({
      startY: yPos + 8,
      head: [['Metric', 'Count', 'Status']],
      body: assignmentData,
      theme: 'grid',
      headStyles: {
        fillColor: emerald,
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 10,
        textColor: gray
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: 30, halign: 'center' }
      },
      margin: { left: 20, right: 70 }
    });

    // Attendance Section
    yPos = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Attendance Overview', 20, yPos);

    // Attendance visual bar
    const attendanceRate = data.attendanceRate || 0;
    yPos += 10;

    // Background bar
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(20, yPos, 170, 12, 3, 3, 'F');

    // Progress bar
    const barColor: [number, number, number] = attendanceRate > 80 ? emerald : attendanceRate > 60 ? [251, 146, 60] as [number, number, number] : [239, 68, 68] as [number, number, number];
    doc.setFillColor(...barColor);
    doc.roundedRect(20, yPos, (170 * attendanceRate) / 100, 12, 3, 3, 'F');

    // Percentage text
    doc.setTextColor(...gray);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${attendanceRate}% Attendance Rate`, 105, yPos + 8, { align: 'center' });

    // PAGE 2: DETAILED REPORTS
    // =========================
    doc.addPage();

    // Page 2 Header
    doc.setFillColor(...blue);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Detailed Performance Report', 20, 20);

    // Teacher Performance Table
    if (data.teacherData && data.teacherData.length > 0) {
      doc.setTextColor(...gray);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Teacher Performance', 20, 45);

      const teacherTableData = data.teacherData.map((t: any) => [
        t.name || 'Unknown',
        String(t.class_count || 0),
        String(t.assignmentsCreated || 0),
        `${t.completionRate || 0}%`,
        t.response_time || 'N/A'
      ]);

      (doc as any).autoTable({
        startY: 52,
        head: [['Teacher Name', 'Classes', 'Assignments', 'Completion', 'Response']],
        body: teacherTableData,
        theme: 'striped',
        headStyles: {
          fillColor: purple,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: gray
        },
        alternateRowStyles: {
          fillColor: [248, 245, 255]
        },
        margin: { left: 20, right: 20 }
      });
    }

    // Class Performance
    if (data.classData && data.classData.length > 0) {
      const classYPos = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 100;

      doc.setTextColor(...gray);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Class Performance', 20, classYPos);

      const classTableData = data.classData.map((c: any) => [
        c.name || 'Unknown',
        String(c.student_count || 0),
        String(c.assignment_count || 0),
        `${c.average_grade || 0}%`
      ]);

      (doc as any).autoTable({
        startY: classYPos + 7,
        head: [['Class Name', 'Students', 'Assignments', 'Avg Grade']],
        body: classTableData,
        theme: 'striped',
        headStyles: {
          fillColor: blue,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9,
          textColor: gray
        },
        alternateRowStyles: {
          fillColor: [245, 251, 255]
        },
        margin: { left: 20, right: 20 }
      });
    }

    // Summary Box
    const summaryY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 20 : 180;

    // Summary background
    doc.setFillColor(...lightBg);
    doc.roundedRect(20, summaryY, 170, 40, 5, 5, 'F');

    // Summary border
    doc.setDrawColor(...emerald);
    doc.setLineWidth(1);
    doc.roundedRect(20, summaryY, 170, 40, 5, 5, 'S');

    // Summary content
    doc.setTextColor(...gray);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Summary', 30, summaryY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`This comprehensive report was generated on ${new Date().toLocaleDateString()}.`, 30, summaryY + 18);
    doc.text(`It contains real-time data from your school management system.`, 30, summaryY + 25);
    doc.text(`All metrics are calculated from actual database values.`, 30, summaryY + 32);

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(20, 275, 190, 275);

      // Footer text
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, 105, 282, { align: 'center' });
      doc.text('© QuranAkh School Management System - Professional Report', 105, 287, { align: 'center' });
    }

    // Save the PDF
    const fileName = `School_Report_${new Date().getTime()}.pdf`;
    doc.save(fileName);

    return fileName;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
}