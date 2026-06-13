import {
  getAllForms,
  getAllFormsOfUser,
  getApprovedAmountReportApplications,
  getApplicationsByStatus,
  deleteFormByRequestId,
  getFormByRequestId,
  getUsers,
  insertWelfareFormData,
  updateApprovedAmountByRequestId,
  updateApprAmt,
  updateStatus,
  getApprovedNoAmtForms,
  updateWelfareFormData,
} from '../../model/user/welfareForm.model.js';
import { getWelfareDocsById } from '../../model/user/welfareDocs.model.js';
import { pool } from '../../config/db.config.js';
import { generateWelfarePDF } from '../../utils/pdfGenerator.js';
import { sendWelfareSubmissionEmail } from '../../utils/mailer.js';

import { v4 as uuidv4 } from 'uuid';

export const submitWelfareForm = async (req, res) => {
  try {
    // Generate requestId if not provided
    if (!req.body.requestId) {
      req.body.requestId = uuidv4();
    }

    await insertWelfareFormData(req, res);

    // ── Post-submission: send confirmation email with PDF ──────────────
    // Run after the response is already sent; errors here must NOT crash
    try {
      const hrmsNo = req.body?.hrmsNo;
      if (hrmsNo) {
        // Fetch registered email from user_profile table
        const [rows] = await pool.execute(
          'SELECT emailId FROM user_profile WHERE hrmsNo = ? LIMIT 1',
          [hrmsNo],
        );
        const email = rows?.[0]?.emailId;

        if (email) {
          // Fetch document URLs from welfareDocs table
          const requestId = req.body.requestId;
          let docUrls = {};
          if (requestId) {
            try {
              const docs = await getWelfareDocsById(requestId);
              if (docs) {
                // Map the document fields to the expected keys
                docUrls = {
                  dischargeCertificate: docs.dischargeCertificate,
                  doctorPrescription: docs.doctorPrescription,
                  medicineBills: docs.medicineBills,
                  diagnosticReports: docs.diagnosticReports,
                  otherDoc1: docs.otherDoc1,
                  otherDoc2: docs.otherDoc2,
                  otherDoc3: docs.otherDoc3,
                  otherDoc4: docs.otherDoc4,
                  otherDoc5: docs.otherDoc5,
                };
              }
            } catch (docError) {
              console.warn(
                '⚠️ Failed to fetch document URLs:',
                docError.message,
              );
            }
          }

          // Combine form data with document URLs
          const pdfData = { ...req.body, ...docUrls };

          const pdfBuffer = await generateWelfarePDF(pdfData);
          await sendWelfareSubmissionEmail(email, pdfData, pdfBuffer);
          console.log(`✅ Welfare submission email sent to ${email}`);
        } else {
          console.warn(
            `⚠️ No email found for hrmsNo=${hrmsNo}, skipping submission email`,
          );
        }
      }
    } catch (emailErr) {
      // Email failure should never break the form submission response
      console.error(
        '⚠️ Failed to send welfare submission email (non-fatal):',
        emailErr,
      );
    }
  } catch (error) {
    console.error('Error submitting welfare form:', error);
  }
};

export const updateFormStatus = async (req, res) => {
  try {
    const { id, status, rejectionReason } = req.body;
    await updateStatus(id, status, rejectionReason);
    return res
      .status(200)
      .json({ message: 'Form Status updated successfully' });
  } catch (error) {
    console.error('Error updating form: ', error);
    return res.status(500).json({ message: 'Failed to update form status' });
  }
};

export const updateFormApprovalAmt = async (req, res) => {
  try {
    const { id, amt } = req.body;
    await updateApprAmt(id, amt);
    return res
      .status(200)
      .json({ message: 'Form approval amount updated successfully' });
  } catch (error) {
    console.error('Error updating form approval amount: ', error);
    return res
      .status(500)
      .json({ message: 'Failed to update form approval amount' });
  }
};

export const getForms = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    console.log(`page : ${page}, limit: ${limit}`);
    const forms = await getAllForms({ page, limit });
    return res
      .status(200)
      .json({ message: 'Forms Retrieved Successfully', forms: forms });
  } catch (error) {
    console.error('Error retrieving forms: ', error);
    return res.status(500).json({ message: 'Failed to retrieve forms' });
  }
};

export const getFormsOfUser = async (req, res) => {
  try {
    const { hrmsNo } = req.query;
    const forms = await getAllFormsOfUser(hrmsNo);
    return res
      .status(200)
      .json({ message: 'Forms Retrieved Successfully', forms: forms });
  } catch (error) {
    console.error('Error retrieving forms: ', error);
    return res.status(500).json({ message: 'Failed to retrieve forms' });
  }
};

export const getUsersController = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    console.log(`search = ${search}`);
    const result = await getUsers({ page, limit, search });
    return res
      .status(200)
      .json({ message: 'Users fetched successfully', users: result });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const getApprovedUnpaidForms = async (req, res) => {
  try {
    const result = await getApprovedNoAmtForms();
    return res
      .status(200)
      .json({ message: 'Forms Retrieved Successfully', forms: result.forms });
  } catch (error) {
    console.error('Error retrieving unpaid approved forms: ', error);
    return res.status(500).json({ message: 'Failed to retrieve forms' });
  }
};

export const getFormDetail = async (req, res) => {
  try {
    const { requestId } = req.query;
    if (!requestId)
      return res.status(400).json({ message: 'requestId is required' });
    const form = await getFormByRequestId(requestId);
    if (!form) return res.status(404).json({ message: 'Form not found' });
    return res
      .status(200)
      .json({ message: 'Form retrieved successfully', form });
  } catch (error) {
    console.error('Error retrieving form detail:', error);
    return res.status(500).json({ message: 'Failed to retrieve form detail' });
  }
};

export const getApplicationsByStatusController = async (req, res) => {
  try {
    const {
      status = 'approved',
      search = '',
      sortBy = 'formDate',
      sortOrder = 'desc',
      approvedAmountMax,
      minRequestedAmount,
      zone,
    } = req.query;

    const applications = await getApplicationsByStatus({
      status,
      search,
      sortBy,
      sortOrder,
      approvedAmountMax,
      minRequestedAmount,
      zone,
    });

    return res.status(200).json({
      message: 'Applications retrieved successfully',
      applications,
    });
  } catch (error) {
    console.error('Error retrieving applications by status:', error);
    return res.status(500).json({ message: 'Failed to retrieve applications' });
  }
};

export const patchApprovedAmountController = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedAmount, approvedDate } = req.body;

    const application = await updateApprovedAmountByRequestId(
      id,
      approvedAmount,
      approvedDate,
    );

    // Fetch user email and name using hrmsNo
    if (application && application.hrmsNo) {
      try {
        const [rows] = await pool.execute(
          'SELECT emailId, employeeName FROM user_profile WHERE hrmsNo = ? LIMIT 1',
          [application.hrmsNo],
        );
        const email = rows?.[0]?.emailId;
        const applicantName = rows?.[0]?.employeeName || 'Applicant';
        if (email) {
          // Dynamically import mailer to avoid circular deps
          const { sendFundApprovalEmail } =
            await import('../../utils/mailer.js');
          await sendFundApprovalEmail(
            email,
            applicantName,
            application.approvedAmount,
            application.requestedAmount,
          );
        }
      } catch (mailErr) {
        console.error('Error sending fund approval email:', mailErr);
      }
    }

    return res.status(200).json({
      message: 'Approved amount updated successfully',
      application,
    });
  } catch (error) {
    console.error('Error updating approved amount:', error);
    const statusCode = error.message === 'Application not found.' ? 404 : 400;
    return res
      .status(statusCode)
      .json({ message: error.message || 'Failed to update approved amount' });
  }
};

export const getReportApplicationsController = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'approvedAmountDate',
      sortOrder = 'desc',
      approvedDateFrom,
      approvedDateTo,
      minRequestedAmount,
      zone,
    } = req.query;

    const result = await getApprovedAmountReportApplications({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      approvedDateFrom,
      approvedDateTo,
      minRequestedAmount,
      zone,
    });

    return res.status(200).json({
      message: 'Report applications retrieved successfully',
      ...result,
    });
  } catch (error) {
    console.error('Error retrieving report applications:', error);
    return res
      .status(500)
      .json({ message: 'Failed to retrieve report applications' });
  }
};

export const deleteFormController = async (req, res) => {
  try {
    const { requestId } = req.params;
    const deletedForm = await deleteFormByRequestId(requestId);

    return res.status(200).json({
      message: 'Form deleted successfully',
      deletedForm,
    });
  } catch (error) {
    console.error('Error deleting form:', error);
    const statusCode = error.message === 'Form not found.' ? 404 : 400;
    return res
      .status(statusCode)
      .json({ message: error.message || 'Failed to delete form' });
  }
};

export const resubmitWelfareForm = async (req, res) => {
  try {
    console.log("resubmitWelfareForm params:", req.params);
    console.log("resubmitWelfareForm body keys:", Object.keys(req.body));
    console.log("resubmitWelfareForm doc URLs:", {
      dischargeCertificate: req.body.dischargeCertificate,
      doctorPrescription: req.body.doctorPrescription,
      medicineBills: req.body.medicineBills,
      diagnosticReports: req.body.diagnosticReports,
      otherDoc1: req.body.otherDoc1,
    });
    await updateWelfareFormData(req, res);
  } catch (error) {
    console.error('Error resubmitting welfare form:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
