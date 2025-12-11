import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 기본 테스트용
app.get("/", (req, res) => {
  res.send("Mulid Backend Server Running");
});

// ------------------------------------------------------
//  Whisper : 오디오·영상 음성 → 텍스트 변환
// ------------------------------------------------------
app.post("/api/whisper", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      response_format: "json"
    });

    // 파일 삭제
    fs.unlinkSync(filePath);

    res.json({
      text: transcription.text,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Whisper 변환 중 오류 발생" });
  }
});

// ------------------------------------------------------
//  GPT: 텍스트 분석 / 변환 API
// ------------------------------------------------------
app.post("/api/gpt", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: prompt,
    });

    res.json({ result: response.output_text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "GPT 변환 중 오류 발생" });
  }
});

// ------------------------------------------------------

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
