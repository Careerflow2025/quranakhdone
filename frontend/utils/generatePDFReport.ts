// Utility to generate beautiful PDF reports
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface ReportData {
  schoolInfo: any;
  reportPeriod: string;
  dateRange: { start: Date; end: Date };
  metrics: {
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    totalClasses: number;
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
    overdueAssignments: number;
    attendanceRate: number;
    averageGrade: number;
    completionRate: number;
  };
  classData: any[];
  teacherData: any[];
  assignmentTrend: any[];
  attendanceTrend: any[];
}

export function generatePDFReport(data: ReportData) {
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Colors
  const primaryColor = [16, 185, 129]; // Emerald-600
  const secondaryColor = [59, 130, 246]; // Blue-600
  const textColor = [31, 41, 55]; // Gray-800
  const lightGray = [243, 244, 246]; // Gray-100

  // Fonts
  doc.setFont('helvetica');

  // Helper function to add header
  const addHeader = () => {
    // School logo placeholder
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');

    // School name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(data.schoolInfo?.name || 'School Report', 20, 20);

    // Report title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprehensive Performance Report', 20, 28);

    // Date range
    doc.setFontSize(10);
    doc.text(
      `Period: ${data.dateRange.start.toLocaleDateString()} - ${data.dateRange.end.toLocaleDateString()}`,
      20, 35
    );

    // Generated date
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 35);
  };

  // Helper function to add footer
  const addFooter = (pageNum: number) => {
    doc.setTextColor(...textColor);
    doc.setFontSize(8);
    doc.text(`Page ${pageNum}`, 105, 285, { align: 'center' });
    doc.text('© QuranAkh School Management System', 105, 290, { align: 'center' });
  };

  // Page 1: Overview
  addHeader();

  // Executive Summary Section
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 20, 55);

  // Key Metrics Grid
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Metric cards
  const metrics = [
    { label: 'Total Students', value: data.metrics.totalStudents, color: secondaryColor },
    { label: 'Total Teachers', value: data.metrics.totalTeachers, color: [147, 51, 234] },
    { label: 'Total Classes', value: data.metrics.totalClasses, color: [236, 72, 153] },
    { label: 'Attendance Rate', value: `${data.metrics.attendanceRate}%`, color: primaryColor }
  ];

  let xPos = 20;
  let yPos = 65;
  metrics.forEach((metric, index) => {
    // Card background
    doc.setFillColor(...lightGray);
    doc.roundedRect(xPos, yPos, 40, 25, 3, 3, 'F');

    // Metric value
    doc.setTextColor(...metric.color);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(String(metric.value), xPos + 20, yPos + 12, { align: 'center' });

    // Metric label
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label, xPos + 20, yPos + 20, { align: 'center' });

    xPos += 45;
    if (index === 1) {
      xPos = 20;
      yPos += 30;
    }
  });

  // Assignment Analytics Section
  yPos += 35;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Assignment Analytics', 20, yPos);

  yPos += 10;
  const assignmentData = [
    ['Total Assignments', data.metrics.totalAssignments.toString()],
    ['Completed', data.metrics.completedAssignments.toString()],
    ['Pending', data.metrics.pendingAssignments.toString()],
    ['Overdue', data.metrics.overdueAssignments.toString()],
    ['Completion Rate', `${data.metrics.completionRate}%`],
    ['Average Grade', `${data.metrics.averageGrade}%`]
  ];

  (doc as any).autoTable({
    startY: yPos,
    head: [['Metric', 'Value']],
    body: assignmentData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40, halign: 'center' }
    },
    margin: { left: 20, right: 110 }
  });

  // Performance Chart placeholder
  yPos = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('7-Day Performance Trend', 20, yPos);

  yPos += 10;
  doc.setFillColor(...lightGray);
  doc.rect(20, yPos, 170, 50, 'F');

  // Draw simple bar chart
  const barWidth = 20;
  const barSpacing = 4;
  const maxHeight = 40;
  const chartData = data.assignmentTrend?.slice(0, 7) || [];

  xPos = 25;
  chartData.forEach((item, index) => {
    const barHeight = (item.count / 20) * maxHeight; // Assuming max 20
    doc.setFillColor(...secondaryColor);
    doc.rect(xPos + (index * (barWidth + barSpacing)), yPos + 45 - barHeight, barWidth, barHeight, 'F');

    // Day label
    doc.setTextColor(...textColor);
    doc.setFontSize(8);
    doc.text(
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
      xPos + (index * (barWidth + barSpacing)) + 10,
      yPos + 48,
      { align: 'center' }
    );
  });

  addFooter(1);

  // Page 2: Detailed Reports
  doc.addPage();
  addHeader();

  // Class Performance Table
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Class Performance Report', 20, 55);

  const classTableData = data.classData?.map(cls => [
    cls.name,
    cls.student_count?.toString() || '0',
    cls.assignment_count?.toString() || '0',
    `${cls.average_grade || 0}%`,
    `${cls.completion_rate || 0}%`
  ]) || [];

  (doc as any).autoTable({
    startY: 65,
    head: [['Class Name', 'Students', 'Assignments', 'Avg Grade', 'Completion']],
    body: classTableData,
    theme: 'striped',
    headStyles: {
      fillColor: secondaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor
    },
    alternateRowStyles: {
      fillColor: lightGray
    },
    margin: { left: 20, right: 20 }
  });

  // Teacher Performance Table
  yPos = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Teacher Performance Report', 20, yPos);

  const teacherTableData = data.teacherData?.map(teacher => [
    teacher.name,
    teacher.class_count?.toString() || '0',
    teacher.assignmentsCreated?.toString() || '0',
    `${teacher.completionRate || 0}%`,
    teacher.response_time || '24h'
  ]) || [];

  (doc as any).autoTable({
    startY: yPos + 10,
    head: [['Teacher Name', 'Classes', 'Assignments', 'Completion Rate', 'Avg Response']],
    body: teacherTableData,
    theme: 'striped',
    headStyles: {
      fillColor: [147, 51, 234], // Purple
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor
    },
    alternateRowStyles: {
      fillColor: lightGray
    },
    margin: { left: 20, right: 20 }
  });

  // Summary Section
  yPos = (doc as any).lastAutoTable.finalY + 15;
  doc.setFillColor(...lightGray);
  doc.rect(20, yPos, 170, 30, 'F');

  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Summary', 30, yPos + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `This report covers the period from ${data.dateRange.start.toLocaleDateString()} to ${data.dateRange.end.toLocaleDateString()}.`,
    30, yPos + 18
  );
  doc.text(
    `Generated by QuranAkh School Management System on ${new Date().toLocaleString()}.`,
    30, yPos + 25
  );

  addFooter(2);

  // Save the PDF
  const fileName = `School_Report_${data.reportPeriod}_${Date.now()}.pdf`;
  doc.save(fileName);

  return fileName;
}