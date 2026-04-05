import requests
key = "AIzaSyDm2OvetdFDqvVgE2QoWEx0aErffzGcebA"
url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash", "gemini-1.5-flash-8b", "gemini-2.0-flash-lite-preview-02-05"]
for m in models:
    try:
        resp = requests.post(url, headers=headers, json={"model": m, "messages": [{"role": "user", "content": "hi"}], "max_tokens": 10})
        print(f"{m} -> code: {resp.status_code}")
    except Exception as e:
        print(f"error {m}")
