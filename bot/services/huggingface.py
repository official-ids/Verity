import httpx
from typing import Optional, List, Dict
from datetime import datetime
from config import HUGGINGFACE_API_KEY, DEFAULT_MODEL, FALLBACK_MODEL, MAX_MESSAGE_LENGTH
from utils.logger import logger

class HuggingFaceService:
    def __init__(self):
        self.api_key = HUGGINGFACE_API_KEY
        self.base_url = "https://api-inference.huggingface.co/models"
        self.timeout = 60
        
    async def generate(
        self, 
        prompt: str, 
        model: str = None,
        temperature: float = 0.7,
        max_tokens: int = 512,
        system_prompt: str = None,
        conversation_history: List[Dict] = None
    ) -> Optional[str]:
        """Generate text using Hugging Face API."""
        if not model:
            model = DEFAULT_MODEL
            
        # Prepare the full prompt with context
        full_prompt = self._prepare_prompt(prompt, system_prompt, conversation_history)
        
        # Try primary model first
        result = await self._make_request(full_prompt, model, temperature, max_tokens)
        
        # If failed, try fallback model
        if not result and model != FALLBACK_MODEL:
            logger.warning(f"Primary model {model} failed, trying fallback {FALLBACK_MODEL}")
            result = await self._make_request(full_prompt, FALLBACK_MODEL, temperature, max_tokens)
            
        return result
    
    def _prepare_prompt(
        self, 
        prompt: str, 
        system_prompt: str = None,
        conversation_history: List[Dict] = None
    ) -> str:
        """Prepare prompt with system instruction and conversation history."""
        full_prompt = ""
        
        if system_prompt:
            full_prompt += f"System: {system_prompt}\n\n"
        
        if conversation_history:
            for msg in conversation_history[-10:]:  # Last 10 messages
                role = "User" if msg["role"] == "user" else "Assistant"
                full_prompt += f"{role}: {msg['message']}\n"
        
        full_prompt += f"Assistant: {prompt}"
        return full_prompt
    
    async def _make_request(
        self, 
        prompt: str, 
        model: str,
        temperature: float,
        max_tokens: int
    ) -> Optional[str]:
        """Make API request to Hugging Face."""
        url = f"{self.base_url}/{model}"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "temperature": temperature,
                "max_new_tokens": max_tokens,
                "return_full_text": False,
                "do_sample": True
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    if data and isinstance(data, list) and len(data) > 0:
                        generated_text = data[0].get("generated_text", "")
                        return generated_text.strip() if generated_text else None
                elif response.status_code == 503:
                    logger.warning(f"Model {model} is loading, please retry")
                    return None
                elif response.status_code == 429:
                    logger.warning("Rate limit exceeded")
                    return None
                else:
                    logger.error(f"API error: {response.status_code} - {response.text}")
                    return None
                    
        except httpx.TimeoutException:
            logger.error(f"Timeout for model {model}")
            return None
        except Exception as e:
            logger.error(f"Error calling HF API: {str(e)}")
            return None
    
    async def check_model_availability(self, model: str) -> bool:
        """Check if a model is available."""
        url = f"{self.base_url}/{model}"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(url, headers=headers)
                return response.status_code == 200
        except:
            return False

hf_service = HuggingFaceService()
