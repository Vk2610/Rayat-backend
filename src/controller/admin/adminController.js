import axios from 'axios';

export const proxyFile = async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({ message: "URL is required" });
        }

        console.log("Proxying file from URL:", url);

        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'Accept': 'application/pdf, image/*'
            }
        });

        res.set('Content-Type', response.headers['content-type']);
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cache-Control', 'public, max-age=86400');
        
        return res.send(response.data);
    } catch (error) {
        console.error("Error proxying file:", error.message);
        return res.status(500).json({ message: "Failed to fetch file" });
    }
};