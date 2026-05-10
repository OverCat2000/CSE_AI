import os
from typing import Literal
from langchain_core.language_models.chat_models import BaseChatModel


class LLMFactory:
    @staticmethod
    def get_model(
        provider: Literal["aws", "vertex", "openai"],
        model_name: str,
        temperature: float = 0,
    ) -> BaseChatModel:

        if provider == "aws":
            from langchain_aws import ChatBedrock

            return ChatBedrock(
                model=model_name,
                config={"temperature": temperature},
            )

        elif provider == "vertex":
            from langchain_google import ChatVertexAI

            return ChatVertexAI(
                model_name=model_name,
                temperature=temperature,
            )

        elif provider == "openai":
            from langchain_openai import ChatOpenAI

            return ChatOpenAI(
                model=model_name,
                temperature=temperature,
            )

        else:
            raise ValueError(f"Unsupported provider: {provider}")
