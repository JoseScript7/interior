"""
Seeley Backend — FastAPI + Mangum Lambda Adapter
Coarse-grained REST router (single Lambda per domain per Q2 decision)
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from aws_lambda_powertools import Logger, Tracer

from api.upload import router as upload_router
from api.project import router as project_router
from api.analyze import router as analyze_router
from api.render import router as render_router
from api.furniture import router as furniture_router
from api.scene import router as scene_router
from api.local import router as local_router

logger = Logger(service="seeley-api")
tracer = Tracer(service="seeley-api")

app = FastAPI(
    title="Seeley API",
    description="AI-Powered Home Interior Visualization Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(local_router, prefix="/local", tags=["Local Mode (Path C)"])
app.include_router(upload_router, prefix="/upload", tags=["Upload"])
app.include_router(project_router, prefix="/project", tags=["Project"])
app.include_router(analyze_router, prefix="/recommend", tags=["Recommendations"])
app.include_router(render_router, prefix="/render", tags=["Render"])
app.include_router(furniture_router, prefix="/assets", tags=["Furniture"])
app.include_router(scene_router, prefix="/scene", tags=["Scene"])


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "seeley-api"}


# Mangum adapter for Lambda
handler = Mangum(app, lifespan="off")
