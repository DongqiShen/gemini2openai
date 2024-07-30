# gemini2openai

This is a Cloudflare Worker designed to process embedding requests and convert them to a format compatible with OpenAI.

## Deployment

You can deploy this Worker to your Cloudflare account using the following one-click deployment link:

[Deploy to Cloudflare Workers](https://workers.cloudflare.com)

Copy [`workers.js`](worker.js) to`cloudflare-workers`

## Usage

### Request Format

The Worker only accepts POST requests. The request header must include an `Authorization` field in the format `Bearer YOUR_GEMINI_API_KEY`.

The request body must be in JSON format and include the `input` field. `input` can be a single string or an array of strings.

Example request:

```json
{
  "input": ["This is a sample text.", "Here is another example."],
  "model": "text-embedding-ada-002",
  "encoding_format": "float"
}
```

Example Usage with Python

```python
from openai import OpenAI

client = OpenAI(base_url="https://your-worker-url.workers.dev/", api_key="YOUR_API_KEY")

response = client.embeddings.create(
  model="text-embedding-ada-002",
  input=["The food was delicious and the waiter..."],
  encoding_format="float"
)
```

### Response Format

Example response:
```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [0.1, 0.2, 0.3, ...],
      "index": 0
    },
    {
      "object": "embedding",
      "embedding": [0.4, 0.5, 0.6, ...],
      "index": 1
    }
  ],
  "model": "text-embedding-ada-002",
  "usage": {
    "prompt_tokens": 12,
    "total_tokens": 12
  }
}
```

## Deployment Steps

	1.Ensure you have a Cloudflare account and have created a Cloudflare Workers project.
	2.Use the one-click deployment link above to deploy this Worker.
	3.Once deployed, you can test it by sending POST requests using cURL or any HTTP client.

Example cURL command:

```sh
curl -X POST https://[your-worker-url.workers.dev]/embeddings -H "Authorization: Bearer YOUR_API_KEY" -H "Content-Type: application/json" -d '{"input": ["This is a sample text."], "model": "text-embedding-ada-002", "encoding_format": "float"}'
```

## Error Handling

If the Authorization header is missing or incorrectly formatted, the Worker will return a 500 status code with an error message.

Example error response:

```json
{
  "error": "Invalid or missing API key in the Authorization header"
}
```

## Conversion Functions

### OpenAI to Gemini Conversion

The convertOpenAIToGemini function converts the OpenAI request format to the Gemini request format.

### Gemini to OpenAI Conversion

The convertGeminiToOpenAI function converts the Gemini response format to the OpenAI response format.

## License

This project is licensed under the MIT License.