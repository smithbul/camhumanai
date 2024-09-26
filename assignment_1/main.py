from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import pandas as pd
from dotenv import load_dotenv
import json

load_dotenv()

app = FastAPI()

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store the dataset in memory
dataset = None

class QueryRequest(BaseModel):
    prompt: str

class QueryResponse(BaseModel):
    response: str
    chart: dict = None

# Endpoint for uploading a CSV file
@app.post("/upload_csv/")
async def upload_csv(file: UploadFile = File(...)):
    global dataset
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a valid CSV file.")
    
    try:
        # Read the CSV file into a pandas DataFrame
        df = pd.read_csv(file.file)
        dataset = df
        
        # Return a preview of the dataset (first 5 rows)
        preview = df.head().to_dict(orient="records")
        return {"message": "Dataset uploaded successfully!", "preview": preview}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query", response_model=QueryResponse)
async def query_openai(request: QueryRequest):
    global dataset
    
    if dataset is None:
        return JSONResponse(
            status_code=400, 
            content={"message": "No dataset uploaded. Please upload a CSV file."}
        )

    # Generate the prompt using the user input and dataset
    prompt = construct_prompt(request.prompt, dataset)

    # Log the generated prompt for debugging purposes
    print("Generated prompt:", prompt)
    
    # Generate a Vega-lite chart (example: bar chart)
    # Further improvements could dynamically generate based on the prompt
    chart_type = "bar"  # Default chart type
    if "bar" in request.prompt:
        chart_type = "bar"
    elif "line" in request.prompt:
        chart_type = "line"
    elif "scatter" in request.prompt:
        chart_type = "point"

    chart = {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": "Generated chart based on prompt",
        "data": {
            "values": dataset.to_dict(orient='records')  # convert dataset to JSON
        },
        "mark": chart_type,
        "encoding": {
            "x": {"field": dataset.columns[0], "type": "ordinal"},
            "y": {"field": dataset.columns[1], "type": "quantitative"}
        }
    }
    
    return QueryResponse(response=f"Here's your {chart_type} chart", chart=chart)


# Root endpoint to serve the HTML file
@app.get("/")
async def read_root():
    return FileResponse('/static/index.html')

