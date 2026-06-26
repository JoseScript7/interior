"""
Pydantic models for Scene Descriptor (Python side of JSON Schema contracts)
"""
from typing import Optional
from pydantic import BaseModel, Field


class Point3D(BaseModel):
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0


class FurnitureDimensions(BaseModel):
    width: float
    depth: float
    height: float


class FurnitureItem(BaseModel):
    id: str
    name: str
    category: str = "other"
    position: Point3D = Field(default_factory=Point3D)
    rotation: Point3D = Field(default_factory=Point3D)
    scale: Point3D = Field(default_factory=lambda: Point3D(x=1, y=1, z=1))
    model_url: str = Field(alias="modelUrl", default="")
    thumbnail_url: Optional[str] = Field(alias="thumbnailUrl", default=None)
    dimensions: Optional[FurnitureDimensions] = None
    material: Optional[str] = None
    color: Optional[str] = None
    product_id: Optional[str] = Field(alias="productId", default=None)
    product_url: Optional[str] = Field(alias="productUrl", default=None)
    price: Optional[float] = None
    is_placeholder: bool = Field(alias="isPlaceholder", default=False)

    class Config:
        populate_by_name = True


class RoomGeometry(BaseModel):
    width: float
    length: float
    height: float
    room_type: Optional[str] = Field(alias="roomType", default=None)

    class Config:
        populate_by_name = True


class SceneTheme(BaseModel):
    name: str
    color_palette: list[str] = Field(alias="colorPalette", default_factory=list)
    materials: list[str] = Field(default_factory=list)
    lighting: str = "warm"

    class Config:
        populate_by_name = True


class SceneMetadata(BaseModel):
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")
    version: int = 1
    status: str = "draft"
    original_image_key: Optional[str] = Field(alias="originalImageKey", default=None)
    render_image_key: Optional[str] = Field(alias="renderImageKey", default=None)

    class Config:
        populate_by_name = True


class SceneDescriptor(BaseModel):
    project_id: str = Field(alias="projectId")
    user_id: str = Field(alias="userId")
    room: RoomGeometry
    items: list[FurnitureItem] = Field(default_factory=list)
    theme: Optional[SceneTheme] = None
    metadata: SceneMetadata

    class Config:
        populate_by_name = True
