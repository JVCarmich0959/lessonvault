from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, classes, lesson_plans, materials, runs, standards

app = FastAPI(title="LessonVault API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(lesson_plans.router, prefix="/api/v1/lesson-plans", tags=["lesson-plans"])
app.include_router(standards.router, prefix="/api/v1", tags=["standards"])
app.include_router(materials.router, prefix="/api/v1", tags=["materials"])
app.include_router(runs.router, prefix="/api/v1", tags=["runs"])
app.include_router(classes.router, prefix="/api/v1", tags=["classes"])

@app.get("/")
def root():
    return {"status": "LessonVault API running"}
