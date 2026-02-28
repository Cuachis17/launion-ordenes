import React, { useState } from 'react'

interface UserProfileModalProps {
    user: any
    onClose: () => void
    onUpdateSuccess: () => void
    onLogout: () => void
    onRegisterClick: () => void
    onChangePasswordClick: () => void
}

export default function UserProfileModal({ user, onClose, onUpdateSuccess, onLogout, onRegisterClick, onChangePasswordClick }: UserProfileModalProps) {
    const [uploading, setUploading] = useState(false)

    const apiUrl = import.meta.env.VITE_API_URL

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('avatar', file)

        try {
            const res = await fetch(`${apiUrl}/api/users/${user.id}`, {
                method: 'PUT',
                credentials: 'include',
                body: formData,
            })

            if (res.ok) {
                onUpdateSuccess()
            } else {
                const data = await res.json()
                alert(data.message || 'Error al subir la imagen')
            }
        } catch (error) {
            console.error('Error uploading avatar:', error)
            alert('Error de conexión con el servidor')
        } finally {
            setUploading(false)
        }
    }

    const avatarUrl = user?.avatar
        ? `${apiUrl}/api/users/${user.id}/avatar?t=${Date.now()}`
        : null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Perfil de Usuario</h2>

                    <div className="flex flex-col items-center gap-4 mb-8">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-indigo-50 flex items-center justify-center">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                )}
                            </div>

                            <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white cursor-pointer shadow-lg hover:bg-indigo-700 transition-colors">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    disabled={uploading}
                                />
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </label>
                        </div>

                        {uploading && <p className="text-sm text-indigo-600 animate-pulse font-medium">Subiendo imagen...</p>}
                        <p className="text-sm text-gray-500 italic">Clic en la cámara para subir tu logo/avatar</p>
                    </div>

                    <div className="space-y-4 text-left">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</label>
                            <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">{user?.username}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</label>
                            <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100 capitalize">{user?.role}</p>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-gray-100 pt-6">
                        <button
                            onClick={onChangePasswordClick}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-1 mx-auto py-2 px-4 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Cambiar mi contraseña
                        </button>
                    </div>

                    <div className="mt-8 space-y-3">
                        {user?.role === 'admin' && (
                            <button
                                onClick={onRegisterClick}
                                className="w-full py-3 px-4 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium flex items-center justify-center gap-2 border border-indigo-100"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                                Registrar nuevo usuario
                            </button>
                        )}

                        <button
                            onClick={onLogout}
                            className="w-full py-3 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium flex items-center justify-center gap-2 border border-red-100"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Cerrar sesión
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-3 px-4 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium border border-gray-200"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
