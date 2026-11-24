import logging

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.concepts import CONCEPTS, get_concept
from app.config import FRONTEND_URL
from app.gemini_client import GenerationError
from app.pipeline import generate_diagram
from app.schemas import DiagramResponse
from app.store import load_results

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Science Diagram Maker API",
    description="Science Diagram Maker API that uses AI to create science diagration",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    return { "status": "ok" }

@app.get("/results", response_model=list[DiagramResponse])
def get_results():

    results = {
        result.concept_id: result
        for result in load_results()
    }

    return [
        DiagramResponse(
            concept = concept,
            result = results[concept.id]
        )
        for concept in CONCEPTS
        if concept.id in results
    ]

@app.post(
    "/generate/{concept_id}",
    response_model = DiagramResponse
)
def generate(concept_id: int):

    concept = get_concept(concept_id)

    if concept is None:
        raise HTTPException(
            status_code = 404,
            detail = "Concept not found."
        )

    try:
        result = generate_diagram(concept)

    except GenerationError as exc:
        logger.warning(
            "Generation failed for concept %s: %s", concept_id, exc
        )

        status_code = (
            exc.status_code
            if exc.status_code in {429, 503}
            else 502
        )

        raise HTTPException(
            status_code=status_code,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception(
            "Unexpected generation error for concept %s",
            concept_id,
        )

        raise HTTPException(
            status_code=500,
            detail="Diagram generation failed unexpectedly.",
        ) from exc

    return DiagramResponse(
        concept=concept,
        result=result,
    )