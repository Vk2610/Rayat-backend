import { getWelfareDocsById } from '../../model/user/welfareDocs.model.js';

export const getWelfareDocs = async (req, res) => {
    try {
        const { requestId } = req.query;
        console.log('requestId: ',requestId);
        const result = await getWelfareDocsById(requestId);
        return res.status(200).json({ msg: "Success", docs: result });
    } catch (error) {
        console.log('error retrieving docs ', error);
        return res.status(500).json({ msg: "Error Retrieving docs" });
    }
}