from datetime import datetime
from typing import Optional
import uuid

from backend.documents.ChatDocument import ChatDocument
from backend.services.instruction_service import InstructionService


class ChatService:
    """
    Сервис для управления чатами с пациентами.
    Обрабатывает создание, обновление и получение чатов из MongoDB.
    """
    
    def __init__(self, instruction_service: InstructionService):
        """
        Инициализация сервиса.
        
        Args:
            instruction_service: Сервис для генерации инструкций
        """
        self.instruction_service = instruction_service
    
    async def create_chat(
        self,
        diagnosis: str,
        prescriptions: str,
        patient_tags: list[str]
    ) -> ChatDocument:
        """
        Создает новый чат с пациентом.
        
        Процесс:
        1. Валидирует теги пациента
        2. Генерирует специфические инструкции через LLM
        3. Создает и сохраняет ChatDocument в MongoDB
        
        Args:
            diagnosis: Диагноз пациента
            prescriptions: Назначения врача
            patient_tags: Список тегов пациента
        
        Returns:
            Созданный ChatDocument
        
        Raises:
            ValueError: Если теги невалидны или данные некорректны
        """
        # Валидация тегов
        is_valid, invalid_tags = self.instruction_service.validate_patient_tags(patient_tags)
        if not is_valid:
            raise ValueError(f"Невалидные теги пациента: {', '.join(invalid_tags)}")
        
        # Генерация инструкций
        specific_instructions = await self.instruction_service.generate_specific_instructions(patient_tags)
        
        # Создание документа
        chat = ChatDocument(
            chat_id=f"chat_{uuid.uuid4().hex[:12]}",
            diagnosis=diagnosis,
            prescriptions=prescriptions,
            patient_tags=patient_tags,
            specific_instructions=specific_instructions,
            messages=[],
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Сохранение в MongoDB
        await chat.insert()
        
        return chat
    
    async def get_chat(self, chat_id: str) -> Optional[ChatDocument]:
        """
        Получает чат по ID.
        
        Args:
            chat_id: Идентификатор чата
        
        Returns:
            ChatDocument или None если не найден
        """
        return await ChatDocument.find_one(ChatDocument.chat_id == chat_id)
    
    async def add_message(
        self,
        chat_id: str,
        role: str,
        content: str
    ) -> ChatDocument:
        """
        Добавляет сообщение в чат.
        
        Args:
            chat_id: Идентификатор чата
            role: Роль отправителя ('patient' или 'nurse')
            content: Содержимое сообщения
        
        Returns:
            Обновленный ChatDocument
        
        Raises:
            ValueError: Если чат не найден или роль невалидна
        """
        # Валидация роли
        if role not in ['patient', 'nurse']:
            raise ValueError(f"Невалидная роль: {role}. Допустимые значения: 'patient', 'nurse'")
        
        # Получение чата
        chat = await self.get_chat(chat_id)
        if not chat:
            raise ValueError(f"Чат с ID '{chat_id}' не найден")
        
        # Создание сообщения
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Добавление сообщения
        chat.messages.append(message)
        chat.updated_at = datetime.utcnow()
        
        # Сохранение
        await chat.save()
        
        return chat

    async def refresh_instructions(
        self,
        chat_id: str,
        patient_tags: Optional[list[str]] = None
    ) -> ChatDocument:
        """
        Пересчитывает инструкции для чата. Может обновлять теги пациента.
        
        Args:
            chat_id: Идентификатор чата
            patient_tags: Новый список тегов пациента (если None, используются текущие из чата)
        """
        chat = await self.get_chat(chat_id)
        is_new_chat = False
        if not chat:
            # Создаем новый чат с пустой историей и заданным chat_id
            chat = ChatDocument(
                chat_id=chat_id,
                diagnosis="",
                prescriptions="",
                patient_tags=patient_tags or [],
                specific_instructions="",
                messages=[],
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            is_new_chat = True

        tags_to_use = patient_tags or chat.patient_tags

        # Валидация тегов
        is_valid, invalid_tags = self.instruction_service.validate_patient_tags(tags_to_use)
        if not is_valid:
            raise ValueError(f"Невалидные теги пациента: {', '.join(invalid_tags)}")

        # Генерация инструкций
        specific_instructions = await self.instruction_service.generate_specific_instructions(tags_to_use)

        # Обновление полей
        chat.patient_tags = tags_to_use
        chat.specific_instructions = specific_instructions
        chat.updated_at = datetime.utcnow()

        if is_new_chat:
            await chat.insert()
        else:
            await chat.save()
        return chat

    async def instructions_preview(self, chat_id: str) -> dict:
        """
        Возвращает сырые и финальные инструкции по чату.
        """
        chat = await self.get_chat(chat_id)
        if not chat:
            raise ValueError(f"Чат с ID '{chat_id}' не найден")

        dos, donts = self.instruction_service.get_raw_instructions(chat.patient_tags)

        return {
            "patient_tags": chat.patient_tags,
            "dos": dos,
            "donts": donts,
            "specific_instructions": chat.specific_instructions
        }
    
    async def generate_nurse_response(
        self,
        chat_id: str,
        patient_message: str
    ) -> str:
        """
        Генерирует ответ медсестры на сообщение пациента через LLM.
        Применяет guardrail для проверки безопасности ответа.
        
        Args:
            chat_id: Идентификатор чата
            patient_message: Сообщение от пациента
        
        Returns:
            Сгенерированный и отцензурированный ответ медсестры
        
        Raises:
            ValueError: Если чат не найден
            Exception: При ошибке вызова LLM
        """
        # Получение чата
        chat = await self.get_chat(chat_id)
        if not chat:
            raise ValueError(f"Чат с ID '{chat_id}' не найден")
        
        # Импорт необходимых функций
        from backend.utils.prompts import format_chat_history, master_prompt, guardrail_prompt
        
        # Форматирование истории чата
        chat_history = format_chat_history(chat.messages)
        
        # Подготовка промпта с полным контекстом
        formatted_prompt = master_prompt.format(
            specific_instructions=chat.specific_instructions,
            diagnosis=chat.diagnosis,
            prescriptions=chat.prescriptions,
            chat_history=chat_history,
            input=patient_message
        )
        
        try:
            # Вызов LLM для генерации первичного ответа
            response = self.instruction_service.llm.invoke(formatted_prompt)
            
            # Извлечение текста из ответа
            if hasattr(response, 'content'):
                nurse_response = response.content
            else:
                nurse_response = str(response)
            
            # Применение guardrail для проверки безопасности
            guardrail_formatted = guardrail_prompt.format(
                nurse_response=nurse_response,
                diagnosis=chat.diagnosis,
                prescriptions=chat.prescriptions
            )
            
            # Вызов LLM для цензурирования ответа
            censored_response = self.instruction_service.llm.invoke(guardrail_formatted)
            
            # Извлечение отцензурированного текста
            if hasattr(censored_response, 'content'):
                return censored_response.content
            else:
                return str(censored_response)
                
        except Exception as e:
            raise Exception(f"Ошибка при генерации ответа медсестры через LLM: {str(e)}")
    
    async def clear_chat_history(self, chat_id: str) -> ChatDocument:
        """
        Очищает историю сообщений чата, сохраняя метаданные.
        
        Args:
            chat_id: Идентификатор чата
        
        Returns:
            Обновленный ChatDocument
        
        Raises:
            ValueError: Если чат не найден
        """
        chat = await self.get_chat(chat_id)
        if not chat:
            raise ValueError(f"Чат с ID '{chat_id}' не найден")
        
        # Очистка истории
        chat.messages = []
        chat.updated_at = datetime.utcnow()
        
        # Сохранение
        await chat.save()
        
        return chat
    
    async def delete_chat(self, chat_id: str) -> bool:
        """
        Удаляет чат полностью.
        
        Args:
            chat_id: Идентификатор чата
        
        Returns:
            True если чат был удален, False если не найден
        """
        chat = await self.get_chat(chat_id)
        if not chat:
            return False
        
        await chat.delete()
        return True
    
    async def get_all_chats(self, active_only: bool = True) -> list[ChatDocument]:
        """
        Получает список всех чатов.
        
        Args:
            active_only: Если True, возвращает только активные чаты
        
        Returns:
            Список ChatDocument
        """
        if active_only:
            return await ChatDocument.find(ChatDocument.is_active == True).to_list()
        else:
            return await ChatDocument.find_all().to_list()
    
    async def deactivate_chat(self, chat_id: str) -> ChatDocument:
        """
        Деактивирует чат (помечает как неактивный).
        
        Args:
            chat_id: Идентификатор чата
        
        Returns:
            Обновленный ChatDocument
        
        Raises:
            ValueError: Если чат не найден
        """
        chat = await self.get_chat(chat_id)
        if not chat:
            raise ValueError(f"Чат с ID '{chat_id}' не найден")
        
        chat.is_active = False
        chat.updated_at = datetime.utcnow()
        
        await chat.save()
        
        return chat
