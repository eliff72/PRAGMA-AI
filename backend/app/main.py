from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.competitions import router as competitions_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="TEKNOFEST - Yapay Zeka Destekli SSS ve Chatbot Asistani (RAG tabanli)",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # MVP: gelistirme asamasinda serbest, prod'da kisitlanacak
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health_check() -> dict:
    return {"status": "ok", "service": settings.app_name}


app.include_router(auth_router)
app.include_router(competitions_router)
