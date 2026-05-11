import PDFDocument from 'pdfkit';
import axios from 'axios';

/**
 * Downloads an image from a URL and returns a Buffer
 * @param {string} url - The URL to download from
 * @returns {Promise<Buffer|null>} - The image buffer or null if failed
 */
const downloadImage = async (url) => {
  try {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return null;
    }

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.warn(`Failed to download image from ${url}:`, error.message);
    return null;
  }
};

/**
 * Generates a welfare form PDF as a Buffer (in-memory, no disk I/O).
 * @param {Object} formData - All welfare form fields + doc URLs from req.body
 * @returns {Promise<Buffer>}
 */
export const generateWelfarePDF = async (formData) => {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const primaryColor = '#1a3c6e';
    const accentColor = '#2d7a4f';
    const lightGray = '#f4f6f9';
    const borderColor = '#cccccc';
    const pageWidth = doc.page.width - 80; // usable width

    // ─── HEADER ──────────────────────────────────────────────────────────
    doc.rect(40, 40, pageWidth, 60).fill(primaryColor);

    doc
      .fillColor('#ffffff')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Rayat Shikshan Sanstha', 40, 52, {
        width: pageWidth,
        align: 'center',
      });

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(
        'Rayat Sevak Welfare Fund, Satara — Seva Madhat Arna Request Form',
        40,
        72,
        {
          width: pageWidth,
          align: 'center',
        },
      );

    doc.moveDown(0.2);

    // Confirmation badge
    doc.rect(40, 108, pageWidth, 28).fill(accentColor);
    doc
      .fillColor('#ffffff')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('✓  Form Submitted Successfully', 40, 116, {
        width: pageWidth,
        align: 'center',
      });

    doc.moveDown(0.5);
    doc.y = 148;

    // ─── HELPER: Section header ───────────────────────────────────────────
    const sectionHeader = (title) => {
      doc.rect(40, doc.y, pageWidth, 20).fill(primaryColor);
      doc
        .fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(title, 48, doc.y - 16, { width: pageWidth - 16 });
      doc.moveDown(0.6);
    };

    // ─── HELPER: Two-column row ───────────────────────────────────────────
    const row = (label, value, y) => {
      const colW = pageWidth / 2 - 4;
      const rowH = 20;
      // alternate shading handled by caller
      doc.rect(40, y, colW, rowH).stroke(borderColor);
      doc.rect(40 + colW + 4, y, colW, rowH).stroke(borderColor);

      doc
        .fillColor('#333333')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(label, 44, y + 5, { width: colW - 8 });

      doc
        .font('Helvetica')
        .fillColor('#000000')
        .text(value || '—', 40 + colW + 8, y + 5, { width: colW - 12 });

      return y + rowH;
    };

    // ─── HELPER: Full-width row ───────────────────────────────────────────
    const fullRow = (label, value, y) => {
      const rowH = 20;
      doc.rect(40, y, pageWidth, rowH).stroke(borderColor);
      doc
        .fillColor('#333333')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`${label}:`, 44, y + 5, { width: 140 });
      doc
        .font('Helvetica')
        .fillColor('#000000')
        .text(String(value || '—'), 190, y + 5, { width: pageWidth - 158 });
      return y + rowH;
    };

    // ─── REQUEST ID / DATE ────────────────────────────────────────────────
    doc.rect(40, doc.y, pageWidth, 28).fill(lightGray).stroke(borderColor);

    const metaY = doc.y;
    doc
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(`Request ID: ${formData.requestId || 'N/A'}`, 48, metaY + 8, {
        width: pageWidth / 2 - 10,
      });
    doc.text(
      `Submission Date: ${formData.formDate || new Date().toLocaleDateString('en-IN')}`,
      48 + pageWidth / 2,
      metaY + 8,
      { width: pageWidth / 2 - 10 },
    );

    doc.y = metaY + 36;
    doc.moveDown(0.3);

    // ─── SECTION 1: APPLICANT DETAILS ─────────────────────────────────────
    sectionHeader('1. Applicant Details');
    let y = doc.y;
    y = row('Full Name (Applicant)', formData.applicantName, y);
    y = row('HRMS No.', formData.hrmsNo, y);
    y = row('Branch Name', formData.branchName, y);
    y = row('Joining Date', formData.joiningDate, y);
    y = row('Designation', formData.designation, y);
    y = row('Total Service Period', formData.totalService, y);
    y = row(
      'Monthly Salary',
      formData.monthlySalary ? `Rs. ${formData.monthlySalary}` : '—',
      y,
    );
    y = row('Mobile No.', formData.mobileNo || formData.mobile, y);
    doc.y = y + 8;

    // ─── SECTION 2: PATIENT DETAILS ───────────────────────────────────────
    sectionHeader('2. Patient Details');
    y = doc.y;
    y = row('Patient Full Name', formData.patientName, y);
    y = row('Relation to Applicant', formData.relation, y);
    y = row('Nature of Illness', formData.illnessNature, y);
    y = row('Duration of Illness', formData.illnessDuration, y);
    doc.y = y + 8;

    // ─── SECTION 3: MEDICAL EXPENSES ──────────────────────────────────────
    sectionHeader('3. Medical Expenses');
    y = doc.y;
    y = row('Medicine Bills (Rs.)', formData.medicineBill, y);
    y = row('Doctor Bills (Rs.)', formData.doctorBill, y);
    y = row('Other Expenses (Rs.)', formData.otherExpenses, y);
    y = row('Total Expenses (Rs.)', formData.totalExpenses, y);
    y = row('Doctor Certificates Attached', formData.certificatesAttached, y);
    doc.y = y + 8;

    // ─── SECTION 4: FUND REQUEST DETAILS ──────────────────────────────────
    sectionHeader('4. Fund Request & Bank Details');
    y = doc.y;
    y = row(
      'Requested Amount (Numbers)',
      formData.requestedAmountNumbers
        ? `Rs. ${formData.requestedAmountNumbers}`
        : '—',
      y,
    );
    y = row('Requested Amount (Words)', formData.requestedAmountWords, y);
    y = row('Branch for Deposit', formData.branchNameForDeposit, y);
    y = row('Savings Account No.', formData.savingsAccountNo, y);
    y = row('Previous Fund Help Taken', formData.previousHelp, y);
    if (formData.previousHelpDetails) {
      y = fullRow('Previous Help Details', formData.previousHelpDetails, y);
    }
    y = row('Annual Deductions Paid', formData.annualDeductions, y);
    doc.y = y + 8;

    // ─── SECTION 5: UPLOADED DOCUMENTS ────────────────────────────────────
    sectionHeader('5. Uploaded Documents');

    const docFields = [
      { label: 'Discharge Certificate', key: 'dischargeCertificate' },
      { label: 'Doctor Prescription', key: 'doctorPrescription' },
      { label: 'Medicine Bills', key: 'medicineBills' },
      { label: 'Diagnostic Reports', key: 'diagnosticReports' },
      { label: 'Other Document 1', key: 'otherDoc1' },
      { label: 'Other Document 2', key: 'otherDoc2' },
      { label: 'Other Document 3', key: 'otherDoc3' },
      { label: 'Other Document 4', key: 'otherDoc4' },
      { label: 'Other Document 5', key: 'otherDoc5' },
    ];

    // Process documents and embed images
    for (const { label, key } of docFields) {
      const url = formData[key];
      if (!url) continue;

      // Check if we need a new page
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
        doc.y = 40;
      }

      // Download the image
      const imageBuffer = await downloadImage(url);

      if (imageBuffer) {
        // Try to embed the image
        try {
          // Calculate image dimensions (max width: 250px, max height: 150px)
          const maxWidth = 250;
          const maxHeight = 150;

          // For simplicity, we'll use a fixed size and let PDFKit handle scaling
          const imgWidth = maxWidth;
          const imgHeight = maxHeight;

          // Add document label
          doc
            .fillColor('#333333')
            .font('Helvetica-Bold')
            .fontSize(10)
            .text(`${label}:`, 40, doc.y + 5);

          doc.y += 20;

          // Embed the image
          doc.image(imageBuffer, 40, doc.y, {
            width: imgWidth,
            height: imgHeight,
            fit: [imgWidth, imgHeight],
          });

          doc.y += imgHeight + 10;

          // Add a note that the document is embedded
          doc
            .fillColor('#666666')
            .font('Helvetica')
            .fontSize(8)
            .text('(Document embedded above)', 40, doc.y);

          doc.y += 15;
        } catch (imageError) {
          console.warn(
            `Failed to embed image for ${label}:`,
            imageError.message,
          );
          // Fallback: show URL if embedding fails
          doc
            .fillColor('#333333')
            .font('Helvetica-Bold')
            .fontSize(9)
            .text(`${label}:`, 40, doc.y + 5);

          doc
            .fillColor('#1a56db')
            .font('Helvetica')
            .fontSize(8)
            .text(
              'Document uploaded (URL available in system)',
              140,
              doc.y + 5,
            );

          doc.y += 20;
        }
      } else {
        // If download failed, show that document was uploaded
        doc
          .fillColor('#333333')
          .font('Helvetica-Bold')
          .fontSize(9)
          .text(`${label}:`, 40, doc.y + 5);

        doc
          .fillColor('#666666')
          .font('Helvetica')
          .fontSize(8)
          .text('Document uploaded (available in system)', 140, doc.y + 5);

        doc.y += 20;
      }
    }

    // ─── FOOTER ───────────────────────────────────────────────────────────
    const footerY = doc.page.height - 60;
    doc.rect(40, footerY, pageWidth, 40).fill('#f0f0f0').stroke(borderColor);

    doc
      .fillColor('#666666')
      .font('Helvetica')
      .fontSize(8)
      .text(
        '© 2026 Rayat Shikshan Sanstha — Rayat Sevak Welfare Fund, Satara. This is a system-generated document.',
        48,
        footerY + 8,
        { width: pageWidth - 16, align: 'center' },
      );
    doc.text(
      `Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      48,
      footerY + 22,
      { width: pageWidth - 16, align: 'center' },
    );

    doc.end();
  });
};
