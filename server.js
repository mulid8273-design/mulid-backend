const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// OpenAI 최신 클라이언트 설정
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// 파일 업로드 설정
const upload = multer({ dest: "uploads/" });

// 기본 테스트 라우트
app.get("/", (req, res) => {
    res.send("Mulid Backend Server Running");
});

// Whisper: 오디오 -> 텍스트 변환
app.post("/api/whisper", upload.single("file"), async (req, res) => {
    try {
        const audioPath = req.file.path;

        const transcription = await client.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: "whisper-1"
        });

        // 업로드 파일 제거
        fs.unlinkSync(audioPath);

        res.json({ text: transcription.text });
    } catch (err) {
        console.error("Whisper Error:", err);
        res.status(500).json({ error: "Whisper transcription failed." });
    }
});

// GPT: 텍스트 → GPT 응답
app.post("/api/gpt", async (req, res) => {
    try {
        const { prompt } = req.body;

        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });

        res.json({ text: response.choices[0].message.content });
    } catch (err) {
        console.error("GPT Error:", err);
        res.status(500).json({ error: "GPT request failed." });
    }
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
