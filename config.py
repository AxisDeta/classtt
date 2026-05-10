"""
Configuration file for Study Scheduler
Modify these settings to customize the app
"""

# Flask configuration
FLASK_DEBUG = True
FLASK_PORT = 5000
FLASK_HOST = '0.0.0.0'

# Semester info
SEMESTER_START = "11 May 2026"
SEMESTER_END = "26 June 2026"

# Study session durations (in minutes)
DEEP_STUDY_DURATION = 120  # 2 hours
REVISION_DURATION = 60     # 1 hour

# Color scheme customization
COLORS = {
    'SMA201': '#95E1D3',  # Calculus III - Mint Green
    'SMA203': '#4ECDC4',  # Linear Algebra II - Teal
    'SMA204': '#FFD3B6',  # Algebraic Structures - Peach
    'SST201': '#FFE66D',  # Operations Research - Yellow
    'SST203': '#A8E6CF',  # Database Systems - Light Green
    'SST205': '#FF6B6B',  # Probability & Statistics - Red
    'UCU112': '#C7CEEA',  # General - Light Purple
}

# Study recommendations per subject
STUDY_RECOMMENDATIONS = {
    'SMA201': {
        'focus': ['Partial derivatives', 'Multiple integration', 'Vector calculus', 'Optimization'],
        'method': 'Solve progressively harder problems',
        'mistake': 'Watching solutions without solving independently'
    },
    'SMA203': {
        'focus': ['Eigenvalues/eigenvectors', 'Vector spaces', 'Orthogonality', 'Linear transformations'],
        'method': 'Visualize concepts geometrically',
        'mistake': 'Treating matrices as arithmetic tables instead of transformations'
    },
    'SMA204': {
        'focus': ['Groups', 'Rings', 'Homomorphisms', 'Proof logic'],
        'method': 'Rewrite definitions and practice proofs',
        'mistake': 'Memorizing proofs without understanding theorem assumptions'
    },
    'SST201': {
        'focus': ['Linear programming', 'Optimization', 'Transportation models', 'Decision methods'],
        'method': 'Model practical problems',
        'mistake': 'Solving mechanically without understanding objectives'
    },
    'SST203': {
        'focus': ['SQL syntax', 'Database normalization', 'Relationships', 'Query writing'],
        'method': 'Build small SQL projects',
        'mistake': 'Reading SQL without typing it'
    },
    'SST205': {
        'focus': ['Distributions', 'Conditional probability', 'Problem drills', 'Past CAT questions'],
        'method': 'Never read probability passively',
        'mistake': 'Delaying revision creates conceptual gaps'
    }
}
