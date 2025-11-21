from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="ViajeIA API")

# Configurar CORS para permitir requests del frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React por defecto corre en puerto 3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TravelQuery(BaseModel):
    question: str


class TravelResponse(BaseModel):
    answer: str


@app.get("/")
def read_root():
    return {"message": "ViajeIA API is running"}


@app.post("/api/travel", response_model=TravelResponse)
async def plan_travel(query: TravelQuery):
    """
    Endpoint para procesar preguntas sobre viajes
    """
    # Por ahora retornamos una respuesta básica
    # Aquí se integrará más adelante con un modelo de IA o servicio
    response_text = f"Recibí tu pregunta: '{query.question}'. Próximamente podré ayudarte a planificar tu viaje de manera más detallada."
    
    return TravelResponse(answer=response_text)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}

