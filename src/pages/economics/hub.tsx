import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { EconomicsBackground } from '@/components/backgrounds'

interface Viz {
    id: string
    title: string
    description: string
    to: string
}

interface TopicGroup {
    name: string
    visualizations: Viz[]
}

const topics: TopicGroup[] = [
    {
        name: 'Markets',
        visualizations: [
            { id: 'ppc', title: 'Production Possibilities Curve', description: 'Trade-offs, opportunity cost, and economic growth', to: '/economics/ppc' },
            { id: 'comparative', title: 'Comparative Advantage', description: 'Specialization, terms of trade, and gains from trade', to: '/economics/comparative' },
            { id: 'supply-demand', title: 'Market Equilibrium', description: 'Supply, demand, equilibrium, and determinants of shifts', to: '/economics/supply-demand' },
            { id: 'elasticity', title: 'Elasticity', description: 'PED, PES, cross-price, income elasticity, and total revenue test', to: '/economics/elasticity' },
            { id: 'externalities', title: 'Externalities', description: 'Market failure, deadweight loss, and Pigouvian corrections', to: '/economics/externalities' },
            { id: 'public-goods', title: 'Public Goods & Inequality', description: 'Free rider problem, Lorenz curve, and Gini coefficient', to: '/economics/public-goods' },
        ],
    },
    {
        name: 'Production',
        visualizations: [
            { id: 'costs', title: 'Production & Cost Curves', description: 'Short-run costs, diminishing returns, and profit maximization', to: '/economics/costs' },
            { id: 'long-run-costs', title: 'Long-Run Costs', description: 'Economies of scale, shutdown rule, and economic profit', to: '/economics/long-run-costs' },
        ],
    },
    {
        name: 'Competition',
        visualizations: [
            { id: 'market-structures', title: 'Market Structures', description: 'Perfect competition, monopoly, monopolistic competition, oligopoly', to: '/economics/market-structures' },
            { id: 'game-theory', title: 'Game Theory', description: 'Nash equilibrium, oligopoly, and strategic behavior', to: '/economics/game-theory' },
            { id: 'price-discrimination', title: 'Price Discrimination', description: '1st, 2nd, and 3rd degree price discrimination', to: '/economics/price-discrimination' },
            { id: 'labor-market', title: 'Labor Market', description: 'Labor supply, demand, wage determination, and MRP', to: '/economics/labor-market' },
            { id: 'monopsony', title: 'Monopsony', description: 'Monopsony power, MRP=MFC, and wage exploitation', to: '/economics/monopsony' },
        ],
    },
    {
        name: 'Macro Indicators',
        visualizations: [
            { id: 'circular-flow', title: 'Circular Flow Model', description: 'GDP, income approach, expenditure approach', to: '/economics/circular-flow' },
            { id: 'business-cycle', title: 'Business Cycle', description: 'Expansion, peak, contraction, trough, and indicators', to: '/economics/business-cycle' },
            { id: 'economic-indicators', title: 'Economic Indicators', description: 'CPI, unemployment types, real vs nominal GDP', to: '/economics/economic-indicators' },
            { id: 'ad-as', title: 'AD-AS Model', description: 'Aggregate demand, short-run & long-run aggregate supply', to: '/economics/ad-as' },
        ],
    },
    {
        name: 'Policy',
        visualizations: [
            { id: 'fiscal-policy', title: 'Fiscal Policy', description: 'Multipliers, crowding out, and automatic stabilizers', to: '/economics/fiscal-policy' },
            { id: 'monetary-policy', title: 'Monetary Policy', description: 'OMO, reserve requirements, discount rate, and transmission', to: '/economics/monetary-policy' },
            { id: 'money', title: 'Money Multiplier', description: 'Fractional reserve banking and money creation', to: '/economics/money' },
            { id: 'money-market', title: 'Money Market', description: 'Money supply, demand, and nominal interest rate', to: '/economics/money-market' },
            { id: 'loanable-funds', title: 'Loanable Funds', description: 'Savings, investment, and real interest rate', to: '/economics/loanable-funds' },
            { id: 'interest', title: 'Compound Interest', description: 'Time value of money and present value', to: '/economics/interest' },
            { id: 'phillips', title: 'Phillips Curve', description: 'Inflation-unemployment tradeoff, NAIRU, expectations', to: '/economics/phillips' },
            { id: 'economic-growth', title: 'Economic Growth', description: 'PPC shifts, capital, human capital, technology, and Rule of 70', to: '/economics/economic-growth' },
        ],
    },
    {
        name: 'International',
        visualizations: [
            { id: 'forex', title: 'Foreign Exchange', description: 'Currency markets, appreciation, depreciation', to: '/economics/forex' },
            { id: 'balance-of-payments', title: 'Balance of Payments', description: 'Current account, capital account, and trade flows', to: '/economics/balance-of-payments' },
        ],
    },
]

export default function EconomicsHub() {
    return (
        <div className="min-h-screen relative bg-bg">
            <EconomicsBackground className="opacity-40" />

            <div className="relative z-10 px-5 sm:px-8 py-10 sm:py-14 max-w-6xl mx-auto">
                <motion.header
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-text mb-1">
                        Economics
                    </h1>
                    <p className="text-text-secondary text-sm">
                        Markets, production, competition, macro indicators, policy, and trade
                    </p>
                </motion.header>

                <div className="space-y-10">
                    {topics.map((group, gi) => (
                        <motion.section
                            key={group.name}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: gi * 0.08 }}
                        >
                            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">
                                {group.name}
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {group.visualizations.map((viz) => (
                                    <Link key={viz.id} to={viz.to} className="group block">
                                        <div className="bg-bg-elevated rounded-[--radius-lg] p-4 shadow-[--shadow-sm] transition-all duration-200 hover:shadow-[--shadow-md] hover:-translate-y-0.5">
                                            <h3 className="text-sm font-medium text-text mb-1 group-hover:text-text transition-colors">
                                                {viz.title}
                                            </h3>
                                            <p className="text-text-secondary text-xs leading-relaxed">
                                                {viz.description}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </motion.section>
                    ))}
                </div>
            </div>
        </div>
    )
}
