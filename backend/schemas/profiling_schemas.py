from enum import StrEnum


class IssueType(StrEnum):
    """Типы проблем пациента"""
    HEAVY_STATE = "Восприятие своего состояния как тяжелого"
    SECONDARY_GAIN = "Вторичная выгода заболевания"
    HIDING_ILLNESS = "Стремление скрыть свою болезнь"
    ESCAPE_ACTIVITY = "Стремление «убежать» в работу или спорт"
    LOW_SELF_ESTEEM = "Сниженная самооценка, неудовлетворенность собой"
    ALT_MEDICINE = "Вера в альтернативную медицину и стремление к самолечению"
    ADDICTIONS = "Вредные привычки, химические зависимости, аддикции"
    IGNORING_ILLNESS = "Игнорирование болезни"
    ANXIETY = "Склонность к тревожным расстройствам"


class PatientType(StrEnum):
    """Типы личности пациента"""
    SENSITIVE = "Сензитивный"
    DISTIMIC = "Дистимический"
    DEMONSTRATIVE = "Демонстративный"
    EXCITABLE = "Возбудимый"
    CYCLOTHYMIC = "Циклотимический"
    RUMINATIVE = "Застревающий"
    PEDANTIC = "Педантичный"
    CLOSED = "Замкнутый"
    HYPERTIMIC = "Гипертимный"


class InstructionType(StrEnum):
    """Типы инструкций"""
    DOS = "Что делать"
    DONTS = "Чего не делать"