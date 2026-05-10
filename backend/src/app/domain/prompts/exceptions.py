class PromptNotFound(Exception):
    def __init__(self, node: str, variant: str):
        self.node = node
        self.variant = variant
        super().__init__(f"Prompt '{node}/{variant}' not found")
