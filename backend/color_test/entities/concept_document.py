from beanie import Document
from pydantic import Field


class ConceptDocument(Document):
    """
    Singleton document storing the editable list of color-test concepts.
    """

    id: str = Field(default="color_test_concepts", alias="_id")
    concepts: list[str] = Field(default_factory=list)

    class Settings:
        name = "color_test_concepts"
