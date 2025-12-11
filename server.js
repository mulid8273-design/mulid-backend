const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// OpenAI 설정
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// 파일 업로드 설정
const upload = multer({ dest: "uploads/" });

// 기본 테스트
app.get("/", (req, res) => {
    res.send("Mulid Backend Server Running");
});

// Whisper: 오디오 -> 텍스트 변환
app.post("/api/whisper", upload.single("file"), async (req, res) => {
    try {
        const audioPath = req.file.path;
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: process.env.WHISPER_MODEL || "whisper-1"
        });

        // 업로드 파일 삭제
        fs.unlinkSync(audioPath);

        res.json({ text: transcription.text });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Whisper transcription failed." });
    }
});

// GPT: 텍스트 -> GPT 응답
app.post("/api/gpt", async (req, res) => {
    try {
        const prompt = req.body.prompt;
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        });
        res.json({ text: response.choices[0].message.content });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "GPT request failed." });
    }
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
