// Send fund approval email to user
export const sendFundApprovalEmail = async (
  email,
  applicantName,
  approvedAmount,
  requestedAmount,
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `🎉 Your Welfare Fund Has Been Approved!`,
      html: `
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden; border:1px solid #e0e0e0; font-family:Arial,sans-serif;">
          <tr>
            <td style="background:#1a3c6e; padding:22px 30px; text-align:center; color:#fff; font-size:20px; font-weight:bold;">
              Rayat Kutumb Welfare Fund Approval
            </td>
          </tr>
          <tr>
            <td style="padding:28px 30px; color:#333; font-size:15px; line-height:1.7;">
              <p>Dear <strong>${applicantName || 'Applicant'}</strong>,</p>
              <p style="margin:0 0 16px;">
                We are pleased to inform you that your welfare fund request has been <span style="color:#2d7a4f; font-weight:bold;">approved</span>.<br>
                <br>
                <strong>Approved Amount:</strong> <span style="color:#1a3c6e;">₹${approvedAmount}</span><br>
                <strong>Requested Amount:</strong> ₹${requestedAmount}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9; border:1px solid #d0dbe8; border-radius:8px; margin:20px 0;">
                <tr>
                  <td style="padding:14px 18px; color:#1a3c6e; font-size:15px;">
                    <strong>Congratulations!</strong> The approved funds will be processed to your account soon.
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px; color:#555; font-size:13px;">
                If you have any questions, please contact the Welfare Office.
              </p>
              <p style="margin:20px 0 0;">
                Warm regards,<br>
                <strong style="color:#1a3c6e;">Rayat Kutumb Welfare Team</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f0f0f0; padding:14px 30px; text-align:center; font-size:11px; color:#888;">
              © 2026 Rayat Shikshan Sanstha — Rayat Sevak Welfare Fund, Satara. All rights reserved.
            </td>
          </tr>
        </table>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Fund approval email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending fund approval email:', error);
    return false;
  }
};
import nodemailer from 'nodemailer';

export const sendWelcomeEmail = async (email, hrmsNo, password) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Rayat Kutumb!',
      html: `
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden;">
          <tr>
            <td style="background:#2c3e50; padding:20px; text-align:center; color:#ffffff; font-size:22px; font-weight:bold;">
              Rayat Kutumb Kalyan Yojana
            </td>
          </tr>
          <tr>
            <td style="padding:30px; color:#333333; font-size:15px; line-height:1.6;">
              <p>Hello,</p>
              <p>We’re excited to welcome you to <strong>Rayat Kutumb</strong>! 🎉  
              Your account has been successfully created.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa; border:1px solid #e0e0e0; border-radius:8px; margin:20px 0;">
                <tr>
                  <td style="padding:15px;">
                    <p style="margin:0;"><strong>Username:</strong> ${hrmsNo}</p>
                    <p style="margin:5px 0 0;"><strong>Password:</strong> ${password}</p>
                  </td>
                </tr>
              </table>
              <div style="text-align:center; margin:25px 0;">
                <a href="https://yourwebsite.com/login" 
                   style="background:#27ae60; color:#ffffff; text-decoration:none; padding:12px 25px; border-radius:5px; display:inline-block; font-weight:bold;">
                  Login to Your Account
                </a>
              </div>
              <p>If you need any assistance, feel free to contact our support team.</p>
              <p>Warm regards,<br><strong>Rayat Kutumb Team</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background:#ecf0f1; padding:15px; text-align:center; font-size:12px; color:#777;">
              © 2026 Rayat Kutumb. All rights reserved.
            </td>
          </tr>
        </table>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

export const sendWelfareSubmissionEmail = async (
  email,
  formData,
  pdfBuffer,
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const submissionDate =
      formData.formDate || new Date().toLocaleDateString('en-IN');
    const requestId = formData.requestId || 'N/A';
    const applicantName = formData.applicantName || 'Applicant';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `✅ Welfare Form Submitted Successfully — Rayat Kutumb`,
      html: `
        <table width="620" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif; background:#ffffff; border-radius:10px; overflow:hidden; border:1px solid #e0e0e0;">
          <!-- Header -->
          <tr>
            <td style="background:#1a3c6e; padding:24px 30px; text-align:center;">
              <p style="margin:0; color:#ffffff; font-size:20px; font-weight:bold; letter-spacing:0.5px;">
                Rayat Kutumb Kalyan Yojana
              </p>
              <p style="margin:6px 0 0; color:#a8c4e0; font-size:13px;">
                Rayat Sevak Welfare Fund, Satara
              </p>
            </td>
          </tr>

          <!-- Success Banner -->
          <tr>
            <td style="background:#2d7a4f; padding:14px 30px; text-align:center;">
              <p style="margin:0; color:#ffffff; font-size:16px; font-weight:bold;">
                ✓ &nbsp; Form Submitted Successfully
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 30px; color:#333333; font-size:14px; line-height:1.7;">
              <p style="margin:0 0 12px;">Dear <strong>${applicantName}</strong>,</p>
              <p style="margin:0 0 16px;">
                Your <strong>Seva Madhat Arna (Welfare Assistance) Form</strong> has been received and is under review.
                Our committee will process your application shortly.
              </p>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9; border:1px solid #d0dbe8; border-radius:8px; margin:0 0 20px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table width="100%" cellpadding="6" cellspacing="0">
                      <tr>
                        <td style="color:#555; font-weight:bold; width:45%;">📋 Request ID</td>
                        <td style="color:#1a3c6e; font-weight:bold;">${requestId}</td>
                      </tr>
                      <tr>
                        <td style="color:#555; font-weight:bold;">👤 Applicant Name</td>
                        <td style="color:#333;">${applicantName}</td>
                      </tr>
                      <tr>
                        <td style="color:#555; font-weight:bold;">🏢 HRMS No.</td>
                        <td style="color:#333;">${formData.hrmsNo || '—'}</td>
                      </tr>
                      <tr>
                        <td style="color:#555; font-weight:bold;">📅 Submission Date</td>
                        <td style="color:#333;">${submissionDate}</td>
                      </tr>
                      <tr>
                        <td style="color:#555; font-weight:bold;">💰 Requested Amount</td>
                        <td style="color:#333;">Rs. ${formData.requestedAmountNumbers || '—'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1; border-left:4px solid #f0a500; border-radius:4px; margin:0 0 20px;">
                <tr>
                  <td style="padding:12px 16px; color:#5a4000; font-size:13px;">
                    <strong>📎 Note:</strong> A detailed PDF of your submitted form is attached to this email for your records.
                    Please keep it safe as it serves as proof of submission.
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px; color:#555; font-size:13px;">
                If you have any questions regarding your application, please contact the Welfare Office.
              </p>
              <p style="margin:20px 0 0;">
                Warm regards,<br>
                <strong style="color:#1a3c6e;">Rayat Kutumb Welfare Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f0f0f0; padding:14px 30px; text-align:center; font-size:11px; color:#888;">
              © 2026 Rayat Shikshan Sanstha — Rayat Sevak Welfare Fund, Satara. All rights reserved.
            </td>
          </tr>
        </table>
      `,
      attachments: [
        {
          filename: `welfare_form_${requestId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welfare submission email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending welfare submission email:', error);
    return false;
  }
};
