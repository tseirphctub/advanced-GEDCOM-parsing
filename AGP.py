import re

class GedcomParser:
    def __init__(self):
        self.data = {}
        self.current_path = []
        self.level_stack = []

    def parse(self, filename):
        with open(filename, 'r', encoding='utf-8') as file:
            for line in file:
                self._process_line(line.strip())

    def _process_line(self, line):
        match = re.match(r'(\d+)\s+(@[^@]+@|)\s*(\w+)\s*(.*)', line)
        if not match:
            print(f"Warning: Could not parse line: {line}")
            return

        level, pointer, tag, value = match.groups()
        level = int(level)
        value = value.strip() if value else None

        # Manage the level stack
        while self.level_stack and self.level_stack[-1] >= level:
            self.level_stack.pop()
            if self.current_path:
                self.current_path.pop()

        # New record if level 0 with a pointer
        if level == 0 and pointer:
            self.current_path = [pointer]
            self.level_stack = [level]
            if pointer.startswith('@I'):
                self.data[pointer] = {'type': 'INDI', 'details': {}}
            elif pointer.startswith('@F'):
                self.data[pointer] = {'type': 'FAM', 'details': {}}
            else:
                self.data[pointer] = {'type': 'OTHER', 'details': {}}
        else:
            # Push level to stack and update path for nested structures
            if level > 0:
                self.level_stack.append(level)
                self.current_path.append(tag)

            # Store data at current path
            current = self.data
            for part in self.current_path[:-1]:
                if part not in current:
                    current[part] = {}
                current = current[part]

            if tag not in current:
                current[tag] = value or []
            elif isinstance(current[tag], list):
                current[tag].append(value or {})
            else:
                if value:
                    current[tag] = [current[tag], value]
                else:
                    current[tag] = [current[tag], {}]

    def get_data(self):
        return self.data

# Example usage
if __name__ == "__main__":
    parser = GedcomParser()
    parser.parse('example.ged')
    
    # Print structure (simplified, as actual output could be very large)
    for record in parser.get_data().values():
        print(f"Record Type: {record['type']}")
        print(f"Details:\n{record['details']}\n")
