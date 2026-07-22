class UserNotFound(Exception):
    def __init__(self, user_id: int):
        self.user_id = user_id
        super().__init__(f"User '{user_id}' not found.")


class SelfModificationError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
