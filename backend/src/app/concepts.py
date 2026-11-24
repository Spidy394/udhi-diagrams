from textwrap import dedent

from app.schemas import Concept

CONCEPTS: list[Concept] = [
    Concept(
        id=1,
        name="Pythagoras' theorem",
        subject="Maths",
        description=dedent(
            """
                In a right-angled triangle, the longest side is called the hypotenuse. The square of the hypotenuse is equal to the sum of the squares of the other two sides: a² + b² = c².
            """
        ).strip()
    ),
    Concept(
        id=2,
        name="Parts of a circle",
        subject="Maths",
        description=dedent(
            """
                A circle has a centre. The radius is the distance from the centre to the edge. The diameter goes across the circle through the centre and is twice the radius. The circumference is the distance around the circle.
            """
        ).strip()
    ),
    Concept(
        id=3,
        name="Series circuit",
        subject="Physics",
        description=dedent(
            """
                In a series circuit there is only one loop. The current is the same everywhere in the loop. The voltage of the cell is shared between the components.
            """
        ).strip()
    ),
    Concept(
        id=4,
        name="Photosynthesis",
        subject="Biology",
        description=dedent(
            """
                Plants take in carbon dioxide and water. They use light energy, absorbed by chlorophyll, to make glucose and oxygen.
            """
        ).strip()
    ),
    Concept(
        id=5,
        name="States of matter",
        subject="Chemistry",
        description=dedent(
            """
                In a solid the particles are close together and vibrate in place. In a liquid they are close but move past each other. In a gas they are far apart and move fast.
            """
        ).strip()
    )
]

def get_concept(concept_id: int) -> Concept | None:
    return next(
        (concept for concept in CONCEPTS if concept.id == concept_id),
        None
    )