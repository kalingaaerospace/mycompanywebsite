from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

# Initialize the FastAPI app
app = FastAPI()

# Load the GPT-2 model for text generation
model = pipeline('text-generation', model='gpt2')

# Define a request model for text analysis input
class TextInput(BaseModel):
    text: str

# Define the root endpoint (homepage)
@app.get("/")
def read_root():
    return {"message": "Hello world"}

# Define the /analyze endpoint for POST requests
@app.post("/analyze/")
def analyze_text(input_data: TextInput):
    # Use the GPT-2 model to generate a response
    result = model(input_data.text, max_length=50)
    return {"generated_text": result[0]['generated_text']}
