import base64
from openai import OpenAI
from .prompt import LOAN_FORM_EXTRACTION_PROMPT
import httpx
import json
from app.config import NOVA_API_KEY


def download_image_as_base64(image_url: str):
    response = httpx.get(
        image_url,
        timeout=30.0
    )

    response.raise_for_status()

    image_data = base64.b64encode(
        response.content
    ).decode("utf-8")

    content_type = response.headers.get(
        "content-type",
        "image/jpeg"
    )

    return image_data, content_type




def parse_json_response(content: str) -> dict:

    print(f"Raw AI Response: {content}")
    content = content.strip()

    # Remove Markdown code fence
    if content.startswith("```json"):
        content = content[7:].strip()
    elif content.startswith("```"):
        content = content[3:].strip()

    if content.endswith("```"):
        content = content[:-3].strip()

    return json.loads(content)

client = OpenAI(
    api_key=NOVA_API_KEY,
    base_url="https://api.nova.amazon.com/v1"
)







def ai_service(image_url: str):

    image_data, content_type = download_image_as_base64(image_url)

    response = client.chat.completions.create(
        model="nova-2-lite-v1",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": LOAN_FORM_EXTRACTION_PROMPT
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{content_type};base64,{image_data}"
                        }
                    }
                ]
            }
        ]
    )
    print(f"THIS IS AI DEBUGGING {response}")
    content = response.choices[0].message.content
    return parse_json_response(content)