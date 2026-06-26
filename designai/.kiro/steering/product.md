# DesignAI — Product Vision

## What We Build
AI-powered home interior visualization platform. Users upload a room photo,
receive personalized design recommendations, visualize real furniture in 3D/AR,
and purchase products with confidence — without hiring an interior designer.

## Target Users
- Homeowners planning renovations (primary)
- Real estate agents doing virtual staging
- Furniture retailers wanting AR try-before-buy
- Interior design students

## Core User Journey
Upload Room → Upload Pinterest Inspiration → AI Understands Space →
AI Generates Design → Match 3D Furniture → Drag-and-Drop Editor →
AR Preview in Real Room → Photorealistic Render → Purchase

## MVP Features (Hackathon Scope)
1. Room photo upload + S3 storage
2. Bedrock Claude room analysis (dimensions, style, objects detected)
3. AI design recommendations (3 style options per room)
4. Three.js 3D room editor with draggable furniture
5. AR furniture preview via WebXR on mobile
6. Photorealistic render trigger (Stable Diffusion via SageMaker)
7. Save/share design link

## Success Metric for Hackathon Demo
A judge uploads a photo of any room and within 90 seconds sees:
3 AI-generated redesign previews, a 3D editor with real furniture, and AR mode on mobile.
