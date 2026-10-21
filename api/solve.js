export default async function handler(req, res) {
    // Cấu hình CORS cho phép Extension gọi vào
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { question, choices } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; // Lấy API Key bảo mật từ Vercel Environment Variables

    if (!apiKey) {
        return res.status(500).json({ error: 'Server API key not configured on Vercel' });
    }

    try {
        let choicesText = '';
        if (Array.isArray(choices)) {
            choices.forEach((c, i) => {
                choicesText += `[${i}] ${c}\n`;
            });
        } else {
            choicesText = choices;
        }

        const prompt = `Bạn là trợ lý giải toán chuyên nghiệp. Hãy đọc đề bài toán sau và chọn đáp án chính xác nhất trong các lựa chọn.
Đề bài:
${question}

Các lựa chọn:
${choicesText}

YÊU CẦU: Trả về ĐÚNG MỘT SỐ CHỈ MỤC (index trong ngoặc vuông [] tương ứng với đáp án đúng, ví dụ: 0 hoặc 1 hoặc 2...). Không giải thích gì thêm.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        
        const match = aiReply.match(/\d+/);
        const correctIndex = match ? parseInt(match[0]) : 0;

        return res.status(200).json({ correctIndex, raw: aiReply });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}
