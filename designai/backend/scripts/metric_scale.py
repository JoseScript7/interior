"""
Metric scale calibration — converts Depth Anything V2's RELATIVE depth into
real-world metres using a known anchor object in the room photo.

Depth Anything V2 outputs a normalized map (0=closest .. 1=farthest) with NO
intrinsic scale. Without a metric anchor, a 2.1m sofa may render at 0.5m or 5m.

Anchors (known physical heights):
  - interior_door : 2.03 m  (international standard)
  - credit_card   : 0.0856 m (ISO/IEC 7810 ID-1 long edge)

Workflow:
  1. SAM2 (or Rekognition) segments the anchor -> pixel bounding box.
  2. metres_per_pixel = anchor_real_height_m / anchor_pixel_height
  3. Apply that factor to room/furniture pixel measurements.

This module is pure math (no AWS calls) so it is unit-testable in isolation.
"""
from dataclasses import dataclass

ANCHOR_HEIGHTS_M = {
    "interior_door": 2.03,
    "credit_card": 0.0856,
}


@dataclass
class ScaleResult:
    metres_per_pixel: float
    anchor: str
    anchor_pixel_height: float
    confidence: float  # 0..1, caller may derive from segmentation score


def compute_scale(anchor: str, anchor_pixel_height: float, confidence: float = 1.0) -> ScaleResult:
    """metres_per_pixel from a known anchor's pixel height."""
    if anchor not in ANCHOR_HEIGHTS_M:
        raise ValueError(f"Unknown anchor '{anchor}'. Known: {list(ANCHOR_HEIGHTS_M)}")
    if anchor_pixel_height <= 0:
        raise ValueError("anchor_pixel_height must be > 0")
    real_h = ANCHOR_HEIGHTS_M[anchor]
    return ScaleResult(
        metres_per_pixel=real_h / anchor_pixel_height,
        anchor=anchor,
        anchor_pixel_height=anchor_pixel_height,
        confidence=max(0.0, min(1.0, confidence)),
    )


def pixels_to_metres(pixel_length: float, scale: ScaleResult) -> float:
    return pixel_length * scale.metres_per_pixel


def estimate_room_dimensions(
    room_width_px: float,
    room_length_px: float,
    room_height_px: float,
    scale: ScaleResult,
) -> dict:
    """Convert pixel-space room extents to metres. Clamped to plausible interior ranges."""
    def clamp(v, lo, hi):
        return max(lo, min(hi, v))

    return {
        "width": round(clamp(pixels_to_metres(room_width_px, scale), 1.5, 15.0), 2),
        "length": round(clamp(pixels_to_metres(room_length_px, scale), 1.5, 20.0), 2),
        "height": round(clamp(pixels_to_metres(room_height_px, scale), 2.0, 4.5), 2),
        "scaleSource": scale.anchor,
        "metresPerPixel": round(scale.metres_per_pixel, 6),
        "confidence": scale.confidence,
    }


# Fallback when no anchor is detected: assume a typical doorway height fraction
# of the image so the scene is at least plausible (flagged low-confidence).
def fallback_scale(image_height_px: float) -> ScaleResult:
    assumed_door_px = image_height_px * 0.75
    return compute_scale("interior_door", assumed_door_px, confidence=0.3)


if __name__ == "__main__":
    # quick self-check
    s = compute_scale("interior_door", anchor_pixel_height=480)
    print("metres/pixel:", round(s.metres_per_pixel, 5))
    print(estimate_room_dimensions(1200, 1500, 700, s))
