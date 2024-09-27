from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import pandas as pd
import openai
from dotenv import load_dotenv

# Load environment variables from .env file
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

        print("Dataset uploaded successfully:", dataset)
        
        # Return a preview of the dataset (first 5 rows)
        preview = df.head().to_dict(orient="records")
        return {"message": "Dataset uploaded successfully!", "preview": preview}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query", response_model=QueryResponse)
async def query_openai(request: Request):
    global dataset
    
    if dataset is None:
        return JSONResponse(
            status_code=400, 
            content={"message": "No dataset uploaded. Please upload a CSV file."}
        )

    # Log the incoming request data
    request_data = await request.json()
    print("Incoming request data:", request_data)

    # Validate the request data
    try:
        query_request = QueryRequest(**request_data)
    except Exception as e:
        print("Request validation error:", str(e))
        raise HTTPException(status_code=400, detail="Invalid request format.")

    # Access the API key from environment variables
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not found.")
    
    openai.api_key = api_key

    # Generate the prompt using the user input and dataset
    prompt = construct_prompt(query_request.prompt, dataset)

    # Log the generated prompt for debugging purposes
    print("Generated prompt:", prompt)
    
    # Handle unanswerable or irrelevant questions
    if "hi" in query_request.prompt.lower() or "hello" in query_request.prompt.lower():
        return QueryResponse(response="Hi there! How can I assist you with your data today?")
    
    if "bar" not in query_request.prompt.lower() and "line" not in query_request.prompt.lower() and "scatter" not in query_request.prompt.lower():
        return QueryResponse(response="I'm sorry, I can only generate bar, line, or scatter charts. Please ask a relevant question.")

    # Generate a Vega-lite chart (example: bar chart)
    chart_type = "bar"  # Default chart type
    if "bar" in query_request.prompt.lower():
        chart_type = "bar"
    elif "line" in query_request.prompt.lower():
        chart_type = "line"
    elif "scatter" in query_request.prompt.lower():
        chart_type = "point"

    try:
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
        print("Generated chart specification:", chart)
    except Exception as e:
        print("Chart generation error:", str(e))
        return QueryResponse(response="Failed to generate chart. The Vega-Lite specification is ill-formed.", chart=None)
    
    return QueryResponse(response=f"Here's your {chart_type} chart", chart=chart)

@app.get("/")
async def read_root():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, 'static', 'index.html')
    return FileResponse(file_path)

def construct_prompt(prompt, dataset):
    # This function should construct a prompt based on the user input and dataset
    # For now, it just returns the prompt as is
    return prompt