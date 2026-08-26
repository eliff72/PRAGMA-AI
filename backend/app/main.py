from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin import router as admin_router
from app.api.analytics import router as analytics_router
from app.api.auth import router as auth_router
from app.api.competitions import router as competitions_router
from app.api.escalations import router as escalations_router
from app.api.faq import router as faq_router
from app.api.metrics import router as metrics_router
from app.api.questions import router as questions_router
from app.api.resources import router as resources_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="TEKNOFEST - Yapay Zeka Destekli SSS ve Chatbot Asistani (RAG tabanli)",
    version="0.1.0",
)

# CORS — yerel gelistirme ve production frontend domainleri.
# CORS_ORIGINS env degiskeni ile yonetilir (bkz. app/core/config.py):
#   - tanimsiz / "*"  -> tum origin'lere izin (jury demosu, hizli dagitim)
#   - virgullu liste   -> yalnizca listelenen domainler
# NOT: Tarayici spesifikasyonu geregi allow_origins=["*"] ile
# allow_credentials=True birlikte calismaz (tarayici istegi reddeder).
# Auth'umuz cookie degil "Authorization: Bearer" header'i kullandigi icin
# joker modda credentials'i kapatmak arayuzde hicbir seyi bozmaz.
cors_origins = settings.cors_origin_list
allow_all_origins = cors_origins == ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=not allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health_check() -> dict:
    return {"status": "ok", "service": settings.app_name}


# Eski path'ler (frontend/src/api/* onceki surumleri veya dogrudan API tuketen
# baska istemciler icin) KIRILMADAN korunuyor; ayni router'lar /api prefix'iyle
# de ikinci kez bagliyoruz ki feature/backend-frontend-uyumu sozlesmesindeki
# /api/... path'leri de calissin.
app.include_router(auth_router)
app.include_router(auth_router, prefix="/api")
app.include_router(competitions_router)
app.include_router(competitions_router, prefix="/api")
app.include_router(escalations_router)
app.include_router(escalations_router, prefix="/api")
app.include_router(faq_router)
app.include_router(faq_router, prefix="/api")
app.include_router(metrics_router)
app.include_router(metrics_router, prefix="/api")

# Yeni, duz (flat) frontend sozlesmesine ozgu endpoint'ler — bunlarin router'lari
# zaten kendi ic prefix'lerinde "/api" tasiyor.
app.include_router(questions_router)
app.include_router(resources_router)
app.include_router(analytics_router)
app.include_router(admin_router)
