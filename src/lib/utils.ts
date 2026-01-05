import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function collatzSequence(n: number): number[] {
    const sequence: number[] = [n]
    while (n !== 1) {
        n = n % 2 === 0 ? n / 2 : 3 * n + 1
        sequence.push(n)
    }
    return sequence
}

export function gcd(a: number, b: number): { steps: Array<{ a: number; b: number; q: number; r: number }>; result: number } {
    const steps: Array<{ a: number; b: number; q: number; r: number }> = []
    while (b !== 0) {
        const q = Math.floor(a / b)
        const r = a % b
        steps.push({ a, b, q, r })
        a = b
        b = r
    }
    return { steps, result: a }
}

export function multiplyMatrices(a: number[][], b: number[][]): number[][] {
    const rowsA = a.length
    const colsA = a[0].length
    const colsB = b[0].length
    const result: number[][] = Array(rowsA).fill(null).map(() => Array(colsB).fill(0))

    for (let i = 0; i < rowsA; i++) {
        for (let j = 0; j < colsB; j++) {
            for (let k = 0; k < colsA; k++) {
                result[i][j] += a[i][k] * b[k][j]
            }
        }
    }
    return result
}

export function binarySearch(arr: number[], target: number): { steps: Array<{ left: number; right: number; mid: number; found: boolean }>; index: number } {
    const steps: Array<{ left: number; right: number; mid: number; found: boolean }> = []
    let left = 0
    let right = arr.length - 1

    while (left <= right) {
        const mid = Math.floor((left + right) / 2)
        const found = arr[mid] === target
        steps.push({ left, right, mid, found })

        if (found) return { steps, index: mid }
        if (arr[mid] < target) left = mid + 1
        else right = mid - 1
    }

    return { steps, index: -1 }
}

export function generateRandomArray(size: number, max: number = 100): number[] {
    return Array.from({ length: size }, () => Math.floor(Math.random() * max) + 1)
}

export function generateSortedArray(size: number, max: number = 100): number[] {
    return generateRandomArray(size, max).sort((a, b) => a - b)
}
