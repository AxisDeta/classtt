"""
Configuration file for Study Scheduler
Modify these settings to customize the app
"""

# Flask configuration
FLASK_DEBUG = True
FLASK_PORT = 5000
FLASK_HOST = '0.0.0.0'

# Semester info
SEMESTER_TITLE = "3rd Year, 1st Semester"
SEMESTER_START = "11 May 2026"
SEMESTER_END = "26 June 2026"

# Study session durations (in minutes)
DEEP_STUDY_DURATION = 120  # 2 hours
REVISION_DURATION = 60     # 1 hour

# Color scheme customization
COLORS = {
    'SMA300': '#10B981',  # Real Analysis I - Emerald Green
    'SST305': '#EF4444',  # Theory of Estimation - Crimson Red
    'SMA335': '#3B82F6',  # ODEs I - Royal Blue
    'SMA330': '#F59E0B',  # Numerical Analysis I - Amber
    'SST304': '#8B5CF6',  # Multivariate Statistical Methods I - Violet
    'SST301': '#06B6D4',  # Programming Language for Statistics I - Cyan
    'SST101': '#EC4899',  # Intro to Probability & Statistics (Retake) - Rose Pink
}

# Study recommendations per subject
STUDY_RECOMMENDATIONS = {
    'SMA300': {
        'focus': ['Epsilon-delta limit proofs', 'Sequences & series convergence', 'Continuity & differentiability', 'Properties of ℝ'],
        'method': 'Reconstruct every proof from memory after first seeing it; never move to the next theorem until you can restate the previous logic unaided.',
        'mistake': 'Reading a proof and believing that is the same as being able to produce one.'
    },
    'SST305': {
        'focus': ['MLE & Method of Moments derivations', 'Unbiasedness, efficiency & consistency proofs', 'Confidence intervals & Rao-Blackwell'],
        'method': 'Derive, do not memorize — for every named estimator, be able to show why it has the properties it has.',
        'mistake': 'Treating "unbiased," "efficient," and "consistent" as interchangeable praise words instead of distinct, provable properties.'
    },
    'SMA335': {
        'focus': ['First-order & higher-order ODEs', 'Systems of linear ODEs', 'Characteristic equations & integrating factors', 'Applied modeling'],
        'method': 'Classify the ODE type first, every single time, before reaching for a solution method.',
        'mistake': 'Pattern-matching to a remembered solution instead of verifying classification.'
    },
    'SMA330': {
        'focus': ['Root-finding (Bisection, Newton-Raphson)', 'Interpolation & polynomial approximations', 'Numerical integration & differentiation', 'Error analysis & bounds'],
        'method': 'After solving, always ask how the error propagates or grows — active calculation beats intuition.',
        'mistake': 'Getting a numerically "close enough" answer without understanding why it is close or how error behaves.'
    },
    'SST304': {
        'focus': ['Multivariate normal distribution', 'Principal Component Analysis (PCA)', 'Factor analysis', 'Discriminant analysis', 'Multivariate regression'],
        'method': 'Connect every technique to practical ML applications — use existing ML intuition to solidify statistical theory.',
        'mistake': 'Relearning techniques as abstract statistics instead of recognizing tools you already use.'
    },
    'SST301': {
        'focus': ['Statistical language syntax (R / Python)', 'Data manipulation pipelines', 'Statistical computing & simulation', 'Custom scripting drills'],
        'method': 'Light, consistent touches: 30 min syntax drills + 30 min script from scratch without copy-pasting.',
        'mistake': 'Under-investing so much that you miss language-specific statistical idioms (e.g. vectorized/formula syntax).'
    },
    'SST101': {
        'focus': ['Probability fundamentals & Bayes theorem', 'Discrete & continuous distributions', 'Hypothesis testing & confidence intervals', 'Foundational estimation'],
        'method': 'Identify exactly what caused the issue previously; target problem areas with active recall from memory.',
        'mistake': 'Treating retake as "easy content, low effort needed" instead of deliberately mastering past CAT/exam weaknesses.'
    }
}
