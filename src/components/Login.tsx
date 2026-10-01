// Formulario de acceso que explica errores y cuentas suspendidas en línea.
import React, { useState } from 'react'
import { AVISO_SUSPENSION } from '../hooks/useSession'

export default function Login({ onClose, onLoginSuccess }: {
    onClose: () => void
    onLoginSuccess: () => void
}) {
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const apiUrl = import.meta.env.VITE_API_URL ?? ''
    const [error, setError] = useState('')
    const [enviando, setEnviando] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setEnviando(true)
        try {
            const res = await fetch(`${apiUrl}/api/login`, {
                method: 'POST',
                credentials: 'include', // El navegador conserva la cookie de sesión.
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: phone.trim(), phone: phone.trim(), password }),
            })
            const data = await res.json()
            if (res.ok) {
                onLoginSuccess()
            } else {
                setError(res.status === 403 ? AVISO_SUSPENSION :
                    data.message || 'Error al iniciar sesión')
            }
        } catch (error) {
            console.error('Login error:', error)
            setError('Error de conexión con el servidor')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div
        className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
            <div
        className="bg-card rounded-xl shadow-2xl max-w-md w-full p-8 relative">
                <button
                    aria-label="Cerrar inicio de sesión"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-muted-foreground
hover:text-muted-foreground hover:bg-muted rounded-lg
transition-colors"
                >
                    <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
                        <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div>
                    <div
        className="flex justify-center">
                        {/* Puedes cambiar esto por el logo de tu empresa si lo prefieres */}
                        <div
        className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                            <svg
        className="w-8 h-8 text-primary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24">
                                <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916
13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118
6.844A21.88 21.88 0 0015.171 17m3.839
1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319
1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                            </svg>
                        </div>
                    </div>
                    <h2
        className="mt-6 text-center text-3xl font-extrabold text-foreground">
                        Iniciar sesión
                    </h2>
                    <p
        className="mt-2 text-center text-sm text-muted-foreground">
                        Ingresa tus datos para continuar
                    </p>
                </div>

                <form aria-busy={enviando}
        className="mt-8 space-y-6"
        onSubmit={handleSubmit}>
                    <div
        className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="phone"
        className="block text-sm font-medium text-foreground">
                                Teléfono o correo
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="text"
                                autoComplete="username"
                                required
                                className="appearance-none
block w-full px-3 py-2 border border-border
rounded-lg placeholder-muted-foreground focus:outline-none
focus:ring-2 focus:ring-ring focus:border-ring sm:text-sm mt-1"
                                placeholder="Tu teléfono o tu correo"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="password"
        className="block text-sm font-medium text-foreground">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none
block w-full px-3 py-2 border border-border
rounded-lg placeholder-muted-foreground focus:outline-none
focus:ring-2 focus:ring-ring focus:border-ring sm:text-sm mt-1"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && <p
        role="alert"
        className="text-sm">{error}</p>}
                    <div>
                        <button
                            disabled={enviando}
                            type="submit"
                            className="w-full
flex justify-center py-2.5 px-4 border border-transparent
rounded-lg shadow-sm text-sm font-medium text-primary-foreground
bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2
focus:ring-offset-2 focus:ring-ring transition-colors"
                        >
                            {enviando ? 'Ingresando…' : 'Entrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
