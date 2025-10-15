'use server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createSb } from '@/lib/supabase/server';
import { telemetry } from '../../telemetry/server';

export async function generateReport(studentId: string) {
  try {
    const sb = createSb();
    
    // Fetch all student data in parallel
    const [notesResult, rendersResult, tajweedResult, studentResult] = await Promise.all([
      sb.from('teacher_notes').select('*').eq('student_id', studentId).eq('visible_to_parent', true),
      sb.from('annotated_renders').select('*').eq('student_id', studentId).order('created_at', { ascending: true }),
      sb.from('tajweed_results').select('*').eq('student_id', studentId).order('created_at', { ascending: true }),
      sb.from('students').select('name, email').eq('id', studentId).single()
    ]);

    const notes = notesResult.data || [];
    const renders = rendersResult.data || [];
    const tajweed = tajweedResult.data || [];
    const student = studentResult.data;

    // Create PDF document
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

    // Page 1: Cover Page & Summary
    const page1 = pdf.addPage([595, 842]); // A4 size
    page1.setFont(boldFont);
    page1.setFontSize(24);
    page1.drawText('Quran Mate - Student Progress Report', {
      x: 50,
      y: 780,
      color: rgb(0.2, 0.4, 0.2) // Dark green
    });

    // Student info
    page1.setFont(font);
    page1.setFontSize(16);
    page1.drawText(`Student: ${student?.name || 'Unknown'}`, { x: 50, y: 740 });
    page1.drawText(`Email: ${student?.email || 'N/A'}`, { x: 50, y: 720 });
    page1.drawText(`Report Generated: ${new Date().toLocaleDateString()}`, { x: 50, y: 700 });

    // Summary statistics
    page1.setFont(boldFont);
    page1.setFontSize(18);
    page1.drawText('Progress Summary', { x: 50, y: 660, color: rgb(0.2, 0.4, 0.2) });

    page1.setFont(font);
    page1.setFontSize(14);
    const summaryY = 620;
    page1.drawText(`📝 Teacher Notes: ${notes.length}`, { x: 70, y: summaryY });
    page1.drawText(`🖼️ Annotated Pages: ${renders.length}`, { x: 70, y: summaryY - 25 });
    page1.drawText(`🎤 Tajweed Analyses: ${tajweed.length}`, { x: 70, y: summaryY - 50 });

    // Recent activity summary
    if (renders.length > 0) {
      const latestRender = renders[renders.length - 1];
      page1.drawText(`Last Annotation: ${new Date(latestRender.created_at).toLocaleDateString()}`, {
        x: 70,
        y: summaryY - 90
      });
    }

    if (tajweed.length > 0) {
      const totalIssues = tajweed.reduce((sum, t) => sum + (t.result_json?.issues?.length || 0), 0);
      const avgConfidence = tajweed.reduce((sum, t) => sum + (t.result_json?.confidence_score || 0), 0) / tajweed.length;
      page1.drawText(`Total Tajweed Issues Found: ${totalIssues}`, { x: 70, y: summaryY - 115 });
      page1.drawText(`Average AI Confidence: ${Math.round(avgConfidence * 100)}%`, { x: 70, y: summaryY - 140 });
    }

    // Page 2: Teacher Notes
    if (notes.length > 0) {
      const page2 = pdf.addPage([595, 842]);
      page2.setFont(boldFont);
      page2.setFontSize(20);
      page2.drawText('Teacher Notes & Feedback', { x: 50, y: 780, color: rgb(0.2, 0.4, 0.2) });

      let notesY = 740;
      page2.setFont(font);
      page2.setFontSize(12);

      notes.slice(0, 15).forEach((note, index) => { // Limit to 15 notes to fit on page
        if (notesY < 100) return; // Stop if running out of space

        const date = new Date(note.created_at).toLocaleDateString();
        page2.setFont(boldFont);
        page2.drawText(`${index + 1}. ${date}`, { x: 50, y: notesY });

        page2.setFont(font);
        const noteText = note.content || 'No content';
        const wrappedText = wrapText(noteText, 70, page2, font, 11);
        
        wrappedText.forEach((line, lineIndex) => {
          if (notesY - 20 - (lineIndex * 15) > 50) {
            page2.drawText(line, { x: 70, y: notesY - 20 - (lineIndex * 15) });
          }
        });

        notesY -= 60 + (wrappedText.length - 1) * 15;
      });

      if (notes.length > 15) {
        page2.setFont(font);
        page2.setFontSize(10);
        page2.drawText(`... and ${notes.length - 15} more notes`, { x: 50, y: notesY - 20 });
      }
    }

    // Page 3: Tajweed Analysis Summary
    if (tajweed.length > 0) {
      const page3 = pdf.addPage([595, 842]);
      page3.setFont(boldFont);
      page3.setFontSize(20);
      page3.drawText('AI Tajweed Analysis Results', { x: 50, y: 780, color: rgb(0.2, 0.4, 0.2) });

      let tajweedY = 740;
      page3.setFont(font);
      page3.setFontSize(12);

      tajweed.slice(0, 8).forEach((analysis, index) => { // Limit to fit on page
        if (tajweedY < 100) return;

        const date = new Date(analysis.created_at).toLocaleDateString();
        const result = analysis.result_json;
        const issues = result?.issues || [];
        const confidence = result?.confidence_score || 0;

        page3.setFont(boldFont);
        page3.drawText(`${index + 1}. Analysis - ${date}`, { x: 50, y: tajweedY });

        page3.setFont(font);
        page3.drawText(`Confidence: ${Math.round(confidence * 100)}%`, { x: 70, y: tajweedY - 20 });
        page3.drawText(`Issues Found: ${issues.length}`, { x: 70, y: tajweedY - 40 });

        if (issues.length > 0) {
          page3.drawText('Common Issues:', { x: 70, y: tajweedY - 60 });
          issues.slice(0, 3).forEach((issue, issueIndex) => {
            const severity = issue.severity === 'critical' ? '🔴' : issue.severity === 'major' ? '🔶' : '⚠️';
            page3.drawText(`${severity} ${issue.word}: ${issue.error}`, { 
              x: 90, 
              y: tajweedY - 80 - (issueIndex * 15),
              size: 10
            });
          });
        }

        tajweedY -= 140;
      });
    }

    // Footer on all pages
    const pageCount = pdf.getPageCount();
    for (let i = 0; i < pageCount; i++) {
      const page = pdf.getPage(i);
      page.setFont(font);
      page.setFontSize(10);
      page.drawText(`Generated by Quran Mate - Page ${i + 1} of ${pageCount}`, {
        x: 50,
        y: 30,
        color: rgb(0.5, 0.5, 0.5)
      });
      page.drawText('Confidential - For Educational Use Only', {
        x: 400,
        y: 30,
        color: rgb(0.5, 0.5, 0.5)
      });
    }

    const pdfBytes = await pdf.save();

    // Log telemetry
    await telemetry.logEvent('report.exported', {
      student_id: studentId,
      format: 'pdf',
      pages_count: pageCount,
      notes_included: notes.length,
      renders_included: renders.length,
      tajweed_included: tajweed.length
    });

    return pdfBytes;
  } catch (error) {
    // Log error telemetry
    await telemetry.logEvent('report.export_failed', {
      student_id: studentId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Helper function to wrap text
function wrapText(text: string, maxCharsPerLine: number, page: any, font: any, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    
    if (width < maxCharsPerLine * 6) { // Approximate character width
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word); // Single word longer than line
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}