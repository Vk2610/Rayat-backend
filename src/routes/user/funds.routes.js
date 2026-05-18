import express from "express";
import { pool } from "../../config/db.config.js";   // ✅ FIX: pool must be imported
import { 
  getFundsByHRMS,
  updateInstallments,
  createFundRecord,
  updateDisbursement
} from "../../model/user/funds.model.js";

const router = express.Router();

/* -------------------------------------------------------
   GET FUNDS BY HRMSNO
---------------------------------------------------------*/
router.get("/:hrmsNo", async (req, res) => {
  try {
    const hrmsNo = req.params.hrmsNo;

    let fund = await getFundsByHRMS(hrmsNo);

    if (!fund) {
      fund = await createFundRecord(hrmsNo);
    }

    res.json(fund);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


/* -------------------------------------------------------
   UPDATE INSTALLMENTS
---------------------------------------------------------*/
router.put("/upd-ints/:hrmsNo", async (req, res) => {
  try {
    const hrmsNo = req.params.hrmsNo;

    console.log("📝 PUT update funds for HRMS:", hrmsNo);
    console.log("🔥 Received update payload:", req.body);

    const {
      installment1, installment1Date,
      installment2, installment2Date,
      installment3, installment3Date,
      installment4, installment4Date,
      installment5, installment5Date,
      claimedFullAmount
    } = req.body;

    await createFundRecord(hrmsNo);

    const fund = await updateInstallments(hrmsNo, {
      installment1,
      installment1Date,
      installment2,
      installment2Date,
      installment3,
      installment3Date,
      installment4,
      installment4Date,
      installment5,
      installment5Date,
      claimedFullAmount
    });

    res.json({ success: true, fund });

  } catch (err) {
    console.error("PUT /funds error:", err);
    res.status(500).json({
      error: "Server error updating installments",
      details: err?.sqlMessage || err?.message || String(err),
    });
  }
});


/* -------------------------------------------------------
   UPDATE DISBURSEMENT
---------------------------------------------------------*/
router.put("/upd-disbursement/:hrmsNo", async (req, res) => {
  try {
    const hrmsNo = req.params.hrmsNo;
    const { meetingNo, checqueNo, meetingDate } = req.body;
    
    await createFundRecord(hrmsNo);
    const fund = await updateDisbursement(hrmsNo, { meetingNo, checqueNo, meetingDate });
    
    res.json({ success: true, fund });
  } catch (err) {
    console.error("PUT /upd-disbursement error:", err);
    res.status(500).json({ error: "Server error updating disbursement details" });
  }
});

export default router;
