VARIABLES = ["csc", "maths", "phy", "che", "tam", "eng", "bio"]

DOMAIN = ["Monday", "Tuesday", "Wednesday"]

CONSTRAINTS = [
    ("csc", "maths"),
    ("mat", "phy"),
    ("mat", "che"),
    ("mat", "tam"),
    ("phy", "tam"),
    ("phy", "eng"),
    ("che", "csc"),
    ("tam", "eng"),
    ("eng", "bio")
]


def backtrack(assignment):
    """Runs backtracking search to find an assignment."""
    # Check if assignment is complete
    if len(assignment) == len(VARIABLES):
        return assignment

    var = select_unassigned_variable(assignment)

    for value in DOMAIN:
        if consistent(var, value, assignment):
            assignment[var] = value
            result = backtrack(assignment)
            if result is not None:
                return result
            # Backtrack
            del assignment[var]

    return None


def select_unassigned_variable(assignment):
    """Chooses a variable not yet assigned, in order."""
    for var in VARIABLES:
        if var not in assignment.keys():
            return var


def consistent(var, value, assignment):
    """Checks to see if an assignment is consistent."""
    for var1, var2 in CONSTRAINTS:
        if var1 == var or var2 == var:
            for var3, day in assignment.items():
                if (var3 == var2 or var3 == var1) and day == value:
                    return False
    return True


solution = backtrack(dict())

print(solution)
