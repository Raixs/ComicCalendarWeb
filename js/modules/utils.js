// Módulo de utilidades generales
import { CONFIG } from '../config.js';

/**
 * Utilidades para manejo de fechas
 */
export class DateUtils {
    static getLastDayOfMonth(year, month) {
        return new Date(year, month, 0).getDate();
    }

    static getMonthStartEnd(year, month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-${this.getLastDayOfMonth(year, month)}`;
        return { startDate, endDate };
    }

    static constructDateQuery(year, month, startDate, endDate) {
        const currentYear = new Date().getFullYear();
        let startDateQuery = startDate;
        let endDateQuery = endDate;

        if (month && !year) {
            ({ startDate: startDateQuery, endDate: endDateQuery } = this.getMonthStartEnd(currentYear, month));
        } else if (year && !month) {
            startDateQuery = `${year}-01-01`;
            endDateQuery = `${year}-12-31`;
        }

        return { startDateQuery, endDateQuery };
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString(CONFIG.DATE_CONFIG.LOCALE, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    static formatTime(dateString) {
        if (!dateString) return '';
        const parts = dateString.split(' ');
        if (parts.length < 2) return '';
        const time = parts[1];
        const [hours, minutes] = time.split(':');
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    static isAllDayEvent(startTime, endTime) {
        return (startTime === CONFIG.DATE_CONFIG.ALL_DAY_START && endTime === CONFIG.DATE_CONFIG.ALL_DAY_END);
    }

    static datePart(dateString) {
        return dateString ? dateString.split(' ')[0] : '';
    }

    static formatDateToUTC(dateString) {
        const date = new Date(dateString);
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth();
        const day = date.getUTCDate();
        return { year, month, day };
    }

    static formatEventDate(startDate, endDate) {
        const start = this.formatDateToUTC(startDate);
        const end = this.formatDateToUTC(endDate);

        const startDay = start.day;
        const startMonth = new Date(Date.UTC(start.year, start.month)).toLocaleDateString(CONFIG.DATE_CONFIG.LOCALE, { month: 'long' });
        const startYear = start.year;

        const endDay = end.day;
        const endMonth = new Date(Date.UTC(end.year, end.month)).toLocaleDateString(CONFIG.DATE_CONFIG.LOCALE, { month: 'long' });
        const endYear = end.year;

        if (startYear === endYear) {
            if (start.month === end.month) {
                if (startDay === endDay) {
                    return `${startDay} de ${startMonth} de ${startYear}`;
                } else {
                    return `${startDay} al ${endDay} de ${startMonth} de ${startYear}`;
                }
            } else {
                return `${startDay} de ${startMonth} al ${endDay} de ${endMonth} de ${startYear}`;
            }
        } else {
            return `${startDay} de ${startMonth} de ${startYear} al ${endDay} de ${endMonth} de ${endYear}`;
        }
    }

    static formatToStandardDateTime(date, time) {
        return `${date} ${time}:00`;
    }

    static getCurrentCreateDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    static formatUpdateDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString(CONFIG.DATE_CONFIG.LOCALE, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

/**
 * Utilidades para manejo del DOM
 */
export class DOMUtils {
    static createElement(tag, className = '', innerHTML = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    }

    static show(selector) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (element) element.style.display = 'block';
    }

    static hide(selector) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (element) element.style.display = 'none';
    }

    static toggleClass(selector, className, condition = null) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!element) return;
        
        if (condition === null) {
            element.classList.toggle(className);
        } else {
            element.classList.toggle(className, condition);
        }
    }

    static addClass(selector, className) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (element) element.classList.add(className);
    }

    static removeClass(selector, className) {
        const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (element) element.classList.remove(className);
    }
}

/**
 * Utilidades para clonado y manipulación de objetos
 */
export class ObjectUtils {
    static clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    static isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    static pick(obj, keys) {
        const result = {};
        keys.forEach(key => {
            if (key in obj) result[key] = obj[key];
        });
        return result;
    }
}

/**
 * Utilidades para validación
 */
export class ValidationUtils {
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    static isValidTime(timeString) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(timeString);
    }
}

/**
 * Utilidades para URLs y navegación
 */
export class URLUtils {
    static getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    static updateURL(eventId) {
        history.pushState(null, '', `?id=${eventId}`);
    }

    static resetURL() {
        history.replaceState(null, '', window.location.pathname);
    }

    static encodeForURL(text) {
        return encodeURIComponent(text);
    }
}