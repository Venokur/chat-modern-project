import uvicorn
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="AI Chat Engine", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    room_id: str = Field(..., description="ID диалога")
    text: str = Field(..., min_length=1, description="Текст сообщения")
    sender: str

class AnalyzeResponse(BaseModel):
    status: str
    auto_reply: str | None = None
    intent: str = "general"

@app.post("/analyze", response_model=AnalyzeResponse, status_code=status.HTTP_200_OK)
async def analyze_message(payload: AnalyzeRequest):
    text_lower = payload.text.lower()
    auto_reply = None
    intent = "general"

    if any(word in text_lower for word in ["цена", "стоимость", "тариф", "прайс"]):
        auto_reply = "Здравствуйте! С актуальными тарифами вы можете ознакомиться в прайс-листе. Оператор скоро подключится."
        intent = "pricing"
    elif any(word in text_lower for word in ["привет", "здравствуйте", "добрый"]):
        auto_reply = "Приветствуем! Чем мы можем помочь вам сегодня?"
        intent = "greeting"

    return AnalyzeResponse(status="ok", auto_reply=auto_reply, intent=intent)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
