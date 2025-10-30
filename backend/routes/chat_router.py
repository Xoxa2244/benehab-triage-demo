from fastapi import APIRouter, HTTPException, status
from typing import List

from backend.schemas import (
    CreateChatRequest,
    SendMessageRequest,
    ChatResponse,
    MessageResponse,
    ChatListResponse,
    SuccessResponse,
    ErrorResponse
)
from backend.services import ChatService, InstructionService
from backend.documents.ChatDocument import ChatDocument

# Создание роутера
router = APIRouter(prefix="/api/chats", tags=["chats"])

# Инициализация сервисов (будут переопределены в main.py при старте приложения)
instruction_service: InstructionService = None
chat_service: ChatService = None


def init_services(instr_service: InstructionService, ch_service: ChatService):
    """
    Инициализация сервисов для роутера.
    Вызывается из main.py при старте приложения.
    """
    global instruction_service, chat_service
    instruction_service = instr_service
    chat_service = ch_service


def chat_document_to_response(chat: ChatDocument) -> ChatResponse:
    """Конвертирует ChatDocument в ChatResponse"""
    return ChatResponse(
        chat_id=chat.chat_id,
        diagnosis=chat.diagnosis,
        prescriptions=chat.prescriptions,
        patient_tags=chat.patient_tags,
        specific_instructions=chat.specific_instructions,
        messages=chat.messages,
        is_active=chat.is_active,
        created_at=chat.created_at,
        updated_at=chat.updated_at
    )


@router.post(
    "/create",
    response_model=ChatResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать новый чат",
    description="Создает новый чат с пациентом, генерирует специфические инструкции на основе тегов"
)
async def create_chat(request: CreateChatRequest):
    """
    Создает новый чат с пациентом.
    
    - **diagnosis**: Диагноз пациента
    - **prescriptions**: Назначения врача
    - **patient_tags**: Список тегов пациента (PatientType + IssueType)
    
    Возвращает созданный чат с сгенерированными инструкциями.
    """
    try:
        chat = await chat_service.create_chat(
            diagnosis=request.diagnosis,
            prescriptions=request.prescriptions,
            patient_tags=request.patient_tags
        )
        return chat_document_to_response(chat)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при создании чата: {str(e)}"
        )


@router.post(
    "/{chat_id}/message",
    response_model=MessageResponse,
    summary="Отправить сообщение",
    description="Обрабатывает сообщение от пациента и генерирует ответ медсестры через LLM"
)
async def send_message(chat_id: str, request: SendMessageRequest):
    """
    Обрабатывает сообщение от пациента и генерирует ответ медсестры.
    
    Процесс:
    1. Сохраняет сообщение пациента в историю чата
    2. Генерирует ответ медсестры через LLM с учетом контекста
    3. Сохраняет ответ медсестры в историю чата
    4. Возвращает ответ медсестры
    
    - **chat_id**: Идентификатор чата
    - **message**: Текст сообщения от пациента
    
    Возвращает сгенерированный ответ медсестры.
    """
    try:
        # 1. Сохранить сообщение пациента
        await chat_service.add_message(
            chat_id=chat_id,
            role="patient",
            content=request.message
        )

        # 2. Сгенерировать ответ медсестры через LLM
        nurse_response = await chat_service.generate_nurse_response(
            chat_id=chat_id,
            patient_message=request.message
        )

        # 3. Сохранить ответ медсестры
        chat = await chat_service.add_message(
            chat_id=chat_id,
            role="nurse",
            content=nurse_response
        )

        # 4. Вернуть ответ медсестры (последнее сообщение)
        last_message = chat.messages[-1] if chat.messages else {}

        return MessageResponse(
            chat_id=chat.chat_id,
            message=last_message
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при обработке сообщения: {str(e)}"
        )


@router.get(
    "/{chat_id}",
    response_model=ChatResponse,
    summary="Получить чат",
    description="Возвращает полную информацию о чате включая историю сообщений"
)
async def get_chat(chat_id: str):
    """
    Получает чат по ID.
    
    - **chat_id**: Идентификатор чата
    
    Возвращает полную информацию о чате.
    """
    try:
        chat = await chat_service.get_chat(chat_id)

        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Чат с ID '{chat_id}' не найден"
            )

        return chat_document_to_response(chat)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении чата: {str(e)}"
        )


@router.delete(
    "/{chat_id}/clear",
    response_model=SuccessResponse,
    summary="Очистить историю чата",
    description="Удаляет все сообщения из чата, сохраняя метаданные"
)
async def clear_chat_history(chat_id: str):
    """
    Очищает историю сообщений чата.
    
    - **chat_id**: Идентификатор чата
    
    Удаляет все сообщения, но сохраняет диагноз, назначения и инструкции.
    """
    try:
        await chat_service.clear_chat_history(chat_id)

        return SuccessResponse(
            success=True,
            message="История чата успешно очищена",
            chat_id=chat_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при очистке истории: {str(e)}"
        )


@router.delete(
    "/{chat_id}",
    response_model=SuccessResponse,
    summary="Удалить чат",
    description="Полностью удаляет чат из базы данных"
)
async def delete_chat(chat_id: str):
    """
    Удаляет чат полностью.
    
    - **chat_id**: Идентификатор чата
    
    Удаляет чат и всю связанную информацию из базы данных.
    """
    try:
        deleted = await chat_service.delete_chat(chat_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Чат с ID '{chat_id}' не найден"
            )

        return SuccessResponse(
            success=True,
            message="Чат успешно удален",
            chat_id=chat_id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при удалении чата: {str(e)}"
        )


@router.get(
    "",
    response_model=ChatListResponse,
    summary="Получить список чатов",
    description="Возвращает список всех чатов (по умолчанию только активные)"
)
async def get_all_chats(active_only: bool = True):
    """
    Получает список всех чатов.
    
    - **active_only**: Если True, возвращает только активные чаты (по умолчанию True)
    
    Возвращает список чатов.
    """
    try:
        chats = await chat_service.get_all_chats(active_only=active_only)

        chat_responses = [chat_document_to_response(chat) for chat in chats]

        return ChatListResponse(
            chats=chat_responses,
            total=len(chat_responses)
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении списка чатов: {str(e)}"
        )
