import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { router } from '@inertiajs/react';
import axios from 'axios';
// Import route function - will be provided by Laravel Ziggy
declare global {
    interface Window {
        route: any;
    }
}

const route = (window as any).route || ((name: string, params?: any) => {
    console.warn('Ziggy route helper not loaded, using fallback for:', name);
    return name;
});

// Configure axios to include CSRF token
(window as any).axios = axios;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Function to update CSRF token from meta tag
function updateCsrfToken() {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
        const csrfToken = token.getAttribute('content');
        if (csrfToken) {
            axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
            // Make CSRF token available globally for Inertia and other components
            (window as any).Laravel = {
                csrfToken: csrfToken
            };
            console.log('CSRF token updated:', csrfToken.substring(0, 10) + '...');
        }
    } else {
        console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
    }
}

// Update CSRF token on initial load
updateCsrfToken();

// Update CSRF token after Inertia page loads complete (after login, navigation, etc.)
router.on('finish', (event: any) => {
    // Use setTimeout to ensure DOM is fully updated
    setTimeout(() => {
        // Get fresh CSRF token from Inertia's shared props
        const page = event.detail?.page;
        const sharedCsrfToken = page?.props?.csrf_token;
        
        if (sharedCsrfToken) {
            // Update the meta tag with fresh token from server
            const metaTag = document.head.querySelector('meta[name="csrf-token"]');
            if (metaTag) {
                metaTag.setAttribute('content', sharedCsrfToken);
            }
            
            // Update axios headers
            axios.defaults.headers.common['X-CSRF-TOKEN'] = sharedCsrfToken;
            
            // Update global window object
            (window as any).Laravel = {
                csrfToken: sharedCsrfToken
            };
            
            console.log('CSRF token refreshed from server:', sharedCsrfToken.substring(0, 10) + '...');
        } else {
            // Fallback to reading from meta tag
            updateCsrfToken();
        }
    }, 10);
});

// Handle 419 CSRF errors and silent 401 errors globally
axios.interceptors.response.use(
    response => response,
    error => {
        // Silently suppress 401 errors (unauthenticated)
        // These are expected when user is logged out
        if (error.response?.status === 401) {
            // Don't log to console, just reject silently
            return Promise.reject(error);
        }
        
        // Handle 419 CSRF token mismatch
        if (error.response?.status === 419) {
            console.warn('CSRF token expired, reloading page...');
            // Show brief message before reload
            const message = 'Your session has expired. Refreshing...';
            
            // Create a temporary toast notification
            const toast = document.createElement('div');
            toast.textContent = message;
            toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#ef4444;color:white;padding:12px 20px;border-radius:8px;z-index:9999;font-family:sans-serif;';
            document.body.appendChild(toast);
            
            // Reload after brief delay
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
            return Promise.reject(error);
        }
        
        return Promise.reject(error);
    }
);

// Make route function available globally
(window as any).route = route;

const appName = import.meta.env.VITE_APP_NAME || 'Rovic Meat Products';

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: async (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx');
        const page = await resolvePageComponent(
            pages[`./pages/${name}.tsx`] ? `./pages/${name}.tsx` : `./pages/${name}/index.tsx`,
            pages
        );
        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <NotificationProvider>
                <CartProvider>
                    <App {...props} />
                </CartProvider>
            </NotificationProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
