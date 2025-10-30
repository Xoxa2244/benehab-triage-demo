from typing import Optional
from langchain_openai import ChatOpenAI

from backend.utils.profiling_instructions import get_instructions_for_tags
from backend.utils.prompts import summarization_prompt


class InstructionService:
    """
    Сервис для генерации специфических инструкций на основе тегов пациента.
    Использует LLM для суммаризации инструкций dos и donts.
    """
    
    def __init__(self, llm: Optional[ChatOpenAI] = None):
        """
        Инициализация сервиса.
        
        Args:
            llm: Экземпляр ChatOpenAI. Если не передан, будет создан с моделью по умолчанию.
        """
        self.llm = llm or ChatOpenAI(model="gpt-4o")
    
    async def generate_specific_instructions(self, patient_tags: list[str]) -> str:
        """
        Генерирует специфические инструкции для общения с пациентом.
        
        Процесс:
        1. Извлекает dos и donts инструкции для каждого тега
        2. Объединяет их в строки
        3. Использует LLM для суммаризации и устранения противоречий
        
        Args:
            patient_tags: Список тегов пациента (строки из IssueType и PatientType)
        
        Returns:
            Сгенерированные инструкции в виде строки
        
        Raises:
            ValueError: Если список тегов пуст
            Exception: При ошибке вызова LLM
        """
        if not patient_tags:
            raise ValueError("Список тегов пациента не может быть пустым")
        
        # Получаем инструкции для всех тегов
        dos_list, donts_list = get_instructions_for_tags(patient_tags)
        
        # Объединяем в строки
        dos_str = '\n'.join(dos_list) if dos_list else "Используем базовый сценарий коммуникации"
        donts_str = '\n'.join(donts_list) if donts_list else "Нет специфических ограничений"
        
        # Форматируем промпт
        formatted_prompt = summarization_prompt.format(dos=dos_str, donts=donts_str)
        
        try:
            # Вызываем LLM для суммаризации
            response = self.llm.invoke(formatted_prompt)
            
            # Извлекаем текст из ответа
            if hasattr(response, 'content'):
                return response.content
            else:
                return str(response)
                
        except Exception as e:
            raise Exception(f"Ошибка при генерации инструкций через LLM: {str(e)}")
    
    def validate_patient_tags(self, patient_tags: list[str]) -> tuple[bool, list[str]]:
        """
        Валидирует теги пациента.
        
        Args:
            patient_tags: Список тегов для валидации
        
        Returns:
            Tuple (is_valid, invalid_tags) где:
            - is_valid: True если все теги валидны
            - invalid_tags: Список невалидных тегов
        """
        from backend.schemas.profiling_schemas import IssueType, PatientType
        
        valid_tags = set([tag.name for tag in IssueType] + [tag.name for tag in PatientType])
        invalid_tags = [tag for tag in patient_tags if tag not in valid_tags]
        
        return len(invalid_tags) == 0, invalid_tags