// Módulo de gestión de autenticación
import { CONFIG, APP_STATE } from '../config.js';
import { AlertManager, NavigationManager } from './ui.js';

/**
 * Gestor de autenticación
 */
export class AuthManager {
    static async checkAuthentication() {
        // Agregar stack trace para debugging
        console.log('🔍 checkAuthentication() llamado desde:', new Error().stack.split('\n')[2]?.trim());
        
        // Prevenir múltiples llamadas concurrentes
        if (APP_STATE.isCheckingAuth) {
            console.log('⚠️ Ya se está verificando autenticación, saltando llamada duplicada');
            return { success: false, error: 'Ya verificando' };
        }
        
        APP_STATE.isCheckingAuth = true;
        
        const token = localStorage.getItem('access_token');
        
        if (token) {
            try {
                const response = await fetch(`${CONFIG.API_URL}/token/validate`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    APP_STATE.isAuthenticated = true;
                    NavigationManager.updateAuthenticationUI(true);
                    console.log('✅ Token válido - usuario autenticado');
                    return { success: true };
                } else {
                    // Token inválido, removerlo
                    console.log('❌ Token inválido - removiendo sesión');
                    this.logout(false);
                    return { success: false, error: 'Token inválido' };
                }
            } catch (error) {
                console.error('❌ Error validando token:', error);
                this.logout(false);
                return { success: false, error: 'Error de conexión validando token' };
            } finally {
                APP_STATE.isCheckingAuth = false;
            }
        } else {
            // No hay token, asegurar UI no autenticada
            console.log('ℹ️ No hay token - usuario no autenticado');
            APP_STATE.isAuthenticated = false;
            NavigationManager.updateAuthenticationUI(false);
            APP_STATE.isCheckingAuth = false;
            return { success: false, error: 'No hay token' };
        }
    }

    static async login(username, password) {
        console.log('🔐 Iniciando login para usuario:', username);
        
        try {
            const response = await fetch(`${CONFIG.API_URL}/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Login exitoso, guardando token y actualizando UI');
                localStorage.setItem('access_token', data.access_token);
                APP_STATE.isAuthenticated = true;
                NavigationManager.updateAuthenticationUI(true);
                
                // Cerrar modal de login
                const loginModal = bootstrap.Modal.getInstance(document.getElementById(CONFIG.MODAL_IDS.LOGIN));
                if (loginModal) loginModal.hide();
                
                AlertManager.success('Sesión iniciada correctamente');
                
                // Recargar eventos para mostrar botones de administración
                // El guard en loadEvents() previene duplicación
                setTimeout(() => {
                    if (window.loadEvents) {
                        console.log('🔄 Recargando eventos después de login para mostrar botones de admin');
                        window.loadEvents();
                    }
                }, 100);
                
                return { success: true, token: data.access_token };
            } else {
                return { success: false, error: data.detail || 'Error de autenticación' };
            }
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }

    static logout(showAlert = true) {
        console.log(`🚪 Cerrando sesión (mostrar alerta: ${showAlert})`);
        localStorage.removeItem('access_token');
        APP_STATE.isAuthenticated = false;
        NavigationManager.updateAuthenticationUI(false);
        
        if (showAlert) {
            AlertManager.success('Sesión cerrada');
        }

        // Recargar eventos para ocultar botones de administración
        // El guard en loadEvents() previene duplicación
        setTimeout(() => {
            if (window.loadEvents) {
                console.log('🔄 Recargando eventos después de logout para ocultar botones de admin');
                window.loadEvents();
            }
        }, 100);
    }

    static getToken() {
        return localStorage.getItem('access_token');
    }

    static isAuthenticated() {
        return APP_STATE.isAuthenticated && this.getToken() !== null;
    }

    static getAuthHeaders() {
        const token = this.getToken();
        return token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        } : {
            'Content-Type': 'application/json'
        };
    }
}

/**
 * Manejadores de eventos de autenticación
 */
export class AuthEventHandlers {

    static async handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (!username || !password) {
            AlertManager.error('Por favor, completa todos los campos');
            return;
        }

        const result = await AuthManager.login(username, password);
        
        if (!result.success) {
            AlertManager.error(result.error);
        }
    }

    static handleLogout() {
        AuthManager.logout();
    }

    static setupAuthEventListeners() {
        // Prevenir inicialización múltiple
        if (APP_STATE.modules.authEventHandlers) return;
        
        // Event listener para el formulario de login
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin);
        }

        // Event listener para logout (se manejará desde el HTML con onclick)
        window.logout = this.handleLogout;
        
        APP_STATE.modules.authEventHandlers = true;
    }
}