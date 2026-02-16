import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsBackground } from '@/components/backgrounds'
import { ControlPanel, ControlGroup, Slider, Button, Toggle, ButtonGroup } from '@/components/control-panel'
import { EquationDisplay } from '@/components/equation-display'
import { InfoPanel, APTag } from '@/components/info-panel'
import { DemoMode, useDemoMode } from '@/components/demo-mode'
import type { DemoStep } from '@/components/demo-mode'

const PURPLE = 'rgb(168, 85, 247)'

export default function DampedDrivenOscillator() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [mass, setMass] = useState(1.0)
    const [k, setK] = useState(10.0)
    const [damping, setDamping] = useState(0.5)
    const [driveAmp, setDriveAmp] = useState(5.0)
    const [driveFreq, setDriveFreq] = useState(3.0)
    const [mode, setMode] = useState('driven')
    const [showResonanceCurve, setShowResonanceCurve] = useState(false)
    const [showPhaseSpace, setShowPhaseSpace] = useState(false)

    const stateRef = useRef({ x: 50, v: 0, t: 0 })
    const historyRef = useRef<{ t: number; x: number; v: number }[]>([])
    const animRef = useRef<number>(0)

    const w0 = Math.sqrt(k / mass)
    const gamma = damping / (2 * mass)
    const Q = w0 / (2 * gamma || 1)
    const steadyAmp = driveAmp / Math.sqrt(
        Math.pow(k - mass * driveFreq * driveFreq, 2) + Math.pow(damping * driveFreq, 2)
    )

    const reset = useCallback(() => {
        stateRef.current = { x: 50, v: 0, t: 0 }
        historyRef.current = []
        setIsRunning(false)
        if (animRef.current) cancelAnimationFrame(animRef.current)
    }, [])

    const demoSteps: DemoStep[] = [
        {
            title: 'Simple Harmonic Motion',
            description: 'Start with a mass on a spring. The restoring force F = -kx pulls the mass back toward equilibrium, creating oscillation.',
            setup: () => { setMode('free'); setK(10); setDamping(0); setDriveAmp(0); setMass(1); reset() },
        },
        {
            title: 'Natural Frequency',
            description: 'The natural frequency omega_0 = sqrt(k/m) depends only on the spring constant and mass. Try changing k to see it update.',
            setup: () => { setMode('free'); setK(20); setDamping(0); setMass(1); reset() },
        },
        {
            title: 'Damping Effects',
            description: 'Real oscillators lose energy to friction. The damping coefficient b controls how quickly amplitude decays.',
            setup: () => { setMode('damped'); setK(10); setDamping(1.5); setDriveAmp(0); setMass(1); reset() },
        },
        {
            title: 'Quality Factor',
            description: 'The Q-factor measures how "sharp" the resonance is. High Q means low damping and many oscillations before energy loss.',
            setup: () => { setMode('damped'); setK(10); setDamping(0.3); setMass(1); reset() },
        },
        {
            title: 'Driven Oscillation',
            description: 'Apply an external periodic force F_0 cos(omega_d t). The system eventually oscillates at the driving frequency.',
            setup: () => { setMode('driven'); setK(10); setDamping(0.5); setDriveAmp(5); setDriveFreq(2); setMass(1); reset() },
        },
        {
            title: 'Resonance!',
            description: 'Set the drive frequency equal to the natural frequency. The amplitude grows dramatically -- this is resonance!',
            setup: () => { setMode('driven'); setK(10); setDamping(0.5); setDriveAmp(5); setDriveFreq(Math.sqrt(10)); setMass(1); reset() },
        },
        {
            title: 'Resonance Curve',
            description: 'Toggle the resonance curve to see how amplitude varies with drive frequency. The peak is at omega_0.',
            setup: () => { setShowResonanceCurve(true); setMode('driven'); setK(10); setDamping(0.5); setDriveAmp(5); setMass(1); reset() },
        },
        {
            title: 'Phase Space',
            description: 'The phase space plot shows position vs velocity. SHM traces an ellipse; driven motion can be more complex.',
            setup: () => { setShowPhaseSpace(true); setShowResonanceCurve(false); setMode('driven'); reset() },
        },
    ]

    const demo = useDemoMode(demoSteps)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const resize = () => {
            const dpr = window.devicePixelRatio || 1
            canvas.width = canvas.offsetWidth * dpr
            canvas.height = canvas.offsetHeight * dpr
            ctx.scale(dpr, dpr)
        }
        resize()
        window.addEventListener('resize', resize)

        let lastTime = performance.now()

        const animate = () => {
            const now = performance.now()
            const dt = Math.min((now - lastTime) / 1000, 0.05)
            lastTime = now

            const w = canvas.offsetWidth
            const h = canvas.offsetHeight

            if (isRunning) {
                const s = stateRef.current
                const Fs = -k * s.x
                const Fd = -damping * s.v
                const isDriven = mode === 'driven'
                const Fext = isDriven ? driveAmp * Math.cos(driveFreq * s.t) : 0
                const a = (Fs + Fd + Fext) / mass

                s.v += a * dt
                s.x += s.v * dt
                s.t += dt

                if (historyRef.current.length === 0 || s.t - historyRef.current[historyRef.current.length - 1].t > 0.05) {
                    historyRef.current.push({ t: s.t, x: s.x, v: s.v })
                    if (historyRef.current.length > 200) historyRef.current.shift()
                }
            }

            // --- DRAW ---
            ctx.clearRect(0, 0, w, h)
            const cx = w / 2
            const cy = h * 0.4
            const scale = 3

            const x_px = stateRef.current.x * scale

            // Spring coil
            ctx.beginPath()
            ctx.moveTo(0, cy)
            const segments = 20
            const springEnd = cx + x_px - 20
            for (let i = 0; i <= segments; i++) {
                const sx = (i / segments) * springEnd
                const sy = cy + (i % 2 === 0 ? -10 : 10) * (i === 0 || i === segments ? 0 : 1)
                ctx.lineTo(sx, sy)
            }
            ctx.strokeStyle = '#94a3b8'
            ctx.lineWidth = 2
            ctx.stroke()

            // Mass block
            ctx.fillStyle = PURPLE
            ctx.shadowColor = PURPLE
            ctx.shadowBlur = 20
            ctx.fillRect(cx + x_px - 20, cy - 20, 40, 40)
            ctx.shadowBlur = 0

            // Equilibrium line
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            ctx.moveTo(cx, cy - 50)
            ctx.lineTo(cx, cy + 50)
            ctx.stroke()
            ctx.setLineDash([])

            // Wall
            ctx.fillStyle = '#475569'
            ctx.fillRect(0, cy - 50, 10, 100)

            // Resonance indicator
            if (mode === 'driven') {
                const ratio = driveFreq / w0
                if (Math.abs(ratio - 1.0) < 0.1) {
                    ctx.fillStyle = '#ef4444'
                    ctx.font = 'bold 16px sans-serif'
                    ctx.textAlign = 'center'
                    ctx.fillText('RESONANCE!', cx, cy - 60)
                }
            }

            // Position vs Time graph
            const gx = 30
            const gy = h - 30
            const gw = showResonanceCurve || showPhaseSpace ? w * 0.45 : w - 60
            const gh = h * 0.35

            ctx.fillStyle = 'rgba(0,0,0,0.4)'
            ctx.fillRect(gx - 10, gy - gh - 10, gw + 20, gh + 20)

            ctx.strokeStyle = 'rgba(255,255,255,0.2)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(gx, gy - gh / 2)
            ctx.lineTo(gx + gw, gy - gh / 2)
            ctx.stroke()

            if (historyRef.current.length > 1) {
                ctx.strokeStyle = PURPLE
                ctx.lineWidth = 2
                ctx.beginPath()
                historyRef.current.forEach((pt, i) => {
                    const px = gx + (i / historyRef.current.length) * gw
                    const py = (gy - gh / 2) - (pt.x / 100) * (gh / 2)
                    if (i === 0) ctx.moveTo(px, py)
                    else ctx.lineTo(px, py)
                })
                ctx.stroke()
            }

            ctx.fillStyle = 'rgba(255,255,255,0.5)'
            ctx.font = '11px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('x(t) -- Position vs Time', gx + gw / 2, gy + 5)

            // Resonance Curve (Amplitude vs Frequency)
            if (showResonanceCurve) {
                const rcx = w * 0.55
                const rcy = gy
                const rcw = w * 0.4
                const rch = gh

                ctx.fillStyle = 'rgba(0,0,0,0.4)'
                ctx.fillRect(rcx - 10, rcy - rch - 10, rcw + 20, rch + 20)

                const wMin = 0.5
                const wMax = w0 * 3
                let maxAmpVal = 0
                for (let i = 0; i <= 200; i++) {
                    const ww = wMin + (i / 200) * (wMax - wMin)
                    const amp = driveAmp / Math.sqrt(
                        Math.pow(k - mass * ww * ww, 2) + Math.pow(damping * ww, 2)
                    )
                    if (amp > maxAmpVal) maxAmpVal = amp
                }

                ctx.strokeStyle = 'rgba(168,85,247,0.8)'
                ctx.lineWidth = 2
                ctx.beginPath()
                for (let i = 0; i <= 200; i++) {
                    const ww = wMin + (i / 200) * (wMax - wMin)
                    const amp = driveAmp / Math.sqrt(
                        Math.pow(k - mass * ww * ww, 2) + Math.pow(damping * ww, 2)
                    )
                    const px = rcx + (i / 200) * rcw
                    const py = rcy - (amp / (maxAmpVal || 1)) * rch * 0.9
                    if (i === 0) ctx.moveTo(px, py)
                    else ctx.lineTo(px, py)
                }
                ctx.stroke()

                // Current drive freq marker
                const markerX = rcx + ((driveFreq - wMin) / (wMax - wMin)) * rcw
                ctx.strokeStyle = '#ef4444'
                ctx.setLineDash([3, 3])
                ctx.beginPath()
                ctx.moveTo(markerX, rcy)
                ctx.lineTo(markerX, rcy - rch)
                ctx.stroke()
                ctx.setLineDash([])

                ctx.fillStyle = 'rgba(255,255,255,0.5)'
                ctx.font = '11px sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText('Amplitude vs Drive Frequency', rcx + rcw / 2, rcy + 5)
            }

            // Phase Space
            if (showPhaseSpace && !showResonanceCurve) {
                const psx = w * 0.55
                const psy = gy
                const psw = w * 0.4
                const psh = gh

                ctx.fillStyle = 'rgba(0,0,0,0.4)'
                ctx.fillRect(psx - 10, psy - psh - 10, psw + 20, psh + 20)

                ctx.strokeStyle = 'rgba(255,255,255,0.15)'
                ctx.lineWidth = 1
                ctx.beginPath()
                ctx.moveTo(psx + psw / 2, psy)
                ctx.lineTo(psx + psw / 2, psy - psh)
                ctx.stroke()
                ctx.beginPath()
                ctx.moveTo(psx, psy - psh / 2)
                ctx.lineTo(psx + psw, psy - psh / 2)
                ctx.stroke()

                if (historyRef.current.length > 1) {
                    ctx.strokeStyle = 'rgba(168,85,247,0.7)'
                    ctx.lineWidth = 1.5
                    ctx.beginPath()
                    historyRef.current.forEach((pt, i) => {
                        const px = psx + psw / 2 + (pt.x / 100) * (psw / 2)
                        const py = (psy - psh / 2) - (pt.v / 80) * (psh / 2)
                        if (i === 0) ctx.moveTo(px, py)
                        else ctx.lineTo(px, py)
                    })
                    ctx.stroke()
                }

                ctx.fillStyle = 'rgba(255,255,255,0.5)'
                ctx.font = '11px sans-serif'
                ctx.textAlign = 'center'
                ctx.fillText('Phase Space (x vs v)', psx + psw / 2, psy + 5)
            }

            animRef.current = requestAnimationFrame(animate)
        }

        animRef.current = requestAnimationFrame(animate)
        return () => {
            window.removeEventListener('resize', resize)
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
    }, [isRunning, mass, k, damping, driveAmp, driveFreq, w0, mode, showResonanceCurve, showPhaseSpace])

    return (
        <div className="min-h-screen flex flex-col bg-[#0f0a1a] text-white font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <PhysicsBackground />
            </div>

            {/* Navbar */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0f0a1a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/physics" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight">Damped Driven Oscillator</h1>
                        <APTag course="Physics C: Mech" unit="Unit 6" color={PURPLE} />
                    </div>
                </div>
                <Button variant="secondary" onClick={demo.open}>Tutorial</Button>
            </div>

            <div className="flex-1 relative flex">
                <div className="flex-1 relative">
                    <canvas ref={canvasRef} className="w-full h-full block" />

                    {/* Equation overlay */}
                    <div className="absolute top-4 left-4 z-10">
                        <EquationDisplay
                            departmentColor={PURPLE}
                            title="Oscillator Equations"
                            equations={[
                                { label: 'SHM', expression: 'x(t) = A cos(omega_0 t + phi)', description: 'Simple harmonic solution' },
                                { label: 'omega_0', expression: 'sqrt(k / m)', description: 'Natural angular frequency' },
                                { label: 'Driven', expression: 'F_0 cos(omega_d t)', description: 'External driving force' },
                                { label: 'EOM', expression: 'ma = -kx - bv + F_0 cos(omega_d t)', description: 'Full equation of motion' },
                            ]}
                        />
                    </div>

                    {/* Info panel overlay */}
                    <div className="absolute top-4 right-4 z-10">
                        <InfoPanel
                            departmentColor={PURPLE}
                            title="Live Values"
                            items={[
                                { label: 'omega_0', value: w0.toFixed(3), unit: 'rad/s' },
                                { label: 'omega_d', value: driveFreq.toFixed(3), unit: 'rad/s' },
                                { label: 'Q-factor', value: Q.toFixed(2), color: Q > 5 ? '#4ade80' : undefined },
                                { label: 'Steady Amp', value: steadyAmp.toFixed(3), unit: 'm' },
                                { label: 'Position', value: stateRef.current.x.toFixed(2), unit: 'm' },
                                { label: 'gamma', value: gamma.toFixed(3), unit: '1/s' },
                            ]}
                        />
                    </div>

                    {/* Demo overlay */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                        <DemoMode
                            steps={demoSteps}
                            currentStep={demo.currentStep}
                            isOpen={demo.isOpen}
                            onClose={demo.close}
                            onNext={demo.next}
                            onPrev={demo.prev}
                            onGoToStep={demo.goToStep}
                            departmentColor={PURPLE}
                        />
                    </div>
                </div>

                {/* Controls Sidebar */}
                <div className="w-80 bg-[#0f0a1a]/90 border-l border-white/10 p-6 flex flex-col gap-4 overflow-y-auto no-scrollbar z-20">
                    <ControlPanel>
                        <ButtonGroup
                            label="Mode"
                            value={mode}
                            onChange={setMode}
                            options={[
                                { value: 'free', label: 'Free' },
                                { value: 'damped', label: 'Damped' },
                                { value: 'driven', label: 'Driven' },
                            ]}
                            color={PURPLE}
                        />

                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    if (isRunning) { setIsRunning(false) }
                                    else { reset(); setIsRunning(true) }
                                }}
                                variant={isRunning ? 'secondary' : 'primary'}
                            >
                                {isRunning ? 'Stop' : 'Start'}
                            </Button>
                            <Button variant="secondary" onClick={reset}>Reset</Button>
                        </div>
                    </ControlPanel>

                    <ControlPanel>
                        <ControlGroup label="Parameters">
                            <Slider label="Mass (m)" value={mass} onChange={setMass} min={0.1} max={5} step={0.1} />
                            <Slider label="Spring Constant (k)" value={k} onChange={setK} min={1} max={50} step={1} />
                            {(mode === 'damped' || mode === 'driven') && (
                                <Slider label="Damping (b)" value={damping} onChange={setDamping} min={0} max={5} step={0.1} />
                            )}
                        </ControlGroup>

                        {mode === 'driven' && (
                            <ControlGroup label="Driving Force">
                                <Slider label="Drive Amplitude (F_0)" value={driveAmp} onChange={setDriveAmp} min={0} max={20} step={0.5} />
                                <Slider label="Drive Freq (omega_d)" value={driveFreq} onChange={setDriveFreq} min={0.5} max={10} step={0.1} />
                                <p className="text-xs text-purple-400">
                                    Resonance at omega_0 = {w0.toFixed(2)} rad/s
                                </p>
                            </ControlGroup>
                        )}
                    </ControlPanel>

                    <ControlPanel>
                        <ControlGroup label="Display">
                            <Toggle label="Resonance Curve" value={showResonanceCurve} onChange={setShowResonanceCurve} />
                            <Toggle label="Phase Space" value={showPhaseSpace} onChange={setShowPhaseSpace} />
                        </ControlGroup>
                    </ControlPanel>
                </div>
            </div>
        </div>
    )
}
