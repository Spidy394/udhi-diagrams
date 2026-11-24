from typing import Literal
from pydantic import BaseModel, Field, computed_field

class Concept(BaseModel):
    id: int
    name: str
    subject: str
    description: str

class CheckResult(BaseModel):
    passed: bool
    message: str

CheckName = Literal[
    "valid_svg",
    "within_viewbox",
    "title_and_labels",
    "has_animation",
    "safe_svg",
]

class DiagramResult(BaseModel):
    concept_id: int
    model: str
    svg: str

    check: dict[CheckName, CheckResult]

    import_tokens: int | None = Field(default=None, ge=0)
    output_tokens: int | None = Field(default=None, ge=0)
    estimated_cost_usd: float | None = Field(default=None, ge=0)

    api_retries: int = Field(default=0, ge=0)
    validation_retries: int = Field(default=0, ge=0)

    @computed_field
    @property
    def retries(self) -> int:
        return self.api_retries + self.validation_retries

    @computed_field
    @property
    def passed(self) -> bool:
        return len(self.check) == 5 and all(
            check.passed for check in self.check.values()
        )

class GenerationResponse(BaseModel):
    model: str
    svg: str

    input_tokens: int | None = None
    output_tokens: int | None = None
    estimated_cost_usd: float | None = None

    api_retries: int = 0