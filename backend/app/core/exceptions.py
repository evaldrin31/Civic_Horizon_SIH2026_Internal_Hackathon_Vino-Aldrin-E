"""Custom exceptions."""


class AIPException(Exception):
    """Base exception for the platform."""
    
    def __init__(self, message: str, code: str = "UNKNOWN_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class NotFoundException(AIPException):
    """Resource not found."""
    
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            message=f"{resource} with id '{identifier}' not found",
            code="NOT_FOUND"
        )


class ValidationException(AIPException):
    """Validation error."""
    
    def __init__(self, message: str):
        super().__init__(message=message, code="VALIDATION_ERROR")


class ImportException(AIPException):
    """Data import error."""
    
    def __init__(self, message: str, record_index: int | None = None):
        prefix = f"Record {record_index}: " if record_index is not None else ""
        super().__init__(message=f"{prefix}{message}", code="IMPORT_ERROR")
