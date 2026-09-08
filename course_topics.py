"""
Course Topics & Syllabus Breakdown for 3rd Year Mathematics & Statistics
"""

COURSE_TOPICS = {
    "SMA300": [
        {"id": "sma300-1", "title": "Field & Order Structure, Bounds, and Completeness Axiom", "module": "Module 1: Real Number System"},
        {"id": "sma300-2", "title": "Supremum & Infimum Properties and Archimedean Property", "module": "Module 1: Real Number System"},
        {"id": "sma300-3", "title": "Point Set Topology in R: Open, Closed, and Compact Sets", "module": "Module 2: Topology in R"},
        {"id": "sma300-4", "title": "Sequences, Convergence Definitions, and Cauchy Criterion", "module": "Module 3: Sequences in R"},
        {"id": "sma300-5", "title": "Subsequences, Bolzano-Weierstrass, and Limit Superior/Inferior", "module": "Module 3: Sequences in R"},
        {"id": "sma300-6", "title": "Limits of Functions and (varepsilon, delta) Continuity Criterion", "module": "Module 4: Limits & Continuity"},
        {"id": "sma300-7", "title": "Intermediate Value & Extreme Value Theorems", "module": "Module 4: Limits & Continuity"},
        {"id": "sma300-8", "title": "Differentiability, Rolle's Theorem, and Mean Value Theorems", "module": "Module 5: Differentiation in R"},
        {"id": "sma300-9", "title": "Uniform Continuity vs Continuity and Metric Space Extensions", "module": "Module 6: Uniform Continuity"}
    ],
    "SST305": [
        {"id": "sst305-1", "title": "Concept of Parameter Estimation & Sampling Distributions", "module": "Lesson 1: Foundations"},
        {"id": "sst305-2", "title": "Unbiasedness, Asymptotic Unbiasedness, and Bias Calculations", "module": "Lesson 2: Properties of Estimators"},
        {"id": "sst305-3", "title": "Consistency & Mean Squared Error (MSE) Decomposition", "module": "Lesson 2: Properties of Estimators"},
        {"id": "sst305-4", "title": "Sufficiency: Neyman-Fisher Factorization Theorem", "module": "Lesson 3: Sufficiency & Efficiency"},
        {"id": "sst305-5", "title": "Efficiency & Fisher Information (Cramer-Rao Lower Bound)", "module": "Lesson 3: Sufficiency & Efficiency"},
        {"id": "sst305-6", "title": "Method of Moments Estimation (MME) & Applications", "module": "Lesson 4: Point Estimation Methods"},
        {"id": "sst305-7", "title": "Maximum Likelihood Estimation (MLE) & Invariance Principle", "module": "Lesson 5: MLE"},
        {"id": "sst305-8", "title": "Completeness, Rao-Blackwell Theorem, and Lehmann-Scheffe MVUE", "module": "Lesson 6: MVUE"}
    ],
    "SMA335": [
        {"id": "sma335-1", "title": "Classification of ODEs: Order, Degree, Linearity & Solutions", "module": "Lesson 1: Introduction"},
        {"id": "sma335-2", "title": "First-Order Separable & Homogeneous Differential Equations", "module": "Lesson 2: First-Order Equations"},
        {"id": "sma335-3", "title": "Exact Differential Equations & Integrating Factors", "module": "Lesson 3: Exact Equations"},
        {"id": "sma335-4", "title": "Linear First-Order ODEs and Bernoulli Equations", "module": "Lesson 4: Linear Equations"},
        {"id": "sma335-5", "title": "Second-Order Homogeneous Linear ODEs (Characteristic Equations)", "module": "Lesson 5: Second-Order Homogeneous"},
        {"id": "sma335-6", "title": "Method of Undetermined Coefficients for Non-Homogeneous ODEs", "module": "Lesson 6: Non-Homogeneous Equations"},
        {"id": "sma335-7", "title": "Method of Variation of Parameters (Wronskian)", "module": "Lesson 6: Non-Homogeneous Equations"},
        {"id": "sma335-8", "title": "First-Order Linear Systems of Differential Equations (Eigenvalues)", "module": "Lesson 7: Linear Systems"}
    ],
    "SMA330": [
        {"id": "sma330-1", "title": "Floating-Point Arithmetic, Truncation, Round-off & Relative Error", "module": "Lesson 1: Error Analysis"},
        {"id": "sma330-2", "title": "Propagation of Errors & Condition Numbers in Computations", "module": "Lesson 2: Error Propagation"},
        {"id": "sma330-3", "title": "Synthetic Division & Horner's Algorithm for Polynomials", "module": "Lesson 3: Polynomial Evaluation"},
        {"id": "sma330-4", "title": "Root Finding: Bisection Method, Regula Falsi & Convergence Rates", "module": "Lesson 4: Bracketing Methods"},
        {"id": "sma330-5", "title": "Root Finding: Newton-Raphson & Secant Methods (Order 2 Convergence)", "module": "Lesson 5: Open Methods"},
        {"id": "sma330-6", "title": "Lagrange Polynomial Interpolation & Error Bounds", "module": "Lesson 6: Interpolation"},
        {"id": "sma330-7", "title": "Newton's Divided Difference Interpolation Formula", "module": "Lesson 6: Interpolation"},
        {"id": "sma330-8", "title": "Numerical Integration: Trapezoidal Rule, Simpson's 1/3 & 3/8 Rules", "module": "Lesson 7: Numerical Quadrature"}
    ],
    "SST304": [
        {"id": "sst304-1", "title": "Random Vectors, Mean Vectors, and Covariance Matrices (Sigma)", "module": "Module 1: Random Vectors"},
        {"id": "sst304-2", "title": "Quadratic Forms, Matrix Traces, and Expectation E[X'AX]", "module": "Module 1: Random Vectors"},
        {"id": "sst304-3", "title": "Multivariate Normal (MVN) Density & Moment Generating Function", "module": "Module 2: MVN Distribution"},
        {"id": "sst304-4", "title": "MVN Marginal & Conditional Distributions via Matrix Partitioning", "module": "Module 2: MVN Distribution"},
        {"id": "sst304-5", "title": "Determination of MVN Parameters from Exponents (Mean & Covariance)", "module": "Module 3: Parameter Determination"},
        {"id": "sst304-6", "title": "Multinomial Distribution: Joint PDF, MGF, and Covariance Structure", "module": "Module 3: Multinomial"},
        {"id": "sst304-7", "title": "Markov & Chebychev Inequalities with Probability Bounds", "module": "Module 4: Limit Theorems"},
        {"id": "sst304-8", "title": "Stochastic Convergence Modes & Weak Law of Large Numbers (WLLN)", "module": "Module 4: Limit Theorems"}
    ],
    "SST301": [
        {"id": "sst301-1", "title": "Statistical Computing Paradigms: Vectors, Matrices, and Lists", "module": "Module 1: Computing Foundations"},
        {"id": "sst301-2", "title": "Data Wrangling: Subsetting, Filtering, Grouping, and Reshaping", "module": "Module 2: Data Manipulation"},
        {"id": "sst301-3", "title": "Random Variate Generation & Simulating Standard Distributions", "module": "Module 3: Simulation"},
        {"id": "sst301-4", "title": "Monte Carlo Integration & Statistical Estimation via Simulation", "module": "Module 4: Monte Carlo"},
        {"id": "sst301-5", "title": "Resampling Methods: Non-parametric Bootstrap & Permutation Tests", "module": "Module 4: Resampling"},
        {"id": "sst301-6", "title": "Statistical Graphics & Multi-variable Data Visualization", "module": "Module 5: Graphics"},
        {"id": "sst301-7", "title": "Writing Robust Vectorized Functions & Performance Profiling", "module": "Module 6: Functions & Scripts"}
    ],
    "SST101": [
        {"id": "sst101-1", "title": "Data Types, Frequency Distributions, and Presentation Methods", "module": "Lesson 1: Descriptive Statistics"},
        {"id": "sst101-2", "title": "Measures of Central Tendency: Mean, Median, Mode & Weighted Averages", "module": "Lesson 2: Central Tendency"},
        {"id": "sst101-3", "title": "Measures of Dispersion: Variance, Standard Deviation, IQR & Skewness", "module": "Lesson 3: Dispersion"},
        {"id": "sst101-4", "title": "Probability Axioms, Conditional Probability, and Bayes' Theorem", "module": "Lesson 4: Probability"},
        {"id": "sst101-5", "title": "Discrete Probability Distributions: Binomial & Poisson Formulations", "module": "Lesson 5: Discrete Distributions"},
        {"id": "sst101-6", "title": "Continuous Distributions: Standard Normal Distribution & Z-Scores", "module": "Lesson 6: Normal Distribution"},
        {"id": "sst101-7", "title": "Sampling Distributions, Central Limit Theorem & Confidence Intervals", "module": "Lesson 7: Sampling & Intervals"},
        {"id": "sst101-8", "title": "Hypothesis Testing: Type I/II Errors, One-Sample & Two-Sample Tests", "module": "Lesson 8: Hypothesis Testing"}
    ]
}

def get_topics_for_subject(subject_code):
    """Return list of syllabus topics for a given subject code"""
    code = (subject_code or '').strip().upper()
    return COURSE_TOPICS.get(code, [])
