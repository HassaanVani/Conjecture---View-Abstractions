# Remaining Overhauls

12 existing visualizations still need the shared component treatment (DemoMode, EquationDisplay, InfoPanel, APTag).

Background agents are currently working on several of these — rebuild and recheck before starting manual work.

---

## What "overhaul" means

For each file, read the existing implementation, then add:
1. `EquationDisplay` — relevant equations in a collapsible panel
2. `InfoPanel` — real-time calculated values display
3. `APTag` — course and unit badge
4. `DemoMode` + `useDemoMode` — 7-8 step guided tutorial with `setup()` callbacks
5. Replace any inline controls with shared `ControlPanel` components (Slider, Toggle, Button, Select, ButtonGroup)
6. Add a Reset button
7. Keep under 600 lines

Imports to add:
```tsx
import { ControlPanel, ControlGroup, Slider, Button, Toggle, Select, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
```

---

## Files

### 1. `src/pages/physics/em/rlc.tsx`
- **APTag**: "AP Physics C: E&M | Unit 4"
- **Equations**: Z = sqrt(R^2 + (XL - XC)^2), omega_0 = 1/sqrt(LC), Q = omega_0*L/R
- **InfoPanel**: Impedance, resonant frequency, Q-factor, phase angle, power factor
- **DemoMode topics**: RLC basics, impedance, resonance, Q-factor, power, phasor diagram, frequency response, damping
- **Enhancements**: Resonance frequency indicator, impedance vs frequency plot, power factor display

### 2. `src/pages/economics/supply-demand.tsx`
- **Note**: Already has demo mode (gold standard at 1037 lines). Needs EquationDisplay and InfoPanel added, not a full rewrite.
- **APTag**: "AP Microeconomics | Unit 2"
- **Equations**: Qd = a - bP, Qs = c + dP, elasticity = (%dQ)/(%dP)
- **InfoPanel**: Equilibrium P/Q, consumer surplus, producer surplus, total surplus, elasticity at equilibrium
- **Approach**: Surgically add EquationDisplay + InfoPanel without disrupting existing demo mode

### 3. `src/pages/economics/business-cycle.tsx`
- **APTag**: "AP Macroeconomics | Unit 2"
- **Equations**: GDP gap = (Actual - Potential)/Potential, Okun's Law
- **InfoPanel**: Current phase, GDP gap %, unemployment estimate, trend growth
- **DemoMode topics**: What is the business cycle, expansion, peak, contraction, trough, GDP gap, leading indicators, policy responses

### 4. `src/pages/economics/ad-as.tsx`
- **APTag**: "AP Macroeconomics | Unit 3"
- **Equations**: AD shifts (C+I+G+NX), SRAS = f(input prices), LRAS at Y_f
- **InfoPanel**: Price level, real GDP, GDP gap, inflationary/recessionary gap size
- **DemoMode topics**: AD-AS model, AD curve, SRAS curve, LRAS, equilibrium, recessionary gap, inflationary gap, self-correction

### 5. `src/pages/economics/money-multiplier.tsx`
- **APTag**: "AP Macroeconomics | Unit 4"
- **Equations**: Money multiplier = 1/rr, Delta-Ms = multiplier * Delta-deposits
- **InfoPanel**: Reserve ratio, multiplier, initial deposit, total money created, excess reserves at each round
- **DemoMode topics**: Fractional reserve banking, reserve ratio, deposit expansion, multiplier formula, T-accounts, Fed tools, excess reserves, money supply effect

### 6. `src/pages/economics/phillips-curve.tsx`
- **APTag**: "AP Macroeconomics | Unit 5"
- **Equations**: SRPC tradeoff, LRPC at NRU, expectations-augmented: pi = pi_e - b(u - u_n)
- **InfoPanel**: Inflation rate, unemployment rate, NRU, expected inflation, sacrifice ratio
- **DemoMode topics**: Inflation-unemployment tradeoff, SRPC, movement along curve, LRPC, expectations, stagflation, disinflation, policy implications

### 7. `src/pages/economics/forex.tsx`
- **APTag**: "AP Macroeconomics | Unit 6"
- **Equations**: Exchange rate from S-D, appreciation/depreciation, net exports effect
- **InfoPanel**: Exchange rate, currency direction (appreciating/depreciating), net exports effect, capital flow direction
- **DemoMode topics**: Foreign exchange market, supply of currency, demand for currency, equilibrium rate, appreciation, depreciation, trade effects, capital flows

### 8. `src/pages/economics/compound-interest.tsx`
- **APTag**: "AP Macroeconomics | Unit 4"
- **Equations**: A = P(1 + r/n)^(nt), continuous: A = Pe^(rt), Rule of 72
- **InfoPanel**: Future value, total interest earned, doubling time, effective annual rate
- **DemoMode topics**: Simple vs compound, compounding frequency, exponential growth, Rule of 72, present value, continuous compounding, real vs nominal, time value of money

### 9. `src/pages/cs/binary-search.tsx`
- **APTag**: "AP CS A | Unit 7"
- **Equations**: Time complexity O(log n), comparisons <= floor(log2(n)) + 1
- **InfoPanel**: Array size, comparisons made, elements eliminated, current search range
- **DemoMode topics**: Sorted array prerequisite, divide and conquer, mid calculation, comparison, narrowing range, best/average/worst case, vs linear search, logarithmic growth

### 10. `src/pages/cs/graph-traversal.tsx`
- **APTag**: "AP CS A | Unit 10"
- **Equations**: BFS: O(V+E), DFS: O(V+E), shortest path (unweighted)
- **InfoPanel**: Nodes visited, edges explored, queue/stack size, path length
- **DemoMode topics**: Graph representation, BFS (level-order), BFS queue, DFS (depth-first), DFS stack/recursion, shortest path, connected components, BFS vs DFS comparison

### 11. `src/pages/math/collatz.tsx`
- **APTag**: "Mathematics | Number Theory"
- **Equations**: n -> n/2 (even), n -> 3n+1 (odd), conjecture: all sequences reach 1
- **InfoPanel**: Current value, sequence length, max value reached, total stopping time
- **DemoMode topics**: The conjecture, even rule, odd rule, sequence example, hailstone numbers, stopping time, open problem, tree of sequences

### 12. `src/pages/math/euclidean.tsx`
- **APTag**: "Mathematics | Number Theory"
- **Equations**: gcd(a,b) = gcd(b, a mod b), Bezout's identity: ax + by = gcd(a,b)
- **InfoPanel**: GCD result, number of steps, quotients, Bezout coefficients (x, y)
- **DemoMode topics**: What is GCD, division algorithm, Euclidean algorithm, step-through, geometric interpretation (rectangle subtraction), extended algorithm, Bezout's identity, applications (cryptography)
