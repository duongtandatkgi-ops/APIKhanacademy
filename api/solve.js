export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { image } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Server API key not configured' });
    }

    try {
        let contents = [];

        if (image) {
            // Tách dữ liệu base64 từ ảnh chụp màn hình
            const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
            contents.push({
                inlineData: {
                    mimeType: "image/png",
                    data: base64Data
                }
            });
            contents.push({
                text: "Hãy nhìn ảnh chụp bài tập trên Khan Academy này. Xác định nội dung câu hỏi, các lựa chọn (A, B, C, D...) và giải thích ngắn gọn, sau đó chỉ rõ đáp án chính xác nhất là gì bằng tiếng Việt."
            });
        } else {
            return res.status(400).json({ error: 'Không nhận được ảnh chụp từ client.' });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: contents }] })
        });

        const data = await response.json();
        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Không đọc được phản hồi từ AI.';

        return res.status(200).json({ answer: aiReply });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}
