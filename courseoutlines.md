# SST304: Multivariate Statistical Methods I

### **Module 1: Random Vectors & Quadratic Forms**

  * **Topic 1: Random and Mean Vectors**
      * Learn definitions of a random vector and a mean vector.
      * Understand how to evaluate a variance-covariance matrix ($\\Sigma$) and its symmetric property.
      * Evaluate the mean and variance of linear functions of a random vector ($\\underline{Y} = A\\underline{X}$).
      * Complete Unit 1 Revision Exercise Questions 1, 2, and 3.
  * **Topic 2: Quadratic Forms**
      * Define a quadratic form ($\\underline{Q} = \\underline{X}'A\\underline{X}$).
      * Learn how to evaluate the expectation of a quadratic form using matrix traces ($trace(A\\Sigma) + \\underline{\\mu}'A\\underline{\\mu}$).
      * Study the unbiased estimator sample problem.
      * Complete Unit 1 Revision Exercise Question 4.

### **Module 2: Multivariate Normal Distribution (MVN)**

  * **Topic 3: PDF and Moment Generating Functions**
      * Master the probability density function (pdf) for the non-singular MVN distribution.
      * Review the step-by-step mathematical proof confirming it integrates to one.
      * Derive and apply the MVN moment generating function (mgf).
      * Complete Unit 2 Revision Exercise Questions 1, 2, and 3.
  * **Topic 4: Marginal & Conditional Distributions of MVN**
      * Infer the univariate and subset marginal distributions using the uniqueness of mgf and matrix partitioning.
      * Write out conditional distributions for subsets of an MVN vector given another subset.
      * Calculate partial regression coefficients and multiple correlation coefficients.
      * Complete Unit 3 Revision Exercises.

### **Module 3: MVN Parameter Determination & Multinomial Distribution**

  * **Topic 5: Determination of MVN Parameters**
      * Extract the components of a mean vector ($\\underline{\\mu}$) by solving $\\frac{\\partial Q}{\\partial \\underline{X}} = \\underline{0}$.
      * Obtain the components of a variance-covariance matrix ($\\Sigma$) from the coefficients of the square and bilinear terms in an exponent.
      * Prove the distribution of the exponent quadratic form follows a chi-square distribution.
      * Complete Unit 4 Revision Exercises.
  * **Topic 6: Multinomial Distribution**
      * Write the joint pdf of a multinomial distribution.
      * Obtain its mgf and probability generating function (pgf).
      * Derive marginal distributions, means ($np\_i$), variances ($np\_i(1-p\_i)$), covariances ($-np\_ip\_j$), and conditional binomial distributions from the mgf/pgf.
      * Complete Unit 5 Revision Exercises.

### **Module 4: Limit Theorems in Probability**

  * **Topic 7: Probability Inequalities**
      * State and prove the Markov Inequality for non-negative functions.
      * State, prove, and apply the Chebychev Inequality to find lower probability bounds or maximum error limits.
      * Practice calculations using the Poisson, Binomial, and general variable examples.
  * **Topic 8: Stochastic Convergence & WLLN**
      * Differentiate between the three definitions of stochastic convergence (converging to zero, a constant, or another random variable).
      * State and prove the Weak Law of Large Numbers (WLLN) using Chebychev's Inequality.
      * Complete Unit 6 Revision Exercises.

---

# SMA300: Real Analysis I


### Module 1: The Real Number System

This foundational module outlines the structural architecture of real numbers, comparing rational and irrational numbers, and establishing the properties of bounds and completeness.

  * **Field and Order Structure**: Entails the algebraic structure of the real numbers ($\\mathfrak{R}$) under addition and multiplication. It details properties like closure, commutativity, associativity, additive/multiplicative identities, and inverses. It defines an "ordered field" through specific ordering relationships ($\\le$).
  * **Rational and Irrational Numbers**: Explains the mathematical extension of integers to rational numbers ($Q$), formatted as $m/n$ where $m$ and $n$ share no common factors other than 1. It introduces irrational numbers ($Q^c$) as numbers that cannot be expressed as a fraction, and includes a formal proof showing that $\\sqrt{2}$ is irrational. The unified set forms the real number system, or "the continuum" ($\\mathfrak{R} = Q \\cup Q^c$).
  * **Intervals**: Categorizes subsets of real numbers into open $(a,b)$, closed $\[a,b\]$, or half-open/half-closed intervals.
  * **Bounded Sets**: Defines sets that are bounded above (having an upper bound) or bounded below (having a lower bound).
  * **Supremum and Infimum**: Covers the precise definitions of the Supremum ($\\sup S$, the least upper bound) and Infimum ($\\inf S$, the greatest lower bound). It also entails matching these to "maximal elements" and "minimum elements" when the bound belongs to the subset.
  * **Completeness Axiom**: Dictates that every non-empty subset of $\\mathfrak{R}$ that is bounded above has a supremum in $\\mathfrak{R}$ (and if bounded below, has an infimum in $\\mathfrak{R}$), making $\\mathfrak{R}$ a complete ordered field.
  * **Density of Rational Numbers**: Proves the Density Theorem, which states that between any two distinct real numbers, there exists both a rational number and an irrational number.

### Module 2: Topology of the Real Numbers

This module covers the spatial relationships and structural classifications of point sets within the real line.

  * **Neighborhoods**: Defines an $\\epsilon$-neighborhood of a point $x$ as an open interval $(x-\\epsilon, x+\\epsilon)$ for some $\\epsilon \> 0$.
  * **Interior Points and Open Sets**: Entails finding interior points where an open interval around a point sits entirely within a subset. A set is explicitly "open" if every point within it is an interior point ($B^\\circ = B$). It includes theorems proving the behavior of unions and intersections of open sets.
  * **Limit Points and Derived Sets**: Defines a limit point (or cluster/accumulation point) of a set $S$ as a real number $p$ whose neighborhoods always contain points of $S$ distinct from $p$. The collection of these limit points is defined as the derived set ($S'$).
  * **Closed Sets and Closure**: Defines a set as "closed" if it contains all of its limit points. It proves that a set is closed if and only if its complement is open, and outlines the rules for intersections and unions of closed sets. The "closure" of a set is defined as the union of the set and its derived set ($\\bar{S} = S \\cup S'$).
  * **Dense Sets**: Explains that a subset $A$ is dense in $\\mathfrak{R}$ if its closure equals $\\mathfrak{R}$ ($\\bar{A} = \\mathfrak{R}$), meaning every real number is a limit point of that subset.

### Module 3: Sequences

This module details how ordered lists of numbers behave as they progress toward infinity.

  * **Convergence of Sequences**: Introduces the formal definition of convergence using the $\\epsilon$-definition ($|x\_n - x| \< \\epsilon, \\forall n \> N$) to establish a limit point.
  * **Properties of Sequences**: Proves core sequence theorems, including the uniqueness of limits and the rule that every convergent sequence must be bounded. It outlines the algebraic limit laws for the addition, scalar multiplication, multiplication, and division of sequences.
  * **Subsequences**: Focuses on subsets of sequences chosen via an increasing sequence of indices. It outlines the theorem that a sequence converges if and only if every subsequence converges to the same limit.
  * **Cauchy Sequences**: Focuses on sequences where the terms become arbitrarily close to each other ($|x\_m - x\_n| \< \\epsilon, \\forall m, n \> N$). It details the relationship that all convergent sequences are Cauchy sequences.
  * **Monotonic Sequences**: Covers monotonic increasing ($x\_n \\le x\_n+1$) and monotonic decreasing ($x\_n \\ge x\_n+1$) sequences, proving that a monotonic sequence converges if and only if it is bounded.
  * **Limit Superior and Limit Inferior**: Defines the $\\limsup$ and $\\liminf$ of bounded sequences by identifying the supremum and infimum of the set of all subsequential limits.

### Module 4: Series

This module shifts from sequences to infinite series, looking at the summation of infinitely many terms and evaluating whether the total sum is finite.

  * **Introduction to Infinite Series**: Entails calculating the $n^{\\text{th}}$ partial sum ($S\_n = \\sum\_{i=1}^n a\_i$). A series converges if the sequence of partial sums converges.
  * **Special Series Rules**: Includes specific convergence benchmarks for Geometric Series (converges if common ratio $|r| \< 1$) and P-series (converges if $p \> 1$, diverges if $p \\le 1$, which includes the divergent harmonic series where $p=1$).
  * **$n^{\\text{th}}$ Term Divergence Test**: Establishes that if a series converges, the limit of its individual terms must equal 0 ($\\lim\_{n\\to\\infty} a\_n = 0$); conversely, if the limit does not equal 0, the series diverges.
  * **Convergence Tests**: Entails the execution of several distinct testing procedures to classify non-negative series:
      * *The Integral Test*: Evaluates convergence by matching the series to a continuous, positive, decreasing function integrated to infinity ($\\int\_{1}^{\\infty} f(x)dx$).
      * *The Comparison Test*: Direct mathematical comparison against known convergent or divergent series.
      * *D'Alembert's Ratio Test*: Evaluates factorials and growth by taking the limit of $\\lim\_{n\\to\\infty} |a\_{n+1}/a\_n|$.
      * *Cauchy's Root Test*: Evaluates exponential terms by looking at the limit of the $n^{\\text{th}}$ root ($\\lim\_{n\\to\\infty} \\sqrt\[n\]{a\_n}$).
      * *Alternating Series Test (Leibniz's Theorem)*: Evaluates series that alternate between positive and negative values, requiring a decreasing sequence of positive terms where $\\lim\_{n\\to\\infty} a\_n = 0$.
  * **Absolute vs. Conditional Convergence**: Distinguishes between series that converge even when taking the absolute value of their terms ($\\sum |a\_n|$), versus conditionally convergent series that converge in their given alternating format but diverge when absolute values are applied.

### Module 5: Countable and Uncountable Sets

This module looks at set cardinality and sizes of infinity.

  * **Countable Sets**: Focuses on sets whose elements can be placed in a 1-1 correspondence with the set of natural numbers ($N$), listing them as an infinite sequence. Examples include the set of all even/odd numbers and the set of all integers ($Z$). It proves that a subset of a countable set is countable, and a sequence of countable sets retains countability under a union.
  * **Uncountable Sets**: Details sets that are too large to maintain a 1-1 mapping with natural numbers. It provides a contradiction proof showing that the set of real numbers ($\\mathfrak{R}$) is uncountable.

### Module 6: Functions

The final module applies the rigorous topological and sequential properties established in prior modules directly to real-valued functions.

  * **Limits of Functions**: Introduces the formal $\\epsilon$-$\\delta$ limit definition, stating that a function has a limit $L$ at point $a$ if $|f(x) - L| \< \\epsilon$ whenever $|x - a| \< \\delta$. It covers standard algebraic limit properties and one-sided limits (evaluating the function exclusively from the left $x \\to a^-$ or right $x \\to a^+$).
  * **Pointwise Continuity**: Defines a function as continuous at a specific point $a$ if the limit exists and exactly equals the function's evaluation at that point ($\\lim\_{x\\to a} f(x) = f(a)$). It introduces points of discontinuity where this criterion fails.
  * **Uniform Continuity**: Distinguishes itself from pointwise continuity by requiring a single, uniform $\\delta$ value that depends *only* on $\\epsilon$, working universally across the entire domain set $S$ rather than varying point-by-point ($|f(x) - f(y)| \< \\epsilon$ whenever $|x - y| \< \\delta$ for all $x, y \\in S$). It also entails techniques for showing when a function is *not* uniformly continuous on an interval.


---

# SMA330: Numerical Analysis I
Based on the provided course material, here is the complete list of topics, modules, and what each entails for the course **SMA 330: Numerical Analysis I**:

### Course Introduction & Goals

The module introduces learners to continuous mathematics algorithms using numerical approximations. The overall goal is to design and analyze techniques that provide approximate but accurate solutions to complex problems using simple arithmetic operations.

-----

### Lecture & Lesson Modules

  * **Lesson 1: Errors and Approximation in Numerical Computations**
      * **What it entails:** Introduces the core concepts of errors, including how round-off errors occur due to finite machine memory. It covers chopping, truncating, symmetric rounding, and calculations for absolute, relative, and percentage errors, alongside methods to minimize them.
  * **Lesson 2: Propagation of Errors in Computation**
      * **What it entails:** Explains propagated errors, which are cumulative errors resulting from arithmetic operations (+, -, ×, ÷) on numbers that already have initial errors. It details how to calculate maximum error bounds and minimize accumulated error during successive computations.
  * **Lesson 3: Polynomials and Synthetic Division**
      * **What it entails:** Explores approximation by polynomials and expressing them in alternative equivalent layouts, such as the nested form, to reduce computational error. It teaches synthetic division as an economical algorithm to easily evaluate polynomial function values and remainders.
  * **Lesson 4: Interpolation and Polynomial Approximation**
      * **What it entails:** Focuses on using polynomials as substitutes for complex functions. It covers the Weierstrass Approximation Theorem, the limitations of Taylor polynomials over larger intervals, and the derivation of collocation polynomials using the Lagrange interpolation formula.
  * **Lesson 5: Finite Differences**
      * **What it entails:** Discusses interpolation techniques for discrete data points that are equally spaced. It covers defining and constructing tables for forward, backward, and central differences, and demonstrates how to use these tables to detect and correct single data errors or misprints.
  * **Lesson 6: Newton's Forward and Backward Interpolation Formulae**
      * **What it entails:** Details the process of constructing collocation polynomials for equally spaced discrete data points. It applies finite differences and factorial polynomials directly to Newton's interpolation summation formulas to calculate specific hidden function values.
  * **Lesson 7: Numerical Differentiation**
      * **What it entails:** Teaches numerical methods to approximate first, second, and higher-order derivatives, which is especially useful when functions are highly complicated or given purely in a tabular format. It covers extracting derivatives via finite differences and tracking the accuracy/truncation errors involved.
  * **Lesson 8: Numerical Integration**
      * **What it entails:** Addresses how to integrate functions that are explicitly difficult or presented only in graphical or tabular forms. It focuses on dividing areas into equal strips using Newton-Cotes formula bases, specifically implementing the Trapezoidal rule and Simpson's rule to evaluate definite integrals and bound their generated errors.
  * **Lesson 9: Composite Formulae and Romberg Integration**
      * **What it entails:** Teaches how simple Newton-Cotes integration rules fail over large intervals and details the usage of composite (piecewise) integration formulas. It covers the Romberg integration algorithm, which generates a triangular array of recursive trapezoidal estimations and applies Richardson extrapolation to successively refine accuracy.
  * **Lesson 10: Quadrature Methods**
      * **What it entails:** Introduces a family of numerical integration methods that rely on derived "nodes" and "weights" instead of equally spaced lines. It covers the Method of Undetermined Coefficients, the Gauss-Legendre 3-point formula, and applying linear transformations to shift an integral's interval into a standard Gaussian calculation range.
  * **Lesson 11: Iteration Techniques for Non-Linear Equations**
      * **What it entails:** Focuses on locating the roots/zeros of explicit polynomial or implicit transcendental equations where $f(x)=0$. It compares direct exact methods against iterative mathematical sequences, establishes stopping criteria for predefined error tolerances, and heavily details the step-by-step logic of the Bisection Method via the Intermediate Value Theorem.
  * **Lesson 12: Newton-Raphson and Secant Method**
      * **What it entails:** Dives into advanced iterative methods for optimizing and finding successive approximations to real-valued function roots. It teaches the construction of recursive tangent-slope definitions under the Newton-Raphson method, details how to measure its rate of convergence, and explains why starting sufficiently close to the desired root is crucial for quick stabilization.

---
# SMA335: Ordinary Differential Equations I

### Lesson 1: Differential Equations and Their Solutions

  * **Introduction to Ordinary Differential Equations (ODEs):** Core definitions, principles, and examples of ODEs versus partial differential equations (PDEs).
  * **Order and Degree:** Defining and identifying the order (highest derivative present) and degree (power of the highest derivative) of differential equations.
  * **Solutions of ODEs:** Differentiating between and finding general solutions (which contain arbitrary constants) and particular solutions (where specific values are assigned to constants).
  * **Forming Differential Equations:** Creating equations by expressing scientific relationships or by eliminating arbitrary constants from a primitive equation.

### Lesson 2: Equations of First Order - Variables Separable and Homogeneous Equations

  * **Method of Separation of Variables:** Solving first-order linear equations by transforming them into a format where variables can be integrated on separate sides of the equation ($g(y)dy = f(x)dx$).
  * **Homogeneous Differential Equations:** Defining homogeneous functions of degree zero and utilizing the substitution $y = vx$ (and its derivative $\\frac{dy}{dx} = v + x\\frac{dv}{dx}$) to reduce them to a separable form.
  * **Equations Reducible to Homogeneous Form:** Transforming non-homogeneous first-order equations of the type $\\frac{dy}{dx} = \\frac{ax+by+c}{px+qy+r}$ into homogeneous equations using linear coordinate shifts ($x=X+h, y=Y+k$) or substitution ($z = ax+by$).

### Lesson 3: First Order Exact Equations and Integrating Factors

  * **Exact Differential Equations:** Defining exact equations and establishing the necessary and sufficient condition ($\\frac{\\partial M}{\\partial y} = \\frac{\\partial N}{\\partial x}$) for the equation $Mdx + Ndy = 0$ to be exact.
  * **Solution Method:** Step-by-step resolution of exact equations via partial integration to find the underlying function $F(x,y) = \\text{constant}$.
  * **Integrating Factors (I.F.):** Defining and applying integrating factors ($\\phi(x,y)$) to multiply across non-exact equations to make them exact, utilizing standard rules based on functions of $x$ alone ($e^{\\int f(x)dx}$) or $y$ alone ($e^{\\int -g(y)dy}$).

### Lesson 4: First Order Linear Equations and Equations Reducible to This Form (Bernoulli's Equations)

  * **First Order Linear Equations:** Formulating and solving standard linear equations of the form $\\frac{dy}{dx} + Py = Q$ (where $P$ and $Q$ are functions of $x$) using the Integrating Factor $e^{\\int Pdx}$.
  * **Bernoulli's Equations:** Identifying equations of the form $\\frac{dy}{dx} + Py = Qy^n$ and applying the transformation $v = y^{-(n-1)}$ to reduce them to standard first-order linear equations.

### Lesson 5: Second Order Homogeneous Linear Equations with Constant Coefficients

  * **Definitions and Classifications:** Differentiating between homogeneous and non-homogeneous second-order equations, as well as distinguishing linear equations from non-linear equations based on derivative degrees and coefficients.
  * **Operator Notation:** Introducing $D$-notation ($D = \\frac{d}{dx}, D^2 = \\frac{d^2}{dx^2}$) to represent equations as $f(D)y = 0$.
  * **Characteristic/Auxiliary Equations:** Finding the auxiliary equation $a\_0m^2 + a\_1m + a\_2 = 0$ by testing the exponential solution $y = e^{mx}$.
  * **Root Classifications for General Solutions:** Resolving equations based on three distinct behaviors of auxiliary roots:
      * *Real and Distinct Roots* ($m\_1, m\_2$): $y = c\_1e^{m\_1x} + c\_2e^{m\_2x}$.
      * *Real and Repeated Roots* ($m, m$): $y = c\_1e^{mx} + c\_2xe^{mx}$.
      * *Complex Conjugate Roots* ($a \\pm ib$): $y = e^{ax}(c\_1\\cos bx + c\_2\\sin bx)$.
  * **Higher-Order Extensions:** Extending these auxiliary root methods to solve 3rd, 4th, and higher-order homogeneous equations.

### Lesson 6: Second Order Nonhomogeneous Linear Equations with Constant Coefficients

  * **Structure of the General Solution:** Establishing that solutions for equations of the form $f(D)y = Q(x)$ are comprised of a Complementary Function ($y\_c$, solving the homogeneous state) and a Particular Integral ($y\_p$).
  * **Finding Particular Integrals (Method 1):** Factorizing the differential operator $F(D) = (D-m\_1)(D-m\_2)$ and solving successively via linear first-order steps using the integral equation $\\frac{Q(x)}{D-a} = e^{ax}\\int e^{-ax}Q(x)dx$.

### Lesson 7: Determination of Particular Integrals Using Short Methods

  * **Short Methods for Specific $Q(x)$ Functions:** Determining the Particular Integral ($y = \\frac{Q}{f(D)}$) efficiently depending on the format of the non-homogeneous term:
      * *Exponential Form* ($e^{ax}$): Substituting $D = a$ if $f(a) \\neq 0$; or applying $\\frac{x^re^{ax}}{r\!}$ if $f(a) = 0$.
      * *Trigonometric Form* ($\\sin(ax+b)$ or $\\cos(ax+b)$): Replacing $D^2$ with $-a^2$.
      * *Polynomial Form* ($x^n$): Expanding $\[f(D)\]^{-1}$ using the Binomial theorem up to the $D^n$ term to operate on $x^n$.
      * *Product with Exponential* ($e^{ax}u$): Shifting the operator via $e^{ax}\\big\[\\frac{u}{f(D+a)}\\big\]$.
      * *Product with $x$* ($xu$): Applying the identity $x\\frac{1}{f(D)}u - \\frac{f'(D)}{\[f(D)\]^2}u$.

### Lesson 8: Second Order Equations with Variable Coefficients

  * **General Form:** Introducing second-order equations where the coefficients are functions of $x$ ($\\frac{d^2y}{dx^2} + P\\frac{dy}{dx} + Qy = R$).
  * **Method I: Changing the Independent Variable:** Transforming the equation into one with constant coefficients by choosing a new variable $z$ such that $(\\frac{dz}{dx})^2 = Q$ or $k f(x)$.
  * **Method II: Removal of the First Derivative (Normal Form):** Eliminating the $\\frac{dy}{dx}$ term via the substitution $y = uv$, where $u = e^{-\\frac{1}{2}\\int Pdx}$, reducing the expression to $\\frac{d^2v}{dx^2} + Sv = T$.

### Lesson 9: Linear Equations of Order $n$

  * **General $n^{\\text{th}}$-Order Equations:** Expanding solution processes (Complementary Function + Particular Integral) to general higher-order equations.
  * **Cauchy-Euler Equation:** Recognizing and solving equations of the form $x^n \\frac{d^ny}{dx^n} + a\_1x^{n-1}\\frac{d^{n-1}y}{dx^{n-1}} + \\dots + a\_ny = f(x)$ by changing the independent variable via $x = e^z$ (or utilizing $y = x^m$ if homogeneous).
  * **Legendre's Linear Equation:** Solving general versions of the Cauchy-Euler type structured as $(ax+b)^n \\frac{d^ny}{dx^n} + \\dots + a\_ny = f(x)$ using the substitution $(ax+b) = e^z$.

### Lesson 10: Reduction of $n^{\\text{th}}$ Order Equations to a First Order System of $n$ Equations and Solving the System

  * **System Reduction:** Introducing new variables ($y' = u, u' = v, v' = w$, etc.) to break down a single $n^{\\text{th}}$-order linear equation into a simultaneous system of $n$ first-order equations.
  * **Matrix Representation:** Translating systems into matrix equations ($X' = AX$ for homogeneous or $X' = AX + B$ for non-homogeneous systems).
  * **Matrix Algebra Solutions:** Computing the characteristic equation ($|A - mI| = 0$), Eigenvalues, and Eigenvectors of an $n \\times n$ matrix to construct the general system solutions:
      * *Real and Distinct Eigenvalues:* Solved via $X = c\_1v\_1e^{m\_1t} + c\_2v\_2e^{m\_2t} + \\dots$.
      * *Real and Repeated Eigenvalues:* Solved using a combination of $te^{mt}$ and auxiliary vector determinations.
      * *Complex Conjugate Eigenvalues:* Separated into real and imaginary parts using Euler's notation ($e^{i\\theta} = \\cos\\theta + i\\sin\\theta$).
      * *Non-homogeneous Systems:* Determining the particular vector solution $X\_p$ using the vector function $B$.

### Lesson 11: Singular Points of Differential Equations and Power Series Solutions Near Singular Points

  * **Normalized Form & Analyticity:** Defining the normalized form of a second-order equation ($\\frac{d^2y}{dx^2} + p\_1(x)\\frac{dy}{dx} + p\_2(x)y = 0$) and the analyticity of its coefficient functions.
  * **Classification of Points:** Learning to isolate and categorize points into:
      * *Ordinary Points:* Where both $p\_1$ and $p\_2$ are analytic.
      * *Regular Singular Points:* Where $p\_1$ or $p\_2$ fail to be analytic, but both $(x-x\_0)p\_1$ and $(x-x\_0)^2p\_2$ remain analytic.
      * *Irregular Singular Points:* Where the regular singular criteria are violated.
  * **Existence and Nature of Solutions:** Determining what form of power series solution is guaranteed to exist near each point type (e.g., standard Taylor series vs. Frobenius series solutions $y = \\sum C\_n(x-x\_0)^{n+r}$).

### Lesson 12: Power Series Solutions of First and Second Order Equations

  * **First Order Power Series:** Evaluating the three existence and uniqueness conditions for a first-order series solution ($\\frac{dy}{dx} = f(x,y)$) and executing solutions using recurrence relations.
  * **Second Order Solutions at Ordinary Points:** Assuming a solution form $y = \\sum c\_nx^n$, computing its derivatives, substituting them into the variable-coefficient equation, and mapping constants through a recurrence relation.
  * **Solutions at Regular Singular Points:** Employing the Frobenius method ($y = \\sum c\_nx^{n+r}$), solving the resulting *indicial equation* for $r$, and mapping the constants to find independent series solutions.
  * **Non-homogeneous Series Extensions:** Applying power series solution mechanics to equations containing a non-zero $f(x)$ term.

### Lesson 13: Application of Differential Equations

  * **Mathematical Modeling:** Translating real-world physical and scientific principles into first- and second-order ODEs or systems.
  * **Growth and Decay:** Modeling population expansion and radioactive nuclear disintegration using first-order separable laws ($\\frac{dx}{dt} = \\pm kx$).
  * **Mixture Problems:** Using the flow balance relationship ($\\frac{dx}{dt} = \\text{Rate In} - \\text{Rate Out}$) to track substance quantities over time in uniform mixtures.
  * **Electric Circuits:** Applying Kirchhoff's Law to model first-order series circuits ($L\\frac{di}{dt} + Ri = E$) and second-order capacitor networks ($L\\frac{d^2q}{dt^2} + R\\frac{dq}{dt} + \\frac{q}{c} = E$).
  * **Elastic Springs:** Formulating interconnected spring-and-mass physics problems via simultaneous systems of homogeneous linear differential equations.

---
# SST301 Programming Language for Statistics I

| Module / Main Unit | Key Topics Included | What Each Topic Entails & Computational Focus |
| --- | --- | --- |
| **0. Course Overview & Introduction** | Course Scope, Textbooks & Assessment Criteria | Outlines assessment structure (Assignments 5%, Practicals 10%, CATs 15%, Examination 70%) and core topics: Linear Programming, Confidence Intervals, PCA, Quality Control, and Life Tables using R. |
| **1. Matrices in R** | Matrix Creation & Indexing | Constructing 2D arrays with `matrix()`, setting dimensions (`nrow`, `ncol`, `byrow`), assigning names via `rownames()` / `colnames()`, and subsetting rows and columns. |
|  | Matrix Arithmetic & Manipulations | Element-wise addition and multiplication (`*`), matrix cross-product (`%*%`), dimensions check (`dim()`), row/column sums (`rowSums`, `colSums`), and transposing with `t()`. |
|  | Linear Algebra Operations | Matrix inversion with `solve()`, computing determinants (`det()`), constructing diagonal and identity matrices via `diag()`, and finding eigenvalues/eigenvectors using `eigen()`. |
|  | Advanced Matrix Products | Calculating Kronecker / direct products of matrices of arbitrary compatible dimensions using `kronecker()`. |
| **2. Grouping, Loops & Control Structures** | Conditional Execution | Branching code logic using `if`, `else if`, `else`, and vectorized conditionals via `ifelse()`. |
|  | `for` Loops & Iteration | Iterating over numeric sequences, indexing through matrix rows/columns, batch plotting with `par(mfrow)`, and nested `for` loops. |
|  | Jump Statements | Controlling iteration flow with `break` (terminating the loop) and `next` (skipping to the next iteration). |
|  | `while` & `repeat` Loops | Executing conditional while loops (`while`) and unconditional infinite loops (`repeat`) with conditional break checks. |
| **3. User-Defined Functions** | Function Definition & Syntax | Writing custom functions with `function()`, handling arguments, return statements (`return()`), and packaging outputs as scalars, vectors, or `list` structures. |
| **4. Solutions of Systems of Linear Equations** | Systems Formulation & Geometry | Understanding matrix forms $Ax = b$ and $x = A^{-1}b$, consistency, intersection geometry (unique, infinite, no solution). |
|  | Computation via `matlib` | Solving linear systems in two and three unknowns using `Solve()`, visualizing with `plotEqn()`, displaying equations with `showEqn()`, and reducing to Echelon forms with `echelon()`. |
| **5. Differentiation & Integration of Univariate Functions** | Symbolic Differentiation | Defining symbolic expressions with `expression()` and computing first/second derivatives using `D()`. |
|  | Numerical & Analytical Integration | Finding anti-derivatives using `antiD()` (`mosaicCalc`) and calculating definite integrals over finite or infinite intervals using `integrate()`. |
| **6. Determining Roots of Equations & Optimization** | Univariate & Multivariate Root Finding | Searching intervals for roots using `uniroot()`, finding all roots with `uniroot.all()`, polynomial roots using `polyroot()`, and solving nonlinear systems using `multiroot()` (`rootSolve`). |
|  | Local Extrema & Stationary Points | First and second derivative tests ($dy/dx = 0$, $d^2y/dx^2$), finding local maxima/minima, and numerical optimization using `optimize()`. |
| **7. Pseudo-Random Number Generators & Simulation** | Distribution Function Families | Overview of the standard R prefixes: `r` (random generation), `d` (density/pmf), `p` (cumulative distribution), and `q` (quantiles). |
|  | Continuous Distributions | Simulating, plotting densities, and evaluating Uniform (`runif`), Normal (`rnorm`), Exponential (`rexp`), Student’s $t$ (`rt`), and Chi-square (`rchisq`) distributions. |
|  | Discrete Distributions | Simulating binary and event counts using the Binomial (`rbinom`) and Poisson (`rpois`) distributions. |
| **8. Hypothesis Testing** | Testing Framework | Formulating null ($H_0$) and alternative ($H_a$) hypotheses, calculating test statistics, interpreting $p$-values against significance level $\alpha$. |
|  | Parametric Testing (`t-test`) | Implementing Student’s $t$-test for comparing two sample means under normality assumptions. |

*(Note: Topics listed in the syllabus overview such as Linear Programming via Simplex, PCA, Quality Control Charts, and Life Tables are identified in the course syllabus scope, though detailed worked lecture notes for them follow later sections in the curriculum).*

---
# SST305:Theory of Estimation

  * **Lesson One: Concept of Estimation**
    
      * **Details:** Introduces the concept of parameter estimation using sample characteristics or statistics, distinguishing population characteristics (parameters, which are usually unknown) from sample characteristics (statistics, which are usually known). It covers the distinction between point estimation (utilizing sample information to arrive at a single number) and interval estimation (arriving at two numbers intended to enclose the parameter).

  * **Lesson Two: Properties of Point Estimators**
    
      * **Details:** Outlines the four properties of a "best" estimator according to R.A. Fisher: unbiasedness, consistency, efficiency, and sufficiency. This lesson specifically focuses on testing for unbiasedness (when the expected value of the estimator equals the parameter) and consistency (using Chebyshev's Inequality to evaluate the limits of probability as the sample size approaches infinity).

  * **Lesson Three: Sufficiency and Efficiency of an Estimator**
    
      * **Details:** Focuses on the remaining two properties of a good estimator. It defines sufficiency (where a statistic carries all the relevant population information originally contained in the sample) and explains how to test for it using conditional probabilities or the Factorization Theorem. It also defines efficiency, which provides a basis for choosing the estimator with the least variance among a class of unbiased estimators.

  * **Lesson Four: Methods of Point Estimation (Method of Moments)**
    
      * **Details:** Formally introduces methods for obtaining a point estimator, specifically focusing on the Method of Moments. This method operates on the assumption that sample moments provide good estimates of corresponding population moments, equating the r-th population moment to the r-th sample moment to solve for the desired parameters.

  * **Lesson Five: Method of Maximum Likelihood**
    
      * **Details:** Teaches how to obtain Maximum Likelihood Estimators (MLE). The principle consists of constructing a likelihood function from a random sample and finding the estimator value that maximizes the function by utilizing first and second derivatives.

  * **Lesson Six: Method of Least Squares**
    
      * **Details:** Covers the estimation of regression constants ($\\alpha$ and $\\beta$) by minimizing the sum of squared errors ($S = \\sum e\_i^2$) when the mean of a variable $Y$ varies linearly with $X$. It details solving these linear equations simultaneously both normally and via matrix notation.

  * **Lesson Seven: Method of Minimum Variance**
    
      * **Details:** Focuses on finding a Minimum Variance Unbiased Estimator (MVUE) or a Uniformly Minimum Variance Unbiased Estimator (UMVUE). It establishes the necessary and sufficient conditions for an MVUE to exist via likelihood functions, introduces the Schwartz inequality proof, explains Fishers Information, and details how to find the lower variance limit using the Cramer-Rao Inequality (CRI).

  * **Lesson Eight: Interval Estimation**
    
      * **Details:** Covers generating narrow confidence intervals (confidence limits) that enclose an unknown parameter with a high probability. Assuming a normal population, it walks through deriving and computing $100(1-\\alpha)%$ confidence intervals for the population mean ($\\mu$) and variance ($\\sigma^2$) under different scenarios: when $\\sigma^2$ is known or unknown, and when $\\mu$ is known or unknown.

  * **Lesson Nine: Interval Estimation: Confidence Intervals for the Difference Between Means of Two Independent Normal Distributions**
    
      * **Details:** Extends interval estimation to look at two independent populations ($X\_1$ and $X\_2$). It details how to derive and compute a $100(1-\\alpha)%$ confidence interval for the true mean difference ($\\mu\_1 - \\mu\_2$) under two primary cases: when the common variance ($\\sigma^2$) is known, and when $\\sigma^2$ is unknown (requiring a pooled sample variance estimator).

  * **Lesson Ten: Bayes Estimation**
    
      * **Details:** Introduces an estimation approach that treats the unknown parameter as a random variable itself rather than a fixed point. It entails defining the Mean Squared Error (MSE), distinguishing between loss functions (e.g., squared error or absolute error loss) and risk functions (average loss), and utilizing prior distributions alongside sample data to calculate the posterior distribution, Bayes risk, and the final Bayes estimator.


---
# SST101: Intro to Probability & Statistics (Retake)

  * **Lesson One: Definition of Statistics, Data Collection and Data Presentation Techniques**
    
      * **What it entails**: Introduces the fundamental science of data (descriptive vs. inferential statistics) and its essential elements like populations, variables, and samples. It outlines quantitative and qualitative data types, data collection methods (surveys, experiments, etc.), and visual presentation formats including discrete/grouped frequency tables, histograms, frequency polygons, and cumulative frequencies.

  * **Lesson Two: Measures of Central Tendency (Part 1)**
    
      * **What it entails**: Focuses on identifying a single central value to describe an entire data set. It covers calculating the arithmetic mean for both simple series and grouped frequency distributions. It also introduces advanced calculation practices like the assumed mean method and the coding method for grouped datasets.

  * **Lesson Three: Measures of Central Tendency (Part 2)**
    
      * **What it entails**: Continues exploring data location indicators by defining and computing the geometric mean and the harmonic mean. It details how to calculate the median, quartiles (lower and upper), deciles, and percentiles using mathematical formulas and graphical interpolation. Lastly, it teaches how to identify individual or bimodal modal values within distributions.

  * **Lesson Four: Measures of Dispersion**
    
      * **What it entails**: Covers techniques used to calculate the spread or variation of a data set. Topics include measuring absolute metrics like range, quartile deviation (semi-interquartile range), standard deviation, variance, and pooled/combined variance across multiple subgroups. It also teaches the Coefficient of Variation (C.V.) to mathematically compare consistency across distinct data groups.

  * **Lesson Five: Moments**
    
      * **What it entails**: Details how moments are used to mathematically describe the distinct characteristics of a distribution measured from a specific point. It teaches how to compute the $r$th moment about zero, about the mean, and about an assumed value $A$ for raw and grouped data formats. It also breaks down algebraic relations to transform raw moments into finalized mean moments up to the fourth power.

  * **Lesson Six: Skewness and Kurtosis**
    
      * **What it entails**: Focuses on analyzing distribution shapes. Skewness examines the direction of spread and lack of symmetry (positive/right vs. negative/left) measured through Karl Pearson's, Bowley's, Kelly's (Percentile), or Moment coefficients. Kurtosis measures the "peaked-ness" or flatness of a curve relative to a normal distribution, establishing metrics for leptokurtic, platykurtic, and mesokurtic distributions.

  * **Lesson Seven: Regression and Correlation Analysis**
    
      * **What it entails**: Explores bivariate distributions to study the links between two variables. Correlation metrics (including Karl Pearson's product-moment and Spearman's rank correlation coefficients for non-repeated/repeated items) are used to measure the strength of linear association. Regression analysis covers using the mathematical method of least squares to establish linear predictive equations ($Y$ on $X$ and $X$ on $Y$).

  * **Lesson Eight: Mutually Exclusive and Exhaustive Events; and Probability**
    
      * **What it entails**: Covers introductory probability theory based on set axioms. It explicitly defines disjoint (mutually exclusive) events and system-exhaustive events. It establishes basic probability rules, complement principles, De Morgan's laws, and charts random sampling scenarios using probability tree diagrams to contrast sampling with and without replacement.

  * **Lesson Nine: Conditional Probability, Independent Events and Bayes' Theorem**
    
      * **What it entails**: Breaks down conditional probability calculations ($P(A/E)$) alongside multiplication rules for compound instances. It outlines the mathematical criteria required to prove statistical independence between multiple sample space events. Finally, it introduces Bayes' Theorem for resolving posterior probabilities when evaluating defective item rates or random tracking conditions.
