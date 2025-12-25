import requests
import json
import sys

try:
    response = requests.get("http://localhost:8000/openapi.json")
    if response.status_code == 200:
        schema = response.json()
        paths = schema.get("paths", {})
        print(f"Total paths found: {len(paths)}")
        
        teacher_paths = [p for p in paths if "/teacher/papers" in p]
        if teacher_paths:
            print("Found teacher paths:")
            for p in teacher_paths:
                print(f" - {p}")
        else:
            print("ERROR: /teacher/papers path NOT FOUND in openapi.json")
            print("Available paths starting with /api/v1/teacher:")
            for p in paths:
                if "/api/v1/teacher" in p:
                    print(f" - {p}")
    else:
        print(f"Failed to fetch openapi.json: {response.status_code}")
except Exception as e:
    print(f"Connection failed: {e}")
