"""
Project API — CRUD operations for design projects
"""
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from aws_lambda_powertools import Logger
import boto3

logger = Logger(child=True)
router = APIRouter()

dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION_NAME", "us-east-1"))
PROJECTS_TABLE = os.environ.get("PROJECTS_TABLE", "designai-projects")


@router.get("/")
def list_projects():
    """List all projects for the current user"""
    table = dynamodb.Table(PROJECTS_TABLE)
    response = table.query(
        IndexName="GSI2-Date",
        KeyConditionExpression="GSI2PK = :pk",
        ExpressionAttributeValues={":pk": "USER#placeholder"},
        ScanIndexForward=False,
        Limit=20,
    )
    projects = [item.get("data", {}) for item in response.get("Items", [])]
    return {"projects": projects}


@router.get("/{project_id}")
def get_project(project_id: str):
    """Get a single project by ID"""
    table = dynamodb.Table(PROJECTS_TABLE)
    response = table.get_item(
        Key={"PK": "USER#placeholder", "SK": f"PROJECT#{project_id}"}
    )
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Project not found")
    return item.get("data", {})


@router.delete("/{project_id}")
def delete_project(project_id: str):
    """Delete a project"""
    table = dynamodb.Table(PROJECTS_TABLE)
    table.delete_item(
        Key={"PK": "USER#placeholder", "SK": f"PROJECT#{project_id}"}
    )
    return {"message": "Project deleted", "project_id": project_id}
